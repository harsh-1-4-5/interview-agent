"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Play, CheckCircle2, TrendingUp, AlertTriangle, ArrowRight, User, TerminalSquare, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
const triggerConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};
import candidatesData from '../data/candidates.json';

type Message = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
};

type Feedback = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/interview`
  : "https://interview-agent-api-8x97.onrender.com/api/interview";

export default function InterviewApp() {
  const [candidates] = useState(candidatesData.candidates);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.member.id || "");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isDone, setIsDone] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading, isDone]);

  const handleStart = async () => {
    if (!selectedCandidateId) return;
    setIsLoading(true);

    // Generate fresh session ID
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);

    const selectedCandidate = candidates.find((c: any) => c.member.id === selectedCandidateId);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: newSessionId,
          candidate: selectedCandidate
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("Backend error:", data.error || res.statusText);
        setSessionId(null);
        setIsLoading(false);
        setChatHistory([{ id: crypto.randomUUID(), sender: 'ai', text: `⚠️ ${data.reply || 'Server returned an error. Please try again.'}` }]);
        setIsStarted(true);
        return;
      }

      setChatHistory([
        { id: crypto.randomUUID(), sender: 'ai', text: data.reply }
      ]);
      setIsStarted(true);
    } catch (error) {
      console.error("Error starting interview:", error);
      setSessionId(null);
      setChatHistory([{ id: crypto.randomUUID(), sender: 'ai', text: '⚠️ Failed to connect to the backend server. If using the live Render backend, please wait ~50 seconds for it to spin up from a cold start and try again.' }]);
      setIsStarted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText("");

    setChatHistory(prev => [
      ...prev,
      { id: crypto.randomUUID(), sender: 'user', text: userMessage }
    ]);

    setIsLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("Backend error:", data.error || res.statusText);
        setSessionId(null);
        setIsLoading(false);
        setChatHistory(prev => [
          ...prev,
          { id: crypto.randomUUID(), sender: 'ai', text: `⚠️ ${data.reply || 'Server error. Your session has been reset — please start a new interview.'}` }
        ]);
        return;
      }

      if (data.done && data.feedback) {
        setChatHistory(prev => [
          ...prev,
          { id: crypto.randomUUID(), sender: 'ai', text: data.reply }
        ]);
        setFeedback(data.feedback);
        setIsDone(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899']
        });
      } else {
        setChatHistory(prev => [
          ...prev,
          { id: crypto.randomUUID(), sender: 'ai', text: data.reply }
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSessionId(null);
      setChatHistory(prev => [
        ...prev,
        { id: crypto.randomUUID(), sender: 'ai', text: '⚠️ Failed to connect to the server. If this is a cold start on Render, it might take ~50 seconds to spin up. Your session has been reset — please start a new interview.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------

  const renderSetupScreen = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto space-y-8">
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl w-full">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner">
            <TerminalSquare className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
          AI Tech Interviewer
        </h1>
        <p className="text-slate-400 text-center mb-8">Select a candidate profile to begin the technical evaluation.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Candidate Profile</label>
            <select
              className="w-full bg-slate-900/80 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
            >
              {candidates.map((c: any) => (
                <option key={c.member.id} value={c.member.id}>
                  {c.member.id} - {c.member.name} ({c.member.jobRole})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-900/50 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );

  const renderFeedbackScorecard = () => {
    if (!feedback) return null;
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 mt-12 mb-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-3">
            Interview Complete
          </h2>
          <p className="text-slate-400 text-lg">Final evaluation based on the conversation history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary */}
          <div className="col-span-1 md:col-span-2 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 md:p-8 rounded-3xl shadow-xl">
            <h3 className="flex items-center gap-3 text-2xl font-semibold text-slate-100 mb-5">
              <div className="p-2 bg-blue-500/20 rounded-lg"><FileText className="text-blue-400 w-6 h-6" /></div>
              Summary
            </h3>
            <p className="text-slate-300 text-lg leading-relaxed">{feedback.summary}</p>
          </div>

          {/* Strengths */}
          <div className="bg-slate-800/40 backdrop-blur-md border border-emerald-900/40 p-6 md:p-8 rounded-3xl shadow-xl">
            <h3 className="flex items-center gap-3 text-2xl font-semibold text-emerald-400 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-lg"><TrendingUp className="w-6 h-6 text-emerald-400" /></div>
              Strengths
            </h3>
            <ul className="space-y-4">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Gaps */}
          <div className="bg-slate-800/40 backdrop-blur-md border border-rose-900/40 p-6 md:p-8 rounded-3xl shadow-xl">
            <h3 className="flex items-center gap-3 text-2xl font-semibold text-rose-400 mb-6">
              <div className="p-2 bg-rose-500/20 rounded-lg"><AlertTriangle className="w-6 h-6 text-rose-400" /></div>
              Knowledge Gaps
            </h3>
            <ul className="space-y-4">
              {feedback.gaps.map((g, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  </div>
                  <span className="leading-relaxed">{g}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="col-span-1 md:col-span-2 bg-slate-800/40 backdrop-blur-md border border-indigo-900/40 p-6 md:p-8 rounded-3xl shadow-xl">
            <h3 className="flex items-center gap-3 text-2xl font-semibold text-indigo-400 mb-6">
              <div className="p-2 bg-indigo-500/20 rounded-lg"><ArrowRight className="w-6 h-6 text-indigo-400" /></div>
              Next Steps
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedback.next.map((n, i) => (
                <div key={i} className="bg-indigo-950/40 border border-indigo-900/50 p-5 rounded-2xl flex items-start gap-4 hover:bg-indigo-950/60 transition-colors">
                  <div className="text-indigo-400 font-black text-xl mt-0.5">{i + 1}.</div>
                  <div className="text-slate-300 leading-relaxed">{n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // MAIN RETURN
  // ----------------------------------------------------

  return (
    <main className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30">

      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-inner">
            <TerminalSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">AI Tech Lead</h1>
        </div>

        {isStarted && (
          <div className="flex items-center gap-3 bg-slate-800/80 px-5 py-2.5 rounded-full border border-slate-700 shadow-sm">
            <User className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-200">
              {candidates.find((c: any) => c.member.id === selectedCandidateId)?.member.name}
            </span>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto relative scroll-smooth p-4 md:p-6 pb-40">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute top-0 left-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>

        {!isStarted ? (
          renderSetupScreen()
        ) : (
          <div className="w-full max-w-4xl mx-auto space-y-8 flex flex-col justify-end min-h-full">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] md:max-w-[80%] p-5 rounded-3xl leading-relaxed whitespace-pre-wrap shadow-xl text-[15px] md:text-base ${msg.sender === 'user'
                    ? 'bg-emerald-600/20 text-emerald-50 border border-emerald-500/30 rounded-br-sm backdrop-blur-md'
                    : 'bg-indigo-600/20 text-indigo-50 border border-indigo-500/30 rounded-bl-sm backdrop-blur-md'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && !isDone && (
              <div className="flex w-full justify-start">
                <div className="max-w-[85%] md:max-w-[75%] p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 rounded-bl-sm flex items-center gap-4 backdrop-blur-md shadow-xl">
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-slate-300 text-sm font-semibold tracking-wide">Interviewer is typing...</span>
                </div>
              </div>
            )}

            {isDone && renderFeedbackScorecard()}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Footer */}
      {isStarted && !isDone && (
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-slate-950 via-slate-950 to-transparent pt-12 pb-6 px-4 md:px-6 z-20 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <form
              onSubmit={handleSend}
              className="relative flex items-center bg-slate-800/90 backdrop-blur-2xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all"
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
                placeholder="Type your answer here... (Press Enter to send)"
                className="w-full bg-transparent text-slate-100 placeholder-slate-400 px-6 py-5 focus:outline-none resize-none max-h-32 disabled:opacity-50 text-[15px]"
                rows={1}
                style={{ minHeight: '68px' }}
              />
              <div className="pr-4 shrink-0 flex items-end h-full py-3">
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-3.5 rounded-xl transition-all shadow-lg active:scale-95 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
            <div className="text-center mt-4 text-xs text-slate-500 font-semibold tracking-wider uppercase">
              AI Interviewer • Next.js + Groq + FastAPI
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
