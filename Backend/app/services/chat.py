"""OpenAI tool-calling orchestration for the task chatbot."""

import json
import re
from datetime import datetime, timezone
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from jose import JWTError

from app.llm import MODEL, client
from app.mcp_client import task_mcp_client
from app.repositories.tasks import list_tasks
from app.schemas import ChatResponse
from app.security import create_tool_confirmation, decode_tool_confirmation
from app.config import settings


SYSTEM_PROMPT = """You are a reliable, context-aware productivity assistant.

Conversation quality:
- Read the full conversation before answering. Resolve pronouns and follow-up phrases such as
  "it", "that", "the second one", and "do the same" from prior turns.
- Preserve relevant facts, preferences, constraints, and decisions already stated by the user.
- Use the supplied current date/time context to resolve relative dates precisely. Interpret terms
  such as "today", "tomorrow", "next Monday", and "in two hours" in that timezone, and include
  an explicit timezone offset in date-times passed to tools.
- Display all dates and times to the user in Indian Standard Time (IST, UTC+05:30). Never show UTC
  timestamps or raw ISO values unless the user explicitly asks for them. Tool inputs may still use
  RFC 3339 internally.
- Do not ask the user to repeat information available in the conversation or tool results.
- Answer the actual question first. Be concise but complete; use clear structure when it helps.
- If a reference remains genuinely ambiguous, ask one focused clarification instead of guessing.
- Never invent facts, tool results, links, or completed actions.

Actions and safety:
- Use the supplied tools for tasks, web search, calendar events, and Gmail drafts. Never claim an
  action succeeded unless its tool result confirms success.
- For task retrieval, prefer query_tasks over list_tasks. Pass the user's exact filters, sorting,
  and requested count as limit (for example status=pending, sort_by=due_at, limit=3). Never fetch
  the complete task list when a bounded or filtered subset can answer the request. Request task
  descriptions only when their content is necessary.
- Never answer questions about the user's current tasks from memory or chat history alone. Current
  task status, priority, deadlines, counts, and rankings must come from a task tool result.
- Combine the current request with relevant details from earlier turns. Ask only for required
  details that are still missing, such as recipient, content, date, start time, end time/duration,
  or timezone.
- Calendar and task due date-times must be RFC 3339 and include a timezone. Treat "done" as
  completed. When the user gives a task deadline, save it as due_at; never silently drop it.
- Never send email. Gmail actions may only create a draft.
- If a Google tool returns a Google Workspace connection URL, give the user that URL and explain
  that they must open it once to authorize Calendar/Gmail, then retry the request.
- When adding or removing a Calendar reminder for an existing task, always use add_task_reminder or
  remove_task_reminder instead of the generic create_calendar_event tool. These tools keep the task
  card's reminder state synchronized with Google Calendar.
- Include useful links returned by tools and briefly state what was created or changed."""

