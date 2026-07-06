"""Authenticated AI chatbot endpoint."""

from fastapi import APIRouter, Depends, HTTPException
from httpx import ConnectError

from app.dependencies import get_current_user
from app.models import UserRecord
from app.schemas import ChatRequest, ChatResponse
from app.services.chat import chat_with_tasks


router = APIRouter(tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user: UserRecord = Depends(get_current_user)):
    history = [item.model_dump() for item in request.history]
    try:
        return await chat_with_tasks(
            request.message,
            user.id,
            history,
            request.require_confirmation,
            request.approved_action,
        )
    except Exception as error:
        if _is_mcp_connection_error(error):
            raise HTTPException(
                status_code=503,
                detail="The chatbot tool process could not start. Check the backend deployment files and MCP dependencies.",
            ) from error
        raise


def _is_mcp_connection_error(error: BaseException) -> bool:
    if isinstance(error, (ConnectError, ConnectionError)):
        return True
    if isinstance(error, BaseExceptionGroup):
        return any(_is_mcp_connection_error(nested) for nested in error.exceptions)
    return error.__cause__ is not None and _is_mcp_connection_error(error.__cause__)
