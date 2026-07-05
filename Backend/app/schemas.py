"""Request and response schemas used by authentication routes."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models import Task


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    # bcrypt accepts at most 72 bytes, so the API rejects longer passwords.
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    # Existing accounts used email addresses as their login identifier. Keep the
    # request field name stable for the frontend while accepting full emails.
    username: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=72)


class UserPublic(BaseModel):
    id: UUID
    username: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserPublic


class TokenPayload(BaseModel):
    sub: UUID


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatHistoryMessage] = Field(default_factory=list, max_length=20)
    require_confirmation: bool = False
    approved_action: str | None = None


class ChatResponse(BaseModel):
    reply: str
    action_taken: bool
    updated_tasks: list[Task]
    redirect_url: str | None = None
    confirmation_required: bool = False
    confirmation_token: str | None = None
    confirmation_message: str | None = None


class TaskReminderResponse(BaseModel):
    created: bool
    message: str
    redirect_url: str | None = None
    calendar_url: str | None = None
    task: Task | None = None
