import os
import asyncio
from openai import AsyncOpenAI, NOT_GIVEN
import random
from dotenv import load_dotenv
import argparse

# Load environment variables from the .env file
load_dotenv()



async def _model(api_key: str, base_url: str, model: str, system_prompt: str, user_prompt: str, reasoning_effort:str=NOT_GIVEN, temperature:float=NOT_GIVEN, timeout:int=NOT_GIVEN) -> str:
    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
    )

    if model == "o3-mini" and reasoning_effort == NOT_GIVEN:
        reasoning_effort = "high"
    
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=temperature,
        timeout=timeout,
        reasoning_effort=reasoning_effort
    )
    
    return response.choices[0].message.content.strip()



# Set DRY_RUN mode based on the environment variable
DRY_RUN = os.getenv("DRY_RUN", "0") == "1"

# Function to process one pair of files: synopsis and report
async def process_pair(file_name, report, semaphore):
    async with semaphore:
        system_prompt = """You are a security expert. You are given a vulnerability report. You need to calculate the number of UNIQUE vulnerabilities in the report."""
        user_prompt = f"""Given the vulnerability report, answer only total number of UNIQUE vulnerabilities:
===REPORT BEGIN===
{report}
===REPORT END===

If the vulnerability is not unique, do not count it.
Answer only the number and nothing else.

"""

        
        # DRY_RUN mode: simulate response with a random answer
        if DRY_RUN:
            answer = random.randint(0, 100)
            print(f"[DRY RUN] File {file_name}: {answer}")
            await asyncio.sleep(0.1)  # simulate a slight delay
            return answer

        try:
            for _ in range(5):
                try:
                    answer = await _model(os.getenv("AI_API_KEY"), os.getenv("AI_BASE_URL"), os.getenv("AI_MODEL"), system_prompt, user_prompt)
                    print(f"File {file_name}: {answer}")
                    return int(answer)
                except Exception as e:
                    print(f"Error processing file {file_name}: {e}")
                    await asyncio.sleep(1)
            raise Exception(f"Failed to process file {file_name} after 5 attempts")
        except Exception as e:
            print(f"Error processing file {file_name}: {e}")
            exit(1)

async def main(reports_dir):
    # Read synopsis files (only .txt)
    report_files = {}
    for f in os.listdir(reports_dir):
        if f.endswith(".txt") or f.endswith(".md"):
            base_name = os.path.splitext(f)[0]
            report_files[base_name] = os.path.join(reports_dir, f)



    # Limit simultaneous requests to 60
    semaphore = asyncio.Semaphore(60)
    tasks = []
    N=3

    # For each pair of files, read their contents and create an asynchronous task
    for base_name in report_files:
        with open(report_files[base_name], "r", encoding="utf-8") as f:
            report_content = f.read()
        for _ in range(N):
            tasks.append(asyncio.create_task(process_pair(base_name, report_content, semaphore)))

    # Wait for all tasks to complete
    results = await asyncio.gather(*tasks)

    # Count the number of reports where the answer starts with "Yes" (case-insensitive)
    count = sum(res for res in results)
    print(f"\nNumber of unique vulnerabilities found: {count}")

if __name__ == "__main__":
    # Parse command line arguments to specify the directories
    parser = argparse.ArgumentParser(
        description="Processes synopsis and report files to determine if the report describes the vulnerability."
    )

    parser.add_argument(
        "reports_dir",
        help="Path to the directory containing report files (.txt and .md files)"
    )
    args = parser.parse_args()
    asyncio.run(main(args.reports_dir))
