import React, { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import {
  Users,
  Bot,
  Zap,
  Clock,
  Rocket,
  Search,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Layers,
  Download,
  Award,
  UserCog,
  ClipboardCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AGENTS } from "@/lib/constants";
import { useFederalData } from "@/lib/FederalDataContext";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import {
  MINISTRY_BY_ID,
  TWIN_ADOPTION,
  competencyLabel,
  ministryRollup,
  peopleOfMinistry,
} from "@/lib/federal";
import { credentialTotal } from "@/lib/entityAdmin/selectors";
import {
  PageEnter,
  Stagger,
  StaggerItem,
  ChartReveal,
  ScrollReveal,
  CountUp,
} from "@/components/motion";
import { downloadCsvPack } from "@/lib/exportFile";

export default function MinistryDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([]);
  const { focus, ministries, submissions, credentials } = useFederalData();
  const { cohorts, accounts } = useEntityAdmin();

  const ministry = ministries.find((m) => m.id === focus.ministryId) ?? MINISTRY_BY_ID[focus.ministryId];
  const rollup = useMemo(() => ministryRollup(focus.ministryId), [focus.ministryId]);
  const departmentData = rollup?.departments ?? [];

  /** Projects from this entity awaiting an entity endorsement decision. */
  const awaitingEntity = submissions.filter(
    (s) => s.ministryId === focus.ministryId && s.state === "awaiting_entity",
  );
  const pendingEntityReview = submissions.filter(
    (s) => s.ministryId === focus.ministryId && (s.state === "awaiting_entity" || s.state === "awaiting_manager"),
  );

  const totalCredentials = credentialTotal(ministry, credentials);
  const sessionCredentials = credentials.filter(
    (c) => c.ministryId === focus.ministryId && !c.id.startsWith("cr-"),
  ).length;

  /** Accounts an admin needs to chase: invited, consent pending, low profile. */
  const accountsNeedingAttention = accounts.filter(
    (a) => a.status === "Invited" || a.consent === "Pending" || a.profileCompletion < 50,
  );

  const kpis = [
    { label: "Total Employees", value: ministry.employees, icon: Users, color: "text-primary" },
    { label: "Active Learners", value: ministry.activeLearners, icon: Search, color: "text-secondary" },
    { label: "AI Readiness Index", value: ministry.readiness, suffix: "%", icon: Zap, color: "text-accent" },
    { label: "AI Digital Twins", value: ministry.twins, icon: Bot, color: "text-[hsl(var(--chart-4))]" },
    { label: "Projects Submitted", value: ministry.projectsSubmitted, icon: Rocket, color: "text-[hsl(var(--chart-5))]" },
    { label: "Credentials Issued", value: totalCredentials, icon: Award, color: "text-[hsl(var(--chart-3))]" },
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
    setAppliedRecommendations((prev) => [...prev, id]);
    toast({ title: "Action Applied", description: `Successfully executed: ${action}` });
  };

  const handleExport = () => {
    const name = downloadCsvPack(
      "mohap-dashboard",
      [
        {
          filename: "mohap-dashboard-summary",
          title: "Entity dashboard summary",
          notes: [`Entity: ${ministry.name}`, `Generated for the current session`],
          headers: ["Metric", "Value"],
          rows: [
            ["Total employees", ministry.employees],
            ["Active learners", ministry.activeLearners],
            ["AI readiness index", `${ministry.readiness}%`],
            ["AI digital twins", ministry.twins],
            ["Projects submitted", ministry.projectsSubmitted],
            ["Credentials issued", totalCredentials],
            ["Projects awaiting entity decision", awaitingEntity.length],
            ["Accounts needing attention", accountsNeedingAttention.length],
          ],
        },
        {
          filename: "mohap-dashboard-departments",
          title: "Department capability overview",
          headers: ["Department", "Employees", "Readiness %", "Digital twins", "Projects", "Hours saved/mo", "Risk"],
          rows: departmentData.map((d) => [d.name, d.employees, d.readiness, d.twins, d.projects, d.hoursSavedPerMonth, d.risk]),
        },
      ],
      `${ministry.name} — dashboard export`,
    );
    toast({ title: "Report exported", description: `Dashboard figures saved as ${name}.` });
  };

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <PageHeader
          tone="primary"
          className="mb-2"
          title={ministry.name}
          description="Entity Admin Dashboard — workforce adoption, capability and workplace-project activity for the entity."
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => setLocation("/ministry/reports?view=gaps")}
                data-testid="button-view-gaps"
              >
                <Layers className="w-4 h-4 mr-2" /> View Capability Gaps
              </Button>
              <Button variant="outline" onClick={handleExport} data-testid="button-export-report">
                <Download className="w-4 h-4 mr-2" /> Export Report
              </Button>
              <Button onClick={() => setLocation("/ministry/approvals")} data-testid="button-review-projects">
                Review Projects ({awaitingEntity.length})
              </Button>
            </>
          }
        />

        {/* Pending decisions & accounts needing attention */}
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StaggerItem>
            <Link href="/ministry/approvals" data-testid="link-pending-approvals">
              <Card className="hover-elevate transition-all cursor-pointer border-border hover:border-primary/50 focus-within:border-primary/50">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg shrink-0">
                      <ClipboardCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold"><CountUp to={awaitingEntity.length} /></p>
                      <p className="text-sm text-muted-foreground">Workplace projects awaiting your endorsement</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>
          <StaggerItem>
            <Link href="/ministry/users" data-testid="link-accounts-attention">
              <Card className="hover-elevate transition-all cursor-pointer border-border hover:border-primary/50 focus-within:border-primary/50">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-accent/10 text-accent p-3 rounded-lg shrink-0">
                      <UserCog className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold"><CountUp to={accountsNeedingAttention.length} /></p>
                      <p className="text-sm text-muted-foreground">Accounts pending invite, consent or profile completion</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>
        </Stagger>

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
            <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StaggerItem className="bg-background rounded-md p-4 border border-border flex flex-col justify-between">
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
                  data-testid="button-rec-1"
                >
                  {appliedRecommendations.includes("rec-1") ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Triggered</> : "Send Coach Check-in"}
                </Button>
              </StaggerItem>

              <StaggerItem className="bg-background rounded-md p-4 border border-border flex flex-col justify-between">
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
                  data-testid="button-rec-2"
                >
                  {appliedRecommendations.includes("rec-2") ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Published</> : "Publish Templates"}
                </Button>
              </StaggerItem>

              <StaggerItem className="bg-background rounded-md p-4 border border-border flex flex-col justify-between">
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
                  onClick={() => setLocation("/ministry/reports?view=gaps")}
                  data-testid="button-rec-3"
                >
                  Review Capability Gaps
                </Button>
              </StaggerItem>
            </Stagger>
          </CardContent>
        </Card>

        <Stagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi, i) => (
            <StaggerItem key={i}>
              <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <kpi.icon className={`w-6 h-6 mb-2 ${kpi.color}`} />
                  <p className="text-2xl font-bold">
                    <CountUp to={kpi.value} suffix={kpi.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        {sessionCredentials > 0 && (
          <p className="text-xs text-muted-foreground" data-testid="text-session-note">
            Includes {sessionCredentials} credential{sessionCredentials === 1 ? "" : "s"} issued this session.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Readiness by Department</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartReveal className="h-full" direction="rise">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={readinessChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartReveal>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Digital Twin Adoption Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartReveal className="h-full" direction="wipe">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={twinAdoptionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="twins" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartReveal>
            </CardContent>
          </Card>
        </div>

        <ScrollReveal>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Department Capability Overview</CardTitle>
                <CardDescription>Click a department to drill into its learners.</CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={handleExport} data-testid="button-export-departments">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              {departmentData.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No departments recorded for this entity yet.</p>
                </div>
              ) : (
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
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <Stagger as="tbody">
                      {departmentData.map((dept) => (
                        <StaggerItem
                          as="tr"
                          variant="row"
                          key={dept.id}
                          className="border-b transition-colors hover:bg-muted/50 focus-within:bg-muted/50 cursor-pointer"
                          data-testid={`row-department-${dept.id}`}
                        >
                          <TableCell className="font-medium">
                            <Link href={`/ministry/departments/${dept.id}`} className="hover:text-primary hover:underline focus:underline focus:outline-none" data-testid={`link-department-${dept.id}`}>
                              {dept.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">{dept.employees.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{dept.readiness}%</TableCell>
                          <TableCell className="text-right">{dept.twins.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{dept.projects}</TableCell>
                          <TableCell className="text-right">{dept.hoursSavedPerMonth.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={dept.risk === "High" ? "destructive" : dept.risk === "Medium" ? "secondary" : "outline"}
                              className={dept.risk === "Low" ? "bg-green-50 text-green-700 border-green-200" : ""}
                            >
                              {dept.risk} Gap
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/ministry/departments/${dept.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus:underline focus:outline-none" data-testid={`link-department-arrow-${dept.id}`}>
                              View <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </TableCell>
                        </StaggerItem>
                      ))}
                    </Stagger>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>
      </PageEnter>
    </Layout>
  );
}
