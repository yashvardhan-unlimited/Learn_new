"""Reusable FastAPI authorization dependencies."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.models import UserRecord
from app.security import decode_access_token
from app.repositories.users import find_user_by_id


# HTTPBearer reads Authorization: Bearer <token> and documents it in OpenAPI.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserRecord:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Login required.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise credentials_error
    try:
        user_id = decode_access_token(credentials.credentials)
    except JWTError as error:
        raise credentials_error from error

    user = find_user_by_id(user_id)
    if user is None:
        raise credentials_error
    return user

