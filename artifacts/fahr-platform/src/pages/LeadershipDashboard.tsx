import React from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Users, Award, DollarSign, Shield, Building2, Bot, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CAPABILITY_LEVELS, AGENTS } from "@/lib/constants";

export default function LeadershipDashboard() {
  const { toast } = useToast();

  const strategicKPIs = [
    { label: "National AI Readiness", value: "64%", change: "+6pts QoQ", trend: "up", icon: TrendingUp },
    { label: "Workforce Coverage", value: "52%", subtitle: "41,850 of 80,000", icon: Users },
    { label: "Capability Champions", value: "1,240", subtitle: "Level 5 achievers", icon: Award },
    { label: "Est. Annual Value", value: "AED 72M", subtitle: "Delivered outcomes", icon: DollarSign },
    { label: "Ministries On Track", value: "9/14", subtitle: ">=65% readiness", icon: Building2 },
    { label: "Responsible AI Compliance", value: "97%", subtitle: "Framework adherence", icon: Shield },
  ];

  const readinessTrendData = [
    { quarter: "Q3 2025", readiness: 41, target: 50 },
    { quarter: "Q4 2025", readiness: 48, target: 55 },
    { quarter: "Q1 2026", readiness: 55, target: 60 },
    { quarter: "Q2 2026", readiness: 59, target: 65 },
    { quarter: "Q3 2026", readiness: 64, target: 70 },
  ];

  const ministryReadinessData = [
    { ministry: "Economy", readiness: 82 },
    { ministry: "Human Resources", readiness: 75 },
    { ministry: "Education", readiness: 71 },
    { ministry: "Health and Prevention", readiness: 68 },
    { ministry: "Climate Change & Environment", readiness: 66 },
    { ministry: "Foreign Affairs", readiness: 63 },
    { ministry: "Interior", readiness: 59 },
    { ministry: "Justice", readiness: 55 },
  ];

  const capabilityDistribution = [
    { level: CAPABILITY_LEVELS[0].label, count: 8420, percentage: 20 },
    { level: CAPABILITY_LEVELS[1].label, count: 12555, percentage: 30 },
    { level: CAPABILITY_LEVELS[2].label, count: 14610, percentage: 35 },
    { level: CAPABILITY_LEVELS[3].label, count: 5025, percentage: 12 },
    { level: CAPABILITY_LEVELS[4].label, count: 1240, percentage: 3 },
  ];

  const nationalRisks = [
    { gap: "AI Workflow Automation", affectedMinistries: 8, trend: "rising" },
    { gap: "Data Literacy & Analytics", affectedMinistries: 6, trend: "stable" },
    { gap: "Responsible AI Review", affectedMinistries: 4, trend: "declining" },
  ];

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
                description: "Q3 2026 national readiness report prepared."
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
                  <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
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
              Quarterly progress toward federal AI transformation target (75% by Q2 2027)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readinessTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  y={75} 
                  stroke="hsl(var(--chart-5))" 
                  strokeDasharray="5 5" 
                  label={{ value: 'Target 75%', position: 'right', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
              {capabilityDistribution.map((level, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{level.level}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{level.count.toLocaleString()}</span>
                      <span className="font-bold text-primary w-10 text-right">{level.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${level.percentage}%`,
                        backgroundColor: `hsl(var(--chart-${(i % 5) + 1}))`
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                Total active learners: <span className="font-semibold text-foreground">41,850</span>
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
                <span className="font-semibold text-foreground">Insight 1:</span> Readiness growth is strongest in Economy, Climate, and HR clusters (+12-14pts QoQ). Momentum concentrated in policy-heavy functions.
              </p>
              <p>
                <span className="font-semibold text-foreground">Insight 2:</span> Capability gap in AI workflow automation affects 8 ministries, particularly legal and judicial entities.
              </p>
              <p>
                <span className="font-semibold text-foreground">Insight 3:</span> Champion-level practitioners (Level 5) distribution is uneven — 60% concentrated in 3 ministries, limiting cross-entity knowledge transfer.
              </p>
              <p>
                <span className="font-semibold text-primary">Recommendation:</span> Launch a federal AI Workflow Challenge in Q4 2026, pairing high-performing ministries with lagging entities to accelerate capability transfer and close automation gaps.
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
                {nationalRisks.map((risk) => (
                  <TableRow key={risk.gap}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-chart-5" />
                      {risk.gap}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{risk.affectedMinistries}</TableCell>
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
