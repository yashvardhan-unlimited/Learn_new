"""Google Workspace REST integrations with no extra runtime dependencies."""

import base64
import json
from email.message import EmailMessage
from uuid import UUID
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.config import settings
from app.repositories.users import google_refresh_token
from app.security import create_google_oauth_state

GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.compose"
GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


class GoogleAuthorizationRequired(RuntimeError):
    def __init__(self, owner_id: UUID):
        self.connect_url = google_connect_url(owner_id)
        super().__init__(f"Connect Google Workspace to continue: {self.connect_url}")


def google_connect_url(owner_id: UUID) -> str:
    state = create_google_oauth_state(owner_id)
    return f"{settings.backend_public_url.rstrip('/')}/google/connect?" + urlencode({"state": state})


def google_authorization_url(state: str) -> str:
    return GOOGLE_AUTHORIZE_URL + "?" + urlencode({
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": GOOGLE_SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    })


def exchange_authorization_code(code: str) -> dict:
    data = urlencode({
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.google_redirect_uri,
    }).encode()
    with urlopen(Request(GOOGLE_TOKEN_URL, data=data, method="POST"), timeout=20) as response:
        return json.loads(response.read())


def _access_token(owner_id: UUID) -> str:
    refresh_token = google_refresh_token(owner_id) or settings.google_refresh_token
    values = {
        "GOOGLE_CLIENT_ID": settings.google_client_id,
        "GOOGLE_CLIENT_SECRET": settings.google_client_secret,
        "GOOGLE_REFRESH_TOKEN": refresh_token,
    }
    missing = [name for name, value in values.items() if not value]
    if missing:
        if not refresh_token and settings.google_client_id and settings.google_client_secret:
            raise GoogleAuthorizationRequired(owner_id)
        raise RuntimeError(
            "Google integration is not configured. Client credentials may come from "
            "Backend/credentials.json; set the remaining value(s) in Backend/.env: "
            + ", ".join(missing)
        )
    data = urlencode({"client_id": settings.google_client_id, "client_secret": settings.google_client_secret, "refresh_token": refresh_token, "grant_type": "refresh_token", "scope": GOOGLE_SCOPES}).encode()
    with urlopen(Request(GOOGLE_TOKEN_URL, data=data, method="POST"), timeout=20) as response:
        return json.loads(response.read())["access_token"]


def _post(owner_id: UUID, url: str, payload: dict) -> dict:
    request = Request(url, data=json.dumps(payload).encode(), headers={"Authorization": f"Bearer {_access_token(owner_id)}", "Content-Type": "application/json"}, method="POST")
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read())


def _delete(owner_id: UUID, url: str) -> None:
    request = Request(url, headers={"Authorization": f"Bearer {_access_token(owner_id)}"}, method="DELETE")
    with urlopen(request, timeout=20):
        return None


def create_calendar_event(owner_id: UUID, title: str, start: str, end: str, timezone: str, description: str = "", location: str = "") -> dict:
    body = {
        "summary": title,
        "description": description,
        "location": location,
        "start": {"dateTime": start, "timeZone": timezone},
        "end": {"dateTime": end, "timeZone": timezone},
    }
    return _post(owner_id, "https://www.googleapis.com/calendar/v3/calendars/primary/events", body)


def delete_calendar_event(owner_id: UUID, event_id: str) -> None:
    from urllib.parse import quote

    _delete(owner_id, "https://www.googleapis.com/calendar/v3/calendars/primary/events/" + quote(event_id, safe=""))


def create_gmail_draft(owner_id: UUID, to: str, subject: str, body: str, cc: str = "") -> dict:
    message = EmailMessage()
    message["To"] = to
    message["Subject"] = subject
    if cc:
        message["Cc"] = cc
    message.set_content(body)
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
    return _post(owner_id, "https://gmail.googleapis.com/gmail/v1/users/me/drafts", {"message": {"raw": raw}})


def google_error_message(error: Exception) -> str:
    if isinstance(error, HTTPError):
        return f"Google rejected the request ({error.code}). Check OAuth access and the supplied values."
    if isinstance(error, URLError):
        return "Google is currently unreachable. Please try again."
    return str(error)
