"""Registration, login, and current-user routes."""

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models import UserRecord
from app.schemas import TokenResponse, UserLogin, UserPublic, UserRegister
from app.services.auth import authenticate_user, register_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserRegister):
    return register_user(data)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin):
    return authenticate_user(data)


@router.get("/me", response_model=UserPublic)
def current_user(user: UserRecord = Depends(get_current_user)):
    return UserPublic.model_validate(user.model_dump())
