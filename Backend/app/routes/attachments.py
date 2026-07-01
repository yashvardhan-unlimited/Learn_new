"""Authenticated upload, download, and attachment deletion routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile

from app.dependencies import get_current_user
from app.models import Task, UserRecord
from app.services.attachments import delete_attachment, download_attachment, save_attachment


router = APIRouter(prefix="/tasks/{task_id}/attachments", tags=["Attachments"])


@router.post("", response_model=Task)
async def upload_task_attachment(
    task_id: UUID,
    file: UploadFile = File(...),
    user: UserRecord = Depends(get_current_user),
):
    return await save_attachment(task_id, user.id, file)


@router.get("/{attachment_id}")
def get_task_attachment(
    task_id: UUID,
    attachment_id: UUID,
    user: UserRecord = Depends(get_current_user),
):
    return download_attachment(task_id, attachment_id, user.id)


@router.delete("/{attachment_id}", response_model=Task)
def remove_task_attachment(
    task_id: UUID,
    attachment_id: UUID,
    user: UserRecord = Depends(get_current_user),
):
    return delete_attachment(task_id, attachment_id, user.id)
