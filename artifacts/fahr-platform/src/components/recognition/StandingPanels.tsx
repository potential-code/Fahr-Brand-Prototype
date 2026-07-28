import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { POINT_RULES } from "@/lib/engagement";
import type { RecognitionRecord } from "@/lib/recognitionRecord";
import {
  ArrowRight,
  Check,
  Clock,
  Gauge,
  Hexagon,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

/** Impact points, where they came from, and standing against colleagues. */
export function PointsAndRank({ record }: { record: RecognitionRecord }) {
  const { points, pointsEntries, rank } = record;
  const ledgerTotal = pointsEntries.reduce((n, e) => n + e.points, 0);

  return (
    <Card className="border-card-border" data-testid="card-points-rank">
      <CardContent className="p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
          <Star className="h-5 w-5 fill-current text-primary" /> Impact points and standing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Points accumulate from learning, contribution and evaluated work. Nothing here is awarded for logging in.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { id: "total", label: "Impact points", value: points, icon: Star },
            { id: "entity", label: `Rank of ${rank.entityTotal.toLocaleString("en-US")} in entity`, value: rank.entity, prefix: "#", icon: Users },
            { id: "federal", label: `Rank of ${rank.federalTotal.toLocaleString("en-US")} federally`, value: rank.federal, prefix: "#", icon: Trophy },
          ].map((stat, i) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="rounded-xl border border-border bg-muted/40 p-4"
              data-testid={`points-stat-${stat.id}`}
            >
              <stat.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                <CountUp to={stat.value} prefix={stat.prefix} />
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <TrendingUp className="h-3.5 w-3.5" /> Up {rank.movement} places federally this quarter
        </p>

        <div className="mt-5 rounded-xl border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Where your points came from</p>
          <ul className="mt-3 space-y-2">
            {pointsEntries.map((entry, i) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="min-w-0 text-foreground">
                  {entry.label}
                  <span className="ms-2 text-xs text-muted-foreground">{entry.when}</span>
                  {entry.source === "record" && (
                    <span className="ms-2 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      From FAHR records
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-primary">
                  +{entry.points.toLocaleString("en-US")}
                </span>
              </motion.li>
            ))}
          </ul>
          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            {ledgerTotal.toLocaleString("en-US")} points traced above. Unlabelled lines are counted from your activity
            on this platform; lines marked <span className="font-medium text-foreground">From FAHR records</span> are
            carried in from the programme's own attendance and peer recognition records. The remainder carries over
            from earlier programme activity.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How to earn more</p>
          <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
            {POINT_RULES.map((rule) => (
              <li key={rule.label} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-foreground">{rule.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">+{rule.points}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/learner/community" data-testid="link-leaderboards">
            See the leaderboards <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Measured workplace impact, taken from the learner's evaluated project. */
export function ImpactPanel({ record }: { record: RecognitionRecord }) {
  const { impact } = record;

  if (!impact.fromOwnProject) {
    return (
      <Card className="border-card-border" data-testid="card-impact-empty">
        <CardContent className="p-6">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
            <Zap className="h-5 w-5 text-primary" /> Measured workplace impact
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{impact.bandNote}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button asChild size="sm">
              <Link href="/learner/lab/project" data-testid="link-build-project">
                Build my workplace project <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/learner/evaluation" data-testid="link-see-evaluation">
                See how it is evaluated
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const figures = [
    { id: "hours-month", label: "Hours returned each month", value: impact.hoursPerMonth, icon: Clock },
    { id: "days-year", label: "Working days returned a year", value: impact.workingDaysReturned, icon: Gauge },
    { id: "cycle", label: "Cycle time reduction", value: impact.cycleReductionPct, suffix: "%", icon: TrendingUp },
    { id: "people", label: "Colleagues affected", value: impact.peopleAffected, icon: Users },
  ];

  return (
    <Card className="border-card-border" data-testid="card-impact">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
              <Zap className="h-5 w-5 text-primary" /> Measured workplace impact
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              From your evaluated project, <span className="font-medium text-foreground">{impact.projectTitle}</span>.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {impact.band}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {figures.map((figure, i) => (
            <motion.div
              key={figure.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className="rounded-xl border border-border bg-muted/40 p-4"
              data-testid={`impact-figure-${figure.id}`}
            >
              <figure.icon className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                <CountUp to={figure.value} suffix={figure.suffix} />
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {figure.label}
              </p>
            </motion.div>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{impact.bandNote}</p>

        {impact.measures.length > 0 && (
          <div className="mt-5 rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you committed to measure
            </p>
            <ul className="mt-2.5 space-y-2">
              {impact.measures.map((measure) => (
                <li key={measure.id} className="flex gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{measure.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/learner/evaluation" data-testid="link-impact-evaluation">
            Open the full evaluation <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Position on the unified federal capability ladder. */
export function LadderPanel({ record }: { record: RecognitionRecord }) {
  const { levelIndex, nextLevel, levelMeasured, progressToNext } = record;

  return (
    <Card className="border-card-border" data-testid="card-ladder">
      <CardContent className="p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
          <Target className="h-5 w-5 text-primary" /> Unified capability ladder
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {levelMeasured
            ? "Your standing on the single federal progression ladder used by every entity."
            : "Not measured yet — take the baseline assessment to place yourself on the ladder."}
        </p>

        <div className="relative mt-6">
          <div aria-hidden="true" className="absolute inset-y-2 start-[19px] w-0.5 bg-border" />
          <ol className="relative space-y-5">
            {CAPABILITY_LEVELS.map((level, i) => {
              const achieved = levelMeasured && i <= levelIndex;
              const current = levelMeasured && i === levelIndex;
              return (
                <motion.li
                  key={level.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="flex gap-4"
                  data-testid={`ladder-level-${level.id}`}
                >
                  <span
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-card ${
                      current
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : achieved
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {achieved ? <Check className="h-4 w-4" /> : <Hexagon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm font-bold ${current ? "text-primary" : "text-foreground"}`}>
                        {level.label}
                      </p>
                      {current && (
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          You are here
                        </span>
                      )}
                      {nextLevel?.id === level.id && (
                        <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                          {progressToNext}% there
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{level.description}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>

        <Button asChild variant="outline" size="sm" className="mt-6">
          <Link
            href={levelMeasured ? "/learner/profile" : "/learner/assessment"}
            data-testid="link-ladder-action"
          >
            {levelMeasured ? "See how this is calculated" : "Take the baseline assessment"}
            <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
