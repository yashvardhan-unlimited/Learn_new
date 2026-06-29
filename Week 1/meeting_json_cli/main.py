import argparse
import json
import os
import sys

from dotenv import load_dotenv
from matplotlib import text
from openai import OpenAI

from schema import MeetingOutput
from datetime import datetime

today = datetime.now().strftime("%A, %B %d, %Y")


def read_file(path: str) -> str:
    if not os.path.exists(path):
        print(json.dumps({"error": "Input file not found"}))
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as file:
        text = file.read().strip()

    if not text:
        print(json.dumps({"error": "Input file is empty"}))
        sys.exit(1)

    return text


def extract_meeting_json(text: str) -> MeetingOutput:
    client = OpenAI()

    response = client.responses.parse(
        model="gpt-4.1-mini",
        input=f"""
Extract structured information from these meeting notes.

Rules:
- Return only the required structured data.
- If owner or deadline is missing, use "unknown".
- Priority should be one of: low, medium, high.

Todays date and day: {today}

Meeting notes:
{text}
""",
        text_format=MeetingOutput,
    )

    return response.output_parsed


def main():
    load_dotenv()

    if not os.getenv("OPENAI_API_KEY"):
        print(json.dumps({"error": "OPENAI_API_KEY missing in .env"}))
        sys.exit(1)

    # parser = argparse.ArgumentParser(description="Extract meeting notes into JSON")
    # parser.add_argument("--input", required=True, help="Path to meeting notes file")
    # args = parser.parse_args()

    # text = read_file(args.input)

    text =read_file("sample_notes.txt")
    
    try:
        result = extract_meeting_json(text)
        print(result.model_dump_json(indent=2))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()