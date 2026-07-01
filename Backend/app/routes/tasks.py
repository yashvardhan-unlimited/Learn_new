"""Authenticated task routes."""

from fastapi import APIRouter, Depends
from uuid import UUID

from app.dependencies import get_current_user
from app.models import Task, TaskCreate, TaskUpdate, UserRecord
from app.repositories.tasks import (
    find_task as find_task_record,
    insert_task as insert_task_record,
    list_tasks as list_task_records,
    update_task as update_task_record,
)
from app.services.summary import stream_user_task_summary
from app.services.attachments import delete_task_and_files


router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", response_model=Task)
def add_task(task: TaskCreate, user: UserRecord = Depends(get_current_user)):
    return insert_task_record(task, user.id)


@router.get("", response_model=list[Task])
def list_tasks(user: UserRecord = Depends(get_current_user)):
    return list_task_records(user.id)


@router.post("/summarize")
def summarize(user: UserRecord = Depends(get_current_user)):
    return stream_user_task_summary(user.id)


@router.get("/{task_id}", response_model=Task)
def task_detail(task_id: UUID, user: UserRecord = Depends(get_current_user)):
    return find_task_record(task_id, user.id)


@router.put("/{task_id}", response_model=Task)
def edit_task(
    task_id: UUID,
    task_update: TaskUpdate,
    user: UserRecord = Depends(get_current_user),
):
    return update_task_record(task_id, task_update, user.id)


@router.delete("/{task_id}")
def remove_task(task_id: UUID, user: UserRecord = Depends(get_current_user)):
    return delete_task_and_files(task_id, user.id)
