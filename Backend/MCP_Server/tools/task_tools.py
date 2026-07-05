"""MCP wrappers around the backend's safe task operations."""

from typing import Literal
from uuid import UUID

from mcp.server.fastmcp import FastMCP



from app.ai_tools import (
    create_task_tool,
    delete_task_tool,
    execute_task_tool,
    list_tasks_tool,
    summarize_tasks_tool,
    update_task_tool,
)


def _owner(owner_id: str) -> UUID:
    return UUID(owner_id)


def create_task(
    owner_id: str,
    title: str,
    description: str = "",
    priority: Literal["low", "medium", "high"] = "medium",
    status: Literal["pending", "in_progress", "completed"] = "pending",
    due_at: str | None = None,
) -> dict:
    """Create a task. due_at must be an ISO 8601 timestamp with timezone when supplied."""
    return create_task_tool(_owner(owner_id), title, description, priority, status, due_at).as_dict()


def delete_task(owner_id: str, task_query: str) -> dict:
    """Delete one unambiguously matched task; never guess among matches."""
    return delete_task_tool(_owner(owner_id), task_query).as_dict()


def update_task(
    owner_id: str,
    task_query: str,
    status: Literal["pending", "in_progress", "completed"] | None = None,
    priority: Literal["low", "medium", "high"] | None = None,
    due_at: str | None = None,
    clear_due_at: bool = False,
) -> dict:
    """Update status, priority, or deadline. due_at requires an ISO 8601 timestamp with timezone."""
    return update_task_tool(_owner(owner_id), task_query, status, priority, due_at, clear_due_at).as_dict()


def list_tasks(owner_id: str) -> dict:
    """List the authenticated user's tasks."""
    return list_tasks_tool(_owner(owner_id)).as_dict()


def summarize_tasks(owner_id: str) -> dict:
    """Summarize the authenticated user's task counts and urgency."""
    return summarize_tasks_tool(_owner(owner_id)).as_dict()


def execute_task(owner_id: str, task_query: str) -> dict:
    """Execute safely; email work creates a draft placeholder only."""
    return execute_task_tool(_owner(owner_id), task_query).as_dict()


def register_task_tools(mcp: FastMCP) -> None:
    """Register every task function with the supplied MCP server."""
    for tool in (
        create_task,
        delete_task,
        update_task,
        list_tasks,
        summarize_tasks,
        execute_task,
    ):
        mcp.tool()(tool)
