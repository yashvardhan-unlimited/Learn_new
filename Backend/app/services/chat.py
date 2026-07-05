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
- Do not ask the user to repeat information available in the conversation or tool results.
- Answer the actual question first. Be concise but complete; use clear structure when it helps.
- If a reference remains genuinely ambiguous, ask one focused clarification instead of guessing.
- Never invent facts, tool results, links, or completed actions.

Actions and safety:
- Use the supplied tools for tasks, web search, calendar events, and Gmail drafts. Never claim an
  action succeeded unless its tool result confirms success.
- Combine the current request with relevant details from earlier turns. Ask only for required
  details that are still missing, such as recipient, content, date, start time, end time/duration,
  or timezone.
- Calendar and task due date-times must be RFC 3339 and include a timezone. Treat "done" as
  completed. When the user gives a task deadline, save it as due_at; never silently drop it.
- Never send email. Gmail actions may only create a draft.
- If a Google tool returns a Google Workspace connection URL, give the user that URL and explain
  that they must open it once to authorize Calendar/Gmail, then retry the request.
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
        for _ in range(3):
            response = client.chat.completions.create(model=MODEL, messages=messages, tools=tools, tool_choice="auto")
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
        arguments = ", ".join(f"{name}={value}" for name, value in action["arguments"].items())
        descriptions.append(f'{action["name"]}({arguments})')
    return "Allow the AI to execute: " + "; ".join(descriptions) + "?"


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
