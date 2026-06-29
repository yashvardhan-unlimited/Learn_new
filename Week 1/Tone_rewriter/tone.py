import os

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()



client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class RewriteOutput(BaseModel):
    professional: str
    casual: str
    persuasive: str


def rewrite_paragraph(paragraph: str) -> RewriteOutput:
    response = client.responses.parse(
        model="gpt-4.1-mini",
        text_format=RewriteOutput,
        input=[
            {
                "role": "system",
                "content": (
                    "You are an expert writing assistant.\n"
                    "Your job is to rewrite paragraphs while preserving their meaning.\n\n"
                    "Rules:\n"
                    "- Do not change the meaning.\n"
                    "- Improve grammar and readability.\n"
                    "- Do not invent information.\n"
                    "- Produce three distinct writing styles:\n"
                    "  1. Professional\n"
                    "  2. Casual\n"
                    "  3. Persuasive"
                ),
            },

            # -------- Few-shot Example 1 --------
            {
                "role": "user",
                "content": (
                    "Rewrite the following paragraph:\n\n"
                    "Our app is good but there are still many bugs that we need to fix before launching."
                ),
            },
            {
                "role": "assistant",
                "content": (
                    "Professional:\n"
                    "Our application demonstrates strong potential; however, several issues remain that should be resolved before the official launch.\n\n"
                    "Casual:\n"
                    "Our app is pretty good, but we've still got a bunch of bugs to fix before we launch it.\n\n"
                    "Persuasive:\n"
                    "Let's fix the remaining bugs before launch so users get the best possible first impression of our application."
                ),
            },

            # -------- Few-shot Example 2 --------
            {
                "role": "user",
                "content": (
                    "Rewrite the following paragraph:\n\n"
                    "Students should start preparing early for exams because waiting until the last week usually creates unnecessary stress."
                ),
            },
            {
                "role": "assistant",
                "content": (
                    "Professional:\n"
                    "Students are encouraged to begin preparing well in advance of examinations, as delaying preparation often results in unnecessary stress.\n\n"
                    "Casual:\n"
                    "It's better to start studying early instead of waiting until the last week because cramming is stressful.\n\n"
                    "Persuasive:\n"
                    "Start preparing today instead of waiting until the last minute. A little effort each day can reduce stress and help you achieve better results."
                ),
            },

            # -------- Actual User Input --------
            {
                "role": "user",
                "content": (
                    f"Rewrite the following paragraph:\n\n{paragraph}"
                ),
            },
        ],
    )

    return response.output_parsed


def main():
    print("=== AI Paragraph Rewriter ===\n")

    paragraph = input("Enter a paragraph:\n\n> ")

    result = rewrite_paragraph(paragraph)

    print("\n" + "=" * 60)

    print("\nProfessional\n")
    print(result.professional)

    print("\n" + "-" * 60)

    print("\nCasual\n")
    print(result.casual)

    print("\n" + "-" * 60)

    print("\nPersuasive\n")
    print(result.persuasive)

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()

