import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { TrendingUp, Users, Award, DollarSign, Shield, Building2, Bot, AlertTriangle } from "lucide-react";
import { AGENTS } from "@/lib/constants";
import { useFederalData } from "@/lib/FederalDataContext";
import { printReport } from "@/lib/exportFile";
import { PageEnter, Stagger, StaggerItem, CountUp, ChartReveal } from "@/components/motion";
import { AIAnalysisPanel } from "@/components/ai/AIAnalysis";
import {
  CAPABILITY_BANDS,
  FEDERAL,
  NATIONAL_TARGET,
  ON_TRACK_READINESS,
  READINESS_TRAJECTORY,
  competencyLabel,
  nationalGaps,
} from "@/lib/federal";

const CHART_ENTITY_COUNT = 8;

const SECTORS: Record<string, string> = {
  mohap: "Health & Wellbeing",
  moe: "Education",
  econ: "Economy & Trade",
  mohre: "Society & Talent",
  moccae: "Infrastructure",
  moei: "Infrastructure",
  moiat: "Economy & Trade",
  dgov: "Technology",
  mofa: "Security & Law",
  moi: "Security & Law",
  moj: "Security & Law",
  mocd: "Society & Talent",
  mccy: "Society & Talent",
  mof: "Economy & Trade"
};

