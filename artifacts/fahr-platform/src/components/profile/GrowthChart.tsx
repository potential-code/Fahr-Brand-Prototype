import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { HistoryPoint } from "@/lib/profileAnalysis";

type Shape = "line" | "area";

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">
        AI readiness <span className="font-semibold text-primary">{payload[0].value}%</span>
      </p>
    </div>
  );
}

/**
 * Readiness across the programme. The line draws itself in on first paint and
 * the most recent point is the learner's live assessment score.
 */
export function GrowthChart({ history }: { history: HistoryPoint[] }) {
  const [shape, setShape] = useState<Shape>("area");

  const first = history[0];
  const current = history[history.length - 1];
  const gain = current.readiness - first.readiness;

  const axisProps = {
    tickLine: false,
    axisLine: false,
    stroke: "hsl(var(--muted-foreground))",
    className: "text-xs",
  } as const;

  return (
    <Card className="border-card-border" data-testid="card-growth-chart">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" /> Capability growth over time
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Recalculated after every assessment and validated work outcome. Hover any point for the score at
              that checkpoint.
            </p>
          </div>
          <div
            className="inline-flex shrink-0 rounded-full border border-border bg-muted p-1"
            role="tablist"
            aria-label="Growth chart shape"
          >
            {(["area", "line"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={shape === s}
                onClick={() => setShape(s)}
                className={`rounded-full px-3.5 py-1 text-xs font-medium capitalize transition-colors ${
                  shape === s ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`button-growth-shape-${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 h-64 w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={shape}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                {shape === "area" ? (
                  <AreaChart data={history} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                    <defs>
                      <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis domain={[0, 100]} {...axisProps} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="readiness"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="url(#growthFill)"
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1400}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={history} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis domain={[0, 100]} {...axisProps} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="readiness"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      animationDuration={1400}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Your latest score is {current.readiness}% — {gain > 0 ? `${gain} points above` : "level with"} where this
          record started in {first.label}.
        </p>
      </CardContent>
    </Card>
  );
}
