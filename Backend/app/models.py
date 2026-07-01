# BaseModel gives these Python classes automatic validation and JSON conversion.
from pydantic import BaseModel, Field
# Optional means a value may be None. Literal restricts a value to listed choices.
from typing import Optional, Literal
from datetime import datetime
# UUID values provide unique IDs even if two tasks have the same title.
from uuid import uuid4, UUID

UserRole = Literal["user", "admin"]


class Attachment(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    filename: str
    content_type: str
    size: int
    uploaded_at: datetime = Field(default_factory=datetime.now)


# This model validates the JSON body used when a new task is created.
class TaskCreate(BaseModel):
    # "..." means title is required; min_length prevents an empty title.
    title: str = Field(..., min_length=1)
    # The remaining fields have defaults, so the frontend may omit them.
    description: Optional[str] = ""
    priority: Literal["low", "medium", "high"] = "medium"
    status: Literal["pending", "in_progress", "completed"] = "pending"


# This model validates updates to an existing task.
class TaskUpdate(BaseModel):
    # Every field is optional because a PUT request may update only some fields.
    title: Optional[str] = Field(default=None, min_length=1)
    description: Optional[str] = None
    priority: Optional[Literal["low", "medium", "high"]] = None
    status: Optional[Literal["pending", "in_progress", "completed"]] = None


# This is the complete task shape stored in MongoDB and returned by the API.
class Task(BaseModel):
    # default_factory runs for each new task instead of sharing one fixed value.
    id: UUID = Field(default_factory=uuid4)
    # Every task belongs to exactly one authenticated user.
    owner_id: UUID
    title: str
    description: Optional[str] = ""
    priority: Literal["low", "medium", "high"] = "medium"
    status: Literal["pending", "in_progress", "completed"] = "pending"
    attachments: list[Attachment] = Field(default_factory=list)
    # datetime.now records creation/update times when a Task is constructed.
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


# Internal database model. password_hash is never returned by API routes.
class UserRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    username: str
    password_hash: str
    role: UserRole = "user"
    created_at: datetime = Field(default_factory=datetime.now)
