import React, { useMemo } from "react";
import { Link, useParams } from "wouter";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, Stagger, StaggerItem, ChartReveal, CountUp } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  ArrowLeft,
  Users,
  Search,
  Zap,
  Bot,
  Rocket,
  Clock,
  Gauge,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  DEPARTMENT_BY_ID,
  MINISTRY_BY_ID,
  SUBMISSION_STATE_LABEL,
  competencyLabel,
  levelForScore,
} from "@/lib/federal";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { COMPETENCIES } from "@/lib/learningData";
import {
  departmentGapRows,
  departmentRoster,
} from "@/lib/entityAdmin/selectors";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import { AIAnalysisPanel } from "@/components/ai/AIAnalysis";
import { AGENTS } from "@/lib/constants";

const LEVEL_LABEL: Record<string, string> = Object.fromEntries(
  CAPABILITY_LEVELS.map((l) => [l.id, l.label]),
);

const STATUS_STYLE: Record<string, string> = {
  excelling: "bg-green-50 text-green-700 border-green-200",
  "on-track": "bg-blue-50 text-blue-700 border-blue-200",
  "needs-attention": "bg-amber-50 text-amber-700 border-amber-200",
  "at-risk": "bg-red-50 text-red-700 border-red-200",
};

export default function MinistryDepartment() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { people, submissions, credentials } = useFederalData();
  const { cohorts } = useEntityAdmin();

  const department = departmentId ? DEPARTMENT_BY_ID[departmentId] : undefined;
  const ministry = department ? MINISTRY_BY_ID[department.ministryId] : MINISTRY_BY_ID["mohap"];

  const gapRow = useMemo(() => {
    if (!department) return undefined;
    return departmentGapRows(ministry).find((r) => r.department.id === department.id);
  }, [department, ministry]);

  const roster = useMemo(
    () => (department ? departmentRoster(department.id, credentials) : []),
    [department, credentials],
  );

  const departmentCohorts = useMemo(
    () => (department ? cohorts.filter((c) => c.departmentId === department.id) : []),
    [cohorts, department],
  );

  const departmentProjects = useMemo(
    () => (department ? submissions.filter((s) => s.departmentId === department.id) : []),
    [submissions, department],
  );

  // Roster may be a generated sample for departments without an authored roster.
  const authoredCount = department
    ? people.filter((p) => p.departmentId === department.id).length
    : 0;
  const isSample = authoredCount === 0 && roster.length > 0;

  if (!department) {
    return (
      <Layout role="ministry">
        <PageEnter className="space-y-6">
          <PageHeader tone="primary" title="Department not found" description="This department does not exist in the entity." />
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><Building2 className="h-6 w-6" /></EmptyMedia>
              <EmptyTitle>We could not find that department</EmptyTitle>
              <EmptyDescription>The link may be stale. Return to the dashboard to pick a department.</EmptyDescription>
            </EmptyHeader>
            <Link href="/ministry">
              <Button className="mt-4" data-testid="button-back-dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard</Button>
            </Link>
          </Empty>
        </PageEnter>
      </Layout>
    );
  }

  const coverage = Math.round((department.activeLearners / department.employees) * 100);

  const radarData = gapRow
    ? COMPETENCIES.map((c) => ({
        competency: c.short,
        score: gapRow.scores[c.id],
        target: gapRow.scores[c.id],
      }))
    : [];
  const weakestLabel = gapRow ? competencyLabel(gapRow.weakestCompetencyId) : "";

  const kpis = [
    { label: "Employees", value: department.employees, icon: Users, color: "text-primary" },
    { label: "Active learners", value: department.activeLearners, icon: Search, color: "text-secondary" },
    { label: "Coverage", value: coverage, suffix: "%", icon: Users, color: "text-accent" },
    { label: "Readiness index", value: department.readiness, suffix: "%", icon: Zap, color: "text-[hsl(var(--chart-4))]" },
    { label: "AI digital twins", value: department.twins, icon: Bot, color: "text-[hsl(var(--chart-3))]" },
    { label: "Projects", value: department.projects, icon: Rocket, color: "text-[hsl(var(--chart-5))]" },
    { label: "Hours saved/mo", value: department.hoursSavedPerMonth, icon: Clock, color: "text-primary" },
  ];

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <Link href="/ministry" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to {ministry.shortName} dashboard
        </Link>

        <PageHeader
          tone="primary"
          icon={<Building2 className="h-7 w-7 text-primary" />}
          title={department.name}
          description={`${ministry.name} · department drill-down`}
          actions={
            <Badge
              variant="outline"
              className={
                department.risk === "High"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : department.risk === "Medium"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-green-50 text-green-700 border-green-200"
              }
              data-testid="badge-department-risk"
            >
              <Gauge className="mr-1 h-3.5 w-3.5" /> {department.risk} capability gap
            </Badge>
          }
        />

        {/* KPIs */}
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <kpi.icon className={`mb-2 h-5 w-5 ${kpi.color}`} />
                  <p className="text-xl font-bold"><CountUp to={kpi.value} suffix={kpi.suffix} /></p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Competency profile */}
          <AIAnalysisPanel
            agent={AGENTS.analytics}
            title="Competency profile"
            sources={`${authoredCount > 0 ? authoredCount : roster.length} staff records`}
            steps={["Reading baseline assessments", "Averaging capability across framework", "Identifying largest gaps"]}
            runKey={department.id}
            className="lg:col-span-2"
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Average capability across the five framework competencies for this department.
              </p>
              <ChartReveal direction="rise" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="competency" fontSize={12} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip />
                    <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartReveal>
              {gapRow && (
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Weakest competency: <span className="font-medium text-foreground">{weakestLabel}</span> at{" "}
                  {gapRow.scores[gapRow.weakestCompetencyId]}%.
                </p>
              )}
            </div>
          </AIAnalysisPanel>

          {/* Cohorts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cohorts here</CardTitle>
              <CardDescription>Learning cohorts assigned to this department.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {departmentCohorts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cohorts are assigned to this department yet.</p>
              ) : (
                departmentCohorts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/ministry/cohorts/${c.id}`}
                    className="block rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-muted/50"
                    data-testid={`link-cohort-${c.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{c.name}</span>
                      <Badge variant="outline">{c.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.learners} learners</p>
                    <Progress value={c.progress} className="mt-2 h-1.5" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* People */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">People</CardTitle>
              <CardDescription>
                {isSample
                  ? `A generated sample of ${roster.length} learners representing this ${department.activeLearners.toLocaleString()}-learner department.`
                  : `${roster.length} named learners in this department.`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Capability level</TableHead>
                    <TableHead>Pathway progress</TableHead>
                    <TableHead className="text-right">Assessment</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Certified</TableHead>
                  </TableRow>
                </TableHeader>
                <Stagger as="tbody">
                  {roster.map(({ person, certified }) => (
                    <StaggerItem
                      as="tr"
                      variant="row"
                      key={person.id}
                      className="border-b border-border hover:bg-muted/50"
                      data-testid={`row-person-${person.id}`}
                    >
                      <TableCell>
                        <Link
                          href={`/ministry/people/${person.id}`}
                          className="font-medium text-primary hover:underline"
                          data-testid={`link-person-${person.id}`}
                        >
                          {person.name}
                        </Link>
                      </TableCell>
                      <TableCell>{person.role}</TableCell>
                      <TableCell>{LEVEL_LABEL[person.levelId] ?? levelForScore(person.assessmentScore).label}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={person.pathwayProgress} className="h-2 w-16" />
                          <span className="text-xs text-muted-foreground">{person.pathwayProgress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{person.assessmentScore}%</TableCell>
                      <TableCell className="text-muted-foreground">{person.lastActive}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_STYLE[person.status]}>
                          {person.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {certified ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Certified</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </StaggerItem>
                  ))}
                </Stagger>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workplace projects</CardTitle>
            <CardDescription>Projects raised in this department, in the approval chain.</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workplace projects have been raised in this department yet.</p>
            ) : (
              <div className="space-y-3">
                {departmentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href="/ministry/portfolio"
                    className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-muted/50"
                    data-testid={`link-project-${p.id}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.impact} impact · {p.governanceStatus}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">{SUBMISSION_STATE_LABEL[p.state]}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>
    </Layout>
  );
}
