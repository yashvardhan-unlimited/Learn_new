"""Client bridge between the FastAPI chat agent and the task MCP server."""

import json
import sys
from contextlib import asynccontextmanager
from copy import deepcopy
from pathlib import Path
from typing import AsyncIterator
from uuid import UUID

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from app.ai_tools import ToolResult


SERVER_PATH = Path(__file__).resolve().parent.parent / "MCP_Server" / "server.py"


class TaskMCPClient:
    def __init__(self, session: ClientSession, owner_id: UUID):
        self.session = session
        self.owner_id = owner_id

    async def openai_tools(self) -> list[dict]:
        result = await self.session.list_tools()
        tools = []
        for tool in result.tools:
            schema = deepcopy(tool.inputSchema)
            schema.get("properties", {}).pop("owner_id", None)
            schema["required"] = [name for name in schema.get("required", []) if name != "owner_id"]
            tools.append({"type": "function", "function": {"name": tool.name, "description": tool.description or "", "parameters": schema}})
        return tools

    async def call(self, name: str, arguments: dict) -> ToolResult:
        # Auth context is injected here and is never exposed to the model.
        result = await self.session.call_tool(name, {**arguments, "owner_id": str(self.owner_id)})
        if result.isError:
            return ToolResult("The task tool could not complete that request.")
        payload = result.structuredContent
        if payload is None and result.content:
            payload = json.loads(result.content[0].text)
        if isinstance(payload, dict) and isinstance(payload.get("result"), dict):
            payload = payload["result"]
        return ToolResult(message=payload["message"], action_taken=payload.get("action_taken", False), redirect_url=payload.get("redirect_url"))


@asynccontextmanager
async def task_mcp_client(owner_id: UUID) -> AsyncIterator[TaskMCPClient]:
    if not SERVER_PATH.is_file():
        raise RuntimeError(f"MCP server was not found at {SERVER_PATH}")
    parameters = StdioServerParameters(
        command=sys.executable,
        args=[str(SERVER_PATH)],
        cwd=str(SERVER_PATH.parent.parent),
    )
    # Forward child-process diagnostics to the FastAPI logs. Without this,
    # deployment failures surface only as the unhelpful "Connection closed".
    async with stdio_client(parameters, errlog=sys.stderr) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()
            yield TaskMCPClient(session, owner_id)

            
