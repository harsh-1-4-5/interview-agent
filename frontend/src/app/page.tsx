"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  TerminalSquare,
  Sparkles,
  ChevronDown,
  RotateCcw,
  ArrowRight,
  Briefcase,
  GraduationCap,
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  Target,
  TrendingUp,
  Hash,
} from "lucide-react";
import confetti from "canvas-confetti";
import candidatesData from "../data/candidates.json";
import curriculumData from "../data/curriculum.json";

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

type Tab = "live" | "curriculum" | "dashboard";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/interview`
  : "https://interview-agent-api-8x97.onrender.com/api/interview";

const TARGET_QUESTIONS = 8;
const TOTAL_CURRICULUM_DAYS = 31;

// ─── Global Motion / Keyframes ────────────────────────────────────────────────

function MotionStyles() {
  return (
    <style jsx global>{`
      @keyframes auroraDriftA {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(50px, -35px) scale(1.15); }
      }
      @keyframes auroraDriftB {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-45px, 40px) scale(1.1); }
      }
      @keyframes gridDrift {
        0% { background-position: 0 0; }
        100% { background-position: 48px 48px; }
      }
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes messageIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.96) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes pulseGlow {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      .animate-aurora-a { animation: auroraDriftA 24s ease-in-out infinite; }
      .animate-aurora-b { animation: auroraDriftB 28s ease-in-out infinite; }
      .animate-grid-drift { animation: gridDrift 14s linear infinite; }
      .animate-gradient-text { animation: gradientShift 6s ease-in-out infinite; }
      .animate-message-in { animation: messageIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .animate-fade-in { animation: fadeIn 0.25s ease-out both; }
      .animate-scale-in { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .animate-pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .animate-aurora-a, .animate-aurora-b, .animate-grid-drift,
        .animate-gradient-text, .animate-message-in, .animate-fade-in,
        .animate-scale-in, .animate-pulse-glow {
          animation: none !important;
        }
      }
    `}</style>
  );
}

// ─── Ambient Background (grid + drifting orbs) ────────────────────────────────

function AmbientBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] animate-grid-drift"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute -top-48 -left-24 w-[38rem] h-[38rem] rounded-full bg-indigo-600/20 blur-[130px] animate-aurora-a" />
      <div className="absolute top-1/4 -right-40 w-[32rem] h-[32rem] rounded-full bg-violet-600/15 blur-[120px] animate-aurora-b" />
      <div
        className="absolute bottom-[-10rem] left-1/3 w-[28rem] h-[28rem] rounded-full bg-fuchsia-600/10 blur-[110px] animate-aurora-a"
        style={{ animationDelay: "-9s" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_#09090b_78%)]" />
    </div>
  );
}

// ─── Animated Wordmark ─────────────────────────────────────────────────────────

function Wordmark({ size = "text-base" }: { size?: string }) {
  return (
    <p
      className={`${size} font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-violet-200 to-indigo-300 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-text`}
    >
      Interview Agent
    </p>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-4 w-full justify-start items-start animate-message-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mt-1">
        <Sparkles className="w-4 h-4 text-indigo-400" />
      </div>
      <div className="flex items-center gap-1 pt-3">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Message Row ──────────────────────────────────────────────────────────────

function MessageRow({ msg }: { msg: Message }) {
  const isAi = msg.sender === "ai";

  if (isAi) {
    return (
      <div className="flex gap-4 w-full justify-start items-start animate-message-in">
        <div className="flex-shrink-0 w-8 h-8 bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-xl flex items-center justify-center mt-1">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-loose">
          <p className="m-0 whitespace-pre-wrap">{msg.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-end animate-message-in">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] ml-auto break-words">
        {msg.text}
      </div>
    </div>
  );
}

// ─── Feedback Section (scorecard) ─────────────────────────────────────────────

function FeedbackSection({
  feedback,
  onDownloadPDF,
}: {
  feedback: Feedback;
  onDownloadPDF?: () => void;
}) {
  const toList = (v: string[] | undefined): string[] =>
    Array.isArray(v) && v.length ? v : ["No data provided"];

  return (
    <div className="w-full flex flex-col items-center gap-6 animate-message-in">
      {/* This ID targets only the visual feedback content for the PDF, excluding the download button */}
      <div
        id="scorecard-dashboard"
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] p-8 space-y-7"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-white/10 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-indigo-300" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Interview Complete
          </h2>
        </div>

        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-2">
            Summary
          </h3>
          <p className="text-zinc-300 leading-relaxed">
            {feedback.summary || "No summary available."}
          </p>
        </div>

        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-2">
            Strengths
          </h3>
          <ul className="space-y-1.5">
            {toList(feedback.strengths).map((s, i) => (
              <li key={i} className="text-zinc-300 flex gap-2 text-sm">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-2">
            Knowledge Gaps
          </h3>
          <ul className="space-y-1.5">
            {toList(feedback.gaps).map((g, i) => (
              <li key={i} className="text-zinc-300 flex gap-2 text-sm">
                <span className="text-amber-400 mt-0.5">→</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-2">
            Next Steps
          </h3>
          <ul className="space-y-1.5">
            {toList(feedback.next).map((n, i) => (
              <li key={i} className="text-zinc-300 flex gap-2 text-sm">
                <span className="text-indigo-400 mt-0.5">•</span>
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
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Scorecard PDF
        </button>
      )}
    </div>
  );
}

// ─── Custom Candidate Selector ────────────────────────────────────────────────

function CandidateSelector({
  candidates,
  selectedId,
  onChange,
  disabled,
}: {
  candidates: any[];
  selectedId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = candidates.find((c) => c.member.id === selectedId);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 text-left transition-all duration-200 hover:bg-white/[0.08] hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">
            {selected?.member.name}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {selected?.member.jobRole}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-1.5 animate-fade-in">
          {candidates.map((c) => (
            <button
              key={c.member.id}
              type="button"
              onClick={() => {
                onChange(c.member.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-150 ${c.member.id === selectedId
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-zinc-300 hover:bg-white/5"
                }`}
            >
              <p className="text-sm font-medium truncate">{c.member.name}</p>
              <p className="text-xs text-zinc-500 truncate">{c.member.jobRole}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Nav Item (fully wired tab switcher) ──────────────────────────────

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none ${active
        ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
        : "text-zinc-400 border border-transparent hover:bg-white/5 hover:text-zinc-200"
        }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-glow" />}
    </button>
  );
}

