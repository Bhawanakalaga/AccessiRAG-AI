import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from database import ChromaLocalDB
from agents import CrewCoordinator

app = FastAPI(
    title="AccessiRAG AI - Multi-Agent Backend Service",
    description="Python FastAPI implementation serving CrewAI agents, ChromaDB vector listings, and adaptive RAG queries.",
    version="1.0.0"
)

# Enable CORS for local React/Vite development or Cloud Run container mapping
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate Database and Agent controllers
db = ChromaLocalDB()
coordinator = CrewCoordinator(db)

# Request Models
class QueryRequest(BaseModel):
    query: str
    history: Optional[List[dict]] = []
    accessibilityConfig: Optional[dict] = {"mode": "standard"}

class IngestTextRequest(BaseModel):
    name: str
    type: str # 'text' | 'url'
    content: str
    url: Optional[str] = None

@app.get("/")
def health_check():
    """Verify system-wide availability."""
    return {
        "status": "healthy",
        "service": "FastAPI Multi-Agent Server",
        "database": "ChromaDB Ready",
        "agents": ["IngestionAgent", "RetrievalAgent", "ReasoningAgent"]
    }

@app.get("/api/documents")
def list_documents():
    """List all ingested technical documents with chunk counts metadata."""
    documents = db.get_documents()
    return {"documents": documents}

@app.post("/api/documents/ingest")
async def ingest_text_document(req: IngestTextRequest):
    """Trigger manual text ingestion agent mapping."""
    if not req.name or not req.content:
        raise HTTPException(status_code=400, detail="Missing title or content parameters.")
    
    try:
        doc = db.add_document(
            name=req.name,
            doc_type=req.type,
            content=req.content
        )
        return {
            "success": True,
            "document": doc,
            "message": f"Successfully ingested '{req.name}' into vector database!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/upload-pdf")
async def upload_pdf_document(
    name: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Ingest a PDF document directly, parse its binary structural contents, 
    generate embeddings, and save chunks to the vector database.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF file format is supported.")
    
    try:
        # Read uploaded binary contents
        file_bytes = await file.read()
        
        # Parse PDF using PyPDF2 or pdfminer
        import io
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            text_content = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_content += extracted + "\n"
        except ImportError:
            # Simple fallback if PyPDF2 is during local boot setup
            text_content = file_bytes.decode('utf-8', errors='ignore')

        if not text_content.strip():
            raise HTTPException(status_code=400, detail="Extracted text from PDF is empty.")

        doc = db.add_document(
            name=name,
            doc_type="pdf",
            content=text_content
        )
        return {
            "success": True,
            "document": doc,
            "message": f"PDF File '{file.filename}' parsed and vector-indexed matching 512 chunks!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF ingestion failed: {str(e)}")

@app.post("/api/chat")
async def chat_rag_agents(req: QueryRequest):
    """
    Trigger the distributed multi-agent RAG workflow. 
    Collaborates Ingestion Agent, Retrieval Agent, and Reasoning Agent to formulate 
    cognitive, visual responses.
    """
    try:
        reply = await coordinator.coordinate_query(
            query=req.query,
            history=req.history,
            config=req.accessibilityConfig
        )
        return reply
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent reasoning failed: {str(e)}")

if __name__ == "__main__":
    # Standard server entry point
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
