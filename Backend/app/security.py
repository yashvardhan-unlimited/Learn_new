"""Password hashing and JWT creation/verification helpers."""

from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.config import settings


def hash_password(password: str) -> str:
    # bcrypt stores its random salt and cost inside the resulting hash.
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("Password must be at most 72 UTF-8 bytes.")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: UUID) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_expire_minutes
    )
    payload = {"sub": str(user_id), "exp": expires_at}
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> UUID:
    """Return the user UUID in a valid token or raise JWTError."""
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    subject = payload.get("sub")
    if not subject:
        raise JWTError("Token subject is missing")
    try:
        return UUID(subject)
    except (TypeError, ValueError) as error:
        raise JWTError("Token subject is invalid") from error


def create_google_oauth_state(
    user_id: UUID,
    scopes: list[str],
    action: str | None = None,
    task_id: str | None = None,
) -> str:
    payload = {
        "sub": str(user_id),
        "purpose": "google_oauth",
        "scopes": scopes,
        "action": action,
        "task_id": task_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_google_oauth_state(state: str) -> UUID:
    return decode_google_oauth_state_details(state)["owner_id"]


def decode_google_oauth_state_details(state: str) -> dict[str, Any]:
    payload = jwt.decode(state, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("purpose") != "google_oauth":
        raise JWTError("Invalid OAuth state")
    try:
        owner_id = UUID(payload["sub"])
    except (KeyError, TypeError, ValueError) as error:
        raise JWTError("Invalid OAuth state subject") from error
    scopes = payload.get("scopes")
    if not isinstance(scopes, list) or not scopes or not all(isinstance(scope, str) for scope in scopes):
        raise JWTError("Invalid OAuth scopes")
    return {
        "owner_id": owner_id,
        "scopes": scopes,
        "action": payload.get("action"),
        "task_id": payload.get("task_id"),
    }


def create_tool_confirmation(user_id: UUID, actions: list[dict[str, Any]]) -> str:
    payload = {
        "sub": str(user_id),
        "purpose": "tool_confirmation",
        "actions": actions,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_tool_confirmation(token: str, user_id: UUID) -> list[dict[str, Any]]:
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("purpose") != "tool_confirmation" or payload.get("sub") != str(user_id):
        raise JWTError("Invalid tool confirmation")
    actions = payload.get("actions")
    if not isinstance(actions, list) or not actions:
        raise JWTError("Tool confirmation has no actions")
    return actions
