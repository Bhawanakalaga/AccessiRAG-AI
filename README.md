# AccessiRAG AI 🚀
### Distributed Agentic RAG Platform for Technical Accessibility

**AccessiRAG AI** is a multi-modal, cognitive-friendly Retrieval-Augmented Generation (RAG) educational workspace. It decomposes dense, dry technical documentation (such as cloud architectures, microservices, and Kubernetes specifications) and translates them into customized mental layouts, interactive process flowcharts, everyday analogies, context-sensitive key-term glossaries, and clean browser-native audio streams.

---

## 📋 1. Project Background & Framework

### Project Problem Statement
Technical documentation is structurally intimidating, verbose, and cognitively exhausting. Systems like cloud architectures, DevOps frameworks, and API specifications are traditionally documented in dense, fine-print whitepapers or text-heavy wikis. This creates severe learning barriers:
1. **ADHD Cognitive Fatigue**: General lack of visual anchors, scannable summaries, and highlighted takeaways triggers fast reading fatigue.
2. **Dyslexic Interaction Friction**: Squeezed typography, tight letter-tracking, and high text density make word retrieval and syntactic decoding difficult.
3. **Autism Spectrum (ASD) Ambiguity**: Abstract, non-linear logic flow and figurative analogies without clear systematic transition inputs/outputs make system modeling difficult.
4. **Rigid Presentation Formats**: Traditional search engines and RAG tools generate uniform blocks of plain text, neglecting visual and auditory learning representation.

### Proposed Solution
**AccessiRAG AI** bridges technical documentation with cognitive accessibility. It behaves as an agentic tutoring workspace that converts dense text instructions into a responsive learning experience: Matrix Node process graphs, customized cognitive reading templates, interactive terminology glossaries, and audio narration.

### Target Users
- **Neurodivergent Developers & Students**: Engineering candidates with ADHD, Dyslexia, or ASD seeking structured learning.
- **Junior Developers & Computer Science Students**: Learners transitioning into complex systems (e.g., container orchestration, multi-tier architectures).
- **Technical Writers & Educators**: Teams testing if their documentation is easily parsed, summarized, and structurally friendly.

---

## ✨ 2. Objectives, Outcomes, & Expected Impact

### Objectives
- **Ob1. Multi-modal Technical Ingestion**: Design and build a unified pipeline to ingest raw technical manuals, plain markdown text, or live public web documentation URLs.
- **Ob2. Cognitive Profile Demarcation**: Develop customized LLM adaptors for four dynamic user styles: *Standard*, *ADHD Focus*, *Dyslexia Friendly*, and *Autism Spectrum (ASD)*.
- **Ob3. Automatic Visual Deconstruction**: Formulate a generative mapping pipeline that converts sequential paragraphs into structured JSON processes, rendering interactive node maps in real-time.
- **Ob4. Multi-sensory reinforcement**: Streamline visual, textual, and audio systems simultaneously using local document stores and unified Web Speech Synthesis.

### Outcomes & Expected Project Outcomes
- **Decreased Reading Fatigue & Reduced Cognitive Load**: Neurodivergent learners report faster retention rates by utilizing specialized letter-spacing parameters, analogies, and key-points panels.
- **Interactive Concept Verification**: Complex system interdependencies (e.g., "how a load balancer forwards traffic to a server cluster") become immediately scannable on an interactive, responsive stage.
- **Accelerated DevOps Training**: Drastically shortens the onboarding curve for cloud configurations and technical specifications compared to pure reading.

---

## 🛠️ 3. High-Level Methodology: How It Works & How It Is Working

AccessiRAG AI runs on a distributed full-stack pipeline: a robust **Node.js/Express (TypeScript) Server** orchestrating the backend and a highly polished **React (TypeScript) Single Page Application** running in the browser. 

