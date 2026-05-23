import React, { useState, useEffect, useMemo } from 'react';
import { IngestedDocument } from '../types';
import { FileText, Link2, UploadCloud, Trash2, CheckCircle2, AlertCircle, Loader, RefreshCw, Search, X, Download, FileQuestion, Copy, Check } from 'lucide-react';

interface DocumentManagerProps {
  onIngestSuccess: (message: string) => void;
  onSelectDocumentForContext?: (doc: IngestedDocument) => void;
}

// Helper component to highlight matched terms with a subtle yellow background
interface HighlightedTextProps {
  text: string;
  regex: RegExp | null;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, regex }) => {
  if (!regex || !text) {
    return <>{text}</>;
  }

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) => {
        // String.prototype.split with capture groups returns matched captures at odd indices.
        const isMatch = index % 2 === 1;
        if (isMatch) {
          return (
            <mark 
              key={index} 
              className="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-900 dark:text-yellow-100 px-0.5 rounded font-medium border-b border-yellow-200/40 dark:border-yellow-900/40"
            >
              {part}
            </mark>
          );
        }
        return part;
      })}
    </>
  );
};

export default function DocumentManager({ onIngestSuccess, onSelectDocumentForContext }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [ingestType, setIngestType] = useState<'text' | 'url'>('text');
  
  // Text Ingestion State
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  
  // URL Ingestion State
  const [urlTitle, setUrlTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');

  // Loading and feedback states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);

  // Search filter state for live filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state for live sorting (Newest or Alphabetical)
  const [sortBy, setSortBy] = useState<'newest' | 'alphabetical'>('newest');

  // Preview panel states for slide-in verification
  const [previewDoc, setPreviewDoc] = useState<IngestedDocument | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Word and term highlighter regex
  const highlightRegex = useMemo(() => {
    if (!previewDoc) return null;

    const termsToHighlight = new Set<string>();

    // 1. Add words from document name (clean of extension and small separators)
    const cleanName = previewDoc.name.replace(/\.[^/.]+$/, ""); // strip extension
    const nameWords = cleanName.match(/[a-zA-Z0-9]{3,}/g) || [];
    nameWords.forEach(word => termsToHighlight.add(word.toLowerCase()));

    // 2. Add common technical keywords found in chunk content (case insensitive matches)
    const technicalKeywords = [
      'rag', 'vector', 'embedding', 'embeddings', 'database', 'llm', 'chunk', 'chunks',
      'token', 'tokens', 'prompt', 'prompts', 'model', 'models', 'retrieval', 'semantic',
      'cognitive', 'index', 'query', 'queries', 'context', 'metadata', 'api', 'agent', 'agents'
    ];
    technicalKeywords.forEach(kw => termsToHighlight.add(kw));

    if (termsToHighlight.size === 0) return null;

    // Build unique sorted list of concepts (longer terms first to prevent partial matching splits)
    const sortedTerms = Array.from(termsToHighlight)
      .filter(t => t.length >= 3)
      .sort((a, b) => b.length - a.length);

    if (sortedTerms.length === 0) return null;

    // Escape special characters to build clean regex safe group
    const escapedTerms = sortedTerms.map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

    // Create case-insensitive regex matching complete words using boundary \b
    return new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');
  }, [previewDoc]);

  // Real-time computed filtered documents
  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Real-time sorted and filtered documents
  const sortedAndFilteredDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'newest') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  const handlePreviewDoc = async (doc: IngestedDocument) => {
    setPreviewDoc(doc);
    setPreviewContent('');
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewContent(data.content || 'No text content available.');
      } else {
        setPreviewContent('Error: Could not retrieve document content from agent database.');
      }
    } catch (err) {
      console.error("Error loading document preview:", err);
      setPreviewContent('Network error while retrieving document content.');
    } finally {
      setPreviewLoading(false);
    }

    // Still fire general selection callback if any
    onSelectDocumentForContext?.(doc);
  };

  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const handleDownloadDocDirect = async (doc: IngestedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingDocId) return;

    setDownloadingDocId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (res.ok) {
        const data = await res.json();
        const content = data.content || 'No text content available.';
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        const dateStr = doc.createdAt ? new Date(doc.createdAt).toLocaleString() : 'N/A';

        const markdownText = `# ${doc.name}

**Type:** ${doc.type.toUpperCase()}
**Chunks:** ${doc.chunkCount} vector blocks
**Word Count:** ${wordCount} words
**Ingested At:** ${dateStr}

---

${content}
`;

        const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const safeName = doc.name.replace(/\.[^/.]+$/, "");
        link.setAttribute('download', `${safeName || 'document'}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setErrorMsg("Failed to download document: server returned an error.");
      }
    } catch (err) {
      console.error("Error direct downloading document:", err);
      setErrorMsg("Failed to download document due to network error.");
    } finally {
      setDownloadingDocId(null);
    }
  };

  const [copyingDocId, setCopyingDocId] = useState<string | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  const handleCopyDocText = async (doc: IngestedDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (copyingDocId) return;

    setCopyingDocId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (res.ok) {
        const data = await res.json();
        const content = data.content || '';
        if (content) {
          await navigator.clipboard.writeText(content);
          setCopiedDocId(doc.id);
          onIngestSuccess?.(`Copied text of "${doc.name}" directly to clipboard!`);
          setTimeout(() => {
            setCopiedDocId(null);
          }, 2000);
        } else {
          setErrorMsg("Document has no text content to copy.");
        }
      } else {
        setErrorMsg("Failed to copy document content: server error.");
      }
    } catch (err) {
      console.error("Error copy document content:", err);
      setErrorMsg("Failed to copy document to clipboard.");
    } finally {
      setCopyingDocId(null);
    }
  };

  const handleExportMarkdown = () => {
    if (!previewDoc || !previewContent) return;

    const wordCount = previewContent.trim() ? previewContent.trim().split(/\s+/).length : 0;
    const dateStr = previewDoc.createdAt ? new Date(previewDoc.createdAt).toLocaleString() : 'N/A';

    const markdownText = `# ${previewDoc.name}

**Type:** ${previewDoc.type.toUpperCase()}
**Chunks:** ${previewDoc.chunkCount} vector blocks
**Word Count:** ${wordCount} words
**Ingested At:** ${dateStr}

---

${previewContent}
`;

    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const safeName = previewDoc.name.replace(/\.[^/.]+$/, "");
    link.setAttribute('download', `${safeName || 'document'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async (retries = 3, delay = 1000) => {
    setRefreshing(true);
    setErrorMsg(null);
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch('/api/documents');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (data && data.documents) {
          setDocuments(data.documents);
          setErrorMsg(null);
          setRefreshing(false);
          return;
        }
      } catch (err: any) {
        console.warn(`Attempt ${i + 1} to load documents failed:`, err);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('Failed to load ingested documents after retries:', err);
          setErrorMsg('Unable to retrieve pre-seeded technical documents. Click the refresh icon to retry.');
        }
      }
    }
    setRefreshing(false);
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      name: ingestType === 'text' ? textTitle : urlTitle,
      type: ingestType,
      content: ingestType === 'text' ? textContent : undefined,
      url: ingestType === 'url' ? urlInput : undefined
    };

    if (!payload.name) {
      setErrorMsg("Please provide a Title or source name for the technical concept.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/documents/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ingestion request failed.");
      }

      setSuccessMsg(data.message || "Document successfully crawled & embedded into database!");
      onIngestSuccess(data.message);
      
      // Reset forms
      setTextTitle('');
      setTextContent('');
      setUrlTitle('');
      setUrlInput('');
      
      fetchDocuments();
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Failed to communicate with RAG ingestion server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this documentation from the RAG knowledge pool?")) return;
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== docId));
        setSuccessMsg("Document resource removed from vector DB.");
      }
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you absolutely sure you want to clear the entire document database? This will permanently wipe the entire RAG knowledge pool!")) return;
    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE'
      });
      if (response.ok) {
        setDocuments([]);
        if (previewDoc) {
          setPreviewDoc(null);
        }
        setSuccessMsg("All document resources removed from vector DB.");
        onIngestSuccess("Entire RAG knowledge pool cleared successfully.");
      } else {
        setErrorMsg("Failed to clear the document database.");
      }
    } catch (err) {
      console.error("Failed to delete all documents", err);
      setErrorMsg("Network error. Failed to clear document database.");
    }
  };

  // Drag & drop file handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processUploadedFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processUploadedFile(file);
    }
  };

  const processUploadedFile = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate file type
    const isText = file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json');
    if (!isText && !file.name.endsWith('.pdf')) {
      setErrorMsg("Support types are TXT, Markdown, or standard text sources.");
      setLoading(false);
      return;
    }

    try {
      const text = await file.text();
      const response = await fetch('/api/documents/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ""), // Strip extension for title
          type: 'text',
          content: text
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccessMsg(`Uploaded file "${file.name}" ingested successfully into vector database.`);
      onIngestSuccess(data.message);
      fetchDocuments();
    } catch (err: any) {
      setErrorMsg(`Failed to parse and upload file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden animate-fade">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-indigo-600" />
          <h2 id="doc-manager-title" className="font-sans font-semibold text-slate-800 dark:text-slate-100 text-lg">
            Knowledge Ingestion Agent
          </h2>
        </div>
        <button
          onClick={fetchDocuments}
          id="btn-refresh-docs"
          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-indigo-600 rounded-lg transition-transform active:scale-95 duration-200"
          title="Refresh documentation collection"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
        <button
          id="tab-ingest-text"
          onClick={() => { setIngestType('text'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex-1 py-1.5 px-3 rounded-lg font-sans font-semibold text-xs transition-all duration-200 ${
            ingestType === 'text'
              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Paste Raw Technical Content
        </button>
        <button
          id="tab-ingest-url"
          onClick={() => { setIngestType('url'); setErrorMsg(null); setSuccessMsg(null); }}
          className={`flex-1 py-1.5 px-3 rounded-lg font-sans font-semibold text-xs transition-all duration-200 ${
            ingestType === 'url'
              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Scrape Documentation URL
        </button>
      </div>

      {/* Info and Errors */}
      {errorMsg && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-sans">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl mb-4">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-sans">{successMsg}</span>
        </div>
      )}

      {/* Ingestion Forms */}
      <form onSubmit={handleIngest} id="ingest-form" className="space-y-4 mb-6">
        {ingestType === 'text' ? (
          <div className="space-y-3">
            <div>
              <input
                type="text"
                id="text-title-input"
                placeholder="Title (e.g., Kubernetes Pod Lifecycle)"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50/50 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 hover:border-slate-300 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
            
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                dragActive ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-550 bg-slate-50/20 dark:bg-slate-950/20'
              }`}
            >
              <textarea
                id="text-content-textarea"
                rows={4}
                placeholder="Paste complex official technical documentation or technical specs here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full text-xs bg-transparent border-0 resize-none outline-none text-slate-700 dark:text-slate-300 placeholder-slate-400"
              />
              <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Drag & drop TXT/MD/JSON files to auto-extract</span>
                <label className="text-indigo-600 hover:underline cursor-pointer font-semibold">
                  Browse files
                  <input type="file" onChange={handleFileChange} className="hidden" accept=".txt,.md,.json" />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <input
                type="text"
                id="url-title-input"
                placeholder="Title Name (e.g., Docker Containers)"
                value={urlTitle}
                onChange={(e) => setUrlTitle(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-850 hover:bg-slate-100/30 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="url"
                  id="url-value-input"
                  placeholder="Paste documentation website URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-100/30 rounded-xl py-2 pl-9 pr-3 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
            </div>
            <div className="p-2.5 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-lg text-[11px] text-indigo-700 dark:text-indigo-300 leading-normal font-sans">
              <strong>Scraper Agent:</strong> Downloads text content from the URL, extracts paragraphs, strips styles and layouts, chunks the technical knowledge, generates embeddings, and indexes them in chromatin memory pool instantly.
            </div>
          </div>
        )}

        <button
          type="submit"
          id="btn-submit-ingest"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-2 px-4 rounded-xl font-sans font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader className="h-4.5 w-4.5 animate-spin" />
              <span>Ingestion Agent Modeling vector paths...</span>
            </>
          ) : (
            <span>Train Agents on this Technical Source</span>
          )}
        </button>
      </form>

      {/* Ingested Documents List */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Active RAG Context Corpus ({sortedAndFilteredDocuments.length})
          </label>
          {documents.length > 0 && (
            <button
              type="button"
              id="btn-delete-all-docs"
              onClick={handleDeleteAll}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1.5 cursor-pointer transition-colors bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 px-2 py-1 rounded-lg"
              title="Delete all ingested documentation"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete All</span>
            </button>
          )}
        </div>

        {/* Real-time search query filter input along with sorting controls */}
        {documents.length > 0 && (
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                id="ingested-docs-search"
                placeholder="Search documents by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl py-2 pl-9 pr-8 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  id="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-sans">Sort:</span>
              <select
                id="doc-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'alphabetical')}
                className="text-xs bg-slate-50 dark:bg-slate-850 hover:bg-slate-100/30 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-2.5 text-slate-700 dark:text-slate-300 font-sans outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-all cursor-pointer font-semibold"
              >
                <option value="newest">Newest</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        )}
        
        {documents.length === 0 ? (
          <div className="text-center p-6 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-950/20">
            <p className="text-xs text-slate-400 font-sans leading-normal">
              No technical documents ingested. Chat uses default training data. Paste details above to augment memory.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 animate-fade" id="ingested-docs-list">
            {sortedAndFilteredDocuments.length === 0 ? (
              <div id="no-search-results" className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 font-sans">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-full mb-2.5 animate-pulse">
                  <FileQuestion className="h-5 w-5 stroke-[1.5]" />
                </div>
                <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                  No documents match search
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[220px] leading-relaxed">
                  We couldn't find any items matching <strong className="text-slate-600 dark:text-slate-400">"{searchQuery}"</strong>. Try checking your spelling or clear queries.
                </p>
                <button
                  type="button"
                  id="btn-no-results-clear"
                  onClick={() => setSearchQuery('')}
                  className="mt-2.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline cursor-pointer transition-colors"
                >
                  Reset active filter
                </button>
              </div>
            ) : (
              sortedAndFilteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  id={`doc-item-${doc.id}`}
                  onClick={() => handlePreviewDoc(doc)}
                  className="group flex items-center justify-between p-2.5 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/40 rounded-xl hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-snug">{doc.name}</h4>
                        {doc.wordCount !== undefined && doc.wordCount > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/40 whitespace-nowrap shrink-0">
                            {doc.wordCount.toLocaleString()} words
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                        {doc.type.toUpperCase()} • {doc.chunkCount} vector blocks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleDownloadDocDirect(doc, e)}
                      id={`btn-download-${doc.id}`}
                      disabled={downloadingDocId === doc.id}
                      className="p-1 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg shrink-0 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
                      title="Download as Markdown"
                    >
                      {downloadingDocId === doc.id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleCopyDocText(doc, e)}
                      id={`btn-copy-${doc.id}`}
                      disabled={copyingDocId === doc.id}
                      className="p-1 text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg shrink-0 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-50 cursor-pointer"
                      title="Copy full text"
                    >
                      {copyingDocId === doc.id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                      ) : copiedDocId === doc.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      id={`btn-delete-${doc.id}`}
                      className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg shrink-0 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                      title="Wipe from memory pool"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Slide-in Verification Panel */}
      {previewDoc && (
        <div 
          id="doc-preview-panel"
          className="absolute inset-y-0 right-0 w-80 md:w-96 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-30 flex flex-col p-5 font-sans animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start justify-between border-b border-slate-250 dark:border-slate-800 pb-3 mb-4">
            <div className="overflow-hidden pr-2 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span>Verification Preview</span>
              </div>
              <div className="flex items-center gap-2 max-w-full">
                <h3 id="preview-doc-title" className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex-1" title={previewDoc.name}>
                  {previewDoc.name}
                </h3>
                <span 
                  id="doc-preview-word-count-badge" 
                  className="shrink-0 text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-1.5 py-0.5 rounded font-mono"
                >
                  {previewLoading ? 'Counting...' : `${previewContent.trim() ? previewContent.trim().split(/\s+/).length : 0} words`}
                </span>
              </div>
            </div>
            <button
              id="btn-close-preview"
              onClick={() => setPreviewDoc(null)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Close preview panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1" id="preview-doc-content-body">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
                <Loader className="h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-[10px] font-mono">Retrieving indexed chunks...</span>
              </div>
            ) : (() => {
              const docParagraphs = previewContent
                .split(/\n\s*\n/)
                .map(p => p.trim())
                .filter(p => p.length > 0)
                .slice(0, 3);
              
              if (docParagraphs.length === 0) {
                return (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs italic font-sans">
                    This document has no content raw segments to display.
                  </div>
                );
              }

              return (
                <>
                  <div className="text-[10px] text-slate-400 dark:text-slate-550 font-mono flex items-center justify-between bg-slate-100 dark:bg-slate-950 p-2 rounded-lg">
                    <span>SOURCE: <strong className="text-slate-700 dark:text-slate-300">{previewDoc.type.toUpperCase()}</strong></span>
                    <span>BLOCKS: <strong className="text-slate-700 dark:text-slate-300">{previewDoc.chunkCount} vector units</strong></span>
                  </div>
                  <div className="space-y-3">
                    {docParagraphs.map((para, i) => (
                      <div 
                        key={i} 
                        id={`preview-paragraph-${i}`} 
                        className="p-3 bg-white dark:bg-slate-955 border border-slate-150 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 rounded-xl leading-relaxed shadow-sm hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors"
                      >
                        <div className="text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-900 pb-1">
                          <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></span>
                          Paragraph {i + 1}
                        </div>
                        <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-305">
                          <HighlightedText text={para} regex={highlightRegex} />
                        </p>
                      </div>
                    ))}
                  </div>
                  {previewContent.split(/\n\s*\n/).filter(p => p.trim()).length > 3 && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 text-center italic mt-2 font-mono">
                      Showing first 3 paragraphs. Ingested total has {previewContent.split(/\n\s*\n/).filter(p => p.trim()).length} blocks indexed for RAG.
                    </p>
                  )}
                </>
              );
            })()}
          </div>

          {/* Export action footer */}
          {!previewLoading && previewContent && (
            <div id="preview-footer-actions" className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                id="btn-export-markdown"
                onClick={handleExportMarkdown}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-650 dark:hover:bg-indigo-600 text-white hover:text-indigo-50 rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] font-sans"
                title="Download full document as a markdown file"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export as Markdown (.md)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
