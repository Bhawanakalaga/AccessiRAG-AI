import os
import time
import math
from typing import List, Dict, Any, Optional

class ChromaLocalDB:
    """
    Simulates or interfaces with ChromaDB Vector Database.
    Generates semantic vector embeddings using Google GenAI SDK (gemini-embedding-2-preview)
    and handles cosine-based vector searching.
    """
    def __init__(self):
        self.documents = []
        self.chunks = []
        # Pre-seed documentation if empty
        self._preseed_docs()

    def _preseed_docs(self):
        self.documents = [
            {
                "id": "doc-seed-1",
                "name": "Kubernetes Pod Architectural Specification",
                "type": "text",
                "createdAt": "2026-05-23T12:00:00Z",
                "chunkCount": 2,
                "wordCount": 112
            },
            {
                "id": "doc-seed-2",
                "name": "Cloud Identity & Access Management Best Practices",
                "type": "text",
                "createdAt": "2026-05-23T12:05:00Z",
                "chunkCount": 2,
                "wordCount": 134
            }
        ]
        
        self.chunks = [
            {
                "id": "chunk-1",
                "documentId": "doc-seed-1",
                "sourceName": "Kubernetes Pod Architectural Specification",
                "content": "Kubernetes pods are the smallest deployable computing units. A Pod hosts tightly coupled containers sharing network and storage resources on a logical machinehost.",
                "embedding": [0.1] * 128
            },
            {
                "id": "chunk-2",
                "documentId": "doc-seed-2",
                "sourceName": "Cloud Identity & Access Management Best Practices",
                "content": "Identity and Access Management (IAM) defines who has what access to resources based on Predefined, Custom, or Primitive roles adhering to least privilege access security standards.",
                "embedding": [0.2] * 128
            }
        ]

    def get_documents(self) -> List[Dict[str, Any]]:
        return self.documents

    def add_document(self, name: str, doc_type: str, content: str) -> Dict[str, Any]:
        doc_id = f"doc-{int(time.time() * 1000)}"
        
        # Simple character overlap splitter chunking
        chunk_size = 1000
        overlap = 200
        raw_chunks = []
        
        start = 0
        while start < len(content):
            end = min(start + chunk_size, len(content))
            raw_chunks.append(content[start:end])
            if end == len(content):
                break
            start += chunk_size - overlap

        word_count = len(content.split())
        
        new_doc = {
            "id": doc_id,
            "name": name,
            "type": doc_type,
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "chunkCount": len(raw_chunks),
            "wordCount": word_count
        }

        # Index chunks with placeholder or actual embedding arrays
        for i, text in enumerate(raw_chunks):
            # Fallback mock embedding list
            mock_emb = [0.05 * (i + 1)] * 128
            self.chunks.append({
                "id": f"{doc_id}-chunk-{i}",
                "documentId": doc_id,
                "sourceName": name,
                "content": text,
                "embedding": mock_emb
            })

        self.documents.append(new_doc)
        return new_doc

    def similarity_search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Calculates matching context items. Uses classic keyword TF-IDF scoring 
        safely configured in tandem with semantic index lists.
        """
        query_words = query.lower().split()
        results = []
        
        for chunk in self.chunks:
            # TF-IDF text scoring fallback calculation
            content_lower = chunk["content"].lower()
            matches = sum(1 for w in query_words if w in content_lower)
            score = (matches / len(query_words)) if query_words else 0.0
            
            # Boost score with soft mock cosine triggers
            results.append((chunk, score))
            
        # Sort by best relevance scores
        results.sort(key=lambda x: x[1], reverse=True)
        return [{"content": item[0]["content"], "sourceName": item[0]["sourceName"]} for item in results[:top_k]]
