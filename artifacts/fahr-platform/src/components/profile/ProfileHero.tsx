import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ReadinessRing } from "@/components/profile/ReadinessRing";
import { AGENTS, LEARNER_PROFILE } from "@/lib/constants";
import type { ProfileAnalysis } from "@/lib/profileAnalysis";
import { ArrowRight, Building2, Sparkles, TrendingUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

function Identity() {
  return (
    <div className="flex items-center gap-4">
      <img
        src={`${BASE}${LEARNER_PROFILE.avatar}`}
        alt=""
        aria-hidden="true"
        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/25"
      />
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-white">{LEARNER_PROFILE.name}</p>
        <p className="truncate text-sm text-white/65">
          {LEARNER_PROFILE.role} · {LEARNER_PROFILE.department}
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/50">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{LEARNER_PROFILE.entity}</span>
        </p>
      </div>
    </div>
  );
}

function HeroShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-[#171310]"
      data-testid="hero-capability-profile"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
      />
      <div className="relative p-6 md:p-8">{children}</div>
    </motion.div>
  );
}

/** Identity band with the animated readiness ring and distance to the next level. */
export function ProfileHero({ analysis }: { analysis: ProfileAnalysis }) {
  const { level, nextLevel, progressToNext, pointsToNext } = analysis;

  return (
    <HeroShell>
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          Maintained by your {AGENTS.capability}
        </span>
      </div>

      <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <Identity />

          <h1 className="mt-5 text-2xl font-bold leading-tight text-white md:text-3xl">
            {level.label} <span className="text-white/45">on the federal AI capability ladder</span>
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/65">
            {analysis.levelBlurb} Last recalculated on {analysis.completedOn} from your assessment outcomes,
            programme participation and learning behaviour.
          </p>

          {/* Distance to the next level */}
          <div className="mt-6 max-w-xl rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium text-white/70">
                {nextLevel ? `Progress to ${nextLevel.label}` : "Top of the capability ladder"}
              </p>
              <p className="text-xs font-semibold tabular-nums text-primary">{progressToNext}%</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-white/55">
              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-primary" />
              {nextLevel
                ? `${pointsToNext} readiness points to reach ${nextLevel.label}. ${nextLevel.description}.`
                : "Top of the ladder — the objective now is to sustain Champion level."}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 lg:pl-6">
          <ReadinessRing value={analysis.overall} />
          <Button asChild variant="outline" size="sm" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <Link href="/learner/assessment/report" data-testid="link-latest-report">
              View latest report <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </HeroShell>
  );
}

/** The same band before any assessment exists — identity only, with the invitation. */
export function ProfileHeroEmpty() {
  return (
    <HeroShell>
      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1">
        <Sparkles className="h-3.5 w-3.5 text-white/70" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
          Awaiting your baseline
        </span>
      </div>

      <div className="mt-5 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <Identity />
          <h1 className="mt-5 text-2xl font-bold leading-tight text-white md:text-3xl">
            Your Capability Profile is <span className="text-white/45">not measured yet</span>
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/65">
            The {AGENTS.capability} already knows your role, entity and department. Eight scenario questions are all
            it needs to score you against the five FAHR AI competencies and start tracking growth from today.
          </p>
          <Button asChild className="mt-6">
            <Link href="/learner/assessment" data-testid="link-start-assessment">
              Take your baseline assessment <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="flex justify-center lg:pl-6">
          <ReadinessRing value={0} empty caption="Not measured" />
        </div>
      </div>
    </HeroShell>
  );
}
