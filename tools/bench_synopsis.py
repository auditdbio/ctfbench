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
async def process_pair(file_name, synopsis, report, semaphore):
    async with semaphore:
        system_prompt = """You are a security expert. You are given a vulnerability synopsis and a report. You need to determine if the report describes the vulnerability mentioned in the synopsis."""
        user_prompt = f"""Given the vulnerability synopsis and report, answer only "Yes" or "No":

===SYNOPSYS BEGIN===
{synopsis}
===SYNOPSYS END===

===REPORT BEGIN===
{report}
===REPORT END===

Does the report describe the vulnerability mentioned in the synopsis?
You should check if the report contains exactly the same vulnerability, as in synopsis.
If the report contains the vulnerability in the same place, but the nature of the vulnerability is different, 
it is still a false positive.

"""

        
        # DRY_RUN mode: simulate response with a random answer
        if DRY_RUN:
            answer = random.choice(["Yes", "No"])
            print(f"[DRY RUN] File {file_name}: {answer}")
            await asyncio.sleep(0.1)  # simulate a slight delay
            return answer

        try:
            
            answer = await _model(os.getenv("AI_API_KEY"), os.getenv("AI_BASE_URL"), os.getenv("AI_MODEL"), system_prompt, user_prompt)
            print(f"File {file_name}: {answer}")
            if answer.lower().strip().endswith("yes"):
                return True
            elif answer.lower().strip().endswith("no"):
                return False
            else:
                raise Exception(f"Invalid answer: {answer}")
        except Exception as e:
            print(f"Error processing file {file_name}: {e}")
            exit(1)

async def main(synopsis_dir, reports_dir):
    # Read synopsis files (only .txt)
    synopsis_files = {
        os.path.splitext(f)[0]: os.path.join(synopsis_dir, f)
        for f in os.listdir(synopsis_dir) if f.endswith(".txt")
    }

    # Read report files (.txt and .md)
    report_files = {}
    for f in os.listdir(reports_dir):
        if f.endswith(".txt") or f.endswith(".md"):
            base_name = os.path.splitext(f)[0]
            report_files[base_name] = os.path.join(reports_dir, f)

    # Check if file names match between directories
    missing_synopsis = set(report_files.keys()) - set(synopsis_files.keys())
    missing_reports = set(synopsis_files.keys()) - set(report_files.keys())
    if missing_synopsis or missing_reports:
        error_message = "File names in the directories do not match."
        if missing_synopsis:
            error_message += " Missing synopsis for files: " + ", ".join(sorted(missing_synopsis)) + "."
        if missing_reports:
            error_message += " Missing reports for files: " + ", ".join(sorted(missing_reports)) + "."
        raise Exception(error_message)

    # Limit simultaneous requests to 60
    semaphore = asyncio.Semaphore(60)
    tasks = []
    N=3

    # For each pair of files, read their contents and create an asynchronous task
    for base_name in synopsis_files:
        with open(synopsis_files[base_name], "r", encoding="utf-8") as f:
            synopsis_content = f.read()
        with open(report_files[base_name], "r", encoding="utf-8") as f:
            report_content = f.read()
        for _ in range(N):
            tasks.append(asyncio.create_task(process_pair(base_name, synopsis_content, report_content, semaphore)))

    # Wait for all tasks to complete
    results = await asyncio.gather(*tasks)

    # Count the number of reports where the answer starts with "Yes" (case-insensitive)
    count = sum(1 for res in results if res)
    print(f"\nNumber of reports containing the vulnerability: {count}")

if __name__ == "__main__":
    # Parse command line arguments to specify the directories
    parser = argparse.ArgumentParser(
        description="Processes synopsis and report files to determine if the report describes the vulnerability."
    )
    parser.add_argument(
        "synopsis_dir",
        help="Path to the directory containing synopsis files (only .txt files)"
    )
    parser.add_argument(
        "reports_dir",
        help="Path to the directory containing report files (.txt and .md files)"
    )
    args = parser.parse_args()
    asyncio.run(main(args.synopsis_dir, args.reports_dir))
