"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, TerminalSquare, User, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import candidatesData from "../data/candidates.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
};

type Feedback = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/interview`
  : "https://interview-agent-api-8x97.onrender.com/api/interview";

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-4 w-full justify-start items-start">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mt-1">
        <Sparkles className="w-4 h-4 text-indigo-400" />
      </div>
      {/* Dots */}
      <div className="flex items-center gap-1 pt-2">
        <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Message Row ──────────────────────────────────────────────────────────────

function MessageRow({ msg }: { msg: Message }) {
  const isAi = msg.sender === "ai";

  if (isAi) {
    return (
      <div className="flex gap-4 w-full justify-start items-start">
        {/* AI Avatar – frosted glass */}
        <div className="flex-shrink-0 w-8 h-8 bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-xl flex items-center justify-center mt-1">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        {/* AI Text – no bubble, document style */}
        <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-loose">
          <p className="m-0 whitespace-pre-wrap">{msg.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-end">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] ml-auto break-words">
        {msg.text}
      </div>
    </div>
  );
}

// ─── Feedback Section ─────────────────────────────────────────────────────────

function FeedbackSection({ feedback, onDownloadPDF }: { feedback: Feedback; onDownloadPDF?: () => void }) {
  const toList = (v: string[] | undefined): string[] =>
    Array.isArray(v) && v.length ? v : ["No data provided"];

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* This ID targets only the visual feedback content for the PDF, excluding the download button */}
      <div id="scorecard-dashboard" className="w-full rounded-2xl border border-zinc-700/50 bg-zinc-900/60 backdrop-blur p-8 space-y-6">
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" /> Interview Complete
        </h2>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2">Summary</h3>
          <p className="text-zinc-300 leading-relaxed">{feedback.summary || "No summary available."}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2">Strengths</h3>
          <ul className="space-y-1">
            {toList(feedback.strengths).map((s, i) => (
              <li key={i} className="text-zinc-300 flex gap-2">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2">Knowledge Gaps</h3>
          <ul className="space-y-1">
            {toList(feedback.gaps).map((g, i) => (
              <li key={i} className="text-zinc-300 flex gap-2">
                <span className="text-amber-400 mt-1">→</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-2">Next Steps</h3>
          <ul className="space-y-1">
            {toList(feedback.next).map((n, i) => (
              <li key={i} className="text-zinc-300 flex gap-2">
                <span className="text-indigo-400 mt-1">•</span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* PDF Download Button */}
      {onDownloadPDF && (
        <button
          onClick={onDownloadPDF}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Scorecard PDF
        </button>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function InterviewApp() {
  const [candidates] = useState(candidatesData.candidates);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    candidates[0]?.member.id || ""
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // PDF Download Handler
  const downloadPDF = async () => {
    const element = document.getElementById('scorecard-dashboard');
    if (typeof window !== 'undefined' && element) {
      // Dynamically import to avoid Next.js SSR window errors
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: 0.5,
        filename: 'Interview_Scorecard.pdf',
        // "as const" forces TS to read this exactly as "jpeg" and not a generic string
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#09090b' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // @ts-ignore - physically bypasses the type checker for this execution
      html2pdf().set(opt).from(element).save();
    }
  };

  // Auto-scroll every time messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading, isDone]);

  // Auto-resize textarea
  const handleTextareaInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 192)}px`;
  };

  // ── Start Interview ──────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (!selectedCandidateId) return;
    setIsLoading(true);
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    const selectedCandidate = candidates.find(
      (c: any) => c.member.id === selectedCandidateId
    );
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: newSessionId, candidate: selectedCandidate }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setChatHistory([{ id: crypto.randomUUID(), sender: "ai", text: `⚠️ ${data.reply || "Server error."}` }]);
        setIsStarted(true);
        return;
      }
      setChatHistory([{ id: crypto.randomUUID(), sender: "ai", text: data.reply }]);
      setIsStarted(true);
    } catch {
      setChatHistory([{ id: crypto.randomUUID(), sender: "ai", text: "⚠️ Failed to connect to backend." }]);
      setIsStarted(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Send Message ─────────────────────────────────────────────────────────────

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const userMsg = inputText.trim();
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setChatHistory(prev => [...prev, { id: crypto.randomUUID(), sender: "user", text: userMsg }]);
    setIsLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: userMsg }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setChatHistory(prev => [...prev, { id: crypto.randomUUID(), sender: "ai", text: `⚠️ ${data.reply || "Server error."}` }]);
        return;
      }
      if (data.done && data.feedback) {
        setChatHistory(prev => [...prev, { id: crypto.randomUUID(), sender: "ai", text: data.reply }]);
        setFeedback(data.feedback);
        setIsDone(true);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } else {
        setChatHistory(prev => [...prev, { id: crypto.randomUUID(), sender: "ai", text: data.reply }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { id: crypto.randomUUID(), sender: "ai", text: "⚠️ Failed to communicate with server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Setup Screen ─────────────────────────────────────────────────────────────

  if (!isStarted) {
    return (
      <div className="h-screen flex flex-col bg-[#09090B] text-zinc-100 overflow-hidden items-center justify-center px-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/50 rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <TerminalSquare className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
              AI Tech Interviewer
            </h1>
            <p className="text-zinc-500 text-sm text-center">
              Select a candidate profile to begin the technical evaluation.
            </p>
          </div>

          <select
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={selectedCandidateId}
            onChange={e => setSelectedCandidateId(e.target.value)}
          >
            {candidates.map((c: any) => (
              <option key={c.member.id} value={c.member.id}>
                {c.member.id} — {c.member.name} ({c.member.jobRole})
              </option>
            ))}
          </select>

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting…
              </>
            ) : (
              "Start Interview"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Chat Screen ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#09090b] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#09090b] to-[#09090b] text-zinc-100 overflow-hidden">

      {/* ── Slim Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-[#09090B]/80 backdrop-blur z-10">
        <div className="flex items-center gap-2 font-semibold text-zinc-100">
          <TerminalSquare className="w-5 h-5 text-indigo-400" />
          AI Tech Lead
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <User className="w-4 h-4" />
          {candidates.find((c: any) => c.member.id === selectedCandidateId)?.member.name}
        </div>
      </header>

      {/* ── Chat Scroll Area ── */}
      <div className="flex-1 overflow-y-auto scroll-smooth w-full">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 px-4 py-8 pb-40">
          {chatHistory.map(msg => (
            <MessageRow key={msg.id} msg={msg} />
          ))}
          {isLoading && !isDone && <TypingIndicator />}

          {/* We pass the downloadPDF function down to the Feedback Section */}
          {isDone && feedback && <FeedbackSection feedback={feedback} onDownloadPDF={downloadPDF} />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Sticky Glassmorphism Input Bar ── */}
      {!isDone && (
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#09090B] via-[#09090B]/80 to-transparent backdrop-blur-sm pt-12 pb-6 px-4">
          <form
            onSubmit={handleSend}
            className="max-w-3xl mx-auto relative flex items-end w-full"
          >
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onInput={handleTextareaInput}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              placeholder="Type your answer… (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 pr-14 text-zinc-100 placeholder-zinc-400 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 resize-none max-h-48 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute bottom-3 right-3 p-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 hover:text-indigo-300 rounded-xl transition-all duration-300 border border-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}