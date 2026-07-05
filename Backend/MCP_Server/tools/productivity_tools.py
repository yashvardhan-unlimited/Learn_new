"""MCP wrappers for calendar, Gmail draft, and web search tools."""

from mcp.server.fastmcp import FastMCP
from uuid import UUID

from app.productivity_tools import add_task_reminder_tool, calendar_event_tool, gmail_draft_tool, remove_task_reminder_tool, web_search_tool

def create_calendar_event(owner_id: str, title: str, start: str, end: str, timezone: str = "Asia/Kolkata", description: str = "", location: str = "") -> dict:
    """Create a Google Calendar event. Use RFC 3339 start/end values and ask for missing date or time details."""
    return calendar_event_tool(UUID(owner_id), title, start, end, timezone, description, location).as_dict()

def compose_gmail_draft(owner_id: str, to: str, subject: str, body: str, cc: str = "") -> dict:
    """Create a Gmail draft without sending it. Ask for any missing recipient, subject, or body."""
    return gmail_draft_tool(UUID(owner_id), to, subject, body, cc).as_dict()

def search_web(query: str, max_results: int = 5) -> dict:
    """Search the public web for current information and return up to eight results."""
    return web_search_tool(query, max_results).as_dict()

def add_task_reminder(owner_id: str, task_query: str) -> dict:
    """Add a Google Calendar reminder for an existing task using its saved due date, and link the event to the task."""
    return add_task_reminder_tool(UUID(owner_id), task_query).as_dict()

def remove_task_reminder(owner_id: str, task_query: str) -> dict:
    """Remove an existing task's linked Google Calendar reminder."""
    return remove_task_reminder_tool(UUID(owner_id), task_query).as_dict()

def register_productivity_tools(mcp: FastMCP) -> None:
    for tool in (create_calendar_event, compose_gmail_draft, search_web, add_task_reminder, remove_task_reminder):
        mcp.tool()(tool)
