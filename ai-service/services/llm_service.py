
import os
import json

from dotenv import load_dotenv
from litellm import completion

load_dotenv()


# ---------------- LLM RESPONSE GENERATION ----------------


def generate_response(prompt: str, provider: str = "gemini"):

    if provider == "gemini":
        model = os.getenv("LLM_MODEL")
        api_key = os.getenv("GEMINI_API_KEY")

    elif provider == "groq":
        model = os.getenv("GROQ_MODEL")
        api_key = os.getenv("GROQ_API_KEY")

    elif provider == "openai":
        model = os.getenv("OPENAI_MODEL")
        api_key = os.getenv("OPENAI_API_KEY")

    else:
        raise ValueError("Unsupported LLM provider")

    if not api_key:
        raise ValueError(f"{provider} API key is missing")

    if not model:
        raise ValueError(f"{provider} model is not configured")

    response = completion(
        model=model,
        messages=[
            {"role": "user", "content": prompt}
        ],
        api_key=api_key
    )

    # Check whether the LLM returned any choices
    if not response.choices:
        raise ValueError("LLM returned no response choices")

    content = response.choices[0].message.content

    if not content:
        raise ValueError("LLM returned empty content")

    return content



#---------------- RESEARCH PAPER ANALYSIS ----------------

  def analyze_research_paper(extracted_text: str, provider: str = "gemini"):

    prompt = f"""
You are an expert research paper analysis assistant.

Analyze the research paper text provided below.

Extract the following information:

1. Title
2. Research objective
3. Problem statement
4. Algorithms and models used
5. Methodology
6. Dataset used
7. Performance metrics
8. Experimental results
9. Limitations
10. Future scope
11. Main contributions

IMPORTANT RULES:
- Use only information supported by the supplied paper text.
- Do not invent algorithms, datasets, results or metrics.
- If information is unavailable, write "Not reported in the paper".
- Preserve technical terminology.
- Distinguish proposed methods from methods actually implemented.
- Return valid JSON only. Do not include Markdown or explanations outside JSON.

Required JSON structure:

{{
    "title": "",
    "research_objective": "",
    "problem_statement": "",
    "algorithms_and_models": [],
    "methodology": "",
    "dataset": "",
    "performance_metrics": [],
    "experimental_results": "",
    "limitations": [],
    "future_scope": [],
    "main_contributions": []
}}

RESEARCH PAPER TEXT:

{extracted_text}
"""

    response = generate_response(prompt, provider)

    result = response.strip()

    # Remove Markdown code fences if returned by the model
    if result.startswith("```"):
        result = result.split("\n", 1)[1]
        result = result.rsplit("```", 1)[0].strip()

    try:
        analysis = json.loads(result)

    except json.JSONDecodeError as error:
        raise ValueError(
            f"LLM did not return valid JSON: {error}"
        )

    return analysis

def compare_research_papers(papers, provider="gemini"):

    papers_text = json.dumps(papers, indent=2)

    prompt = f"""
    You are an expert research paper comparison assistant.

    Compare the following research papers using only
    the information provided.

    PAPERS:
    {papers_text}

    Return a valid JSON object with these fields:

    {{
        "overall_summary": "",
        "similarities": [],
        "differences": [],
        "algorithm_comparison": [],
        "dataset_comparison": [],
        "performance_comparison": [],
        "limitations_comparison": [],
        "research_gaps": []
    }}

    Instructions:
    - Compare each paper separately.
    - Do not invent missing information.
    - Do not assume metrics are directly comparable
      when datasets or experimental settings differ.
    - Clearly identify missing information.
    - Research gaps are potential gaps, not proven novelty.
    - Return valid JSON only.
    """

    response = generate_response(prompt, provider)

    if not response:
        raise ValueError("Gemini returned an empty response")

    result = response.strip()

    # Remove Markdown code fences if present
    if result.startswith("```"):
        lines = result.splitlines()

        if lines[-1].strip().startswith("```"):
            lines = lines[1:-1]
        else:
            lines = lines[1:]

        result = "\n".join(lines).strip()

    try:
        analysis = json.loads(result)
        return analysis

    except json.JSONDecodeError as error:
        print("Invalid Gemini JSON response:")
        print(result)

        raise ValueError(
            f"Gemini returned invalid JSON: {error}"
        )