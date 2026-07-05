"""MongoDB persistence operations for users."""

from uuid import UUID

from fastapi import HTTPException
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.database import database, database_unavailable, users_collection
from app.models import UserRecord


def insert_user(user: UserRecord) -> UserRecord:
    document = user.model_dump(mode="python")
    document["id"] = str(user.id)
    try:
        users_collection.insert_one(document)
        _claim_legacy_tasks_for_first_user(user)
    except DuplicateKeyError as error:
        raise HTTPException(status_code=409, detail="Username is already registered.") from error
    except PyMongoError as error:
        raise database_unavailable(error) from error
    return user

def _validated_user(query: dict) -> UserRecord | None:
    try:
        document = users_collection.find_one(query, {"_id": 0})
    except PyMongoError as error:
        raise database_unavailable(error) from error
    return UserRecord.model_validate(document) if document else None


def find_user_by_username(username: str) -> UserRecord | None:
    identifier = username.strip().lower()
    # `email` supports accounts created before authentication switched to
    # usernames. New records are found by `username` as before.
    return _validated_user({"$or": [{"username": identifier}, {"email": identifier}]})


def find_user_by_id(user_id: UUID) -> UserRecord | None:
    return _validated_user({"id": str(user_id)})


def google_refresh_token(user_id: UUID) -> str | None:
    try:
        document = users_collection.find_one({"id": str(user_id)}, {"google_refresh_token": 1})
    except PyMongoError as error:
        raise database_unavailable(error) from error
    return document.get("google_refresh_token") if document else None


def save_google_refresh_token(user_id: UUID, refresh_token: str) -> None:
    try:
        result = users_collection.update_one(
            {"id": str(user_id)},
            {"$set": {"google_refresh_token": refresh_token}},
        )
    except PyMongoError as error:
        raise database_unavailable(error) from error
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")


def _claim_legacy_tasks_for_first_user(user: UserRecord) -> None:
    if users_collection.count_documents({}) == 1:
        database.tasks.update_many(
            {"owner_id": {"$exists": False}},
            {"$set": {"owner_id": str(user.id)}},
        )
