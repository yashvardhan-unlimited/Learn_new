"""Authenticated task routes."""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID

from app.dependencies import get_current_user
from app.models import Task, TaskCreate, TaskUpdate, UserRecord
from app.repositories.tasks import (
    find_task as find_task_record,
    insert_task as insert_task_record,
    list_tasks as list_task_records,
    update_task as update_task_record,
    set_task_reminder,
)
from app.services.summary import stream_user_task_summary
from app.services.attachments import delete_task_and_files
from app.schemas import TaskReminderResponse
from app.services.google_workspace import CALENDAR_SCOPE, GoogleAuthorizationRequired, create_calendar_event, delete_calendar_event, google_connect_url, google_error_message


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


@router.post("/{task_id}/reminder", response_model=TaskReminderResponse)
def add_calendar_reminder(task_id: UUID, user: UserRecord = Depends(get_current_user)):
    task = find_task_record(task_id, user.id)
    if task.due_at is None:
        raise HTTPException(status_code=400, detail="Set a due date and time before adding a reminder.")
    start = task.due_at
    end = start + timedelta(minutes=30)
    try:
        event = create_calendar_event(
            user.id,
            f"Reminder: {task.title}",
            start.isoformat(),
            end.isoformat(),
            "UTC",
            task.description or "",
        )
    except GoogleAuthorizationRequired as error:
        connect_url = google_connect_url(user.id, [CALENDAR_SCOPE], "add_task_reminder", str(task.id))
        return TaskReminderResponse(created=False, message="Connect Google Workspace to add this reminder.", redirect_url=connect_url)
    except Exception as error:
        raise HTTPException(status_code=502, detail=google_error_message(error)) from error
    return TaskReminderResponse(
        created=True,
        message="Reminder added to Google Calendar.",
        calendar_url=event.get("htmlLink"),
        task=set_task_reminder(task.id, user.id, event["id"], event.get("htmlLink")),
    )


@router.delete("/{task_id}/reminder", response_model=TaskReminderResponse)
def remove_calendar_reminder(task_id: UUID, user: UserRecord = Depends(get_current_user)):
    task = find_task_record(task_id, user.id)
    if not task.reminder_event_id:
        return TaskReminderResponse(created=False, message="This task has no Calendar reminder.", task=task)
    try:
        delete_calendar_event(user.id, task.reminder_event_id)
    except GoogleAuthorizationRequired as error:
        connect_url = google_connect_url(user.id, [CALENDAR_SCOPE], "remove_task_reminder", str(task.id))
        return TaskReminderResponse(created=True, message="Connect Google Workspace to remove this reminder.", redirect_url=connect_url, task=task)
    except Exception as error:
        raise HTTPException(status_code=502, detail=google_error_message(error)) from error
    updated = set_task_reminder(task.id, user.id, None)
    return TaskReminderResponse(created=False, message="Reminder removed from Google Calendar.", task=updated)
