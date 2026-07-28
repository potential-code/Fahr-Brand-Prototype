import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { LEARNER_PROFILE } from "@/lib/constants";
import type { RecognitionRecord } from "@/lib/recognitionRecord";
import { ArrowUpRight, BadgeCheck, Building2, ShieldCheck, Star, TrendingUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

/**
 * The dark record band. Recognition is the one learner screen that should read
 * as a citation rather than a workspace, so the hero and the credential cards
 * are dark against the otherwise light page.
 */
export function RecognitionHero({
  record,
  onSync,
}: {
  record: RecognitionRecord;
  onSync: () => void;
}) {
  const { level, nextLevel, progressToNext, pointsToNext, levelMeasured, points, rank, earnedCount } = record;

  const stats = [
    { id: "points", label: "Impact points", value: points, suffix: "" },
    { id: "credentials", label: "Verified credentials", value: earnedCount, suffix: "" },
    { id: "badges", label: "Badges earned", value: record.achievementsEarned, suffix: "" },
    { id: "rank", label: "Rank in entity", value: rank.entity, prefix: "#" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-[#171310]"
      data-testid="hero-recognition"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div aria-hidden="true" className="absolute -end-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />

      <div className="relative p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Verified federal record · {record.verifiedOn}
          </span>
        </div>

        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
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

            <h1 className="mt-5 text-2xl font-bold leading-tight text-white md:text-3xl">
              Recognition &amp; Impact{" "}
              <span className="text-white/45">
                — {level.label} on the federal ladder
              </span>
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/65">
              {levelMeasured
                ? `${level.description}. Every credential, badge and hour below is issued against work you completed on the platform.`
                : "Your ladder position is not measured yet. Credentials and badges below reflect real activity; take the baseline assessment to place yourself on the ladder."}
            </p>

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
              <p className="mt-2.5 inline-flex items-start gap-1.5 text-xs text-white/55">
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {nextLevel
                  ? `${pointsToNext} readiness points to reach ${nextLevel.label}.`
                  : "Recognition now shifts to mentoring colleagues and leading governance."}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button
                size="sm"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={onSync}
                data-testid="button-sync-uae-pass"
              >
                <ShieldCheck className="me-2 h-4 w-4" /> Sync wallet with UAE Pass
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/learner/profile" data-testid="link-capability-profile">
                  Open capability profile <ArrowUpRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Headline numbers */}
          <div className="grid grid-cols-2 gap-3 lg:w-[300px]">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5"
                data-testid={`hero-stat-${stat.id}`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{stat.label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white">
                  <CountUp to={stat.value} prefix={stat.prefix} />
                </p>
              </motion.div>
            ))}
            <p className="col-span-2 inline-flex items-center gap-1.5 text-[11px] text-white/45">
              <Star className="h-3 w-3 shrink-0 fill-current text-primary" />
              Top {100 - rank.percentile + 1}% federally · up {rank.movement} places this quarter
            </p>
            <p className="col-span-2 inline-flex items-center gap-1.5 text-[11px] text-white/45">
              <BadgeCheck className="h-3 w-3 shrink-0 text-primary" />
              Credentials are verifiable by any federal entity
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