// ─── Telemetry Stat Tile ───────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone: "emerald" | "amber" | "indigo" | "violet";
}) {
  const toneMap: Record<string, string> = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    indigo: "text-indigo-400",
    violet: "text-violet-400",
  };
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3 h-3 flex-shrink-0 ${toneMap[tone]}`} />
        <span className="text-[10px] text-zinc-500 uppercase tracking-wide truncate">{label}</span>
      </div>
      <p className="text-sm font-semibold text-zinc-100 truncate">{value}</p>
    </div>
  );
}

// ─── Curriculum View ────────────────────────────────────────────────────────

function CurriculumView({ curriculum, candidate }: { curriculum: any; candidate: any }) {
  const missionByDay = new Map(candidate.missions.map((m: any) => [m.day, m]));

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-10 pb-24 space-y-8 animate-fade-in">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-1">
          Curriculum
        </p>
        <h2 className="text-xl font-semibold text-zinc-100">{curriculum.cohort}</h2>
        <p className="text-sm text-zinc-500 mt-1">Progress for {candidate.member.name}</p>
      </div>

      {curriculum.modules.map((mod: any) => {
        const [start, end] = mod.days;
        const daysInModule = curriculum.days.filter((d: any) => d.day >= start && d.day <= end);
        return (
          <div key={mod.n} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-600">M{mod.n}</span>
              <h3 className="text-sm font-semibold text-zinc-200">{mod.title}</h3>
            </div>
            <div className="grid gap-2">
              {daysInModule.map((d: any) => {
                // Define a type for mission data so TypeScript knows what properties exist
                type MissionStatus = {
                  passed?: boolean;
                  skipped?: boolean;
                  attempts?: number;
                };

                // Cast the lookup result explicitly with 'as MissionStatus | undefined'
                const mission = missionByDay.get(d.day) as MissionStatus | undefined;
                const StatusIcon = mission?.passed ? CheckCircle2 : mission?.skipped ? XCircle : Circle;
                const iconTone = mission?.passed
                  ? "text-emerald-400"
                  : mission?.skipped
                    ? "text-amber-400"
                    : "text-zinc-700";
                const rowTone = mission?.passed
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : mission?.skipped
                    ? "border-amber-500/20 bg-amber-500/[0.04]"
                    : "border-white/5 bg-white/[0.01] opacity-60";
                return (
                  <div
                    key={d.day}
                    className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors ${rowTone}`}
                  >
                    <StatusIcon className={`w-4 h-4 flex-shrink-0 ${iconTone}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-200 truncate">
                        Day {d.day} — {d.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {d.type}
                        {mission?.attempts ? ` · ${mission.attempts} attempt${mission.attempts > 1 ? "s" : ""}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Candidate Dashboard View ───────────────────────────────────────────────

function CandidateDashboardView({ candidate }: { candidate: any }) {
  const passed = candidate.missions.filter((m: any) => m.passed).length;
  const skipped = candidate.missions.filter((m: any) => m.skipped).length;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-10 pb-24 space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> Callsign {candidate.member.id}
            </p>
            <h2 className="text-2xl font-semibold text-zinc-100 truncate">{candidate.member.name}</h2>
            <p className="text-sm text-zinc-400 mt-1">{candidate.member.jobRole}</p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-medium flex-shrink-0">
            {candidate.member.status}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatTile icon={Briefcase} label="Target Role" value={candidate.member.jobRole} tone="indigo" />
          <StatTile icon={GraduationCap} label="Education" value={candidate.member.education} tone="violet" />
          <StatTile icon={CheckCircle2} label="Passed" value={passed} tone="emerald" />
          <StatTile icon={XCircle} label="Skipped" value={skipped} tone="amber" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 mb-4">
          Performance History
        </p>
        <div className="space-y-1">
          {candidate.missions.map((m: any) => (
            <div
              key={m.day}
              className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0"
            >
              {m.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : m.skipped ? (
                <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-zinc-700 flex-shrink-0" />
              )}
              <span className="text-xs text-zinc-500 font-mono w-14 flex-shrink-0">Day {m.day}</span>
              <span className="text-sm text-zinc-300 flex-1 truncate">{m.title}</span>
              {m.attempts !== undefined && (
                <span className="text-[11px] text-zinc-500 flex-shrink-0">
                  {m.attempts} attempt{m.attempts > 1 ? "s" : ""}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
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
  const [activeTab, setActiveTab] = useState<Tab>("live");

  // UI-only telemetry state (does not touch interview/API state or logic)
  const [elapsed, setElapsed] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedCandidate = candidates.find(
    (c: any) => c.member.id === selectedCandidateId
  );

  const missionStats = selectedCandidate
    ? {
      passed: selectedCandidate.missions.filter((m: any) => m.passed).length,
      skipped: selectedCandidate.missions.filter((m: any) => m.skipped).length,
      firstTry: selectedCandidate.signals?.missionsFirstTry ?? "—",
      commitDays: selectedCandidate.signals?.commitDays ?? "—",
      daysTouched: selectedCandidate.missions.length,
    }
    : null;

  const questionCount = chatHistory.filter((m) => m.sender === "ai").length;
  const progressPct = Math.min(100, Math.round((questionCount / TARGET_QUESTIONS) * 100));
  const curriculumCoveragePct = missionStats
    ? Math.round((missionStats.passed / TOTAL_CURRICULUM_DAYS) * 100)
    : 0;

  const formatElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Session timer — purely presentational
  useEffect(() => {
    if (!isStarted || isDone) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isStarted, isDone]);

  // PDF Download Handler
  const downloadPDF = async () => {
    const element = document.getElementById('scorecard-dashboard');
    if (typeof window !== 'undefined' && element) {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0.5,
        filename: 'Interview_Scorecard.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#09090b' },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      // @ts-ignore
      html2pdf().set(opt).from(element).save();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading, isDone]);

  const handleTextareaInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 192)}px`;
  };

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

  const handleReset = () => {
    setSessionId(null);
    setIsStarted(false);
    setIsLoading(false);
    setChatHistory([]);
    setInputText("");
    setIsDone(false);
    setFeedback(null);
    setElapsed(0);
    setActiveTab("live");
  };

  // ─── Landing / Intro View ────────────────────────────────────────────────
  if (!isStarted) {
    return (
      <div className="h-screen w-full bg-[#09090b] text-zinc-100 overflow-hidden relative flex items-center justify-center px-4">
        <MotionStyles />
        <AmbientBackdrop />

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_60px_rgba(0,0,0,0.5)] p-8 space-y-6 animate-scale-in">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_8px_40px_rgba(99,102,241,0.2)]">
              <TerminalSquare className="w-7 h-7 text-indigo-400" />
            </div>
            <Wordmark size="text-3xl" />
            <p className="text-zinc-500 text-sm text-center leading-relaxed">
              Select a candidate profile to begin an adaptive technical evaluation
              grounded in their cohort history.
            </p>
          </div>

          <CandidateSelector
            candidates={candidates}
            selectedId={selectedCandidateId}
            onChange={setSelectedCandidateId}
          />

          <button
            onClick={handleStart}
            disabled={isLoading || !selectedCandidateId}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                Start Interview
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Dashboard View ─────────────────────────────────────────────────
  return (
    <div className="h-screen w-full flex bg-[#09090b] text-zinc-100 overflow-hidden">
      <MotionStyles />

      {/* ─── Left Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 h-screen flex flex-col justify-between border-r border-white/10 bg-white/[0.02] backdrop-blur-2xl px-6 py-7 z-20">
        <div className="flex flex-col gap-8 min-h-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-white/10 flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.15)]">
              <TerminalSquare className="w-4.5 h-4.5 text-indigo-300" />
            </div>
            <Wordmark />
          </div>

          <nav className="space-y-1">
            <NavItem
              icon={MessageSquare}
              label="Live Interview"
              active={activeTab === "live"}
              onClick={() => setActiveTab("live")}
            />
            <NavItem
              icon={BookOpen}
              label="Curriculum"
              active={activeTab === "curriculum"}
              onClick={() => setActiveTab("curriculum")}
            />
            <NavItem
              icon={LayoutDashboard}
              label="Candidate Dashboard"
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
          </nav>

          <div className="space-y-2.5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500 px-1">
              Candidate
            </p>
            <CandidateSelector
              candidates={candidates}
              selectedId={selectedCandidateId}
              onChange={setSelectedCandidateId}
              disabled
            />

            {selectedCandidate && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <span className="truncate">
                    {selectedCandidate.member.yearsExperience} yrs experience
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <GraduationCap className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <span className="truncate">{selectedCandidate.member.education}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-zinc-300 text-sm font-medium hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98] transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          New Interview / Reset
        </button>
      </aside>

      {/* ─── Center Panel — Main Workspace ─────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
        <AmbientBackdrop />

        {activeTab === "live" && (
          <>
            <div className="flex-1 overflow-y-auto scroll-smooth w-full relative z-10">
              <div className="w-full max-w-2xl mx-auto flex flex-col gap-8 px-6 py-10 pb-40">
                {chatHistory.map(msg => (
                  <MessageRow key={msg.id} msg={msg} />
                ))}
                {isLoading && !isDone && <TypingIndicator />}
                {isDone && feedback && (
                  <FeedbackSection feedback={feedback} onDownloadPDF={downloadPDF} />
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {!isDone && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/85 to-transparent backdrop-blur-sm pt-12 pb-6 px-4 z-10">
                <form
                  onSubmit={handleSend}
                  className="max-w-2xl mx-auto relative flex items-end w-full"
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
                    className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 pr-14 text-zinc-100 placeholder-zinc-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300 resize-none max-h-48 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="absolute bottom-3 right-3 p-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 hover:text-indigo-300 active:scale-90 rounded-xl transition-all duration-200 border border-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
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
          </>
        )}

        {activeTab === "curriculum" && selectedCandidate && (
          <div className="flex-1 overflow-y-auto scroll-smooth relative z-10">
            <CurriculumView curriculum={curriculumData} candidate={selectedCandidate} />
          </div>
        )}

        {activeTab === "dashboard" && selectedCandidate && (
          <div className="flex-1 overflow-y-auto scroll-smooth relative z-10">
            <CandidateDashboardView candidate={selectedCandidate} />
          </div>
        )}
      </div>

      {/* ─── Right Panel — Session Telemetry ───────────────────────────── */}
      <aside className="w-80 flex-shrink-0 h-screen border-l border-white/10 bg-white/[0.02] backdrop-blur-2xl px-6 py-7 overflow-y-auto z-20">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-4 h-4 text-indigo-400" />
          <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
            Session Telemetry
          </p>
          {!isDone && (
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              Live
            </span>
          )}
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Interview Progress</span>
            <span className="text-zinc-300 font-medium">{questionCount} asked</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {missionStats && (
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Curriculum Coverage</span>
              <span className="text-zinc-300 font-medium">
                {missionStats.passed}/{TOTAL_CURRICULUM_DAYS} days
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${curriculumCoveragePct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
          <Clock className="w-3.5 h-3.5" />
          <span>Session time — {formatElapsed(elapsed)}</span>
        </div>

        {missionStats && (
          <div className="space-y-3 mb-6">
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Candidate Brief
            </p>
            <div className="grid grid-cols-2 gap-2">
              <StatTile icon={CheckCircle2} label="Passed" value={missionStats.passed} tone="emerald" />
              <StatTile icon={XCircle} label="Skipped" value={missionStats.skipped} tone="amber" />
              <StatTile icon={Target} label="First Try" value={missionStats.firstTry} tone="indigo" />
              <StatTile icon={TrendingUp} label="Commit Days" value={missionStats.commitDays} tone="violet" />
            </div>
          </div>
        )}

        {isDone && feedback && (
          <div className="space-y-2.5 animate-fade-in">
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              Session Summary
            </p>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-xs">
              <span className="text-zinc-400">Strengths identified</span>
              <span className="text-emerald-400 font-semibold">
                {feedback.strengths?.length ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-xs">
              <span className="text-zinc-400">Gaps flagged</span>
              <span className="text-amber-400 font-semibold">
                {feedback.gaps?.length ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-xs">
              <span className="text-zinc-400">Next steps suggested</span>
              <span className="text-indigo-400 font-semibold">
                {feedback.next?.length ?? 0}
              </span>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
