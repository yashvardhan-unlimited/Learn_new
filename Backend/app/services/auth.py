"""Authentication business logic independent from HTTP route definitions."""

from fastapi import HTTPException

from app.models import UserRecord
from app.repositories.users import find_user_by_username, insert_user
from app.schemas import TokenResponse, UserLogin, UserPublic, UserRegister
from app.security import create_access_token, hash_password, verify_password


def register_user(data: UserRegister) -> TokenResponse:
    user = UserRecord(
        username=str(data.username).strip().lower(),
        password_hash=hash_password(data.password),
        role="user",
    )
    return build_token_response(insert_user(user))


def authenticate_user(data: UserLogin) -> TokenResponse:
    user = find_user_by_username(str(data.username))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return build_token_response(user)


def build_token_response(user: UserRecord) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id),
        user=UserPublic.model_validate(user.model_dump()),
    )
