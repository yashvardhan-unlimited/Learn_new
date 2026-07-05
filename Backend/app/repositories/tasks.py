"""MongoDB persistence operations for tasks."""    

from datetime import datetime, timezone
from uuid import UUID    

from fastapi import HTTPException    
from pymongo import ASCENDING    
from pymongo.errors import PyMongoError    

from app.database import database_unavailable, tasks_collection    
from app.models import Task, TaskCreate, TaskUpdate


def list_tasks(owner_id: UUID) -> list[Task]:    
    try:    
        documents = tasks_collection.find(    
            {"owner_id": str(owner_id)}, {"_id": 0}    
        ).sort([("created_at", ASCENDING), ("id", ASCENDING)])    
        return [Task.model_validate(document) for document in documents]    
    except PyMongoError as error:    
        raise database_unavailable(error) from error    


def query_tasks(
    owner_id: UUID,
    status: str | None = None,
    priority: str | None = None,
    deadline: str = "all",
    sort_by: str = "due_at",
    sort_direction: str = "asc",
    limit: int = 5,
) -> list[Task]:
    """Return only the bounded task subset requested by the assistant."""
    query: dict = {"owner_id": str(owner_id)}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    now = datetime.now(timezone.utc)
    if deadline == "overdue":
        query["due_at"] = {"$lt": now}
        if not status:
            query["status"] = {"$ne": "completed"}
    elif deadline == "upcoming":
        query["due_at"] = {"$gte": now}
    elif deadline == "scheduled":
        query["due_at"] = {"$ne": None}
    elif deadline == "none":
        query["due_at"] = None
    direction = ASCENDING if sort_direction == "asc" else -1
    sort_field = sort_by if sort_by in {"due_at", "priority", "status", "created_at", "updated_at", "title"} else "due_at"
    sort_value: object = f"${sort_field}"
    if sort_field == "priority":
        sort_value = {"$switch": {"branches": [
            {"case": {"$eq": ["$priority", "high"]}, "then": 3},
            {"case": {"$eq": ["$priority", "medium"]}, "then": 2},
        ], "default": 1}}
    elif sort_field == "status":
        sort_value = {"$switch": {"branches": [
            {"case": {"$eq": ["$status", "in_progress"]}, "then": 1},
            {"case": {"$eq": ["$status", "pending"]}, "then": 2},
        ], "default": 3}}
    pipeline = [
        {"$match": query},
        {"$addFields": {
            "_sort_missing": {"$cond": [{"$eq": [{"$ifNull": [f"${sort_field}", None]}, None]}, 1, 0]},
            "_sort_value": sort_value,
        }},
        {"$sort": {"_sort_missing": ASCENDING, "_sort_value": direction, "created_at": -1}},
        {"$limit": max(1, min(limit, 20))},
        {"$project": {"_id": 0, "_sort_missing": 0, "_sort_value": 0}},
    ]
    try:
        return [Task.model_validate(document) for document in tasks_collection.aggregate(pipeline)]
    except PyMongoError as error:
        raise database_unavailable(error) from error


def insert_task(data: TaskCreate, owner_id: UUID) -> Task:    
    task = Task(owner_id=owner_id, **data.model_dump())    
    document = task.model_dump(mode="python")    
    document.update({"id": str(task.id), "owner_id": str(task.owner_id)})    
    try:    
        tasks_collection.insert_one(document)       
    except PyMongoError as error:    
        raise database_unavailable(error) from error
    return task    


def find_task(task_id: UUID, owner_id: UUID) -> Task:    
    return Task.model_validate(_find_document(task_id, owner_id))    


def update_task(task_id: UUID, data: TaskUpdate, owner_id: UUID) -> Task:    
    document = _find_document(task_id, owner_id)    
    updates = {**data.model_dump(exclude_unset=True), "updated_at": datetime.now()}    
    try:    
        tasks_collection.update_one({"id": document["id"]}, {"$set": updates})    
    except PyMongoError as error:    
        raise database_unavailable(error) from error    
    document.update(updates)    
    return Task.model_validate(document)    


def set_task_reminder(task_id: UUID, owner_id: UUID, event_id: str | None, calendar_url: str | None = None) -> Task:
    document = _find_document(task_id, owner_id)
    now = datetime.now()
    if event_id:
        operation = {"$set": {"reminder_event_id": event_id, "reminder_calendar_url": calendar_url, "updated_at": now}}
    else:
        operation = {"$unset": {"reminder_event_id": "", "reminder_calendar_url": ""}, "$set": {"updated_at": now}}
    try:
        tasks_collection.update_one({"id": document["id"], "owner_id": str(owner_id)}, operation)
    except PyMongoError as error:
        raise database_unavailable(error) from error
    return find_task(task_id, owner_id)


def delete_task(task_id: UUID, owner_id: UUID) -> dict[str, str]:    
    document = _find_document(task_id, owner_id)    
    _delete_document(document)    
    return {"message": "Task deleted successfully."}    


def delete_any_task(task_id: UUID) -> dict[str, str]:
    document = _find_document(task_id)
    _delete_document(document)
    return {"message": "Task deleted."}


def add_attachment(task_id: UUID, owner_id: UUID, record: dict) -> Task:
    document = _find_document(task_id, owner_id)
    now = datetime.now()
    try:
        tasks_collection.update_one(
            {"id": document["id"]},
            {"$push": {"attachments": record}, "$set": {"updated_at": now}},
        )
    except PyMongoError as error:
        raise database_unavailable(error) from error
    document.setdefault("attachments", []).append(record)
    document["updated_at"] = now
    return Task.model_validate(document)


def find_attachment_record(task_id: UUID, attachment_id: UUID, owner_id: UUID) -> dict:
    document = _find_document(task_id, owner_id)
    for attachment in document.get("attachments", []):
        if attachment.get("id") == str(attachment_id):
            return attachment
    raise HTTPException(status_code=404, detail="Attachment not found.")


def remove_attachment(task_id: UUID, attachment_id: UUID, owner_id: UUID) -> tuple[dict, Task]:
    record = find_attachment_record(task_id, attachment_id, owner_id)
    now = datetime.now()
    try:
        tasks_collection.update_one(
            {"id": str(task_id), "owner_id": str(owner_id)},
            {"$pull": {"attachments": {"id": str(attachment_id)}}, "$set": {"updated_at": now}},
        )
    except PyMongoError as error:
        raise database_unavailable(error) from error
    return record, find_task(task_id, owner_id)


def attachment_records(task_id: UUID, owner_id: UUID | None = None) -> list[dict]:
    return _find_document(task_id, owner_id).get("attachments", [])


def _find_document(task_id: UUID, owner_id: UUID | None = None) -> dict:    
    query = {"id": str(task_id)}    
    if owner_id is not None:    
        query["owner_id"] = str(owner_id)    
    try:    
        document = tasks_collection.find_one(query, {"_id": 0})    
    except PyMongoError as error:    
        raise database_unavailable(error) from error    
    if document is None:    
        raise HTTPException(status_code=404, detail="Task not found.")    
    return document    


def _delete_document(document: dict) -> None:    
    try:    
        tasks_collection.delete_one({"id": document["id"]})    
    except PyMongoError as error:    
        raise database_unavailable(error) from error    