async def chat_with_tasks(
    message: str,
    owner_id: UUID,
    history: list[dict] | None = None,
    require_confirmation: bool = False,
    approved_action: str | None = None,
) -> ChatResponse:
    # Sending is blocked before the model runs so this safety rule is deterministic.
    if re.search(r"\bsend\b.*\b(email|mail)\b|\b(email|mail)\b.*\bsend\b", message, re.IGNORECASE):
        reply = "Sending email requires explicit confirmation and is not implemented yet. I can only prepare a draft."
        return ChatResponse(reply=reply, action_taken=False, updated_tasks=list_tasks(owner_id))
    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": _current_time_context()},
    ]
    messages.extend((history or [])[-20:])
    messages.append({"role": "user", "content": message})
    action_taken = False
    redirect_url = None

    async with task_mcp_client(owner_id) as mcp_client:
        tools = await mcp_client.openai_tools()
        if approved_action:
            try:
                actions = decode_tool_confirmation(approved_action, owner_id)
            except JWTError:
                return ChatResponse(reply="That confirmation expired or is invalid. Please ask me to try the action again.", action_taken=False, updated_tasks=list_tasks(owner_id))
            results = []
            for action in actions:
                result = await mcp_client.call(action["name"], action["arguments"])
                action_taken = action_taken or result.action_taken
                redirect_url = redirect_url or result.redirect_url
                results.append(result.message)
            return ChatResponse(reply="\n".join(results), action_taken=action_taken, updated_tasks=list_tasks(owner_id), redirect_url=redirect_url)

        # The model discovers MCP tools, then MCP executes any selected function.
        required_tool = _required_task_tool(message)
        for iteration in range(3):
            tool_choice = (
                {"type": "function", "function": {"name": required_tool}}
                if iteration == 0 and required_tool
                else "auto"
            )
            response = client.chat.completions.create(model=MODEL, messages=messages, tools=tools, tool_choice=tool_choice)
            assistant = response.choices[0].message
            messages.append(assistant.model_dump(exclude_none=True))
            if not assistant.tool_calls:
                return ChatResponse(reply=assistant.content or "I could not produce a response.", action_taken=action_taken, updated_tasks=list_tasks(owner_id), redirect_url=redirect_url)
            if require_confirmation:
                actions = [
                    {"name": call.function.name, "arguments": json.loads(call.function.arguments)}
                    for call in assistant.tool_calls
                ]
                confirmation_message = _confirmation_message(actions)
                return ChatResponse(
                    reply=confirmation_message,
                    action_taken=False,
                    updated_tasks=list_tasks(owner_id),
                    confirmation_required=True,
                    confirmation_token=create_tool_confirmation(owner_id, actions),
                    confirmation_message=confirmation_message,
                )
            for call in assistant.tool_calls:
                result = await mcp_client.call(call.function.name, json.loads(call.function.arguments))
                action_taken = action_taken or result.action_taken
                redirect_url = redirect_url or result.redirect_url
                messages.append({"role": "tool", "tool_call_id": call.id, "content": json.dumps(result.as_dict())})

    return ChatResponse(reply="I could not complete that request safely. Please rephrase it.", action_taken=action_taken, updated_tasks=list_tasks(owner_id))


def _confirmation_message(actions: list[dict]) -> str:
    descriptions = []
    for action in actions:
        arguments = ", ".join(f"{name}={_display_argument(name, value)}" for name, value in action["arguments"].items())
        descriptions.append(f'{action["name"]}({arguments})')
    return "Allow the AI to execute: " + "; ".join(descriptions) + "?"


def _display_argument(name: str, value) -> str:
    if name not in {"due_at", "start", "end"} or not isinstance(value, str):
        return str(value)
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(ZoneInfo("Asia/Kolkata")).strftime("%A, %d %B %Y at %I:%M %p IST")
    except ValueError:
        return value


def _current_time_context() -> str:
    try:
        local_timezone = ZoneInfo(settings.default_timezone)
    except ZoneInfoNotFoundError:
        local_timezone = timezone.utc
    now = datetime.now(local_timezone)
    return (
        "Current date/time context: "
        f"{now.strftime('%A, %B %d, %Y at %I:%M:%S %p')} "
        f"({settings.default_timezone}, UTC{now.strftime('%z')[:3]}:{now.strftime('%z')[3:]}). "
        f"RFC 3339 value: {now.isoformat()}."
    )


def _required_task_tool(message: str) -> str | None:
    """Force live task reads through tools while leaving mutations to normal tool selection."""
    normalized = message.lower()
    if re.search(r"\b(reminder|calendar)\b", normalized) and re.search(r"\btask\b", normalized):
        if re.search(r"\b(remove|delete|cancel)\b", normalized):
            return "remove_task_reminder"
        if re.search(r"\b(add|create|set|schedule)\b", normalized):
            return "add_task_reminder"
    mutation_words = r"\b(create|add|update|edit|change|delete|remove|mark|complete|finish)\b"
    if re.search(mutation_words, normalized):
        return None
    task_context = re.search(r"\b(tasks?|deadlines?|due dates?|pending|overdue|upcoming)\b", normalized)
    if not task_context:
        return None
    if re.search(r"\b(how many|count|summary|summarize|overview)\b", normalized):
        return "summarize_tasks"
    read_intent = re.search(r"\b(show|list|tell|which|what|find|give|top|most|least|next|pending|overdue|upcoming|due)\b", normalized)
    return "query_tasks" if read_intent else None