```
┌─────────────────────────────────┐
│        Web Browser (UI)         │
│  [React Client - Space Grotesk] │
└────────────────┬────────────────┘
                 │
  Ingest / Query / Stream Requests
                 │
┌────────────────▼────────────────┐
│      Express Backend Node       │
│    (Port 3000 Security Node)    │
└────────┬────────────────┬───────┘
         │                │
┌└───▼───┘─────┐   ┌──────▼───────┐
│ Local Store  │   │ Google Gemini│
│ (JSON DBMS)  │   │  API Engine  │
└──────────────┘   └──────────────┘
```

The system manages data stream handling through five layered agentic modules:

### 1. The Ingestion Engine & Vectorizer
- **Raw Input**: Accepts manual text snippets, named documentation payloads, or live URLs.
- **Scraper / Pre-processor**: Extracts core text content, filtering out distracting HTML header and sidebar templates.
- **Chunking Pipeline**: Divides raw documents into standard `1000-character` chunks with `200-character` overlap to maintain surrounding context.
- **Embedding Generation**: Converts text chunks into `1536-dimensional` semantic vectors using the modern `@google/genai` model `gemini-embedding-2-preview` and persists them securely inside a local json store (`chroma_stub_db.json`).

### 2. The Semantic Retrieval Agent
- **Query Handling**: When you type a query, it generates an embedding vector from your query.
- **Vector Search**: Computes **Cosine Similarity scores** between the query and all ingested chunks on the server to retrieve the top matching context.
- **Keyword Fallback**: If no Gemini API Key is provided, the database falls back to a custom **TF-IDF keyword scanning algorithm** so core operations never break.

### 3. Cognitive Adaptation Module (User Profiles)
When generating answers, the custom context is passed to `gemini-3.5-flash` with specific system directives tailored to the user's active profile:
- **Standard Profile**: Focuses on direct, highly helpful, and conversational explanations.
- **ADHD Profile**: Places priority on *bold scannable headers*, *bulleted parameters*, and filters out conversational filler. It populates an absolute "Fast Focus Key Takeaways" block first.
- **Dyslexia Profile**: Instructs the LLM to write in distinct structural paragraphs, provides real-world **everyday analogies** (such as comparing microservices to restaurant roles), and styles the typography with optimal high-readability letter tracking.
- **Autism Spectrum (ASD) Profile**: Converts theoretical descriptions into literal, input-and-output procedural lists showing structured transformation rules.

### 4. Interactive Diagram Synthesis
- The assistant is directed to parse relationships into a structured JSON definition containing Nodes (e.g., processes, load balancers, database instances) and Edges (connections).
- The client receives this structural payload and renders a custom-painted interactive Canvas. Users can click individual boxes to view distinct operational logs, triggers, and hover conditions.

### 5. Multi-sensory Audio Synthesizer
- To assist linguistic representation, a dedicated script processor formats answers into a fluid voice stream.
- Using the standard **HTML5 Web Speech API**, users can verbally start, pause, or skip technical passages directly in the UI.

---

## ⚙️ 4. System Requirements & Specifications

### Functional Requirements
- **FR1 (Ingestion Interfaces)**: Allow users to paste raw documentation text, set explicit titles, or provide live wiki URLs to pull, clean, and store resources.
- **FR2 (Document Manipulation)**: Track all active documents within the database. Users must be able to view, download raw Markdown iterations, or delete individual files.
- **FR3 (Profile Swapping)**: Dynamically recalculate active reading pane typography and instruct the AI response template based on selected profile controls.
- **FR4 (Process Modeling)**: Generate structured, interactive flowcharts directly from the query context with customizable zoom, node selection, and details panels.
- **FR5 (Text-to-Speech)**: Streamline structural text answers into accessible voice streams running offline inside browser-native speech managers.

