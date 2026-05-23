import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Path to our persistent vector simulation database
const DB_PATH = path.join(process.cwd(), "chroma_stub_db.json");

interface DocumentChunk {
  id: string;
  documentId: string;
  sourceName: string;
  sourceType: 'text' | 'pdf' | 'url';
  content: string;
  embedding?: number[];
}

interface IngestedDocumentMeta {
  id: string;
  name: string;
  type: 'text' | 'pdf' | 'url';
  createdAt: string;
  chunkCount: number;
  wordCount?: number;
}

interface DatabaseSchema {
  documents: IngestedDocumentMeta[];
  chunks: DocumentChunk[];
}

// Ensure database file exists
function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading vector database, mock-resetting:", err);
  }
  return { documents: [], chunks: [] };
}

function saveDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing vector database:", err);
  }
}

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API initialized successfully!");
} else {
  console.warn("GEMINI_API_KEY not found in environment. Running in sandbox mode with cognitive local RAG.");
}

// Generate chunks with overlap
function splitIntoChunks(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex > text.length) {
      endIndex = text.length;
    }
    chunks.push(text.slice(startIndex, endIndex));
    if (endIndex === text.length) {
      break;
    }
    startIndex += chunkSize - overlap;
  }
  return chunks;
}

// Utility to calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Simple TF-IDF score helper for keyword search fallback
function computeKeywordScore(text: string, query: string): number {
  const queryWords = query.toLowerCase().split(/\W+/).filter(Boolean);
  const textLower = text.toLowerCase();
  if (queryWords.length === 0) return 0;
  
  let matchCount = 0;
  for (const word of queryWords) {
    if (textLower.includes(word)) {
      matchCount++;
    }
  }
  return matchCount / queryWords.length;
}

// Fetch web URLs and clean up layout tags (Naive HTML scraper)
async function scrapeUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    const html = await response.text();
    // Simple text extraction from HTML text elements
    let body = html;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) body = bodyMatch[1];
    
    // Remove scripts, styles, XML/tags
    body = body
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<noscript>([\s\S]*?)<\/noscript>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
      
    return body;
  } catch (err: any) {
    throw new Error(`Failed to scrape URL ${url}: ${err.message}`);
  }
}

// Pre-seed database with friendly starter documentation if empty
function preseedDatabase() {
  const db = loadDatabase();
  if (db.documents.length === 0) {
    const seedDocs = [
      {
        id: "aws-s3-doc",
        name: "Kubernetes Containers & Pods Architecture",
        type: "text" as const,
        createdAt: new Date().toISOString(),
        content: `Kubernetes pods are the smallest deployable units of computing that you can create and manage in Kubernetes. A Pod is a group of one or more containers, with shared storage and network resources, and a specification for how to run the containers. A Pod's contents are always co-located and co-scheduled, and run in a shared context. A Pod models an application-specific "logical host": it contains one or more application containers which are relatively tightly coupled. In non-cloud contexts, applications executed on the same physical or virtual machine are analogous to cloud applications executed on the same logical host. Shared storage refers to volumes that pod containers can access to write and share data. Shared networking utilizes namespaces to share ports and communicate using localhost. Pods are designed to be ephemeral and easily scaled by Deployment controllers.`
      },
      {
        id: "gcp-iam-doc",
        name: "Cloud Identity & Access Management (IAM)",
        type: "text" as const,
        createdAt: new Date().toISOString(),
        content: `Identity and Access Management (IAM) lets you manage access control by defining who (identity) has what access (role) for which resource. In IAM, permission is not granted directly to the user. Instead, permissions are grouped into roles, and roles are granted to members. There are three types of roles in IAM: Primitive roles (Owner, Editor, Viewer), Predefined roles (granular AWS/GCP services like Storage Admin), and Custom roles (tailored permissions specified by admins). Principal accounts can include Google accounts, service accounts, or user groups. Least privilege access is an essential design security standard, preventing users from accessing information beyond what they require to accomplish daily tasks.`
      }
    ];

    for (const doc of seedDocs) {
      const chunks = splitIntoChunks(doc.content);
      const computedWordCount = doc.content.trim() ? doc.content.trim().split(/\s+/).length : 0;
      db.documents.push({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        createdAt: doc.createdAt,
        chunkCount: chunks.length,
        wordCount: computedWordCount
      });

      chunks.forEach((chunkContent, idx) => {
        db.chunks.push({
          id: `${doc.id}-chunk-${idx}`,
          documentId: doc.id,
          sourceName: doc.name,
          sourceType: doc.type,
          content: chunkContent
        });
      });
    }

    saveDatabase(db);
    console.log("Vector DB successfully seeded with accessibility starter docs!");
  }
}

