"""Request and response schemas used by authentication routes."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models import UserRole


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    # bcrypt accepts at most 72 bytes, so the API rejects longer passwords.
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=1, max_length=72)


class UserPublic(BaseModel):
    id: UUID
    username: str
    role: UserRole
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserPublic


class TokenPayload(BaseModel):
    sub: UUID
