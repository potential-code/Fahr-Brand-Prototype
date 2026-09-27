import React, { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { RecognitionBand } from "@/components/recognition/RecognitionSurface";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { useFederalData } from "@/lib/FederalDataContext";
import { FEDERAL, METRICS, NATIONAL_TARGET, nationalLine, workingDaysPerYear } from "@/lib/federal";
import { PageEnter, Stagger, StaggerItem, CountUp, ChartReveal } from "@/components/motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Rocket, Clock, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AIAnalysisPanel } from "@/components/ai/AIAnalysis";
import { AGENTS } from "@/lib/constants";
import { useLiveProjects } from "@/components/leadership/LiveProjects";

export default function LeadershipOutcomes() {
  const { ministries } = useFederalData();
  // Counted from the live project list; the session figures only label what is new.
  const national = useMemo(() => nationalLine(ministries), [ministries]);
  const { session } = useLiveProjects();
  const hasSession = session.count > 0;

  const kpis: {
    label: string;
    value: number;
    icon: typeof Rocket;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    caption: string;
    delta?: string;
  }[] = [
    {
      label: METRICS.projectsLive.label,
      value: national.projectsLive,
      icon: Rocket,
      caption: `of ${national.projects.toLocaleString()} submitted · ${METRICS.projectsLive.caption.toLowerCase()}`,
      delta: hasSession ? `+${session.count} this session` : undefined,
    },
    {
      label: METRICS.hoursSaved.label,
      value: national.hoursSavedPerMonth,
      icon: Clock,
      caption: METRICS.hoursSaved.caption,
      delta: hasSession ? `+${session.hoursSaved.toLocaleString()} h this session` : undefined,
    },
    {
      label: METRICS.credentials.label,
      value: FEDERAL.credentialsIssued,
      icon: Award,
      caption: METRICS.credentials.caption,
    },
  ];

  const topHoursEntities = useMemo(() => {
    return [...ministries].sort((a, b) => b.hoursSavedPerMonth - a.hoursSavedPerMonth).slice(0, 5);
  }, [ministries]);

  return (
    <Layout role="leadership">
      <PageEnter className="space-y-8 pb-12">
        <RecognitionBand
          testId="band-national-outcomes"
          eyebrow="Verified national record"
          title="National Outcomes"
          description="Measurable impact driven by the federal AI capability programme."
        />

        <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => (
            <StaggerItem key={i}>
              <StatCard className="h-full">
                <CardContent className="p-5 flex flex-col items-center text-center justify-center h-full">
                  <kpi.icon className="w-6 h-6 mb-3 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    <CountUp to={kpi.value} decimals={kpi.decimals ?? 0} prefix={kpi.prefix} suffix={kpi.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">{kpi.label}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">{kpi.caption}</p>
                  {kpi.delta && (
                    <span
                      className="mt-2 inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent"
                      data-testid={`kpi-delta-${i}`}
                    >
                      {kpi.delta}
                    </span>
                  )}
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIAnalysisPanel
            agent={AGENTS.analytics}
            title="Hours Returned by Entity"
            steps={[
              "Evaluating live project impact estimates",
              "Aggregating entity-level impact metrics",
              "Isolating top contributors"
            ]}
            className="h-full"
          >
          <Card className="h-full border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardDescription>
                Top 5 entities by hours returned a month, of {national.hoursSavedPerMonth.toLocaleString()} nationally from{" "}
                {national.projectsLive.toLocaleString()} live projects
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 h-[300px]">
              <ChartReveal className="h-full" direction="wipe">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topHoursEntities} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="shortName" type="category" axisLine={false} tickLine={false} width={120} fontSize={12} stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }} 
                      formatter={(v: number) => [`${v.toLocaleString()} h`, "Hours / month"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)'
                      }} 
                    />
                    <Bar dataKey="hoursSavedPerMonth" radius={[0, 4, 4, 0]} barSize={20}>
                      {topHoursEntities.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartReveal>
            </CardContent>
          </Card>
          </AIAnalysisPanel>

          <div className="space-y-6">
            <AIAnalysisPanel
              agent={AGENTS.analytics}
              title="Capability Lift"
              steps={[
                "Benchmarking current readiness against target",
                "Evaluating entity tracking thresholds",
                "Projecting pathway momentum"
              ]}
            >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="px-0 pt-0">
                <CardDescription>Progress toward the {NATIONAL_TARGET.by} target</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Current Federal Readiness</span>
                    <span className="font-bold text-primary">{FEDERAL.readiness}%</span>
                  </div>
                  <Progress value={(FEDERAL.readiness / NATIONAL_TARGET.readiness) * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground text-end">Target: {NATIONAL_TARGET.readiness}%</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      <CountUp to={FEDERAL.ministriesOnTrack} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Entities on track</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      <CountUp to={FEDERAL.ministriesTotal - FEDERAL.ministriesOnTrack} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Entities needing attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </AIAnalysisPanel>

            <AIAnalysisPanel
              agent={AGENTS.analytics}
              title="Strategic Outcome Analysis"
              steps={[
                "Auditing deployed project outcomes",
                "Aggregating monthly capacity recapture",
                "Converting hours returned to working days"
              ]}
              className="bg-primary/5 border-primary/20"
            >
              <div className="text-sm space-y-3">
                <p>{national.projectsLive.toLocaleString()} of {national.projects.toLocaleString()} submitted projects are live, returning an estimated <strong>{national.hoursSavedPerMonth.toLocaleString()} hours a month</strong> — about {workingDaysPerYear(national.hoursSavedPerMonth).toLocaleString()} working days a year.</p>
                <p>Most of that time comes back in policy analysis and customer service delivery, where early projects automate drafting and triage.</p>
              </div>
            </AIAnalysisPanel>
          </div>
        </div>

      </PageEnter>
    </Layout>
  );
}
