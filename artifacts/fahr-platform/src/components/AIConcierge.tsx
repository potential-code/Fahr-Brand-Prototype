import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AGENTS } from "@/lib/constants";
import {
  Bot,
  X,
  Send,
  Sparkles,
  LayoutDashboard,
  Target,
  FlaskConical,
  Award,
  PhoneCall,
  CheckCircle2,
} from "lucide-react";

type Msg = { from: "agent" | "user"; text: string };

const QUICK_ACTIONS = [
  { label: "Go to my dashboard", icon: LayoutDashboard, href: "/learner" },
  { label: "Open my Development Mission", icon: Target, href: "/learner/mission" },
  { label: "Open the Agentic AI Lab", icon: FlaskConical, href: "/learner/lab/twin" },
  { label: "View my certificates & points", icon: Award, href: "/learner/recognition" },
];

const CANNED: Record<string, string> = {
  default:
    "I can help you navigate the platform, explain how the programme works, or connect you with the FAHR support team. Try one of the quick actions below, or ask me anything.",
  pathway:
    "Your personalised pathway is built by the AI Skills Advisor from your baseline assessment and role profile. It adapts as you complete missions — you can review it any time under Development Mission.",
  certificate:
    "Certificates and badges you earn are stored in your Recognition wallet. Points contribute to your entity leaderboard position.",
  help:
    "I have flagged your request to the FAHR programme support team. A human specialist will follow up by email within one business day.",
};

function replyFor(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("pathway") || t.includes("mission") || t.includes("learn")) return CANNED.pathway;
  if (t.includes("certificate") || t.includes("badge") || t.includes("point")) return CANNED.certificate;
  if (t.includes("help") || t.includes("human") || t.includes("support") || t.includes("escalate")) return CANNED.help;
  return CANNED.default;
}

export function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "agent",
      text: `Hi, I'm your ${AGENTS.concierge}. I can answer questions about the platform, guide you to the right place, or connect you with a human specialist.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { from: "agent", text: replyFor(text) }]);
      setTyping(false);
    }, 900);
  };

  const escalate = () => {
    setEscalated(true);
    setMessages((m) => [
      ...m,
      { from: "user", text: "I'd like to speak with a human specialist." },
      { from: "agent", text: CANNED.help },
    ]);
  };

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI Concierge"
          className="fixed bottom-6 right-6 z-[60] group flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 px-4 py-3 hover:scale-105 transition-transform"
        >
          <span className="relative flex">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-primary" />
          </span>
          <span className="hidden sm:block text-sm font-medium pr-1">{AGENTS.concierge}</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[60] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{AGENTS.concierge}</p>
                <p className="text-[11px] text-primary-foreground/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online — simulated
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 max-h-80 min-h-56 overflow-auto p-4 space-y-3 bg-background/60">
            {messages.map((m, i) =>
              m.from === "agent" ? (
                <div key={i} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm max-w-[85%]">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-sm max-w-[85%]">
                    {m.text}
                  </div>
                </div>
              ),
            )}
            {typing && (
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-3 py-2 flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-3 pt-2 flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.href}
                onClick={() => {
                  setOpen(false);
                  setLocation(a.href);
                }}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors"
              >
                <a.icon className="w-3.5 h-3.5 text-primary" />
                {a.label}
              </button>
            ))}
            <button
              onClick={escalate}
              disabled={escalated}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-60"
            >
              {escalated ? <CheckCircle2 className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
              {escalated ? "Specialist notified" : "Talk to a human"}
            </button>
          </div>

          <form
            className="p-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the concierge..."
              className="flex-1 px-3 py-2 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
