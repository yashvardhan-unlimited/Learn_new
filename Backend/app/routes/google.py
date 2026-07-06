"""Google Workspace OAuth consent and callback endpoints."""

from urllib.error import HTTPError, URLError
from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from jose import JWTError

from app.config import settings
from app.repositories.tasks import find_task, set_task_reminder
from app.repositories.users import save_google_refresh_token
from app.security import decode_google_oauth_state_details
from app.services.google_workspace import create_calendar_event, delete_calendar_event, exchange_authorization_code, google_authorization_url


router = APIRouter(prefix="/google", tags=["Google Workspace"])


@router.get("/connect")
def connect_google(state: str = Query(min_length=1)) -> RedirectResponse:
    details = _validated_state(state)
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=503, detail="Google OAuth client credentials are not configured.")
    return RedirectResponse(google_authorization_url(state, details["scopes"]))


@router.get("/callback")
def google_callback(code: str = Query(min_length=1), state: str = Query(min_length=1)) -> RedirectResponse:
    details = _validated_state(state)
    owner_id = details["owner_id"]
    try:
        tokens = exchange_authorization_code(code)
    except (HTTPError, URLError) as error:
        raise HTTPException(status_code=400, detail="Google authorization could not be completed.") from error
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Google did not return a refresh token. Reconnect and grant consent again.")
    save_google_refresh_token(owner_id, refresh_token, details["scopes"])
    result = _complete_pending_action(owner_id, details.get("action"), details.get("task_id"))
    return RedirectResponse(f"{settings.frontend_app_url.rstrip('/')}?google=connected&result={result}")


def _validated_state(state: str) -> dict:
    try:
        return decode_google_oauth_state_details(state)
    except JWTError as error:
        raise HTTPException(status_code=400, detail="Google authorization link is invalid or expired.") from error


def _complete_pending_action(owner_id: UUID, action: str | None, task_id: str | None) -> str:
    if not action or not task_id:
        return "authorized"
    try:
        task_uuid = UUID(task_id)
        task = find_task(task_uuid, owner_id)
        if action == "add_task_reminder":
            if task.due_at is None:
                return "missing_due_date"
            if task.reminder_event_id:
                return "already_added"
            event = create_calendar_event(
                owner_id,
                f"Reminder: {task.title}",
                task.due_at.isoformat(),
                (task.due_at + timedelta(minutes=30)).isoformat(),
                "Asia/Kolkata",
                task.description or "",
            )
            set_task_reminder(task.id, owner_id, event["id"], event.get("htmlLink"))
            return "reminder_added"
        if action == "remove_task_reminder" and task.reminder_event_id:
            delete_calendar_event(owner_id, task.reminder_event_id)
            set_task_reminder(task.id, owner_id, None)
            return "reminder_removed"
    except (ValueError, HTTPError, URLError):
        return "action_failed"
    return "authorized"
