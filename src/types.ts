export interface GlossaryItem {
  word: string;
  definition: string;
}

export interface FlowNode {
  id: string;
  label: string;
  type: 'process' | 'decision' | 'start' | 'end';
  description: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface FlowchartData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface SourceChunk {
  content: string;
  sourceName: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  
  // RAG Reasoning Agent Augmented Output
  analogy?: string;
  glossary?: GlossaryItem[];
  flowchart?: FlowchartData;
  sourceChunks?: SourceChunk[];
  
  // Accessibility parameters computed/simplified
  cleanText?: string; // simplified text
  ttsText?: string;   // text customized for Text-to-Speech
}

export interface AccessibilityConfig {
  mode: 'standard' | 'dyslexia' | 'adhd' | 'autism';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily: 'sans' | 'dyslexic' | 'mono';
  readingGuide: boolean;  // horizontal guideline tracking reading line
  bionicReading: boolean; // bold first letters of words
  ttsSpeed: number;       // speed of Speech Synthesis
  highContrast: boolean;  // higher contrast UI
  soundEffects: boolean;  // ambient or helpful tone triggers
}

export interface IngestedDocument {
  id: string;
  name: string;
  type: 'text' | 'pdf' | 'url';
  createdAt: string;
  chunkCount: number;
  wordCount?: number;
}
