import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AGENTS } from "@/lib/constants";
import type { AdvisorSignal, SignalWeight } from "@/lib/profileAnalysis";
import {
  Activity,
  Award,
  BarChart3,
  Building2,
  ChevronDown,
  Compass,
  Gauge,
  Quote,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

const SIGNAL_ICON: Record<string, LucideIcon> = {
  outcomes: BarChart3,
  competency: Gauge,
  role: User,
  entity: Building2,
  objectives: Compass,
  participation: Activity,
  behaviour: Activity,
  achievements: Award,
};

const WEIGHT_LABEL: Record<SignalWeight, string> = {
  high: "Strong signal",
  medium: "Supporting signal",
  low: "Weak signal",
};

const WEIGHT_BARS: Record<SignalWeight, number> = { high: 3, medium: 2, low: 1 };

function SignalRow({ signal, index }: { signal: AdvisorSignal; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = SIGNAL_ICON[signal.id] ?? Activity;
  const filled = WEIGHT_BARS[signal.weight];

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: 0.05 * index }}
      data-testid={`signal-${signal.id}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-primary/[0.05]"
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {signal.label}
            </span>
            <span className="inline-flex items-center gap-0.5" title={WEIGHT_LABEL[signal.weight]}>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`h-1 w-3 rounded-full ${i < filled ? "bg-primary" : "bg-muted"}`}
                  aria-hidden="true"
                />
              ))}
              <span className="sr-only">{WEIGHT_LABEL[signal.weight]}</span>
            </span>
          </span>
          <span className="mt-0.5 block text-sm font-medium leading-snug text-foreground">
            {signal.value}
          </span>
        </span>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="ps-14 pe-3 pb-3 text-xs leading-relaxed text-muted-foreground">{signal.detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

/**
 * Makes the personalisation legible: the signals the Capability Agent reads about
 * this learner, and the conclusion it drew from them.
 */
export function AdvisorSignalsPanel({
  signals,
  conclusion,
}: {
  signals: AdvisorSignal[];
  conclusion: string;
}) {
  return (
    <Card className="overflow-hidden border-primary/25" data-testid="card-advisor-signals">
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#171310] to-[#3c3229] px-6 py-4">
        <span className="relative shrink-0">
          <img
            src={`${BASE}brand/agent-avatar.png`}
            alt=""
            aria-hidden="true"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#171310]" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{AGENTS.capability}</p>
          <p className="truncate text-xs text-white/60">What I am reading about you</p>
        </div>
        <Badge variant="outline" className="ms-auto shrink-0 rounded-full border-white/25 text-[10px] text-white/80">
          {signals.length} signals
        </Badge>
      </div>

      <CardContent className="p-4">
        <ul className="space-y-0.5">
          {signals.map((signal, i) => (
            <SignalRow key={signal.id} signal={signal} index={i} />
          ))}
        </ul>

        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.05] p-4">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            <Quote className="h-3.5 w-3.5" /> What I concluded
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{conclusion}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Pre-assessment variant: the signals the Advisor already holds, and the one it is waiting on. */
export function AdvisorSignalsPreview({ signals }: { signals: AdvisorSignal[] }) {
  return (
    <Card className="overflow-hidden border-primary/25" data-testid="card-advisor-signals-preview">
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#171310] to-[#3c3229] px-6 py-4">
        <img
          src={`${BASE}brand/agent-avatar.png`}
          alt=""
          aria-hidden="true"
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/20"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{AGENTS.capability}</p>
          <p className="truncate text-xs text-white/60">What I can read so far</p>
        </div>
      </div>
      <CardContent className="p-4">
        <ul className="space-y-0.5">
          {signals.map((signal, i) => (
            <SignalRow key={signal.id} signal={signal} index={i} />
          ))}
        </ul>
        <p className="mt-4 rounded-xl border border-dashed border-primary/30 bg-primary/[0.04] p-4 text-sm leading-relaxed text-muted-foreground">
          Assessment outcomes are the missing signal. Without them the competency map, growth trend and ladder
          position on this page stay empty.
        </p>
      </CardContent>
    </Card>
  );
}
