import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartReveal, CountUp } from "@/components/motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TeamBenchmark } from "@/lib/manager/selectors";
import { Gauge, TrendingDown, TrendingUp } from "lucide-react";

/**
 * The team's readiness against its department and its entity.
 *
 * Both comparison figures come from the derived entity roll-up — this component
 * only states the difference, so the manager, entity admin and leadership views
 * cannot disagree about where a team sits.
 */
export function TeamBenchmarkCard({
  benchmark,
  className,
}: {
  benchmark: TeamBenchmark;
  className?: string;
}) {
  const { department, ministry } = benchmark;
  return (
    <Card className={className} data-testid="card-team-benchmark">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" /> Team vs entity readiness
        </CardTitle>
        <CardDescription>{benchmark.headline}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tabular-nums text-foreground" data-testid="text-team-readiness">
              <CountUp to={benchmark.teamReadiness} />
            </p>
            <p className="text-xs text-muted-foreground">Team capability average</p>
          </div>
          <Badge
            variant="outline"
            className={
              benchmark.aheadOfMinistry
                ? "bg-primary/10 text-primary border-primary/25"
                : "bg-accent/10 text-accent border-accent/25"
            }
            data-testid="badge-benchmark-direction"
          >
            {benchmark.aheadOfMinistry ? (
              <TrendingUp className="me-1 h-3 w-3" />
            ) : (
              <TrendingDown className="me-1 h-3 w-3" />
            )}
            {benchmark.vsMinistry >= 0 ? "+" : ""}
            {benchmark.vsMinistry} vs {ministry.shortName}
          </Badge>
        </div>

        <div className="space-y-3">
          {[
            { id: "team", label: "Your team", value: benchmark.teamReadiness, tone: "bg-primary" },
            { id: "department", label: department.name, value: department.readiness, tone: "bg-secondary" },
            { id: "ministry", label: `${ministry.shortName} average`, value: ministry.readiness, tone: "bg-muted-foreground" },
          ].map((bar) => (
            <div key={bar.id} data-testid={`benchmark-bar-${bar.id}`}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{bar.label}</span>
                <span className="font-semibold tabular-nums text-foreground">{bar.value}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${bar.tone}`} style={{ width: `${bar.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          On-track threshold is {benchmark.onTrack}.{" "}
          {benchmark.atRisk
            ? `The team sits below it, and ${benchmark.membersBelowOnTrack} ${
                benchmark.membersBelowOnTrack === 1 ? "person is" : "people are"
              } below it individually — treat this as an at-risk team.`
            : `The team clears it, with ${benchmark.membersBelowOnTrack} ${
                benchmark.membersBelowOnTrack === 1 ? "person" : "people"
              } still below it individually.`}
        </p>
      </CardContent>
    </Card>
  );
}

/** The same comparison as a report chart section, with the threshold marked. */
export function TeamBenchmarkChart({ benchmark }: { benchmark: TeamBenchmark }) {
  const data = [
    { name: "Your team", value: benchmark.teamReadiness, fill: "hsl(var(--primary))" },
    { name: benchmark.department.name.split(" ")[0], value: benchmark.department.readiness, fill: "hsl(var(--secondary))" },
    { name: `${benchmark.ministry.shortName} avg`, value: benchmark.ministry.readiness, fill: "hsl(var(--muted-foreground))" },
  ];

  return (
    <div className="space-y-3">
      <div className="h-[260px]">
        <ChartReveal className="h-full" direction="rise">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip cursor={{ fill: "transparent" }} />
              <ReferenceLine
                y={benchmark.onTrack}
                stroke="hsl(var(--accent))"
                strokeDasharray="4 4"
                label={{ value: `On track ${benchmark.onTrack}`, position: "right", fontSize: 11, fill: "hsl(var(--accent))" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Readiness index">
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartReveal>
      </div>
      <p className="text-sm text-muted-foreground" data-testid="text-benchmark-read">
        {benchmark.headline} Against its own department ({benchmark.department.name}) the team is{" "}
        {benchmark.vsDepartment >= 0 ? "ahead by" : "behind by"} {Math.abs(benchmark.vsDepartment)}{" "}
        {Math.abs(benchmark.vsDepartment) === 1 ? "point" : "points"}.
      </p>
    </div>
  );
}
