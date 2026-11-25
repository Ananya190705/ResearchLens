
import re
import fitz

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from services.llm_service import (
    generate_response,
    analyze_research_paper,
    compare_research_papers
)


app = FastAPI(title="ResearchLens AI Service")


# ---------------- HOME AND HEALTH CHECK ----------------

@app.get("/")
def home():
    return {"message": "Welcome to ResearchLens AI Service"}


@app.get("/health")
def health_check():
    return {"status": "AI service is running"}


# ---------------- PDF TEXT EXTRACTION ----------------

@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    try:
        pdf_bytes = await file.read()

        if not pdf_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded PDF is empty"
            )

        with fitz.open(stream=pdf_bytes, filetype="pdf") as document:

            extracted_pages = []

            for page_number, page in enumerate(document, start=1):

                page_text = page.get_text()

                extracted_pages.append({
                    "page": page_number,
                    "text": page_text
                })

            extracted_text = "\n".join(
                page["text"] for page in extracted_pages
            )

            return {
                "filename": file.filename,
                "total_pages": len(document),
                "pages": extracted_pages,
                "extracted_text": extracted_text
            }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"PDF extraction failed: {str(error)}"
        )

    finally:
        await file.close()


# ---------------- REQUEST MODELS ----------------

class TextRequest(BaseModel):
    extracted_text: str


class ComparisonRequest(BaseModel):
    papers: list[dict]


# ---------------- TEXT PREPROCESSING ----------------

def clean_text(text: str):

    text = re.sub(r"[ \t]+", " ", text)

    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


# ---------------- TEXT CHUNKING ----------------

def split_into_chunks(text: str, chunk_size=700, overlap=80):

    words = text.split()

    chunks = []
    start = 0

    while start < len(words):

        end = start + chunk_size

        chunk = " ".join(words[start:end])

        chunks.append(chunk)

        if end >= len(words):
            break

        start = end - overlap

    return chunks


@app.post("/preprocess-text")
async def preprocess_text(request: TextRequest):

    if not request.extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Extracted text cannot be empty"
        )

    cleaned_text = clean_text(request.extracted_text)

    chunks = split_into_chunks(cleaned_text)

    return {
        "message": "Text preprocessing completed",
        "original_length": len(request.extracted_text),
        "cleaned_length": len(cleaned_text),
        "total_chunks": len(chunks),
        "chunks": chunks
    }


# ---------------- LLM INTEGRATION TEST ----------------

@app.post("/test-llm")
async def test_llm():

    try:
        answer = generate_response(
            "Explain YOLOv5 in two simple sentences."
        )

        return {
            "message": "LLM integration successful",
            "provider_response": answer
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"LLM integration failed: {str(error)}"
        )


# ---------------- SINGLE PAPER ANALYSIS ----------------

@app.post("/analyze-paper")
async def analyze_paper(request: TextRequest):

    if not request.extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Research paper text cannot be empty"
        )

    try:
        cleaned_text = clean_text(request.extracted_text)

        analysis = analyze_research_paper(
            cleaned_text,
            provider="gemini"
        )

        return {
            "message": "Research paper analysis completed",
            "analysis": analysis
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Research paper analysis failed: {str(error)}"
        )


# ---------------- MULTIPLE PAPER COMPARISON ----------------

@app.post("/compare-papers")
async def compare_papers(request: ComparisonRequest):

    if len(request.papers) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two papers are required for comparison"
        )

    try:
        comparison = compare_research_papers(
            request.papers,
            provider="gemini"
        )

        return {
            "message": "Paper comparison completed",
            "comparison": comparison
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Paper comparison failed: {str(error)}"
        )
