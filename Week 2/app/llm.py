import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI()
MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def build_summary_prompt(tasks: list[dict]) -> str:
    return f"""
You are a productivity assistant.

Summarize the user's task list in a useful way.

Do not just repeat the tasks.
Give:
1. Overall summary
2. Most urgent tasks
3. Suggested order of execution
4. Risks or blockers
5. A short motivational closing

Tasks:
{tasks}
"""


def stream_task_summary(tasks: list[dict]):
    prompt = build_summary_prompt(tasks)

    stream = client.responses.create(
        model=MODEL,
        input=prompt,
        stream=True,
    )

    for event in stream:
        if event.type == "response.output_text.delta":
            yield event.delta