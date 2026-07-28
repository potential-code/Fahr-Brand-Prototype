import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Crosshair, Minus, Target } from "lucide-react";
import type { CompetencyStanding } from "@/lib/profileAnalysis";

type View = "bars" | "radar";

/**
 * Strength, steady and gap are separated by weight rather than by hue — a
 * capability gap is a development priority, not an error, so no alarm colour.
 */
const BAND_STYLE: Record<
  CompetencyStanding["band"],
  { label: string; bar: string; chip: string; dot: string }
> = {
  strength: {
    label: "Strength",
    bar: "bg-primary",
    chip: "border-primary/40 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  steady: {
    label: "Steady",
    bar: "bg-accent",
    chip: "border-accent/40 bg-accent/10 text-accent",
    dot: "bg-accent",
  },
  gap: {
    label: "Priority gap",
    bar: "bg-foreground/30",
    chip: "border-transparent bg-foreground text-background",
    dot: "bg-foreground/40",
  },
};

function CompetencyRow({
  standing,
  index,
  active,
  onActivate,
}: {
  standing: CompetencyStanding;
  index: number;
  active: boolean;
  onActivate: (id: string | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const style = BAND_STYLE[standing.band];

  const detailId = `competency-detail-${standing.competency.id}`;

  return (
    // A real button so Enter and Space activate it, with the pointer and
    // keyboard paths both driving the same active id.
    <button
      type="button"
      className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
        active ? "border-primary/40 bg-primary/[0.04]" : "border-transparent hover:bg-muted/50"
      }`}
      onMouseEnter={() => onActivate(standing.competency.id)}
      onMouseLeave={() => onActivate(null)}
      onFocus={() => onActivate(standing.competency.id)}
      onBlur={() => onActivate(null)}
      onClick={() => onActivate(active ? null : standing.competency.id)}
      aria-expanded={active}
      aria-controls={detailId}
      data-testid={`row-competency-${standing.competency.id}`}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
          <span className="truncate text-sm font-medium text-foreground">{standing.competency.label}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{standing.score}%</span>
      </span>

      {/* Track carries both the current score and the target marker. */}
      <span className="relative mt-2 block h-2.5 overflow-hidden rounded-full bg-muted">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-foreground/[0.07]"
          style={{ width: `${standing.target}%` }}
          aria-hidden="true"
        />
        <motion.span
          className={`absolute inset-y-0 left-0 rounded-full ${style.bar}`}
          initial={{ width: reduceMotion ? `${standing.score}%` : 0 }}
          whileInView={{ width: `${standing.score}%` }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, delay: 0.06 * index, ease: "easeOut" }}
        />
        <span
          className="absolute inset-y-0 w-0.5 bg-foreground/45"
          style={{ left: `calc(${standing.target}% - 1px)` }}
          aria-hidden="true"
        />
      </span>

      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Badge variant="outline" className={`rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wider ${style.chip}`}>
          {style.label}
        </Badge>
        <span className="inline-flex items-center gap-1">
          <Target className="h-3 w-3" /> Target {standing.target}%
        </span>
        <span className={`inline-flex items-center gap-1 ${standing.delta > 0 ? "text-primary" : ""}`}>
          {standing.delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          {standing.delta > 0 ? `+${standing.delta} since first baseline` : "No change yet"}
        </span>
      </span>

      <AnimatePresence initial={false}>
        {active && (
          <motion.span
            id={detailId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="block overflow-hidden"
          >
            <span className="block pt-2.5 text-xs leading-relaxed text-muted-foreground">
              {standing.competency.description}
              {standing.course && ` Closed by ${standing.course.title}.`}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/** The five FAHR competencies, driven by the learner's own assessment scores. */
export function CompetencyMap({ standings }: { standings: CompetencyStanding[] }) {
  const [view, setView] = useState<View>("bars");
  const [activeId, setActiveId] = useState<string | null>(null);

  const radarData = standings.map((s) => ({
    short: s.competency.short,
    score: s.score,
    target: s.target,
  }));

  return (
    <Card className="border-card-border" data-testid="card-competency-map">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
              <Crosshair className="h-4 w-4 text-primary" /> Competency map
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Your live standing across the five FAHR AI competencies, with the target the Advisor has set for
              each one. Hover a competency for detail.
            </p>
          </div>

          <div
            className="inline-flex shrink-0 rounded-full border border-border bg-muted p-1"
            role="tablist"
            aria-label="Competency map view"
          >
            {(["bars", "radar"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-3.5 py-1 text-xs font-medium capitalize transition-colors ${
                  view === v ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`button-map-view-${v}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {view === "bars" ? (
            <motion.div
              key="bars"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="mt-5 space-y-1.5"
            >
              {standings.map((standing, i) => (
                <CompetencyRow
                  key={standing.competency.id}
                  standing={standing}
                  index={i}
                  active={activeId === standing.competency.id}
                  onActivate={setActiveId}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="radar"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="mt-5"
            >
              <div className="h-[320px] w-full" data-testid="chart-competency-radar">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis dataKey="short" tick={{ fontSize: 11, fill: "currentColor" }} className="text-muted-foreground" />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Target"
                      dataKey="target"
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="4 4"
                      fill="none"
                    />
                    <Radar
                      name="You"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.22}
                      isAnimationActive
                      animationDuration={900}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground">
                Solid shape is your current profile · dashed outline is the Advisor's target for this cycle.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