### Non-Functional Requirements
- **Performance**: Semantic retrieval matching and vector block scanning must return scores in sub-second times on local nodes.
- **Visual Design & Contrast**: Adhere to color contrast ratios using deep grays, rich slate canvases, and vivid high-contrast indigo indicators (`Space Grotesk` display typography paired with readable monospaced blocks).
- **Graceful Failures**: Maintain continuous offline and key-missing capability (such as TF-IDF string matching) if Google Gemini services are inaccessible.

---

## 📦 5. Core Technologies & Technology Stack

The platform is designed as a standalone, enterprise-capable hybrid stack:

- **Frontend Client Framework**: React 18 with Vite, designed with complete TypeScript type safety.
- **Client Styling & Animations**: Tailwind CSS utility directives, customized theme fonts (`Inter`, `Space Grotesk`, `JetBrains Mono`), and fluid motion-based enters/transitions via the `motion` package.
- **Icons**: Standardized clean visual glyph assets loaded via `lucide-react`.
- **Backend Infrastructure Server**: Node.js running Web Express with TypeScript execution handled dynamically via `tsx`.
- **Artificial Intelligence Engine**: Modern `@google/genai` TypeScript SDK representing the Google Gemini Ecosystem.
- **Database Storage Engine**: Clean, local structured JSON Similarity database (`chroma_stub_db.json`) enabling zero-config deployment.

---

## 🔐 6. Git Security Protocol: Keeping Secrets and API Keys Safe

Sharing your application code on public GitHub repositories is highly encouraged, but **you must never push secret keys** (such as Gemini API keys, Firebase configuration variables, Google Cloud credentials, or database keys) to GitHub. 

### Why is this critical?
Public search crawlers scan GitHub 24/7 for exposed API keys. Exposing keys leads to unauthorized billing, account suspension, or severe security violations.

### How AccessiRAG AI Protects Your Secrets:
This project is configured with a strict, multi-layer security perimeter to block secret leaks automatically:

1. **The Ignore List (.gitignore)**:
   Our local `.gitignore` is pre-configured to block any environment config files from ever entering GitHub's commits:
   ```text
   # Excludes all .env configurations (such as .env, .env.local, .env.production)
   .env*
   
   # Prevents deep node libraries from committing
   node_modules/
   
   # Ignores local compilation files
   dist/
   build/
   ```
2. **The Environment Blueprint (.env.example)**:
   Instead of uploading real keys, we provide a safe, mock template called `.env.example`. This file holds only empty keys to let other developers know what values they need to run the code locally:
   ```env
   # .env.example - COMMITTED SAFELY TO GITHUB
   GEMINI_API_KEY=
   FIREBASE_API_KEY=
   FIREBASE_AUTH_DOMAIN=
   FIREBASE_PROJECT_ID=
   ```

### 🧑‍💻 How to setup your keys in local development safely:
When setting up this project in VS Code:
1. Copy `.env.example` and name the new copy `.env` (this is ignored by Git).
2. Insert your actual secret keys inside `.env`:
   ```env
   GEMINI_API_KEY=your_actual_gemini_key_here
   ```
3. Run `npm run dev` as usual. The server will read the credentials locally without ever publishing them to GitHub.

---

## 🚀 7. Developer Configuration: Run in VS Code

Follow these simple steps to run AccessiRAG AI locally:

### Step 1: Open workspace in VS Code
1. Extract your project folder.
2. In VS Code, go to `File` -> `Open Folder...` and select your project's root folder.

### Step 2: Set up Local Config
Create a file named `.env` in the root folder, and fill in your keys:
```env
GEMINI_API_KEY=your_actual_vertex_or_gemini_api_key
```

### Step 3: Run Setup & Run Commands
Launch your VS Code terminal (`Ctrl + ~` or `Cmd + ~`) and execute:
```bash
# 1. Install all required dependencies
npm install

# 2. Run the unified dev server
npm run dev
```

### Step 4: Preview App
Open your browser of choice and go to:
```
http://localhost:3000
```
This serves both the frontend SPA interface and proxy API requests simultaneously.
