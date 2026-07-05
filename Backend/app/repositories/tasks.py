"""MongoDB persistence operations for tasks."""    

from datetime import datetime    
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
