import React, { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Users, Award, DollarSign, Shield, Building2, Bot, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AGENTS } from "@/lib/constants";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  CAPABILITY_BANDS,
  FEDERAL,
  NATIONAL_TARGET,
  ON_TRACK_READINESS,
  READINESS_TRAJECTORY,
  competencyLabel,
  nationalGaps,
} from "@/lib/federal";

/** Ministries shown in the comparison chart, highest readiness first. */
const CHART_ENTITY_COUNT = 8;

export default function LeadershipDashboard() {
  const { toast } = useToast();
  const { ministries, submissions } = useFederalData();

  const champions = CAPABILITY_BANDS.find((b) => b.level.id === "champion")?.count ?? 0;
  const gaps = useMemo(() => nationalGaps(), []);

  /** Compliance reads the live portfolio rather than a fixed headline. */
  const compliance = submissions.length
    ? Math.round((submissions.filter((s) => s.governanceStatus === "Compliant").length / submissions.length) * 100)
    : 100;

  const latest = READINESS_TRAJECTORY[READINESS_TRAJECTORY.length - 1];
  const previous = READINESS_TRAJECTORY[READINESS_TRAJECTORY.length - 2];
  const quarterChange = latest.readiness - previous.readiness;

  const strategicKPIs = [
    {
      label: "National AI Readiness",
      value: `${FEDERAL.readiness}%`,
      change: `${quarterChange >= 0 ? "+" : ""}${quarterChange}pts QoQ`,
      icon: TrendingUp,
    },
    {
      label: "Workforce Coverage",
      value: `${FEDERAL.coverage}%`,
      subtitle: `${FEDERAL.activeLearners.toLocaleString()} of ${FEDERAL.employees.toLocaleString()}`,
      icon: Users,
    },
    {
      label: "Capability Champions",
      value: champions.toLocaleString(),
      subtitle: "Level 5 achievers",
      icon: Award,
    },
    {
      label: "Est. Annual Value",
      value: `AED ${FEDERAL.valueCreatedAedM}M`,
      subtitle: "Delivered outcomes",
      icon: DollarSign,
    },
    {
      label: "Ministries On Track",
      value: `${FEDERAL.ministriesOnTrack}/${FEDERAL.ministriesTotal}`,
      subtitle: `>=${ON_TRACK_READINESS}% readiness`,
      icon: Building2,
    },
    {
      label: "Responsible AI Compliance",
      value: `${compliance}%`,
      subtitle: "Framework adherence",
      icon: Shield,
    },
  ];

  const ministryReadinessData = useMemo(
    () =>
      [...ministries]
        .sort((a, b) => b.readiness - a.readiness)
        .slice(0, CHART_ENTITY_COUNT)
        .map((m) => ({ ministry: m.shortName, readiness: m.readiness })),
    [ministries],
  );

  const strongest = [...ministries].sort((a, b) => b.readiness - a.readiness).slice(0, 3);
  const topGap = gaps[0];
  const championShare = champions
    ? Math.round(
        (strongest.reduce((a, m) => a + m.credentialsIssued, 0) /
          Math.max(FEDERAL.credentialsIssued, 1)) * 100,
      )
    : 0;

  return (
    <Layout role="leadership">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Page Header */}
        <PageHeader
          bordered
          title="National Workforce Readiness"
          description="Federal Leadership Consolidated View"
          actions={
            <Button
              variant="outline"
              onClick={() => toast({
                title: "Executive Brief Downloading",
                description: `${latest.quarter} national readiness report prepared.`
              })}
            >
              Download Executive Brief
            </Button>
          }
        />

        {/* Strategic KPI Band */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {strategicKPIs.map((kpi, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <kpi.icon className="w-5 h-5 text-primary" />
                  {kpi.change && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 font-medium">
                      {kpi.change}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground" data-testid={`kpi-${i}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                  {kpi.subtitle && (
                    <p className="text-xs text-muted-foreground/70 mt-1">{kpi.subtitle}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Readiness Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">National AI Readiness Trajectory</CardTitle>
            <CardDescription>
              Quarterly progress toward federal AI transformation target ({NATIONAL_TARGET.readiness}% by {NATIONAL_TARGET.by})
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={READINESS_TRAJECTORY} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }} 
                />
                <ReferenceLine 
                  y={NATIONAL_TARGET.readiness} 
                  stroke="hsl(var(--chart-5))" 
                  strokeDasharray="5 5" 
                  label={{ value: `Target ${NATIONAL_TARGET.readiness}%`, position: 'right', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="readiness" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                  name="Actual Readiness"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Planned Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cross-Ministry Comparison + Capability Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Cross-Ministry AI Readiness</CardTitle>
              <CardDescription>
                Comparative readiness scores across federal entities
                <span className="block mt-2 text-xs text-muted-foreground/80">
                  Detailed drill-down available in the FAHR Programme portal
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={ministryReadinessData} 
                  layout="vertical" 
                  margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="ministry" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={140} 
                    fontSize={11}
                    stroke="hsl(var(--foreground))"
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar 
                    dataKey="readiness" 
                    fill="hsl(var(--chart-1))" 
                    radius={[0, 4, 4, 0]} 
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
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
              {CAPABILITY_BANDS.map((band, i) => (
                <div key={band.level.id} className="space-y-1.5" data-testid={`band-${band.level.id}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{band.level.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{band.count.toLocaleString()}</span>
                      <span className="font-bold text-primary w-10 text-right">{band.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${band.percentage}%`,
                        backgroundColor: `hsl(var(--chart-${(i % 5) + 1}))`
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                Total active learners:{" "}
                <span className="font-semibold text-foreground" data-testid="text-total-learners">
                  {FEDERAL.activeLearners.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategic AI Insights */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-start">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg shrink-0 flex items-center justify-center">
              <Bot className="w-7 h-7" />
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-primary text-base">{AGENTS.analytics} — National-Level Insights</p>
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
          </CardContent>
        </Card>

        {/* National Risk & Priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">National Capability Gaps & Strategic Priorities</CardTitle>
            <CardDescription>
              Top workforce readiness challenges requiring federal coordination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capability Gap</TableHead>
                  <TableHead className="text-right">Affected Ministries</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gaps.map((risk) => (
                  <TableRow key={risk.competency.id} data-testid={`row-gap-${risk.competency.id}`}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-chart-5" />
                      {risk.competency.label}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{risk.ministries}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant="outline" 
                        className={
                          risk.trend === 'rising' 
                            ? 'bg-red-500/10 text-red-700 border-red-500/20' 
                            : risk.trend === 'declining'
                            ? 'bg-green-500/10 text-green-700 border-green-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }
                      >
                        {risk.trend === 'rising' ? '↑ Rising' : risk.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
