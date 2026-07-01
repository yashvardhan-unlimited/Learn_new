"""Password hashing and JWT creation/verification helpers."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

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
