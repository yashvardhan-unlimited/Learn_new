"""Productivity tools exposed to the chat agent through MCP."""

import xml.etree.ElementTree as ET
from datetime import timedelta
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import UUID

from app.ai_tools import ToolResult, _single_matching_task
from app.repositories.tasks import set_task_reminder
from app.services.google_workspace import CALENDAR_SCOPE, GoogleAuthorizationRequired, create_calendar_event, create_gmail_draft, delete_calendar_event, google_connect_url, google_error_message


def calendar_event_tool(owner_id: UUID, title: str, start: str, end: str, timezone: str = "Asia/Kolkata", description: str = "", location: str = "") -> ToolResult:
    try:
        event = create_calendar_event(owner_id, title, start, end, timezone, description, location)
    except GoogleAuthorizationRequired as error:
        return ToolResult(str(error), redirect_url=error.connect_url)
    except Exception as error:
        return ToolResult(google_error_message(error))
    return ToolResult(f'Created calendar event "{event.get("summary", title)}". {event.get("htmlLink", "")}'.strip(), True)


def gmail_draft_tool(owner_id: UUID, to: str, subject: str, body: str, cc: str = "") -> ToolResult:
    try:
        draft = create_gmail_draft(owner_id, to, subject, body, cc)
    except GoogleAuthorizationRequired as error:
        return ToolResult(str(error), redirect_url=error.connect_url)
    except Exception as error:
        return ToolResult(google_error_message(error))
    return ToolResult(f'Created Gmail draft "{subject}" for {to} (draft ID: {draft["id"]}).', True)


def add_task_reminder_tool(owner_id: UUID, task_query: str) -> ToolResult:
    task, error = _single_matching_task(owner_id, task_query)
    if error:
        return ToolResult(error)
    if task.due_at is None:
        return ToolResult(f'Set a due date and time for "{task.title}" before adding a reminder.')
    if task.reminder_event_id:
        return ToolResult(f'"{task.title}" already has a Google Calendar reminder.')
    try:
        event = create_calendar_event(
            owner_id,
            f"Reminder: {task.title}",
            task.due_at.isoformat(),
            (task.due_at + timedelta(minutes=30)).isoformat(),
            "Asia/Kolkata",
            task.description or "",
        )
    except GoogleAuthorizationRequired as auth_error:
        connect_url = google_connect_url(owner_id, [CALENDAR_SCOPE], "add_task_reminder", str(task.id))
        return ToolResult("Connect Google Workspace to add this reminder.", redirect_url=connect_url)
    except Exception as tool_error:
        return ToolResult(google_error_message(tool_error))
    set_task_reminder(task.id, owner_id, event["id"], event.get("htmlLink"))
    return ToolResult(f'Added a Google Calendar reminder for "{task.title}".', True)


def remove_task_reminder_tool(owner_id: UUID, task_query: str) -> ToolResult:
    task, error = _single_matching_task(owner_id, task_query)
    if error:
        return ToolResult(error)
    if not task.reminder_event_id:
        return ToolResult(f'"{task.title}" has no Google Calendar reminder.')
    try:
        delete_calendar_event(owner_id, task.reminder_event_id)
    except GoogleAuthorizationRequired as auth_error:
        connect_url = google_connect_url(owner_id, [CALENDAR_SCOPE], "remove_task_reminder", str(task.id))
        return ToolResult("Connect Google Workspace to remove this reminder.", redirect_url=connect_url)
    except Exception as tool_error:
        return ToolResult(google_error_message(tool_error))
    set_task_reminder(task.id, owner_id, None)
    return ToolResult(f'Removed the Google Calendar reminder for "{task.title}".', True)


def web_search_tool(query: str, max_results: int = 5) -> ToolResult:
    try:
        count = max(1, min(max_results, 8))
        url = "https://www.bing.com/search?" + urlencode({"q": query, "format": "rss"})
        with urlopen(Request(url, headers={"User-Agent": "TaskAI/1.0"}), timeout=15) as response:
            root = ET.fromstring(response.read())
        results = [
            {"title": item.findtext("title", "Untitled"), "href": item.findtext("link", ""), "body": item.findtext("description", "")}
            for item in root.findall("./channel/item")[:count]
        ]
    except Exception:
        return ToolResult("Web search is temporarily unavailable. Please try again.")
    if not results:
        return ToolResult(f'No web results found for "{query}".')
    lines = [f'{index}. {item.get("title", "Untitled")}\n{item.get("href", "")}\n{item.get("body", "")}' for index, item in enumerate(results[:count], 1)]
    return ToolResult("\n\n".join(lines))
