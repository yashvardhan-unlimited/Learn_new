"""Google Workspace OAuth consent and callback endpoints."""

from urllib.error import HTTPError, URLError

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from jose import JWTError

from app.config import settings
from app.repositories.users import save_google_refresh_token
from app.security import decode_google_oauth_state
from app.services.google_workspace import exchange_authorization_code, google_authorization_url


router = APIRouter(prefix="/google", tags=["Google Workspace"])


@router.get("/connect")
def connect_google(state: str = Query(min_length=1)) -> RedirectResponse:
    _validated_owner(state)
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=503, detail="Google OAuth client credentials are not configured.")
    return RedirectResponse(google_authorization_url(state))


@router.get("/callback")
def google_callback(code: str = Query(min_length=1), state: str = Query(min_length=1)) -> RedirectResponse:
    owner_id = _validated_owner(state)
    try:
        tokens = exchange_authorization_code(code)
    except (HTTPError, URLError) as error:
        raise HTTPException(status_code=400, detail="Google authorization could not be completed.") from error
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Google did not return a refresh token. Reconnect and grant consent again.")
    save_google_refresh_token(owner_id, refresh_token)
    return RedirectResponse(f"{settings.frontend_app_url.rstrip('/')}?google=connected")


def _validated_owner(state: str):
    try:
        return decode_google_oauth_state(state)
    except JWTError as error:
        raise HTTPException(status_code=400, detail="Google authorization link is invalid or expired.") from error
