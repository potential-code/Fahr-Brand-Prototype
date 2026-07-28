import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { CAPABILITY_LEVELS, AGENTS } from "@/lib/constants";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  LEVEL_BY_ID,
  SUBMISSION_STATE_LABEL,
  competencyLabel,
  filterSubmissions,
  type LearnerStatus,
  type Person,
} from "@/lib/federal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, TrendingUp, AlertCircle, Send, CheckCircle2, BrainCircuit, Target, Activity, Shield, ChevronRight, UserCircle, ClipboardCheck, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const LEVEL_FILL = [
  "hsl(var(--muted-foreground))",
  "hsl(var(--secondary))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-4))",
];

/** Days since a person was last active, from the "N days ago" style the roster uses. */
function daysSince(lastActive: string): number {
  const match = lastActive.match(/(\d+)\s+day/);
  if (match) return Number(match[1]);
  return 0;
}

export default function ManagerDashboard() {
  const { toast } = useToast();
  const {
    focus,
    teamOf,
    submissions,
    credentials,
    live,
    signOff,
    requestRevision,
    approvalsFor,
    getPerson,
  } = useFederalData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const manager = getPerson(focus.managerId);
  const team = teamOf(focus.managerId);
  const selectedEmployee = selectedId ? team.find((p) => p.id === selectedId) ?? null : null;

  const teamIds = useMemo(() => new Set(team.map((p) => p.id)), [team]);

  /** Every workplace project from this team, newest decision first in the queue. */
  const teamSubmissions = useMemo(
    () => submissions.filter((s) => teamIds.has(s.personId)),
    [submissions, teamIds],
  );
  const awaitingSignOff = useMemo(
    () => filterSubmissions(teamSubmissions, { state: "awaiting_manager" }),
    [teamSubmissions],
  );

  const avgProgress = team.length
    ? Math.round(team.reduce((a, p) => a + p.pathwayProgress, 0) / team.length)
    : 0;
  const practitionersOrAbove = team.filter((p) => (LEVEL_BY_ID[p.levelId]?.order ?? 0) >= 3).length;
  const teamCredentials = credentials.filter((c) => teamIds.has(c.personId)).length;

  const capabilityDistribution = CAPABILITY_LEVELS.map((level, index) => ({
    name: level.label.replace("Emerging Practitioner", "Emerging"),
    count: team.filter((p) => p.levelId === level.id).length,
    fill: LEVEL_FILL[index],
  }));

  /**
   * Insights read the team's live signals rather than a fixed script: whoever
   * is furthest behind, and whoever is furthest ahead.
   */
  const insights = useMemo(() => {
    const items: {
      id: string;
      person: Person;
      message: string;
      context: string;
      urgency: "high" | "low";
      actionLabel: string;
    }[] = [];
    const atRisk = [...team]
      .filter((p) => p.status === "at-risk" || p.status === "needs-attention")
      .sort((a, b) => a.pathwayProgress - b.pathwayProgress)[0];
    if (atRisk) {
      const days = daysSince(atRisk.lastActive);
      items.push({
        id: `insight-risk-${atRisk.id}`,
        person: atRisk,
        message: atRisk.status === "at-risk" ? "High risk of disengagement" : "Falling behind the cohort",
        context: `${atRisk.pathwayProgress}% of the learning pathway complete, last active ${atRisk.lastActive}. The rest of the team averages ${avgProgress}%.`,
        urgency: "high",
        actionLabel: "Send Nudge",
      });
    }
    const excelling = [...team].sort((a, b) => b.pathwayProgress - a.pathwayProgress)[0];
    if (excelling && excelling.id !== atRisk?.id) {
      items.push({
        id: `insight-mentor-${excelling.id}`,
        person: excelling,
        message: "Ready for a mentorship role",
        context: `${LEVEL_BY_ID[excelling.levelId]?.label ?? excelling.levelId} at ${excelling.pathwayProgress}% pathway completion with an assessment score of ${excelling.assessmentScore}. Recommend assigning as a peer mentor.`,
        urgency: "low",
        actionLabel: "Assign Role",
      });
    }
    return items;
  }, [team, avgProgress]);

  const handleAction = (action: string, subject: string) => {
    toast({ title: `Action: ${action}`, description: `Successfully executed for ${subject}.` });
  };

  const handleSignOff = (submissionId: string, title: string) => {
    signOff(submissionId, { by: manager?.name ?? "Line Manager" });
    toast({
      title: "Signed off",
      description: `"${title}" now sits with the entity admin for endorsement.`,
    });
  };

  const handleRevision = (submissionId: string, title: string) => {
    requestRevision(submissionId, {
      by: manager?.name ?? "Line Manager",
      note: "Strengthen the measured impact before resubmitting.",
    });
    toast({
      title: "Revision requested",
      description: `"${title}" has gone back to the learner with your note.`,
    });
  };

  const getStatusBadge = (status: LearnerStatus) => {
    switch (status) {
      case 'on-track': return <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">On Track</Badge>;
      case 'excelling': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Excelling</Badge>;
      case 'needs-attention': return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/25">Needs Attention</Badge>;
      case 'at-risk': return <Badge variant="destructive" className="shadow-none">At Risk</Badge>;
      default: return null;
    }
  };

  return (
    <Layout role="manager">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full pb-12">
        
        {/* Header Section */}
        <PageHeader
          tone="primary"
          className="mb-4"
          title="Team Readiness Dashboard"
          description="Monitor your team's progression through the federal Agentic AI capability ladder."
          actions={
            <Button variant="outline" className="gap-2 shrink-0 bg-background" onClick={() => handleAction("Generate Report", "Team")}>
              <TrendingUp className="w-4 h-4" /> Generate Department Report
            </Button>
          }
        />

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <Badge variant="secondary" className="font-normal text-xs">Active Cohort</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground" data-testid="text-team-size">{team.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Direct Reports enrolled</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <Activity className="w-5 h-5 text-muted-foreground" />
                <Badge variant="outline" className="bg-secondary/10 text-secondary border-none font-normal text-xs">Team average</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground" data-testid="text-avg-progress">{avgProgress}%</p>
              <p className="text-sm text-muted-foreground mt-1">Avg. Pathway Completion</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">{practitionersOrAbove}</p>
              <p className="text-sm text-muted-foreground mt-1">Practitioners or above</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">{teamCredentials}</p>
              <p className="text-sm text-muted-foreground mt-1">Verified Credentials Earned</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Charts and Insights */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* AI Insights Panel */}
            <Card className="border-accent/30 bg-gradient-to-br from-card to-accent/5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <BrainCircuit className="w-32 h-32 text-accent" />
              </div>
              <CardHeader className="pb-3 border-b border-border/50 bg-background/50 backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                   <BrainCircuit className="w-5 h-5 text-accent" />
                   {AGENTS.analytics} Insights
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 relative z-10">
                {insights.map(insight => (
                  <div key={insight.id} className="flex flex-col p-4 bg-background border border-border/50 rounded-lg shadow-sm hover-elevate transition-all">
                     <div className="flex items-start gap-3 mb-3">
                       <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${insight.urgency === 'high' ? 'text-destructive' : 'text-primary'}`} />
                       <div>
                         <p className="font-semibold text-sm text-foreground">{insight.person.name}</p>
                         <p className="font-medium text-xs text-foreground mt-0.5">{insight.message}</p>
                         <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.context}</p>
                       </div>
                     </div>
                     <Button 
                       size="sm" 
                       variant={insight.urgency === 'high' ? 'default' : 'secondary'} 
                       className="w-full gap-2 text-xs h-8"
                       onClick={() => handleAction(insight.actionLabel, insight.person.name)}
                     >
                        <Send className="w-3 h-3" /> {insight.actionLabel}
                     </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Distribution Chart */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Team Capability Distribution</CardTitle>
                <CardDescription>Spread across the unified ladder</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={capabilityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <RechartsTooltip 
                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {capabilityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: sign-off queue and direct reports */}
          <div className="lg:col-span-2 space-y-8">

            {/* Workplace projects waiting on this manager */}
            <Card className="border-border shadow-sm">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Awaiting Your Sign-off</CardTitle>
                    <CardDescription>Workplace projects your team has submitted for validation</CardDescription>
                  </div>
                  <Badge variant={awaitingSignOff.length > 0 ? "default" : "secondary"} data-testid="badge-signoff-count">
                    {awaitingSignOff.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {awaitingSignOff.length === 0 ? (
                  <div className="px-6 py-8 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Nothing is waiting on you. Projects you have already decided on continue through the entity
                      and federal review chain.
                    </p>
                    {teamSubmissions.length > 0 && (
                      <ul className="space-y-2">
                        {teamSubmissions.slice(0, 3).map((s) => (
                          <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium text-foreground truncate">{s.title}</span>
                            <Badge variant="outline" className="shrink-0 font-normal">
                              {SUBMISSION_STATE_LABEL[s.state]}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {awaitingSignOff.map((s) => {
                      const owner = getPerson(s.personId);
                      return (
                        <li key={s.id} className="px-6 py-4 space-y-3" data-testid={`submission-${s.id}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">{s.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {owner?.name ?? "Team member"} · submitted {s.submittedOn}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.metrics}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 font-normal">
                              {s.impact} impact
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => handleSignOff(s.id, s.title)}
                              data-testid={`button-sign-off-${s.id}`}
                            >
                              <ClipboardCheck className="w-4 h-4" /> Sign off
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => handleRevision(s.id, s.title)}
                              data-testid={`button-request-revision-${s.id}`}
                            >
                              <RotateCcw className="w-4 h-4" /> Request revision
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm flex flex-col">
              <CardHeader className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Direct Reports</CardTitle>
                    <CardDescription>Manage individual development journeys</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[250px]">Employee</TableHead>
                      <TableHead>Current Capability</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-muted/10" data-testid={`row-team-${employee.id}`}>
                        <TableCell>
                          <div className="font-semibold text-foreground">{employee.name}</div>
                          <div className="text-xs text-muted-foreground">{employee.role}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{LEVEL_BY_ID[employee.levelId]?.label ?? employee.levelId}</span>
                        </TableCell>
                        <TableCell>
                          <div className="w-[100px] flex flex-col gap-1.5">
                            <Progress value={employee.pathwayProgress} className="h-1.5" />
                            <span className="text-[10px] text-muted-foreground text-right" data-testid={`text-progress-${employee.id}`}>
                              {employee.pathwayProgress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(employee.status)}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm" onClick={() => setSelectedId(employee.id)} data-testid={`button-view-${employee.id}`}>
                             View <ChevronRight className="w-4 h-4 ml-1" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Employee Detail Sheet */}
      <Sheet open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedEmployee && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UserCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl">{selectedEmployee.name}</SheetTitle>
                    <SheetDescription className="text-base">{selectedEmployee.role}</SheetDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedEmployee.status)}
                  <Badge variant="secondary" className="font-normal flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {LEVEL_BY_ID[selectedEmployee.levelId]?.label ?? selectedEmployee.levelId}
                  </Badge>
                  {selectedEmployee.live && (
                    <Badge variant="outline" className="font-normal border-primary/30 text-primary">
                      Live from her learner journey
                    </Badge>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-8">
                
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Current Progress</h4>
                  <div className="p-4 bg-muted/20 rounded-lg border border-border">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-semibold text-sm">Personalised Learning Pathway</span>
                      <span className="font-bold">{selectedEmployee.pathwayProgress}%</span>
                    </div>
                    <Progress value={selectedEmployee.pathwayProgress} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Last active: {selectedEmployee.lastActive}
                      {selectedEmployee.assessmentScore > 0 && ` · Baseline assessment ${selectedEmployee.assessmentScore}%`}
                    </p>
                  </div>
                  {selectedEmployee.live && live.courses.length > 0 && (
                    <div className="space-y-2">
                      {live.courses.map((course) => (
                        <div key={course.courseId} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-muted-foreground truncate">{course.title}</span>
                          <span className="font-medium shrink-0">{course.percent}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects this person has in the review chain */}
                {teamSubmissions.filter((s) => s.personId === selectedEmployee.id).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Workplace Projects</h4>
                    <div className="space-y-3">
                      {teamSubmissions
                        .filter((s) => s.personId === selectedEmployee.id)
                        .map((s) => {
                          const decisions = approvalsFor(s.id);
                          return (
                            <div key={s.id} className="p-4 border border-border rounded-lg space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-medium text-sm">{s.title}</p>
                                <Badge variant="outline" className="shrink-0 font-normal">
                                  {SUBMISSION_STATE_LABEL[s.state]}
                                </Badge>
                              </div>
                              {decisions.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Last decision: {decisions[decisions.length - 1].by} on {decisions[decisions.length - 1].on}
                                </p>
                              )}
                              {s.state === "awaiting_manager" && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <Button size="sm" className="gap-2" onClick={() => handleSignOff(s.id, s.title)}>
                                    <ClipboardCheck className="w-4 h-4" /> Sign off
                                  </Button>
                                  <Button size="sm" variant="outline" className="gap-2" onClick={() => handleRevision(s.id, s.title)}>
                                    <RotateCcw className="w-4 h-4" /> Request revision
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manager Actions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => handleAction("Assign New Pathway", selectedEmployee.name)}>
                      <Target className="w-4 h-4 text-primary" /> Assign New Pathway
                    </Button>
                    <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => handleAction("Send Encouragement Message", selectedEmployee.name)}>
                      <Send className="w-4 h-4 text-secondary" /> Send Direct Message
                    </Button>
                    {selectedEmployee.status === 'at-risk' && (
                      <Button variant="default" className="justify-start gap-3 h-12" onClick={() => handleAction("Schedule Intervention Meeting", selectedEmployee.name)}>
                        <AlertCircle className="w-4 h-4" /> Schedule Intervention
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Competency Map</h4>
                  <Card className="border-border">
                    <CardContent className="p-4 space-y-4">
                      {selectedEmployee.competencyScores ? (
                        Object.entries(selectedEmployee.competencyScores).map(([competencyId, score]) => (
                          <div key={competencyId} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{competencyLabel(competencyId)}</span>
                              <span className="text-muted-foreground">{score} / 100</span>
                            </div>
                            <Progress value={score} className="h-1.5 opacity-70" />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No detailed competency breakdown yet — it appears once the baseline assessment is complete.
                        </p>
                      )}
                      {selectedEmployee.gapCompetencyIds && selectedEmployee.gapCompetencyIds.length > 0 && (
                        <p className="text-xs text-muted-foreground pt-1">
                          Development priorities: {selectedEmployee.gapCompetencyIds.map(competencyLabel).join(", ")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </Layout>
  );
}