preseedDatabase();

// JSON parsing middleware
app.use(express.json({ limit: '10mb' }));

// 1. GET /api/documents - List ingested resources
app.get("/api/documents", (req, res) => {
  const db = loadDatabase();
  const documentsWithWordCount = db.documents.map(doc => {
    if (doc.wordCount !== undefined) {
      return doc;
    }
    const documentChunks = db.chunks.filter(c => c.documentId === doc.id);
    const content = documentChunks.map(c => c.content).join(" ");
    const count = content.trim() ? content.trim().split(/\s+/).length : 0;
    return {
      ...doc,
      wordCount: count
    };
  });
  res.json({ documents: documentsWithWordCount });
});

// 1.5. GET /api/documents/:id - Retrieve specific document content from chunks
app.get("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const doc = db.documents.find(d => d.id === id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found." });
  }
  const documentChunks = db.chunks
    .filter(c => c.documentId === id)
    .sort((a, b) => {
      const idxA = parseInt(a.id.split("-chunk-")[1] || "0", 10);
      const idxB = parseInt(b.id.split("-chunk-")[1] || "0", 10);
      return idxA - idxB;
    });
  res.json({
    ...doc,
    content: documentChunks.map(c => c.content).join("\n\n")
  });
});

// 1.8. DELETE /api/documents - Clear all ingested resources (Delete All)
app.delete("/api/documents", (req, res) => {
  const db = { documents: [], chunks: [] };
  saveDatabase(db);
  res.json({ success: true, message: "All document resources removed from vector DB." });
});

// 2. DELETE /api/documents/:id - Delete ingested resources
app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  
  db.documents = db.documents.filter(d => d.id !== id);
  db.chunks = db.chunks.filter(c => c.documentId !== id);
  
  saveDatabase(db);
  res.json({ success: true, message: "Document deleted successfully" });
});

// 3. POST /api/documents/ingest - Ingestion Agent triggers embedding and storage
app.post("/api/documents/ingest", async (req, res) => {
  const { name, type, content, url } = req.body;
  
  if (!name || (!content && !url)) {
    return res.status(400).json({ error: "Missing required document parameter (name, content, or url)." });
  }

  try {
    let textToProcess = content || "";
    
    // If URL is supplied, trigger URL Scraping mechanism
    if (type === 'url' && url) {
      textToProcess = await scrapeUrl(url);
    }

    if (!textToProcess || textToProcess.trim().length === 0) {
      return res.status(400).json({ error: "Extracted document content is empty." });
    }

    const docId = `doc-${Date.now()}`;
    const chunkStrings = splitIntoChunks(textToProcess);
    const computedWordCount = textToProcess.trim() ? textToProcess.trim().split(/\s+/).length : 0;
    
    const db = loadDatabase();
    const newDoc: IngestedDocumentMeta = {
      id: docId,
      name,
      type,
      createdAt: new Date().toISOString(),
      chunkCount: chunkStrings.length,
      wordCount: computedWordCount
    };

    // Store Chunks and generate real embeddings if Gemini key is available
    const chunkPromises = chunkStrings.map(async (textChunk, chunkIdx) => {
      let embeddingVector: number[] | undefined;
      
      if (ai) {
        try {
          // Generate vector embeddings using 'gemini-embedding-2-preview'
          const embedRes = await ai.models.embedContent({
            model: "gemini-embedding-2-preview",
            contents: textChunk
          });
          if (embedRes.embeddings?.[0]?.values) {
            embeddingVector = embedRes.embeddings[0].values;
          }
        } catch (embedErr) {
          console.error("Embedding generation failed for chunk, falling back to keyword search indexing:", embedErr);
        }
      }

      return {
        id: `${docId}-chunk-${chunkIdx}`,
        documentId: docId,
        sourceName: name,
        sourceType: type,
        content: textChunk,
        embedding: embeddingVector
      };
    });

    const processedChunks = await Promise.all(chunkPromises);
    
    db.documents.push(newDoc);
    db.chunks.push(...processedChunks);
    
    saveDatabase(db);

    res.json({
      success: true,
      document: newDoc,
      message: `Ingested successfully into ${newDoc.chunkCount} semantic chunks!`
    });

  } catch (err: any) {
    console.error("Ingestion failed:", err);
    res.status(500).json({ error: err.message || "An error occurred during ingestion." });
  }
});

