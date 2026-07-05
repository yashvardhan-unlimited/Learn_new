"""Productivity tools exposed to the chat agent through MCP."""

import xml.etree.ElementTree as ET
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import UUID

from app.ai_tools import ToolResult
from app.services.google_workspace import GoogleAuthorizationRequired, create_calendar_event, create_gmail_draft, google_error_message


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
