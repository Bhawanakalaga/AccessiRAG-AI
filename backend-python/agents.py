import os
import json
from typing import List, Dict, Any, Optional

try:
    # Full representative imports of Python CrewAI
    from crewai import Agent, Task, Crew, Process
    crewai_available = True
except ImportError:
    # Safe fallback if crewai dependencies are pending installation
    crewai_available = False

class CrewCoordinator:
    """
    Coordinates multi-agent workflows matching Phase 3.
    Splits cognitive responsibilities into an Ingestion Agent, a Retrieval Agent, 
    and a Reasoning/Stylization Agent to handle adaptive learning outputs.
    """
    def __init__(self, vector_db):
        self.db = vector_db

    async def coordinate_query(self, query: str, history: List[dict], config: dict) -> Dict[str, Any]:
        """
        Coordinates Retrieval and Reasoning agents to answer technical inquiries.
        """
        mode = config.get("mode", "standard")
        
        # Step 1: Retrieval Agent outputs contextual snippets
        source_chunks = self.db.similarity_search(query)
        context_text = "\n\n".join([f"[Source: {s['sourceName']}] {s['content']}" for s in source_chunks])
        
        # Step 2: System Instructions tailored to user profiles (Phase 4)
        if mode == "dyslexia":
            mode_guidance = (
                "The reader has dyslexia. Segment explanations into clear, breathing-spaced visual chunks. "
                "Pair technical topics with real-world analogies (e.g. comparing microservices to a kitchen staff). "
                "Ensure sentences are short and readable."
            )
        elif mode == "adhd":
            mode_guidance = (
                "The reader has ADHD. Provide quick takeaways immediately. "
                "Use bold formatting, bulleted priorities, and avoid conversational filler code block explanations."
            )
        elif mode == "autism":
            mode_guidance = (
                "The reader has ASD. Provide direct, literal, logical step-by-step instructions. "
                "Remove figurative patterns. Clearly define inputs and expected outputs for each step of the pipeline."
            )
        else:
            mode_guidance = "Provide a warm, technical tutor explanation of the topic."

        # Simulate Multi-Agent Orchestration returning structured diagnostic payloads
        clean_response = (
            f"Here is the simplified tutorial parsed by our Reasoning Agent regarding '{query}':\n\n"
            f"Based on ingested specifications, here is the breakdown of the topic with structural accessibility guidelines applied:\n\n"
            f"1. **Core Concept**: System modularity separates computing scopes to isolate performance faults.\n"
            f"2. **State Transition**: Signals are passed between nodes dynamically under safe telemetry limits.\n\n"
            f"*Context Guide*: {mode_guidance}"
        )

        analogy_text = (
            "Think of computing pods like cars on a highway. The highway lanes are isolated network parameters, "
            "and toll booths are authentication proxies checking access tokens."
        )

        glossary_items = [
            {"word": "Modularity", "definition": "Dividing a larger codebase or system into smaller, self-contained pieces that do one simple task."},
            {"word": "State Transition", "definition": "The exact process of a computer changing from busy, to idle, to successful results."}
        ]

        flowchart_nodes = [
            {"id": "1", "label": "Start Process", "type": "start", "description": "Initialize user query parsing"},
            {"id": "2", "label": "Retrieval Agent", "type": "process", "description": "Scan ChromaDB vector blocks"},
            {"id": "3", "label": "Reasoning Agent", "type": "decision", "description": "Apply dyslexic/ADHD style rules"},
            {"id": "4", "label": "Outcome Display", "type": "end", "description": "Render interactive bionic dashboard"}
        ]

        flowchart_edges = [
            {"id": "e1", "source": "1", "target": "2"},
            {"id": "e2", "source": "2", "target": "3"},
            {"id": "e3", "source": "3", "target": "4"}
        ]

        tts_script = f"Here is the answer regarding {query}. Each node of the technical process is simplified for your cognitive profile."

        # Structured RAG payload matching the React Client Schema
        return {
            "cleanText": clean_response,
            "analogy": analogy_text,
            "glossary": glossary_items,
            "flowchart": {
                "nodes": flowchart_nodes,
                "edges": flowchart_edges
            },
            "ttsText": tts_script,
            "sourceChunks": source_chunks
        }

    def run_crewai_offline_agent(self, context_text: str, user_query: str):
        """
        Example showing how they would define CrewAI agents if deploying in production.
        """
        if not crewai_available:
            return "CrewAI package not imported. See backend-python/README.md to install dependencies."
            
        # Define Ingestion Agent
        ingestion_agent = Agent(
            role='Technical Documentation Ingestor',
            goal='Read dense manuals and split them into semantic metadata chunks',
            backstory='An expert crawl bot indexing tech resources.',
            verbose=True,
            memory=True
        )

        # Define Retrieval Agent
        retrieval_agent = Agent(
            role='Semantic Context Finder',
            goal='Perform similarity mapping on query terms against stored indexes',
            backstory='A skilled system-wide search bot locating matching document blocks.',
            verbose=True
        )

        # Define Reasoning Agent
        reasoning_agent = Agent(
            role='Cognitive Accessibility Simplifier',
            goal='Rewrite dense technical jargon into clear, spaced, analogies and easy summaries',
            backstory='An educational expert designing clear materials for ADHD and dyslexic developers.',
            verbose=True
        )

        # Define Tasks
        retrieve_task = Task(
            description=f'Search database matching key details for: {user_query}',
            expected_output='Top 4 context paragraphs matching user intent.',
            agent=retrieval_agent
        )

        reason_task = Task(
            description='Take the context text and summarize with highly clear, highlighted titles and concrete analogies.',
            expected_output='Spaced markdown with concrete analogies designed for easy cognitive reading.',
            agent=reasoning_agent
        )

        # Boot Agent Crew
        crew = Crew(
            agents=[ingestion_agent, retrieval_agent, reasoning_agent],
            tasks=[retrieve_task, reason_task],
            process=Process.sequential
        )

        return crew.kickoff()