// 4. POST /api/chat - RAG Agents Pipeline triggering
app.post("/api/chat", async (req, res) => {
  const { query, history = [], accessibilityConfig } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Missing query." });
  }

  try {
    const db = loadDatabase();
    const retrievedChunks: DocumentChunk[] = [];
    const scoresMap = new Map<string, number>();

    // Step 1: Retrieval Agent (Semantic RAG search over chroma_stub_db)
    if (ai && db.chunks.some(c => c.embedding)) {
      try {
        // Embed user query
        const embedRes = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: query
        });
        
        const queryVector = embedRes.embeddings?.[0]?.values;
        if (queryVector) {
          // Score matches using cosine similarity
          db.chunks.forEach(chunk => {
            if (chunk.embedding) {
              const score = cosineSimilarity(queryVector, chunk.embedding);
              scoresMap.set(chunk.id, score);
            }
          });
        }
      } catch (err) {
        console.error("Query embedding failed, falling back to TF-IDF text scoring:", err);
      }
    }

    // Fallback or secondary text based scoring calculation
    db.chunks.forEach(chunk => {
      if (!scoresMap.has(chunk.id)) {
        const keywordScore = computeKeywordScore(chunk.content, query);
        scoresMap.set(chunk.id, keywordScore);
      } else {
        // Boost cosine score if there are strong keyword matches
        const keywordScore = computeKeywordScore(chunk.content, query);
        const combined = (scoresMap.get(chunk.id) || 0) * 0.7 + keywordScore * 0.3;
        scoresMap.set(chunk.id, combined);
      }
    });

    // Sort to retrieve top 4 relevant chunks
    const matches = db.chunks
      .map(c => ({ chunk: c, score: scoresMap.get(c.id) || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const contextText = matches.map(m => `[Source: ${m.chunk.sourceName}] ${m.chunk.content}`).join("\n\n");
    const matchedSourceChunks = matches.map(m => ({
      content: m.chunk.content,
      sourceName: m.chunk.sourceName
    }));

    // Step 2 & 3: Reasoning and Visualization Agents (gemini-3.5-flash)
    // Compose custom system instruction targeting the preferred cognitive modality
    const cognitiveMode = accessibilityConfig?.mode || "standard";
    
    let modeInstruction = "";
    if (cognitiveMode === "dyslexia") {
      modeInstruction = `The user has dyslexia. Keep statements highly focused, clear, and prioritize spacing. 
      Use simple vocabulary in the core reply. Avoid long technical jargon blocks, parse sentences into clear, 
      segmented chunks. Integrate visual pacing and clear analogies.`;
    } else if (cognitiveMode === "adhd") {
      modeInstruction = `The user has ADHD. Use highly engaging summaries, short paragraphs, bold lists, 
      and highlighted core ideas. Direct focus explicitly to the core logic, avoiding conversational noise. 
      Add a "Fast Focus Takeaways" section inside the text response.`;
    } else if (cognitiveMode === "autism") {
      modeInstruction = `The user has Autism Spectrum Disorder. Provide concrete, descriptive, literal, 
      highly systematic explanations without ambiguous figurative text. Highlight explicit step-by-step logic, 
      input-output transformations, and precise workflow rules. Keep explanations clean, analytical, and highly organized.`;
    } else {
      modeInstruction = `Provide a clear, educational, beginner-friendly simplified technical tutor explanation of the query given the context.`;
    }

    const systemPrompt = `You are AccessiRAG AI, a distributed Multi-Agentic RAG tutor specializing in cognitive-friendly technical accessibility.
Your internal agents have completed retrieving key structural facts from documentation.

Core retrieved knowledge:
${contextText || "[No documentation source matched. Treat this response as general technical knowledge, and warn the user gently that no local documentation references were found]"}

Your goals:
1. Act as the Reasoning Agent: Translate complex cloud, DevOps, Kubernetes, or software architectural concepts into highly accessible English.
2. Act as the Visualization Agent: Create a visual step-by-step logic flow chart/map explaining the concept.

Provide your response strictly in the following JSON format:
{
  "cleanText": "A simplified, friendly, cognitive-tailored explanation of the technical concept. Use neat markdown (paragraphs, lists, bold notes). Let it be intuitive, eye-safe, and highly readable.",
  "analogy": "An incredibly imaginative, everyday, non-tech analogy describing parallel concepts (e.g. comparing Kubernetes deployments to a master restaurant chef scaling plate service).",
  "glossary": [
    { "word": "technical_jargon_word", "definition": "simple direct description mapping to beginner mental state" }
  ],
  "flowchart": {
    "nodes": [
      { "id": "1", "label": "Start Process", "type": "start", "description": "Initialize action step" },
      { "id": "2", "label": "Core State Guard", "type": "decision", "description": "Evaluate logic condition" },
      { "id": "3", "label": "Run Container Workload", "type": "process", "description": "Execution core" },
      { "id": "4", "label": "End / Complete State", "type": "end", "description": "Successful outcome target" }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2", "label": "Trigger lookup" },
      { "id": "e2-3", "source": "2", "target": "3", "label": "If valid" },
      { "id": "e3-4", "source": "3", "target": "4" }
    ]
  },
  "ttsText": "This is a clean, conversational verbal script of the answer tailored strictly for auditory learners. Avoid markdown markup characters (like asterisk stars, hashes, dashes) so it is pronounced perfectly by the browser speech synthesizer."
}

Ensure the flowchart has valid nodes and edges connected correctly. Keep nodes limited to 4-7 elements to prevent cognitive clutter.

Cognitive Guidance Context:
${modeInstruction}

Maintain technical accuracy while reducing jargon density. Return ONLY valid JSON, no markdown code fence blocks or additional text wrapper outside the raw JSON string.`;

    let replyData = {
      cleanText: "I apologize, but AI reasoning tools are offline because no API key is specified in this sandbox. Please go to Settings > Secrets and configure your GEMINI_API_KEY to trigger the Distributed Agentic RAG Platform.",
      analogy: "Think of an AI engine as a supercar that requires premium fuel (an API key) to ignite its combustion engine and start driving.",
      glossary: [
        { word: "API Key", definition: "A secret passcode that allows computer programs to talk to secure AI model servers." },
        { word: "RAG Pipeline", definition: "A system that fetches private reference guides first, before asking an AI to write a customized answer." }
      ],
      flowchart: {
        nodes: [
          { id: "1", label: "Configure API Key", type: "start" as const, description: "Enter GEMINI_API_KEY in secrets" },
          { id: "2", label: "Semantic Ingestion", type: "process" as const, description: "Generate vector chunks" },
          { id: "3", label: "Reasoning Answer", type: "end" as const, description: "Simplified beginner answers rendered successfully" }
        ],
        edges: [
          { id: "e1-2", source: "1", "target": "2" },
          { id: "e2-3", source: "2", "target": "3" }
        ]
      },
      ttsText: "Please configure your Gemini API key in the secrets section to unlock accessibility tutoring and custom visualization maps.",
      sourceChunks: matchedSourceChunks
    };

    if (ai) {
      try {
        const geminiRes = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            ...history.slice(-6).map((h: any) => ({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            })),
            { role: 'user', parts: [{ text: query }] }
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.3
          }
        });

        const textOutput = geminiRes.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput.trim());
          replyData = {
            ...parsed,
            sourceChunks: matchedSourceChunks
          };
        }
      } catch (geminiErr: any) {
        console.error("Gemini model execution failed:", geminiErr);
        replyData.cleanText = `Reasoning agent encountered an error: ${geminiErr.message}. Falling back to default guide: \n\nMatched Local Documentation Chunk: \n${contextText || "No local documents found."}`;
      }
    }

    res.json(replyData);

  } catch (err: any) {
    console.error("Chat failure:", err);
    res.status(500).json({ error: err.message || "An error occurred during chat reasoning." });
  }
});

// Configure Vite middleware or production build output
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Serve index.html transformed by Vite for any non-API route in dev!
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const templatePath = path.resolve(process.cwd(), "index.html");
        if (fs.existsSync(templatePath)) {
          let template = fs.readFileSync(templatePath, "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } else {
          res.status(404).send("index.html not found");
        }
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    console.log("Vite dev middleware and catch-all route loaded successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static distribution folder served on Port 3000.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AccessiRAG AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
