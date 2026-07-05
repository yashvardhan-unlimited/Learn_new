"""Regression tests for application and MCP package boundaries."""

import unittest
from uuid import uuid4


class PackageTests(unittest.TestCase):
    def test_fastapi_entry_points_share_the_application(self) -> None:
        from app.main import app
        from main import app as compatibility_app

        self.assertIs(compatibility_app, app)
        self.assertIn("/chat", app.openapi()["paths"])

    def test_mcp_server_and_tools_import_as_packages(self) -> None:
        from MCP_Server.server import mcp
        from MCP_Server.tools import register_task_tools
        from app.config import settings

        self.assertIsNotNone(mcp)
        self.assertTrue(callable(register_task_tools))
        self.assertEqual(settings.mcp_server_url, "http://127.0.0.1:8001/mcp")


class MCPIntegrationTests(unittest.IsolatedAsyncioTestCase):
    async def test_http_server_exposes_tools_without_owner_id(self) -> None:
        from app.mcp_client import task_mcp_client

        async with task_mcp_client(uuid4()) as client:
            tools = await client.openai_tools()

        self.assertEqual(len(tools), 12)
        for tool in tools:
            properties = tool["function"]["parameters"].get("properties", {})
            self.assertNotIn("owner_id", properties)

    @classmethod
    def tearDownClass(cls) -> None:
        from app.database import mongo_client

        mongo_client.close()


if __name__ == "__main__":
    unittest.main()
