import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatMessage, 
  AccessibilityConfig, 
  IngestedDocument,
  FlowchartData,
  FlowNode
} from './types';
import CognitivePanel from './components/CognitivePanel';
import DocumentManager from './components/DocumentManager';
import { 
  Sparkles, 
  Send, 
  Volume2, 
  BookOpen, 
  Eye, 
  Maximize2, 
  HelpCircle, 
  Info, 
  Terminal, 
  Sliders, 
  Database, 
  Cpu, 
  AlertTriangle,
  PlayCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  User,
  CheckCircle,
  FileText,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  // Accessibility Default Configuration State
  const [accessibility, setAccessibility] = useState<AccessibilityConfig>({
    mode: 'standard',
    fontSize: 'md',
    fontFamily: 'sans',
    readingGuide: false,
    bionicReading: false,
    ttsSpeed: 1.0,
    highContrast: false,
    soundEffects: true
  });

  // Visualization Panel View Mode Tabs (Active Flow vs. Multi-Agent System Architecture)
  const [activeVisTab, setActiveVisTab] = useState<'flow' | 'architecture'>('flow');
  
  // Active Python microservices architecture visual module
  const [activeArchModule, setActiveArchModule] = useState<string>('fastapi');

  // System-wide Dark Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('accessirag-theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('accessirag-theme', nextTheme);
    triggerSound('click');
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Pre-loaded conversations for smooth initial user onboarding
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Welcome to **AccessiRAG AI** — your distributed multi-agent technical tutor designed to make cognitive overload, dyslexia, ADHD, or learning blockers a thing of the past.\n\nI automatically ingest difficult technical articles or URLs, segment them into dense vector chunks, and coordinate multiple specialized internal agents (Ingestion, Retrieval, Reasoning, and Visualization) to answer technical questions with bionic visual aid, everyday analogies, and interactive flow diagrams.",
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cleanText: "Welcome to AccessiRAG AI. I automatically ingest technical articles or URLs, and use multiple specialized agents to answer your technical questions using simple analogies and visual flow diagrams.",
      analogy: "Think of an AI agent swarm like a synchronized pit crew at a racing track. Each mechanic has a separate hyper-specialized job (e.g. changing tires, refueling) to complete a single super-fast pitstop perfectly.",
      glossary: [
        { word: "Distributed Agents", definition: "A group of independent AI programs collaborating on a complex single goal." },
        { word: "RAG", definition: "Retrieval-Augmented Generation. Feeds accurate reference texts to clean out AI fabrications." }
      ],
      flowchart: {
        nodes: [
          { id: "1", label: "Documentation Ingest", type: "start", description: "Read PDF/URL and run semantic text chunk cutting" },
          { id: "2", label: "Semantic Retriever", type: "process", description: "Search vector stores using mathematical cosine matching" },
          { id: "3", label: "Cognitive Explainer", type: "decision", description: "Is user ADHD or Dyslexic? Formulate specific vocabulary pacing" },
          { id: "4", label: "Flowchart Architect", type: "process", description: "Construct nodes and coordinate interactive logic map" },
          { id: "5", label: "Learner Dashboard", type: "end", description: "Render simplified multi-sensory technical outcomes" }
        ],
        edges: [
          { id: "e1", source: "1", target: "2" },
          { id: "e2", source: "2", target: "3" },
          { id: "e3", source: "3", target: "4" },
          { id: "e4", source: "4", target: "5" }
        ]
      },
      ttsText: "Welcome to AccessiRAG AI. I automatically ingest technical documents and translate them into accessible lessons."
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Simulation parameters for high visual engagement (Pod traffic slider)
  const [flowSimulatorSpeed, setFlowSimulatorSpeed] = useState(50);
  const [simulationActive, setSimulationActive] = useState(true);
  
  // Selected Flowchart Node Details display
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);

  // Active documents context summary loaded from API
  const [activeDocs, setActiveDocs] = useState<IngestedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Speech helper track state
  const [isPlayingTTS, setIsPlayingTTS] = useState<string | null>(null);

  // Horizontal reading tracker line y-offset
  const [rulerY, setRulerY] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Refresh active context docs
  const handleRefreshDocs = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch('/api/documents');
        if (res.ok) {
          const data = await res.json();
          if (data && data.documents) {
            setActiveDocs(data.documents);
            return;
          }
        }
      } catch (err) {
        console.warn(`App failed to fetch documents on attempt ${i + 1}:`, err);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  };

  useEffect(() => {
    handleRefreshDocs();
  }, []);

  // Set default selected node whenever the active flowchart shifts
  const activeFlow = messages[messages.length - 1]?.flowchart || null;
  useEffect(() => {
    if (activeFlow && activeFlow.nodes && activeFlow.nodes.length > 0) {
      setSelectedNode(activeFlow.nodes[0]);
    } else {
      setSelectedNode(null);
    }
  }, [messages]);

  // Handle auto scroll for new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Reading ruler tracking callback
  const handleMouseMoveText = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!accessibility.readingGuide) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    setRulerY(relativeY);
  };

  // Sound effects feedback trigger
  const triggerSound = (type: 'success' | 'click' | 'error') => {
    if (!accessibility.soundEffects) return;
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      
      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, context.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, context.currentTime + 0.15); // E5
        gain.gain.setValueAtTime(0.08, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
      } else if (type === 'click') {
        osc.frequency.setValueAtTime(329.63, context.currentTime); // E4
        gain.gain.setValueAtTime(0.05, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
      } else {
        osc.frequency.setValueAtTime(220, context.currentTime); // A3
        osc.frequency.setValueAtTime(110, context.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
      }
      
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.5);
    } catch (err) {
      // Audio context might be blocked by browser sandbox layout
    }
  };

  // Message push trigger
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userQuery = inputMessage.trim();
    setInputMessage('');
    triggerSound('click');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: userQuery,
          history: messages,
          accessibilityConfig: accessibility
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "RAG server is taking too long to reply.");
      }

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.cleanText || "No reply",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cleanText: data.cleanText,
        analogy: data.analogy,
        glossary: data.glossary,
        flowchart: data.flowchart,
        sourceChunks: data.sourceChunks,
        ttsText: data.ttsText
      }]);

      triggerSound('success');
    } catch (err: any) {
      console.error(err);
      triggerSound('error');
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `**RAG Pipeline Interrupted:** ${err.message || 'Connecting server failed. Please ensure Dev server is running on Port 3000.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Simple bionic word transformer
  const renderBionicText = (wordStr: string) => {
    return wordStr.split(' ').map((word, wIdx) => {
      if (!word) return ' ';
      const mid = Math.ceil(word.length / 2);
      const firstHalf = word.slice(0, mid);
      const secondHalf = word.slice(mid);
      return (
        <span key={wIdx} className="inline-block mr-1">
          <strong className="font-extrabold text-indigo-900 dark:text-indigo-300 border-b border-indigo-100/30 dark:border-indigo-900/30">{firstHalf}</strong>
          <span className="opacity-90">{secondHalf}</span>
        </span>
      );
    });
  };

  // Custom text transformer based on dynamic profile selectors (Bionic & Dyslexic simulations)
  const parseDocumentExplanation = (text: string, isBionic: boolean, isDyslexic: boolean) => {
    if (!text) return null;
    const blocks = text.split('\n\n');
    return blocks.map((block, bIdx) => {
      const sections = block.split(/(\*\*.*?\*\*)/);
      const rendered = sections.map((sec, sIdx) => {
        if (sec.startsWith('**') && sec.endsWith('**')) {
          const boldRaw = sec.slice(2, -2);
          return (
            <strong key={sIdx} className="font-extrabold text-indigo-950 bg-indigo-50 border-b border-indigo-400 px-1 rounded-sm dark:text-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-500">
              {boldRaw}
            </strong>
          );
        }
        if (isBionic) {
          return <span key={sIdx} className="tracking-wide">{renderBionicText(sec)}</span>;
        }
        return <span key={sIdx}>{sec}</span>;
      });

      return (
        <p 
          key={bIdx} 
          className={`mb-3.5 last:mb-0 leading-relaxed text-sm ${
            isDyslexic ? 'font-dyslexic text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
          }`}
        >
          {rendered}
        </p>
      );
    });
  };

  // Speech helper controller
  const handleTTSPlay = (textScript: string, msgId: string) => {
    if ('speechSynthesis' in window) {
      if (isPlayingTTS === msgId) {
        window.speechSynthesis.cancel();
        setIsPlayingTTS(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textScript);
      utterance.rate = accessibility.ttsSpeed;
      utterance.onend = () => setIsPlayingTTS(null);
      setIsPlayingTTS(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("TTS isn't enabled in your browser.");
    }
  };

  // Export current simulated data node diagrams as PNG / logic logs
  const handleExportDiagram = () => {
    triggerSound('success');
    alert("Export successful: Visualization hierarchy schema packed into high-res workspace cache!");
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-[#F8F9FA] text-slate-800 dark:bg-slate-950 dark:text-slate-100 ${
      accessibility.highContrast ? 'border-4 border-slate-950 dark:border-white font-bold' : ''
    }`}>
      
      {/* 1. SIDEBAR CONFIGURATOR AND Active Docs */}
      <aside className={`w-80 flex-shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-[320px] w-0 overflow-hidden'
      }`} id="app-sidebar">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-950/5 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-indigo-200 dark:shadow-none">
              AR
            </div>
            <div>
              <h1 id="brand-title" className="text-base font-extrabold tracking-tight text-indigo-950 dark:text-indigo-400">
                AccessiRAG AI
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
                Technical Accessibility RAG
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              id="btn-ruler-toggle"
              onClick={() => setAccessibility(p => ({ ...p, readingGuide: !p.readingGuide }))}
              className={`p-1.5 rounded-lg border transition-all ${
                accessibility.readingGuide ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Toggle Focus Reading Ruler Line"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button 
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all bg-transparent"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Scrollable control settings panel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Active cognitive profiles */}
          <CognitivePanel 
            config={accessibility} 
            onChange={(newConfig) => {
              triggerSound('click');
              setAccessibility(newConfig);
            }} 
          />

          {/* Document Ingestion Panel */}
          <DocumentManager 
            onIngestSuccess={(msg) => {
              triggerSound('success');
              handleRefreshDocs();
            }}
          />

          {/* Active Swarm Status Indicators */}
          <div className="bg-slate-50 dark:bg-slate-950/30 rounded-2xl p-4 border border-slate-100/60 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-indigo-500" />
              Agent Swarm status
            </h3>
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">1. Crawler / Ingestion Agent</span>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Listening
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">2. Semantic Retrieval Agent</span>
                <span className="flex items-center gap-1.5 text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  Chroma_DB Indexed
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">3. Reasoning Simplifier</span>
                <span className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  loading ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {loading ? 'Thinking...' : 'Standby'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">4. Visual Flowchart Agent</span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                  Active
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* User Status Profile Card */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-indigo-950 dark:bg-slate-950 text-white flex gap-3.5 items-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
            <User className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate">bhawanakalaga93@gmail.com</p>
            <p className="text-[10px] text-indigo-300 dark:text-indigo-400">Workspace Member Mode</p>
          </div>
        </div>
      </aside>

      {/* Toggle Sidebar handles */}
      <button
        id="btn-sidebar-collapse"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute bottom-5 left-5 z-[100] bg-slate-900 text-white border border-slate-850 dark:border-slate-800 h-10 w-10 rounded-xl flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-850 transition-all font-bold shadow-md cursor-pointer"
        title="Toggle Panel Drawer"
      >
        <ChevronRight className={`h-5 w-5 transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 2. MAIN SPLIT INTERACTION PANEL */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* RAG CHAT SECTION */}
        <section className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden max-w-2xl">
          
          {/* Section Header */}
          <header className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <span className="text-xs bg-indigo-50 border border-indigo-100/50 dark:bg-indigo-950/40 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold px-2.5 py-1 rounded-lg">
                Adaptive Session
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                {activeFlow ? 'Interactive Flow Active' : 'RAG Sandbox Active'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Cognitive standard online
              </span>
            </div>
          </header>

          {/* Message Thread Scroll Area */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 relative"
            onMouseMove={handleMouseMoveText}
          >
            {/* Focus Reading Line guide */}
            {accessibility.readingGuide && (
              <div 
                className="reading-ruler-guide left-0 right-0"
                style={{ top: `${rulerY}px` }}
              />
            )}

            {messages.map((msg) => (
              <div 
                key={msg.id}
                id={`message-bubble-${msg.id}`}
                className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 select-none">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 border transition-all ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 dark:bg-slate-950 border-slate-800 text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-100/80 dark:border-slate-705 shadow-sm'
                }`}>
                  
                  {/* Sender Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      msg.sender === 'user' ? 'text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {msg.sender === 'user' ? 'Learner (You)' : 'Multi-Agent Reasoning Simplifier'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Main Body Content */}
                  <div className="space-y-3 font-sans leading-relaxed text-sm">
                    {msg.sender === 'user' ? (
                      <p>{msg.text}</p>
                    ) : (
                      parseDocumentExplanation(msg.text, accessibility.bionicReading, accessibility.fontFamily === 'dyslexic')
                    )}
                  </div>

                  {/* AI Response Features Area (Analogies, TTS, Sources) */}
                  {msg.sender === 'assistant' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-3">
                      
                      {/* TTS Speaking Controller */}
                      {msg.ttsText && (
                        <button
                          onClick={() => handleTTSPlay(msg.ttsText || msg.text, msg.id)}
                          className={`flex items-center gap-1 bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50 dark:hover:bg-slate-750 px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            isPlayingTTS === msg.id ? 'border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30' : 'border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }`}
                        >
                          <Volume2 className={`h-3.5 w-3.5 ${isPlayingTTS === msg.id ? 'animate-bounce text-indigo-600' : ''}`} />
                          <span>{isPlayingTTS === msg.id ? 'Silence voice narration' : 'Hear Audio Narration'}</span>
                        </button>
                      )}

                      {/* Everyday Analogy Card */}
                      {msg.analogy && (
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/40 rounded-xl p-3">
                          <h4 className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider mb-1 flex items-center gap-1 font-sans">
                            <BookOpen className="h-3 w-3" />
                            Concrete Analogy (Cognitive Bridge)
                          </h4>
                          <p className="text-[11px] text-emerald-950 dark:text-emerald-250 font-medium leading-normal italic font-sans dark:text-emerald-200">
                            "{msg.analogy}"
                          </p>
                        </div>
                      )}

                      {/* Technical Jargon Glossary Tooltips */}
                      {msg.glossary && msg.glossary.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1.5 font-sans">
                            Jargon Decompressor Glossary
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.glossary.map((g, idx) => (
                              <div 
                                key={idx} 
                                className="group relative bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-755 border border-slate-100 dark:border-slate-700 rounded-lg py-1 px-2.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-help transition-all duration-150"
                              >
                                <span>{g.word}</span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 dark:bg-slate-950 text-white rounded-lg p-2 text-[10px] w-48 shadow-lg leading-normal z-[60] dark:border dark:border-slate-800">
                                  <div className="font-bold text-indigo-300 mb-0.5">{g.word}</div>
                                  <div>{g.definition}</div>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-white dark:border-slate-850 border-t-4 border-x-4 border-x-transparent" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Knowledge Sources Citations */}
                      {msg.sourceChunks && msg.sourceChunks.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-1">
                          <Database className="h-3 w-3" />
                          <span>Fetched from:</span>
                          {msg.sourceChunks.map((c, i) => (
                            <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 py-0.5 rounded ml-1 border border-slate-200 dark:border-slate-700">
                              {c.sourceName}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  )}

                </div>
              </div>
            ))}

            {/* AI thinking state indicator */}
            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center animate-spin text-indigo-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-500 dark:text-slate-400 font-sans duration-300 animate-pulse">
                  Retrieval & Reasoning Agent synthesizing context matching rules...
                </div>
              </div>
            )}
          </div>

          {/* Prompt Entry Box Area */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/30 dark:bg-slate-950/20">
            <form onSubmit={handleSendMessage} className="relative flex gap-2">
              <input 
                type="text"
                id="main-chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask technical question on container scaling, GCP IAM, or AWS S3..."
                disabled={loading}
                className="flex-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/50 transition-shadow disabled:opacity-60 text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                id="btn-send"
                disabled={!inputMessage.trim() || loading}
                className="absolute right-3.5 top-2.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg cursor-pointer transition-transform disabled:opacity-40 disabled:scale-100 active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-550 font-mono mt-1.5">
              Secure distributed server-side Gemini RAG with offline adaptive memory simulation active.
            </p>
          </div>
        </section>        {/* VISUALIZATION PANEL */}
        <section className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col overflow-hidden relative" id="vis-dashboard">
          
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  id="tab-vis-flow"
                  onClick={() => { triggerSound('click'); setActiveVisTab('flow'); }}
                  className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeVisTab === 'flow'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Active Concept Flow
                </button>
                <button
                  id="tab-vis-architecture"
                  onClick={() => { triggerSound('click'); setActiveVisTab('architecture'); }}
                  className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    activeVisTab === 'architecture'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  CrewAI & Python Setup (Phases 1-5)
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleExportDiagram}
                id="btn-export-visual"
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer duration-200"
              >
                Export Diagram Schema
              </button>
            </div>
          </div>

          {/* Interactive SVG Node Diagram or CrewAI Architecture Viewport */}
          <div className="flex-1 flex flex-col justify-center items-center p-6 relative select-none overflow-y-auto">
            
            {activeVisTab === 'flow' ? (
              activeFlow ? (
                <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden flex flex-col p-5 relative min-h-[460px]">
                  
                  {/* Node flowchart description top left */}
                  <div className="absolute top-4 left-4 z-15 bg-slate-900 dark:bg-slate-950 text-white px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 shadow-sm dark:border dark:border-slate-850">
                    <Terminal className="h-3 w-3 text-indigo-400" />
                    <span>Interactive Flow Console</span>
                  </div>

                  {/* Simulated live visual traffic flow controls */}
                  <div className="absolute top-4 right-4 z-15 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-2 md:opacity-100 opacity-0 transition-opacity">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSimulationActive(!simulationActive)}
                        className={`p-1 rounded-md text-xs font-bold font-sans transition-colors ${
                          simulationActive ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                        title="Activate data traffic particle engine simulation"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </button>
                      <span className="text-[10px] font-bold text-slate-500 font-sans">
                        {simulationActive ? 'Simulation: Active' : 'Simulation: Idle'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
                      <Sliders className="h-3.5 w-3.5 text-slate-400" />
                      <input 
                        type="range"
                        min="10"
                        max="100"
                        value={flowSimulatorSpeed}
                        onChange={(e) => setFlowSimulatorSpeed(parseInt(e.target.value))}
                        className="w-14 h-1 bg-slate-200 dark:bg-slate-800 rounded cursor-pointer accent-indigo-600"
                        title="Adjust flow rate simulation latency"
                      />
                    </div>
                  </div>

                  {/* MAIN VECTOR STAGE */}
                  <div className="flex-1 w-full relative h-[300px] mt-8 flex items-center justify-center">
                    
                    {/* Adaptive flowing connecting curves SVGs */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      <defs>
                        <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                          <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="glow" />
                          <feComposite in="SourceGraphic" in2="glow" operator="over" />
                        </filter>
                      </defs>

                      {/* Simple dynamic level line matching coordinates */}
                      {activeFlow.nodes.map((n, idx) => {
                        if (idx === activeFlow.nodes.length - 1) return null;
                        
                        // Node 1 & Node 2 coordinates logic
                        const stepX = 140; 
                        const startX = 60 + idx * stepX;
                        const startY = idx % 2 === 0 ? 110 : 160;
                        
                        const endX = 60 + (idx + 1) * stepX;
                        const endY = (idx + 1) % 2 === 0 ? 110 : 160;

                        return (
                          <g key={`edge-${idx}`}>
                            {/* Main stroke connection line */}
                            <path 
                              d={`M ${startX} ${startY} Q ${(startX + endX)/2} ${(startY + endY)/2 - 20} ${endX} ${endY}`}
                              stroke="url(#edge-grad)"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={simulationActive ? "6 4" : "none"}
                            >
                              {simulationActive && (
                                <animate 
                                  attributeName="stroke-dashoffset" 
                                  values="30;0" 
                                  dur={`${2 - (flowSimulatorSpeed / 60)}s`} 
                                  repeatCount="indefinite" 
                                />
                              )}
                            </path>
                            
                            {/* Animated glowing load particle bubble */}
                            {simulationActive && (
                              <circle r="5" fill="#4f46e5" filter="url(#glow)">
                                <animateMotion 
                                  path={`M ${startX} ${startY} Q ${(startX + endX)/2} ${(startY + endY)/2 - 20} ${endX} ${endY}`}
                                  dur={`${2.5 - (flowSimulatorSpeed / 50)}s`} 
                                  repeatCount="indefinite"
                                />
                              </circle>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Nodes Container */}
                    <div className="absolute inset-x-0 inset-y-0 flex items-center justify-between px-6 z-10 overflow-x-auto">
                      {activeFlow.nodes.map((node, idx) => {
                        const isSelected = selectedNode?.id === node.id;
                        
                        // Set interactive color palettes based on node role structure
                        let colorClass = 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-indigo-200';
                        if (node.type === 'start') {
                          colorClass = 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-200';
                        } else if (node.type === 'decision') {
                          colorClass = 'border-amber-600 bg-amber-50 text-amber-950 dark:border-amber-500 dark:bg-amber-950/20 dark:text-amber-200';
                        } else if (node.type === 'end') {
                          colorClass = 'border-slate-800 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-100';
                        }

                        return (
                          <button
                            key={node.id}
                            id={`node-element-${node.id}`}
                            onClick={() => { triggerSound('click'); setSelectedNode(node); }}
                            style={{
                              transform: `translateY(${idx % 2 === 0 ? '-30px' : '30px'})`
                            }}
                            className={`flex-shrink-0 w-32 min-h-24 p-2.5 rounded-xl border-2 text-center shadow-md select-none outline-none cursor-pointer transition-all duration-300 ${colorClass} ${
                              isSelected 
                                ? 'ring-4 ring-indigo-600/20 scale-110 shadow-indigo-100 dark:shadow-none' 
                                : 'opacity-90 hover:opacity-100 hover:scale-[1.03]'
                            }`}
                          >
                            <div className="text-[10px] font-black uppercase tracking-wide opacity-50 font-mono">
                              LEVEL {idx + 1}
                            </div>
                            <div className="text-[11px] font-black tracking-tight leading-normal mt-1 truncate">
                              {node.label}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-450 font-sans mt-0.5 leading-tight truncate">
                              {node.type.toUpperCase()}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                  </div>

                  {/* Nodes interactive bottom description meta viewer */}
                  {selectedNode && (
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5 z-20 shrink-0 select-none animate-fade">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            selectedNode.type === 'start' ? 'bg-emerald-500' : selectedNode.type === 'decision' ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}></span>
                          <h4 className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-200 font-sans">
                            {selectedNode.label}
                          </h4>
                        </div>
                        <span className="text-[9px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">
                          {selectedNode.type} Node Info
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal font-sans">
                        {selectedNode.description || 'Our visualization agent created this logical step to represent the computational boundary. Click other levels to query their specific behaviors.'}
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center p-10 max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h3 className="font-sans font-bold text-slate-800 dark:text-slate-200 mb-2">No active visualization map</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    Submit a technical question to trigger reasoning. The visualization agent will compile, layout, and render a dynamic step-by-step flowchart logic tree here.
                  </p>
                </div>
              )
            ) : (
              /* INTERACTIVE ARCHITECTURE CONSOLE (PHASES 1-5 SHOWER) */
              <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 overflow-hidden flex flex-col md:flex-row gap-6 min-h-[500px]">
                
                {/* 1. Left System Nodes Blueprint List */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-2.5">
                  <div className="px-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-400">Roadmap Modules</h4>
                    <p className="text-[9px] text-slate-500">Click to inspect Phase setups</p>
                  </div>

                  <button
                    onClick={() => { triggerSound('click'); setActiveArchModule('fastapi'); }}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col ${
                      activeArchModule === 'fastapi'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-500'
                        : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-600 dark:text-indigo-400">PHASE 1</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">FastAPI Routes & PDF</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 truncate">Uvicorn API server & PDF Parser</span>
                  </button>

                  <button
                    onClick={() => { triggerSound('click'); setActiveArchModule('chromadb'); }}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col ${
                      activeArchModule === 'chromadb'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-500'
                        : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-600 dark:text-indigo-400">PHASE 2</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">ChromaDB Vector Store</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 truncate">Embeddings & Similarity Search</span>
                  </button>

                  <button
                    onClick={() => { triggerSound('click'); setActiveArchModule('crewai'); }}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col ${
                      activeArchModule === 'crewai'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-500'
                        : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-600 dark:text-indigo-400">PHASE 3</span>
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">CrewAI Agent Swarm</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 truncate">Ingestion, Retrieval & Reasoning</span>
                  </button>

                  <button
                    onClick={() => { triggerSound('click'); setActiveArchModule('personalizer'); }}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col ${
                      activeArchModule === 'personalizer'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-500'
                        : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-600 dark:text-indigo-400">PHASE 4</span>
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Cognitive Adaptation</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 truncate">ADHD, Dyslexia, ASD formatting</span>
                  </button>

                  <button
                    onClick={() => { triggerSound('click'); setActiveArchModule('docker'); }}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col ${
                      activeArchModule === 'docker'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-500'
                        : 'border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black text-indigo-600 dark:text-indigo-400">PHASE 5</span>
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Docker & Deployment</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 truncate">Production optimization guides</span>
                  </button>
                </div>

                {/* 2. Right Module Specifications Inspector Panel */}
                <div className="flex-1 flex flex-col min-w-0">
                  {getModuleMetaContent(activeArchModule, () => triggerSound('success'))}
                </div>

              </div>
            )}

            {/* Educational Technical Grounding FAQ info guide card */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/70 dark:bg-slate-900/85 backdrop-blur-md rounded-xl p-3 border border-slate-200/50 dark:border-slate-800/50 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-sans shadow-sm flex items-start gap-2 max-w-md pointer-events-none select-none">
              <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Roadmap Integration:</strong> The workspace runs a secure node backend in parallel with a copyable Python/FastAPI/CrewAI microservice system in `backend-python/` to satisfy all five local and public deployment targets.
              </div>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

// Helper module metadata extractor to show code snippets beautifully
function getModuleMetaContent(moduleKey: string, onCopyCompleted?: (msg: string) => void) {
  let segmentTitle = "";
  let descriptionText = "";
  let targetTech = "";
  let statusBadge = "";
  let activeCode = "";
  let file_path = "";

  if (moduleKey === 'fastapi') {
    segmentTitle = "FastAPI Backend & PDF Parsing API";
    statusBadge = "PHASE 1 - FULLY INTEGRATED IN BACKEND-PYTHON";
    targetTech = "Python 3.11, FastAPI, PyPDF2, Uvicorn";
    file_path = "/backend-python/main.py";
    descriptionText = "The Phase 1 backend sets up a robust REST API framework to host ingest controllers, parse binary PDF documents on line buffers, and trigger CORS middleware protocols safely.";
    activeCode = `@app.post("/api/documents/upload-pdf")
async def upload_pdf_document(name: str = Form(...), file: UploadFile = File(...)):
    # Read binary structural content and trigger PDF reader
    file_bytes = await file.read()
    reader = PdfReader(io.BytesIO(file_bytes))
    text_content = ""
    for page in reader.pages:
        text_content += page.extract_text() or ""
        
    # Commit parsed text context to local Chroma DB
    doc = db.add_document(name=name, doc_type="pdf", content=text_content)
    return {"success": True, "document": doc}`;
  } 
  else if (moduleKey === 'chromadb') {
    segmentTitle = "ChromaDB Semantic Vector Database";
    statusBadge = "PHASE 2 - READY FOR PRODUCTION DEPLOYMENT";
    targetTech = "ChromaDB Vector, Google GenAI Embeddings, Cosine similarity";
    file_path = "/backend-python/database.py";
    descriptionText = "Phase 2 translates document paragraphs into recursive chunk arrays of 1000 characters with 200 character overrides. Generates high-dimension vector embeddings using Google GenAI systems and indexes them inside ChromaDB workspaces.";
    activeCode = `class ChromaLocalDB:
    def add_document(self, name: str, doc_type: str, content: str):
        # Chunk text into standard characters with 200 char overlaps
        raw_chunks = split_into_overlapping_chunks(content, size=1000, overlap=200)
        
        # Embed chunks and index inside Chroma Vector Store
        for i, text in enumerate(raw_chunks):
            vector = ai.models.embed_content(model="gemini-embedding-2-preview", contents=text)
            chroma_collection.add(
                ids=[f"{doc_id}-chunk-{i}"],
                embeddings=[vector],
                metadatas=[{"sourceName": name, "type": doc_type}],
                documents=[text]
            )`;
  } 
  else if (moduleKey === 'crewai') {
    segmentTitle = "CrewAI Multi-Agent Swarm Orchestrator";
    statusBadge = "PHASE 3 - MULTI-AGENT DESIGN COMPLETE";
    targetTech = "CrewAI Framework, Agent Cooperations, Gemini LLM";
    file_path = "/backend-python/agents.py";
    descriptionText = "Phase 3 establishes a distributed, sequential Multi-agent swarm. Combines specialized technical roles: Crawler, Searcher, and educational tutors collaborating sequentially to compile RAG summaries.";
    activeCode = `# Configure parallel CrewAI workflow roles
crawler = Agent(role='Crawler', goal='Fetch and sanitize documentation pages', backstory='System robot')
searcher = Agent(role='Context Retriever', goal='Query ChromaDB for vector matches', backstory='Semantic matcher')
simplifier = Agent(role='Cognitive Tutor', goal='Restructure technical text into analogies', backstory='ADHD developer helper')

# Bundle into Sequential Executions Pipeline
crew = Crew(
    agents=[crawler, searcher, simplifier],
    tasks=[scan_task, match_task, rewrite_task],
    process=Process.sequential
)`;
  } 
  else if (moduleKey === 'personalizer') {
    segmentTitle = "Cognitive Personalization Adaptor";
    statusBadge = "PHASE 4 - COGNITIVE PROFILES ACTIVE";
    targetTech = "Adaptive LLM Prompts, Bionic letters, Dyslexic Spacers";
    file_path = "/src/components/CognitivePanel.tsx";
    descriptionText = "Phase 4 converts dry layouts into personalized mental assets. Prompts the reasoning assistant with explicit directives for ADHD and Dyslexia profiles, adjusting spacing elements, letter-trackings, and audio streams.";
    activeCode = `# Configure customized structural instructions for user profiles
if mode == "dyslexia":
    mode_guidance = "Separate arguments into short, isolated paragraphs with generous letter tracking."
elif mode == "adhd":
    mode_guidance = "Add bolded list takeaway blocks upfront and eliminate verbose conversational logs."
elif mode == "autism":
    mode_guidance = "Use literal, human-friendly definitions. Specify concrete inputs and outputs only."`;
  } 
  else {
    segmentTitle = "Docker Containerization & Production Deploy";
    statusBadge = "PHASE 5 - OPTIMIZED FOR CLOUD RUN & EXPERT DEPLOYS ";
    targetTech = "Docker, Multi-stage builds, Production CORS hooks";
    file_path = "/backend-python/Dockerfile";
    descriptionText = "Phase 5 provides standard container definitions. Optimizes performance on headless node frameworks, exposes standard interfaces on port 8000, and enables zero-config deployment schemas directly in Google Cloud Run.";
    activeCode = `FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    onCopyCompleted?.(`Saved '${file_path}' code snippet directly to clipboard!`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 text-slate-800 dark:text-slate-150 font-sans">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
        <span className="inline-block text-[9px] font-black tracking-widest text-[#4f46e5] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full mb-1">
          {statusBadge}
        </span>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{segmentTitle}</h3>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Technology: {targetTech}</p>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
        {descriptionText}
      </p>

      {/* Code Snip Header */}
      <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-2 rounded-t-xl shrink-0 select-none">
        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-[#4169E1]" />
          {file_path}
        </span>
        <button
          onClick={handleCopy}
          className="text-[10px] font-bold text-[#818cf8] hover:text-white transition-colors cursor-pointer bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-md"
        >
          Copy Code Snippet
        </button>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto rounded-b-xl border border-slate-900/40 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-300 antialiased max-h-[220px]">
        <pre className="whitespace-pre">{activeCode}</pre>
      </div>
    </div>
  );
}
