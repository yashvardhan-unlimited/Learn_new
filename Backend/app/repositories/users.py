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


def find_user_by_username(username: str) -> UserRecord | None:
    return _validated_user({"username": username.strip().lower()})


def find_user_by_id(user_id: UUID) -> UserRecord | None:
    return _validated_user({"id": str(user_id)})


def _validated_user(query: dict) -> UserRecord | None:
    try:
        document = users_collection.find_one(query, {"_id": 0})
    except PyMongoError as error:
        raise database_unavailable(error) from error
    return UserRecord.model_validate(document) if document else None


def _claim_legacy_tasks_for_first_user(user: UserRecord) -> None:
    if users_collection.count_documents({}) == 1:
        database.tasks.update_many(
            {"owner_id": {"$exists": False}},
            {"$set": {"owner_id": str(user.id)}},
        )
