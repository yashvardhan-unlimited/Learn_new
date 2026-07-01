# os reads configuration values from environment variables.
import os
# OpenAI is the official Python client used to request the task summary.
from openai import OpenAI
# load_dotenv loads variables from a local .env file during development.
from dotenv import load_dotenv

# Load .env before creating the client so OPENAI_API_KEY is available.
load_dotenv()

# The client automatically reads OPENAI_API_KEY from the environment.
client = OpenAI()
# Allow the model to be changed in .env while keeping a sensible default.
MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def build_summary_prompt(tasks: list[dict]) -> str:
    """Turn the task list into instructions that the AI model can follow."""
    # The f-string inserts the supplied task dictionaries after "Tasks:".
    return f"""
You are a productivity assistant.

Summarize the user's task list in a useful way.

Do not just repeat the tasks.
Give:
1. Overall summary
2. Most urgent tasks
3. completed tasks
4. A short motivational closing

Tasks:
{tasks}
"""


def stream_task_summary(tasks: list[dict]):
    """Yield summary text pieces as OpenAI generates them."""
    prompt = build_summary_prompt(tasks)

    # stream=True makes the API return events progressively instead of waiting
    # for the entire response to finish.
    stream = client.responses.create(
        model=MODEL,
        input=prompt,
        stream=True,
    )

    # Each event represents one update from the streaming OpenAI response.
    for event in stream:
        # Only text delta events contain the next displayable piece of text.
        if event.type == "response.output_text.delta":
            # yield pauses this generator and hands one chunk to StreamingResponse.
            yield event.delta
