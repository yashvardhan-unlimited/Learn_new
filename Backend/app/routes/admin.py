"""Example routes restricted to users with the admin role."""

from fastapi import APIRouter, Depends
from uuid import UUID

from app.dependencies import require_admin
from app.models import UserRecord
from app.services.attachments import delete_task_and_files


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.delete("/tasks/{task_id}")
def admin_delete_task(
    task_id: UUID,
    _admin: UserRecord = Depends(require_admin),
):
    return delete_task_and_files(task_id)
