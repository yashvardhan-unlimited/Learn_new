"""Secure local file storage and attachment business rules."""

from datetime import datetime
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.config import settings
from app.models import Task
from app.repositories.tasks import (
    add_attachment,
    attachment_records,
    delete_any_task,
    delete_task,
    find_attachment_record,
    remove_attachment,
)


ALLOWED_FILES = {
    "application/pdf": (".pdf", lambda data: data.startswith(b"%PDF-")),
    "image/png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
    "image/jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
    "image/gif": (".gif", lambda data: data.startswith((b"GIF87a", b"GIF89a"))),
    "image/webp": (".webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
}


async def save_attachment(task_id: UUID, owner_id: UUID, upload: UploadFile) -> Task:
    content_type = (upload.content_type or "").lower()
    if content_type not in ALLOWED_FILES:
        raise HTTPException(status_code=415, detail="Only PDF, PNG, JPEG, GIF, and WebP files are allowed.")

    attachment_id = uuid4()
    extension, signature_check = ALLOWED_FILES[content_type]
    relative_path = Path(str(owner_id)) / str(task_id) / f"{attachment_id}{extension}"
    target = _safe_path(relative_path)
    target.parent.mkdir(parents=True, exist_ok=True)

    size = 0
    signature = b""
    try:
        with target.open("wb") as file:
            while chunk := await upload.read(1024 * 1024):
                size += len(chunk)
                if size > settings.max_attachment_bytes:
                    raise HTTPException(status_code=413, detail="Attachment exceeds the size limit.")
                if len(signature) < 16:
                    signature += chunk[: 16 - len(signature)]
                file.write(chunk)
        if not signature_check(signature):
            raise HTTPException(status_code=415, detail="File contents do not match its declared type.")

        original_name = Path(upload.filename or "attachment").name
        safe_filename = f"{Path(original_name).stem or 'attachment'}{extension}"
        record = {
            "id": str(attachment_id),
            "filename": safe_filename,
            "content_type": content_type,
            "size": size,
            "uploaded_at": datetime.now(),
            "storage_path": relative_path.as_posix(),
        }
        return add_attachment(task_id, owner_id, record)
    except Exception:
        _safe_unlink(target)
        raise
    finally:
        await upload.close()


def download_attachment(task_id: UUID, attachment_id: UUID, owner_id: UUID) -> FileResponse:
    record = find_attachment_record(task_id, attachment_id, owner_id)
    path = _safe_path(Path(record["storage_path"]))
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Attachment file is missing.")
    return FileResponse(path, media_type=record["content_type"], filename=record["filename"])


def delete_attachment(task_id: UUID, attachment_id: UUID, owner_id: UUID) -> Task:
    record, task = remove_attachment(task_id, attachment_id, owner_id)
    _safe_unlink(_safe_path(Path(record["storage_path"])))
    return task


def delete_task_and_files(task_id: UUID, owner_id: UUID | None = None) -> dict[str, str]:
    records = attachment_records(task_id, owner_id)
    result = delete_task(task_id, owner_id) if owner_id else delete_any_task(task_id)
    for record in records:
        _safe_unlink(_safe_path(Path(record["storage_path"])))
    return result


def _safe_path(relative_path: Path) -> Path:
    path = (settings.upload_directory / relative_path).resolve()
    if settings.upload_directory not in path.parents:
        raise HTTPException(status_code=400, detail="Invalid attachment path.")
    return path


def _safe_unlink(path: Path) -> None:
    """Attempt cleanup without hiding the API's real validation/database result."""
    try:
        path.unlink(missing_ok=True)
    except OSError:
        # OneDrive or antivirus software can temporarily lock a recently written file.
        pass
