# AccessiRAG AI 🐍
### Distributed CrewAI & FastAPI Python Swarm Microservice

This folder contains the complete parallel **Python Backend Implementation** representing the five-phase roadmap described in your target architecture design:
- **Phase 1**: FastAPI endpoint setup, PDF parsing & file upload integration.
- **Phase 2**: ChromaDB local vector store index & math-similarity retrieval.
- **Phase 3**: CrewAI multi-agent cooperative architecture (Ingestion, Retrieval, and Reasoning Agents).
- **Phase 4**: Cognitive personalization style rules.
- **Phase 5**: Production-grade Dockerization layouts.

---

## 💻 Setup and Execution

To run this backend in your local VS Code environment alongside the React frontend:

### 1. Set Up Python Environment
Open your VS Code terminal and initialize a Virtual Environment inside this folder:
```bash
# Navigate to the backend folder
cd backend-python

# Create virtual environment
python -m venv venv

# Activate Virtual Environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Microservice Dependencies
Install all required packages matching CrewAI, ChromaDB, and Google GenAI SDK:
```bash
pip install -r requirements.txt
```

### 3. Create Local Secrets file (`.env`)
Create a `.env` file in the `backend-python/` root directory to hold your AI credentials safely:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_goes_here
```

### 4. Run the microservice
Execute the API Server using Uvicorn. The server runs on port `8000`:
```bash
python main.py
```

---

## 🎨 Architecture & Agent Swarm

The backend operates 3 collaborative agents managed by a master Coordinator:

1. **Ingestion Agent**: Splits raw PDF characters or url content into a standard recursive chunking matrix, and uses `gemini-embedding-2-preview` to save vectors.
2. **Retrieval Agent**: Takes a query, converts it to vector embeddings, coordinates search constraints on **ChromaDB**, and fetches context chunks using cosine similarity.
3. **Reasoning Agent**: Reviews the retrieved documentation blocks, identifies technical jargon, constructs everyday metaphors/analogies, and formats clear, spaced responses matching standard, ADHD, ASD, or dyslexic learner layouts.