export default function LeadershipDashboard() {
  const [, setLocation] = useLocation();
  const { ministries, submissions } = useFederalData();

  const [period, setPeriod] = useState("all");
  const [grouping, setGrouping] = useState("entity");
  const [showTarget, setShowTarget] = useState(true);

  const champions = CAPABILITY_BANDS.find((b) => b.level.id === "champion")?.count ?? 0;
  const gaps = useMemo(() => nationalGaps(), []);

  const compliance = submissions.length
    ? Math.round((submissions.filter((s) => s.governanceStatus === "Compliant").length / submissions.length) * 100)
    : 100;

  const latest = READINESS_TRAJECTORY[READINESS_TRAJECTORY.length - 1];
  const previous = READINESS_TRAJECTORY[READINESS_TRAJECTORY.length - 2];
  const quarterChange = latest.readiness - previous.readiness;

  const strategicKPIs = [
    {
      label: "National AI Readiness",
      value: FEDERAL.readiness,
      suffix: "%",
      change: `${quarterChange >= 0 ? "+" : ""}${quarterChange}pts QoQ`,
      icon: TrendingUp,
    },
    {
      label: "Workforce Coverage",
      value: FEDERAL.coverage,
      suffix: "%",
      subtitle: `${FEDERAL.activeLearners.toLocaleString()} of ${FEDERAL.employees.toLocaleString()}`,
      icon: Users,
    },
    {
      label: "Capability Champions",
      value: champions,
      subtitle: "Level 5 achievers",
      icon: Award,
    },
    {
      label: "Est. Annual Value",
      value: FEDERAL.valueCreatedAedM,
      prefix: "AED ",
      suffix: "M",
      subtitle: "Delivered outcomes",
      decimals: 1,
      icon: DollarSign,
    },
    {
      label: "Ministries On Track",
      value: FEDERAL.ministriesOnTrack,
      suffix: `/${FEDERAL.ministriesTotal}`,
      subtitle: `>=${ON_TRACK_READINESS}% readiness`,
      icon: Building2,
    },
    {
      label: "Responsible AI Compliance",
      value: compliance,
      suffix: "%",
      subtitle: "Framework adherence",
      icon: Shield,
    },
  ];

  const filteredTrajectory = useMemo(() => {
    if (period === 'all') return READINESS_TRAJECTORY;
    if (period === 'ytd') return READINESS_TRAJECTORY.slice(-3);
    if (period === 'latest') return READINESS_TRAJECTORY.slice(-1);
    return READINESS_TRAJECTORY;
  }, [period]);

  const chartData = useMemo(() => {
    if (grouping === 'entity') {
      return [...ministries]
        .sort((a, b) => b.readiness - a.readiness)
        .slice(0, CHART_ENTITY_COUNT)
        .map(m => ({ id: m.id, label: m.shortName, readiness: m.readiness }));
    } else {
      const sectors: Record<string, { read: number, emp: number }> = {};
      for (const m of ministries) {
        const sec = SECTORS[m.id] || "Other";
        if (!sectors[sec]) sectors[sec] = { read: 0, emp: 0 };
        sectors[sec].read += m.readiness * m.employees;
        sectors[sec].emp += m.employees;
      }
      return Object.entries(sectors)
        .map(([sec, data]) => ({ id: sec, label: sec, readiness: Math.round(data.read / data.emp) }))
        .sort((a, b) => b.readiness - a.readiness);
    }
  }, [ministries, grouping]);

  const strongest = [...ministries].sort((a, b) => b.readiness - a.readiness).slice(0, 3);
  const topGap = gaps[0];
  const championShare = champions
    ? Math.round((strongest.reduce((a, m) => a + m.credentialsIssued, 0) / Math.max(FEDERAL.credentialsIssued, 1)) * 100)
    : 0;

  const handlePrintBrief = () => {
    printReport({
      title: "Federal Executive Brief",
      subtitle: `National AI Readiness & Strategic Outcomes — ${latest.quarter}`,
      meta: [
        `Target: ${NATIONAL_TARGET.readiness}% by ${NATIONAL_TARGET.by}`,
        `Entities in scope: ${FEDERAL.ministriesTotal}`,
        `Workforce coverage: ${FEDERAL.coverage}%`
      ],
      sections: [
        {
          heading: "Strategic Priorities",
          facts: [
            { label: "National Readiness", value: `${FEDERAL.readiness}%` },
            { label: "Active Learners", value: FEDERAL.activeLearners.toLocaleString() },
            { label: "Capability Champions", value: champions.toLocaleString() },
            { label: "Value Created", value: `AED ${FEDERAL.valueCreatedAedM}M` }
          ]
        },
        {
          heading: "National Capability Gaps",
          table: {
            headers: ["Capability Gap", "Affected Ministries", "Trend"],
            rows: gaps.map(g => [g.competency.label, String(g.ministries), g.trend.charAt(0).toUpperCase() + g.trend.slice(1)])
          }
        },
        {
          heading: "Top Performing Entities",
          table: {
            headers: ["Entity", "Readiness", "Value Created"],
            rows: strongest.map(m => [m.name, `${m.readiness}%`, `AED ${m.valueCreatedAedM}M`])
          }
        }
      ],
      footnote: "Generated from the live federal platform session."
    });
  };

  return (
    <Layout role="leadership">
      <PageEnter className="space-y-8 pb-12">
        <PageHeader
          bordered
          title="National Workforce Readiness"
          description="Federal Leadership Consolidated View"
          actions={
            <Button variant="outline" onClick={handlePrintBrief}>
              Download Executive Brief
            </Button>
          }
        />

        <Stagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {strategicKPIs.map((kpi, i) => (
            <StaggerItem key={i}>
              <StatCard className="h-full">
                <CardContent className="p-5 space-y-2 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <kpi.icon className="w-5 h-5 text-primary" />
                    {kpi.change && (
                      <span className="text-xs font-semibold text-primary">
                        {kpi.change}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto">
                    <p className="text-3xl font-bold text-foreground" data-testid={`kpi-${i}`}>
                      <CountUp to={kpi.value as number} decimals={kpi.decimals ?? 0} prefix={kpi.prefix} suffix={kpi.suffix} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                    {kpi.subtitle && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{kpi.subtitle}</p>
                    )}
                  </div>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-6 bg-muted/30 p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Period:</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px] h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quarters</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="latest">Latest Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Grouping:</label>
            <Select value={grouping} onValueChange={setGrouping}>
              <SelectTrigger className="w-[160px] h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entity">By Entity</SelectItem>
                <SelectItem value="sector">By Sector</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <Checkbox id="target-toggle" checked={showTarget} onCheckedChange={(checked) => setShowTarget(!!checked)} />
            <label htmlFor="target-toggle" className="text-sm font-medium text-foreground cursor-pointer select-none">
              Show Target Line
            </label>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">National AI Readiness Trajectory</CardTitle>
            <CardDescription>
              Quarterly progress toward federal AI transformation target ({NATIONAL_TARGET.readiness}% by {NATIONAL_TARGET.by})
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ChartReveal className="h-full" direction="wipe">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredTrajectory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="quarter" 
                    fontSize={12} 
                    axisLine={false} 
                    tickLine={false}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    fontSize={12} 
                    axisLine={false} 
                    tickLine={false}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)'
                    }} 
                  />
                  {showTarget && (
                    <ReferenceLine 
                      y={NATIONAL_TARGET.readiness} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5" 
                      label={{ value: `Target ${NATIONAL_TARGET.readiness}%`, position: 'insideTopRight', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="readiness" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Actual Readiness"
                  />
                  {showTarget && (
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Planned Target"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartReveal>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Cross-{grouping === 'entity' ? 'Ministry' : 'Sector'} AI Readiness</CardTitle>
              <CardDescription>
                Comparative readiness scores across federal {grouping === 'entity' ? 'entities' : 'sectors'}
                {grouping === 'entity' && (
                  <span className="block mt-1 text-xs text-muted-foreground/80">
                    Click a bar to jump directly into the FAHR detail view.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[380px]">
              <ChartReveal className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    layout="vertical" 
                    margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      dataKey="label" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      width={140} 
                      fontSize={11}
                      stroke="hsl(var(--foreground))"
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    />
                    <Bar 
                      dataKey="readiness" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]} 
                      barSize={18}
                      className={grouping === 'entity' ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
                      onClick={(data: any) => {
                        if (grouping === 'entity' && data?.payload?.id) {
                          setLocation(`/fahr?ministry=${data.payload.id}`);
                        }
                      }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 3 ? "hsl(var(--primary))" : "hsl(var(--secondary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartReveal>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">National Capability Distribution</CardTitle>
              <CardDescription>
                Federal workforce spread across the unified AI capability ladder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <Stagger as="div" gap={0.1}>
                {CAPABILITY_BANDS.map((band, i) => (
                  <StaggerItem key={band.level.id}>
                    <div className="space-y-1.5 py-1" data-testid={`band-${band.level.id}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{band.level.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">{band.count.toLocaleString()}</span>
                          <span className="font-bold text-primary w-10 text-end">{band.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-700 ease-out" 
                          style={{ 
                            width: `${band.percentage}%`,
                            backgroundColor: `hsl(var(--chart-${(i % 5) + 1}))`
                          }}
                        />
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
              <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                Total active learners:{" "}
                <span className="font-semibold text-foreground" data-testid="text-total-learners">
                  {FEDERAL.activeLearners.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <AIAnalysisPanel
          agent={AGENTS.analytics}
          title="National-Level Insights"
          sources={`${FEDERAL.ministriesTotal} entities`}
          steps={[
            "Compiling cross-ministry readiness data",
            "Identifying primary capability gaps",
            "Analysing credential distribution",
            "Formulating strategic recommendation"
          ]}
          runKey={`${period}-${grouping}-${showTarget}`}
          className="bg-primary/5 border-primary/20"
        >
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold text-foreground">Insight 1:</span> Readiness is strongest in{" "}
              {strongest.map((m) => m.shortName).join(", ")} ({strongest[0]?.readiness}% at the top), with momentum
              concentrated in policy-heavy functions.
            </p>
            <p>
              <span className="font-semibold text-foreground">Insight 2:</span> The largest capability gap is{" "}
              {topGap ? competencyLabel(topGap.competency.id) : "—"}, named as the top gap by{" "}
              {topGap?.ministries ?? 0} of {FEDERAL.ministriesTotal} entities.
            </p>
            <p>
              <span className="font-semibold text-foreground">Insight 3:</span> Credentialing is uneven —{" "}
              {championShare}% of all issued credentials sit in the three strongest entities, limiting cross-entity
              knowledge transfer.
            </p>
            <p>
              <span className="font-semibold text-primary">Recommendation:</span> Launch a federal challenge on{" "}
              {topGap ? competencyLabel(topGap.competency.id) : "capability transfer"}, pairing high-performing
              ministries with the {FEDERAL.ministriesTotal - FEDERAL.ministriesOnTrack} entities below the{" "}
              {ON_TRACK_READINESS}% threshold.
            </p>
          </div>
        </AIAnalysisPanel>

      </PageEnter>
    </Layout>
  );
}
