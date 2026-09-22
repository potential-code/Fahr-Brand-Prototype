import React, { useMemo } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, Stagger, StaggerItem, ChartReveal, ScrollReveal } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Download,
  Gauge,
  Printer,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import { AIAnalysisPanel } from "@/components/ai/AIAnalysis";
import { AGENTS, CAPABILITY_LEVELS } from "@/lib/constants";
import { COHORT_BY_ID, MINISTRY_BY_ID } from "@/lib/federal";
import { COMPETENCIES } from "@/lib/learningData";
import { departmentGapRows } from "@/lib/entityAdmin/selectors";
import { ReportKpi, ReportPill } from "@/components/ministry/ReportShared";
import { GapHeatmap } from "@/components/manager/GapHeatmap";
import { TeamBenchmarkChart } from "@/components/manager/TeamBenchmark";
import {
  monthsSinceCohortStart,
  teamAssessmentSpread,
  teamBenchmark,
  teamCertificationProgress,
  teamCompetencyColumns,
  teamCompetencyMatrix,
  teamCompetencyTrend,
  teamEngagement,
  teamImpact,
  teamRoster,
} from "@/lib/manager/selectors";
import { downloadCsvPack, printReport, type ExportSheet } from "@/lib/exportFile";

const COMPETENCY_COLOURS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-4))",
  "hsl(var(--muted-foreground))",
];

/** A titled report section, so every analysis on the page reads the same way. */
function ReportSection({
  id,
  title,
  description,
  icon: Icon,
  actions,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ScrollReveal>
      <Card data-testid={`section-${id}`}>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" /> {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {actions}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </ScrollReveal>
  );
}

function SectionEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default function ManagerReports() {
  const { toast } = useToast();
  const { focus, teamOf, submissions, credentials, getPerson } = useFederalData();

  const manager = getPerson(focus.managerId);
  const team = teamOf(focus.managerId);
  const ministry = MINISTRY_BY_ID[focus.ministryId];

  const teamIds = useMemo(() => new Set(team.map((p) => p.id)), [team]);
  const teamSubmissions = useMemo(
    () => submissions.filter((s) => teamIds.has(s.personId)),
    [submissions, teamIds],
  );

  const matrix = useMemo(() => teamCompetencyMatrix(team), [team]);
  const roster = useMemo(() => teamRoster(team, credentials), [team, credentials]);
  const engagement = useMemo(() => teamEngagement(roster), [roster]);
  const impact = useMemo(() => teamImpact(teamSubmissions), [teamSubmissions]);
  const spread = useMemo(() => teamAssessmentSpread(matrix), [matrix]);
  const certification = useMemo(() => teamCertificationProgress(roster), [roster]);

  const departmentScores = useMemo(() => {
    const row = departmentGapRows(ministry).find((r) => r.department.id === focus.departmentId);
    return row?.scores ?? {};
  }, [ministry, focus.departmentId]);

  const columns = useMemo(
    () => teamCompetencyColumns(matrix, focus.departmentId, departmentScores),
    [matrix, focus.departmentId, departmentScores],
  );
  const benchmark = useMemo(
    () => teamBenchmark(matrix, focus.departmentId, focus.ministryId),
    [matrix, focus.departmentId, focus.ministryId],
  );

  const cohort = manager?.cohortId ? COHORT_BY_ID[manager.cohortId] : undefined;
  const teamCohort = team[0]?.cohortId ? COHORT_BY_ID[team[0].cohortId] : cohort;

  const trend = useMemo(
    () =>
      teamCompetencyTrend(matrix, columns, {
        months: 6,
        monthsElapsed: monthsSinceCohortStart(teamCohort?.startsOn),
        averageProgress: engagement.averageProgress,
      }),
    [matrix, columns, teamCohort?.startsOn, engagement.averageProgress],
  );

  const trendData = useMemo(
    () =>
      trend.map((point) => ({
        month: point.month,
        average: point.average,
        ...Object.fromEntries(COMPETENCIES.map((c) => [c.short, point.values[c.id]])),
      })),
    [trend],
  );

  const progressTrendData = useMemo(
    () =>
      trend.map((point, index) => ({
        month: point.month,
        // Pathway completion tracked alongside the capability curve: the last
        // point is the team's real average, earlier months scale back with it.
        progress: Math.round(
          engagement.averageProgress * ((index + 1) / trend.length) * ((index + 1) / trend.length),
        ),
      })),
    [trend, engagement.averageProgress],
  );

  const capabilityDistribution = useMemo(
    () =>
      CAPABILITY_LEVELS.map((level, index) => ({
        name: level.label.replace("Emerging Practitioner", "Emerging"),
        count: team.filter((p) => p.levelId === level.id).length,
        fill: COMPETENCY_COLOURS[index % COMPETENCY_COLOURS.length],
      })),
    [team],
  );

  const topGap = columns.find((c) => c.isTopGap);

  // -- Export sheets: the same rows the sections render ------------------------
  const notes = useMemo(
    () => [
      `Manager: ${manager?.name ?? "Department manager"}`,
      `Department: ${benchmark?.department.name ?? focus.departmentId}`,
      `Entity: ${ministry.name}`,
      `Team size: ${team.length}`,
      `Team readiness: ${benchmark?.teamReadiness ?? 0} (department ${benchmark?.department.readiness ?? 0}, entity ${ministry.readiness}, on-track ${benchmark?.onTrack ?? 65})`,
    ],
    [manager?.name, benchmark, focus.departmentId, ministry, team.length],
  );

  const sheets = useMemo<ExportSheet[]>(() => {
    const rosterSheet: ExportSheet = {
      filename: "team-roster",
      title: "Team roster",
      headers: [
        "Team member",
        "Assigned pathway",
        "Cohort",
        "Pathway completion %",
        "Capability average",
        "Capability level",
        "Last active",
        "Assessment outcome",
        "Certification",
        "Credentials",
        "Status",
      ],
      rows: roster.map((row) => [
        row.person.name,
        row.pathway,
        row.cohortName,
        row.pathwayProgress,
        row.capabilityAverage,
        row.level.label,
        row.lastActive,
        row.assessmentOutcome,
        row.certification,
        row.credentials.length,
        row.status,
      ]),
    };

    const heatmapSheet: ExportSheet = {
      filename: "team-competency-gaps",
      title: "Competency gap heatmap",
      notes: topGap
        ? [`Largest team gap: ${topGap.competency.label} at ${topGap.average}, ${topGap.below} below Practitioner.`]
        : undefined,
      headers: ["Team member", ...COMPETENCIES.map((c) => c.label), "Average"],
      rows: [
        ...matrix.map((row) => [
          row.person.name,
          ...COMPETENCIES.map((c) => row.scores[c.id]),
          row.average,
        ]),
        ["Team average", ...columns.map((c) => c.average), benchmark?.teamReadiness ?? 0],
        ["Department average", ...columns.map((c) => c.departmentAverage), benchmark?.department.readiness ?? 0],
      ],
    };

    const benchmarkSheet: ExportSheet = {
      filename: "team-vs-entity-readiness",
      title: "Team vs department and entity readiness",
      notes: benchmark ? [benchmark.headline] : undefined,
      headers: ["Comparison", "Readiness index", "Difference vs team"],
      rows: benchmark
        ? [
            ["Your team", benchmark.teamReadiness, 0],
            [benchmark.department.name, benchmark.department.readiness, -benchmark.vsDepartment],
            [`${ministry.name} average`, ministry.readiness, -benchmark.vsMinistry],
            ["Federal on-track threshold", benchmark.onTrack, benchmark.teamReadiness - benchmark.onTrack],
          ]
        : [],
    };

    const engagementSheet: ExportSheet = {
      filename: "team-engagement",
      title: "Engagement",
      notes: [
        `${engagement.activeThisWeek} of ${engagement.members} active in the last seven days; ${engagement.atRisk} at risk.`,
      ],
      headers: ["Team member", "Last active", "Days since active", "Pathway completion %", "Status"],
      rows: roster.map((row) => [
        row.person.name,
        row.lastActive,
        row.daysSinceActive,
        row.pathwayProgress,
        row.status,
      ]),
    };

    const competencySheet: ExportSheet = {
      filename: "team-competency-development",
      title: "Competency development over time",
      headers: ["Month", ...COMPETENCIES.map((c) => c.short), "Team average"],
      rows: trend.map((point) => [
        point.month,
        ...COMPETENCIES.map((c) => point.values[c.id]),
        point.average,
      ]),
    };

    const assessmentSheet: ExportSheet = {
      filename: "team-assessment-outcomes",
      title: "Assessment outcomes",
      headers: ["Team member", "Baseline score", "Current capability", "Change", "Outcome"],
      rows: spread.map((row) => [
        row.person.name,
        row.baseline,
        row.current,
        row.delta,
        row.outcome,
      ]),
    };

    const certificationSheet: ExportSheet = {
      filename: "team-completion-certification",
      title: "Completion and certification",
      headers: ["Certification standing", "People", "Share %"],
      rows: certification.map((row) => [row.state, row.count, row.share]),
    };

    const impactSheet: ExportSheet = {
      filename: "team-applied-impact",
      title: "Applied impact by project category",
      notes: [
        `${impact.projectsValidated} validated projects returning ${impact.hoursPerMonth} hours a month (AED ${impact.valueAed.toLocaleString()} estimated annual value).`,
      ],
      headers: ["Project category", "Projects", "Hours saved / month", "Estimated value (AED)"],
      rows: impact.categories.map((row) => [
        row.competency.label,
        row.projects,
        row.hoursSavedPerMonth,
        row.valueAed,
      ]),
    };

    return [
      rosterSheet,
      heatmapSheet,
      benchmarkSheet,
      engagementSheet,
      competencySheet,
      assessmentSheet,
      certificationSheet,
      impactSheet,
    ];
  }, [roster, matrix, columns, benchmark, topGap, engagement, trend, spread, certification, impact, ministry]);

  const handleExport = () => {
    const name = downloadCsvPack(
      `${benchmark?.department.name ?? "team"}-team-report`,
      sheets,
      `${manager?.name ?? "Department manager"} — team reporting pack`,
    );
    toast({
      title: "Team report exported",
      description: `Roster, heatmap and all report sections saved as ${name}.`,
    });
  };

  const handlePrint = () => {
    printReport({
      title: `${benchmark?.department.name ?? "Team"} — team capability report`,
      subtitle: `${manager?.name ?? "Department manager"} · ${ministry.name}`,
      notes,
      sheets,
    });
    toast({ title: "Print view opened", description: "Save as PDF from the print dialog." });
  };

  return (
    <Layout role="manager">
      <PageEnter className="mx-auto w-full max-w-7xl space-y-6 pb-12">
        <PageHeader
          tone="primary"
          icon={<BarChart3 className="h-7 w-7 text-primary" />}
          title="Team Reports"
          description="Competency gaps, engagement, competency development, assessment outcomes, certification and applied impact for your direct reports — benchmarked against your department and entity."
          actions={
            <>
              <Button variant="outline" onClick={handlePrint} data-testid="button-print-report">
                <Printer className="me-2 h-4 w-4" /> Print / PDF
              </Button>
              <Button onClick={handleExport} data-testid="button-export-report">
                <Download className="me-2 h-4 w-4" /> Export report data
              </Button>
            </>
          }
        />

        <AIAnalysisPanel
          agent={AGENTS.analytics}
          title="Team capability analysis"
          sources={`${team.length} team records · ${teamSubmissions.length} workplace projects`}
          steps={[
            "Reading capability profiles and gap flags",
            "Comparing the team against its department and entity",
            "Aggregating validated project impact",
          ]}
          runKey={`${team.length}-${impact.projectsValidated}-${benchmark?.teamReadiness ?? 0}`}
          data-testid="panel-team-analysis"
        >
          <div className="space-y-3 text-sm leading-relaxed text-foreground">
            <p>
              The team averages{" "}
              <span className="font-semibold">{engagement.averageProgress}%</span> pathway completion and sits at a
              capability average of <span className="font-semibold">{benchmark?.teamReadiness ?? 0}</span>.{" "}
              {benchmark?.headline}
            </p>
            {topGap && (
              <p>
                The largest development priority is{" "}
                <span className="font-semibold">{topGap.competency.label}</span> at {topGap.average}, with{" "}
                {topGap.below} of {team.length} people below Practitioner. {engagement.atRisk} team{" "}
                {engagement.atRisk === 1 ? "member is" : "members are"} flagged at risk and{" "}
                {engagement.dormant} {engagement.dormant === 1 ? "has" : "have"} not been active this week.
              </p>
            )}
            <p>
              {impact.projectsValidated} validated Workplace{" "}
              {impact.projectsValidated === 1 ? "Project returns" : "Projects return"}{" "}
              <span className="font-semibold text-primary">{impact.hoursPerMonth} hours</span> a month —{" "}
              <span className="font-semibold text-primary">AED {impact.valueAed.toLocaleString()}</span> of estimated
              annual value, or {impact.workingDaysReturned} working days returned a year.
            </p>
          </div>
        </AIAnalysisPanel>

        <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StaggerItem as="div">
            <ReportKpi
              label="Avg. pathway completion"
              value={engagement.averageProgress}
              suffix="%"
              icon={Activity}
              testId="kpi-avg-progress"
            />
          </StaggerItem>
          <StaggerItem as="div">
            <ReportKpi
              label="Team capability average"
              value={benchmark?.teamReadiness ?? 0}
              icon={Gauge}
              testId="kpi-team-readiness"
            />
          </StaggerItem>
          <StaggerItem as="div">
            <ReportKpi
              label="Hours saved / month"
              value={impact.hoursPerMonth}
              icon={TrendingUp}
              testId="kpi-hours-saved"
            />
          </StaggerItem>
          <StaggerItem as="div">
            <ReportKpi
              label="Est. annual value"
              value={impact.valueAed}
              prefix="AED "
              icon={Sparkles}
              testId="kpi-value-created"
            />
          </StaggerItem>
        </Stagger>

        <ScrollReveal>
          <GapHeatmap rows={matrix} columns={columns} hrefFor={(id) => `/manager/team/${id}`} />
        </ScrollReveal>

        {benchmark && (
          <ReportSection
            id="benchmark"
            title="Team vs department and entity"
            description="The team's capability average against its department and the entity average, with the federal on-track threshold marked."
            icon={Gauge}
            actions={
              <ReportPill tone={benchmark.atRisk ? "accent" : "good"}>
                {benchmark.atRisk ? "Below on-track threshold" : "On track"}
              </ReportPill>
            }
          >
            <TeamBenchmarkChart benchmark={benchmark} />
          </ReportSection>
        )}

        <ReportSection
          id="engagement"
          title="Engagement"
          description="Activity in the last seven days and the spread of learner status across the team."
          icon={Activity}
        >
          {roster.length === 0 ? (
            <SectionEmpty message="No direct reports enrolled yet." />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="h-[260px]">
                <ChartReveal className="h-full" direction="rise">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Excelling", count: engagement.excelling, fill: "hsl(var(--primary))" },
                        { name: "On track", count: engagement.onTrack, fill: "hsl(var(--secondary))" },
                        { name: "Needs attention", count: engagement.needsAttention, fill: "hsl(var(--chart-4))" },
                        { name: "At risk", count: engagement.atRisk, fill: "hsl(var(--accent))" },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} />
                      <Bar dataKey="count" name="People" radius={[4, 4, 0, 0]}>
                        {[0, 1, 2, 3].map((index) => (
                          <Cell
                            key={index}
                            fill={
                              ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--chart-4))", "hsl(var(--accent))"][
                                index
                              ]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartReveal>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-2xl font-bold tabular-nums" data-testid="text-active-this-week">
                      {engagement.activeThisWeek}/{engagement.members}
                    </p>
                    <p className="text-xs text-muted-foreground">Active in the last 7 days</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-2xl font-bold tabular-nums">{engagement.averageDaysSinceActive}</p>
                    <p className="text-xs text-muted-foreground">Avg. days since last activity</p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team member</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead className="text-end">Completion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roster.map((row) => (
                      <TableRow key={row.person.id} data-testid={`engagement-row-${row.person.id}`}>
                        <TableCell className="font-medium">{row.person.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.lastActive}
                          {!row.activeThisWeek && (
                            <ReportPill tone="accent">
                              <span className="ms-0">Dormant</span>
                            </ReportPill>
                          )}
                        </TableCell>
                        <TableCell className="text-end tabular-nums">{row.pathwayProgress}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </ReportSection>

        <ReportSection
          id="competency-development"
          title="Competency development over time"
          description="Where the team started at baseline and where each competency stands now, across the reporting window."
          icon={BarChart3}
        >
          {matrix.length === 0 ? (
            <SectionEmpty message="Competency development appears once the team has completed a baseline assessment." />
          ) : (
            <div className="h-[320px]">
              <ChartReveal className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {COMPETENCIES.map((competency, index) => (
                      <Line
                        key={competency.id}
                        type="monotone"
                        dataKey={competency.short}
                        stroke={COMPETENCY_COLOURS[index % COMPETENCY_COLOURS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartReveal>
            </div>
          )}
        </ReportSection>

        <ReportSection
          id="assessment-outcomes"
          title="Assessment outcomes"
          description="Baseline assessment result against current capability for each team member, with the assessment standing."
          icon={Target}
        >
          {spread.length === 0 ? (
            <SectionEmpty message="No assessments completed yet." />
          ) : (
            <div className="space-y-4">
              <div className="h-[280px]">
                <ChartReveal className="h-full" direction="rise">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={spread.map((row) => ({
                        name: row.person.name.split(" ")[0],
                        Baseline: row.baseline,
                        Current: row.current,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Baseline" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartReveal>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team member</TableHead>
                    <TableHead className="text-end">Baseline</TableHead>
                    <TableHead className="text-end">Current</TableHead>
                    <TableHead className="text-end">Change</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spread.map((row) => (
                    <TableRow key={row.person.id} data-testid={`assessment-row-${row.person.id}`}>
                      <TableCell className="font-medium">{row.person.name}</TableCell>
                      <TableCell className="text-end tabular-nums">{row.baseline}</TableCell>
                      <TableCell className="text-end tabular-nums">{row.current}</TableCell>
                      <TableCell className="text-end tabular-nums">
                        {row.delta >= 0 ? "+" : ""}
                        {row.delta}
                      </TableCell>
                      <TableCell>
                        <ReportPill tone={row.outcome === "Passed" ? "good" : row.outcome === "Retake needed" ? "accent" : "muted"}>
                          {row.outcome}
                        </ReportPill>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ReportSection>

        <ReportSection
          id="completion-certification"
          title="Completion and certification"
          description="Pathway completion across the team and how many people are certified, ready to certify or still working through."
          icon={CheckCircle2}
        >
          {roster.length === 0 ? (
            <SectionEmpty message="No pathways assigned yet." />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="h-[260px]">
                <ChartReveal className="h-full" direction="rise">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={certification.map((row) => ({ name: row.state, count: row.count }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} />
                      <Bar dataKey="count" name="People" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartReveal>
              </div>
              <div className="space-y-2">
                {roster.map((row) => (
                  <div
                    key={row.person.id}
                    className="rounded-lg border border-border p-3"
                    data-testid={`completion-row-${row.person.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{row.person.name}</span>
                      <ReportPill
                        tone={
                          row.certification === "Certified"
                            ? "good"
                            : row.certification === "Ready to certify"
                              ? "accent"
                              : "muted"
                        }
                      >
                        {row.certification}
                      </ReportPill>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${row.pathwayProgress}%` }} />
                      </div>
                      <span className="w-10 text-end text-xs tabular-nums text-muted-foreground">
                        {row.pathwayProgress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportSection>

        <ReportSection
          id="applied-impact"
          title="Applied impact by project category"
          description="Validated Workplace Projects grouped by the competency they were delivered under, with time returned and estimated value."
          icon={Sparkles}
          actions={
            <Link href="/manager/recognition">
              <Button variant="ghost" size="sm" data-testid="link-recognition-from-reports">
                <Award className="me-2 h-4 w-4" /> Recognition &amp; impact
              </Button>
            </Link>
          }
        >
          {impact.categories.length === 0 ? (
            <SectionEmpty message="No workplace projects signed off yet — impact appears here once you validate a submission." />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="h-[260px]">
                <ChartReveal className="h-full" direction="rise">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={impact.categories.map((row) => ({
                        name: row.competency.short,
                        hours: row.hoursSavedPerMonth,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} />
                      <Bar dataKey="hours" name="Hours saved / month" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartReveal>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-end">Projects</TableHead>
                    <TableHead className="text-end">Hours / month</TableHead>
                    <TableHead className="text-end">Value (AED)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {impact.categories.map((row) => (
                    <TableRow key={row.competency.id} data-testid={`impact-row-${row.competency.id}`}>
                      <TableCell className="font-medium">{row.competency.label}</TableCell>
                      <TableCell className="text-end tabular-nums">{row.projects}</TableCell>
                      <TableCell className="text-end tabular-nums">{row.hoursSavedPerMonth}</TableCell>
                      <TableCell className="text-end tabular-nums">{row.valueAed.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ReportSection>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReportSection
            id="capability-distribution"
            title="Capability distribution"
            description="Spread across the unified capability ladder."
            icon={Users}
          >
            <div className="h-[280px]">
              <ChartReveal className="h-full" direction="rise">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={capabilityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} />
                    <Bar dataKey="count" name="People" radius={[4, 4, 0, 0]}>
                      {capabilityDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartReveal>
            </div>
          </ReportSection>

          <ReportSection
            id="progress-trend"
            title="Pathway progress trend"
            description="Average pathway completion across the reporting window."
            icon={Activity}
          >
            <div className="h-[280px]">
              <ChartReveal className="h-full" direction="rise">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="progress"
                      name="Pathway completion %"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorProgress)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartReveal>
            </div>
          </ReportSection>
        </div>

        <p className="text-xs text-muted-foreground">
          Figures are derived from the same federal records as the entity and leadership views. Department and entity
          benchmarks come from the entity roll-up, not a separate team calculation.
        </p>
      </PageEnter>
    </Layout>
  );
}
