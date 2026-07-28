import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, Bot, Zap, Clock, Rocket, Search, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AGENTS } from "@/lib/constants";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  MINISTRY_BY_ID,
  TWIN_ADOPTION,
  competencyLabel,
  cohortsOf,
  ministryRollup,
  peopleOfMinistry,
} from "@/lib/federal";

export default function MinistryDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([]);
  const { focus, ministries, submissions } = useFederalData();

  const ministry = ministries.find((m) => m.id === focus.ministryId) ?? MINISTRY_BY_ID[focus.ministryId];
  const rollup = useMemo(() => ministryRollup(focus.ministryId), [focus.ministryId]);
  const departmentData = rollup?.departments ?? [];
  const cohorts = useMemo(() => cohortsOf(focus.ministryId), [focus.ministryId]);

  /** Projects from this entity that still need an entity decision. */
  const pendingEntityReview = submissions.filter(
    (s) => s.ministryId === focus.ministryId && (s.state === "awaiting_entity" || s.state === "awaiting_manager"),
  );

  const kpis = [
    { label: "Total Employees", value: ministry.employees.toLocaleString(), icon: Users, color: "text-primary" },
    { label: "Active Learners", value: ministry.activeLearners.toLocaleString(), icon: Search, color: "text-secondary" },
    { label: "AI Readiness Index", value: `${ministry.readiness}%`, icon: Zap, color: "text-accent" },
    { label: "AI Digital Twins", value: ministry.twins.toLocaleString(), icon: Bot, color: "text-[hsl(var(--chart-4))]" },
    { label: "Projects Submitted", value: ministry.projectsSubmitted.toLocaleString(), icon: Rocket, color: "text-[hsl(var(--chart-5))]" },
    { label: "Est. Hours Saved/Mo", value: ministry.hoursSavedPerMonth.toLocaleString(), icon: Clock, color: "text-[hsl(var(--chart-3))]" },
  ];

  const readinessChartData = departmentData.map((d) => ({ name: d.name.split(" ")[0], score: d.readiness }));

  const twinAdoptionData = useMemo(
    () => TWIN_ADOPTION.map((point, index) =>
      index === TWIN_ADOPTION.length - 1 ? { ...point, twins: ministry.twins } : point,
    ),
    [ministry.twins],
  );

  /** Insight cards read the entity's own signals rather than a fixed script. */
  const weakestDepartment = [...departmentData].sort((a, b) => a.readiness - b.readiness)[0];
  const atRiskCount = peopleOfMinistry(focus.ministryId).filter(
    (p) => p.status === "at-risk" || p.status === "needs-attention",
  ).length;
  const fastestCohort = [...cohorts]
    .filter((c) => c.status === "Active")
    .sort((a, b) => b.progress - a.progress)[0];
  const slowestCohort = [...cohorts]
    .filter((c) => c.status === "Active")
    .sort((a, b) => a.progress - b.progress)[0];

  const handleApplyRecommendation = (id: string, action: string) => {
    setAppliedRecommendations(prev => [...prev, id]);
    toast({
      title: "Action Applied",
      description: `Successfully executed: ${action}`,
    });
  };

  return (
    <Layout role="ministry">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader
          tone="primary"
          className="mb-2"
          title={ministry.name}
          description="Ministry Admin Dashboard"
          actions={
            <>
              <Button variant="outline" onClick={() => toast({ title: "Report Generating", description: "Capability gap report is being generated." })}>
                View Capability Gaps
              </Button>
              <Button onClick={() => setLocation('/ministry/portfolio')} data-testid="button-review-projects">
                Review Projects ({pendingEntityReview.length})
              </Button>
            </>
          }
        />

        {/* AI Analytics Assistant Panel */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3 flex flex-row items-start gap-4 space-y-0">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {AGENTS.analytics} Insights
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Live Analysis</Badge>
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Continuous monitoring of workforce adoption and performance.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background rounded-md p-4 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-semibold text-sm">At-Risk Learners</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {atRiskCount} tracked staff in {weakestDepartment?.name ?? "the entity"} are behind the pathway
                    baseline — the department sits at {weakestDepartment?.readiness ?? 0}% readiness, the lowest here.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={appliedRecommendations.includes("rec-1")}
                  onClick={() => handleApplyRecommendation("rec-1", "Send automated check-in via AI Learning Coach")}
                >
                  {appliedRecommendations.includes("rec-1") ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Triggered</> : "Send Coach Check-in"}
                </Button>
              </div>

              <div className="bg-background rounded-md p-4 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold text-sm">Cohort Comparison</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {fastestCohort
                      ? `${fastestCohort.name} is at ${fastestCohort.progress}% completion${
                          slowestCohort && slowestCohort.id !== fastestCohort.id
                            ? `, ahead of ${slowestCohort.name} on ${slowestCohort.progress}%`
                            : ""
                        }. Recommend sharing their templates.`
                      : "No active cohorts to compare yet."}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={appliedRecommendations.includes("rec-2")}
                  onClick={() => handleApplyRecommendation("rec-2", `Publish ${fastestCohort?.name ?? "cohort"} templates to internal marketplace`)}
                >
                  {appliedRecommendations.includes("rec-2") ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Published</> : "Publish Templates"}
                </Button>
              </div>

              <div className="bg-background rounded-md p-4 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-accent">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold text-sm">Action Recommended</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {pendingEntityReview.length} workplace projects are awaiting a decision. The entity's biggest gap
                    remains {competencyLabel(ministry.topGapCompetencyId)}.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={appliedRecommendations.includes("rec-3")}
                  onClick={() => handleApplyRecommendation("rec-3", `Assign fast-track review to ${AGENTS.analytics}`)}
                >
                  {appliedRecommendations.includes("rec-3") ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Fast-Tracked</> : "Fast-Track Review"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <kpi.icon className={`w-6 h-6 mb-2 ${kpi.color}`} />
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Readiness by Department</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readinessChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Digital Twin Adoption Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={twinAdoptionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="twins" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Department Capability Overview</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => toast({ title: "Export Started", description: "Your CSV is downloading." })}>
              Export Report
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="text-right">Readiness Score</TableHead>
                    <TableHead className="text-right">Digital Twins</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Est. Hours Saved</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentData.map((dept) => (
                    <TableRow key={dept.id} data-testid={`row-department-${dept.id}`}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-right">{dept.employees.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{dept.readiness}%</TableCell>
                      <TableCell className="text-right">{dept.twins.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{dept.projects}</TableCell>
                      <TableCell className="text-right">{dept.hoursSavedPerMonth.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={dept.risk === 'High' ? 'destructive' : dept.risk === 'Medium' ? 'secondary' : 'outline'} className={dept.risk === 'Low' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                          {dept.risk} Gap
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
