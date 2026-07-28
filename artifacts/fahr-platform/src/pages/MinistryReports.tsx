import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import {
  PageEnter,
  Stagger,
  StaggerItem,
  ChartReveal,
  ScrollReveal,
  CountUp,
} from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Download,
  Printer,
  FileText,
  ArrowRight,
  Users,
  CheckCircle2,
  Target,
  Award,
  Activity,
  BarChart3,
  Layers,
  Lightbulb,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import {
  MINISTRY_BY_ID,
  competencyLabel,
  ministryRollup,
} from "@/lib/federal";
import {
  engagementRows,
  completionRows,
  assessmentRows,
  certificationRows,
  entityCompetencyGaps,
  departmentGapRows,
  entityCapabilityBands,
  credentialTotal,
} from "@/lib/entityAdmin/selectors";
import { COMPETENCIES } from "@/lib/learningData";
import { downloadCsv, downloadCsvPack, printReport, type ExportSheet } from "@/lib/exportFile";
import { ReportKpi, scoreTone, ReportPill } from "@/components/ministry/ReportShared";

type ReportView =
  | "engagement"
  | "completion"
  | "competency"
  | "assessment"
  | "certification"
  | "gaps";

const REPORT_TABS: { id: ReportView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "engagement", label: "Engagement", icon: Activity },
  { id: "completion", label: "Completion", icon: CheckCircle2 },
  { id: "competency", label: "Competency development", icon: BarChart3 },
  { id: "assessment", label: "Assessment outcomes", icon: Target },
  { id: "certification", label: "Certification", icon: Award },
  { id: "gaps", label: "Capability gaps", icon: Layers },
];

/** Reporting periods narrow which cohorts are in scope by their start date. */
const PERIODS: { id: string; label: string; monthsBack: number | null }[] = [
  { id: "all", label: "All time", monthsBack: null },
  { id: "h2-2026", label: "Started Jul–Dec 2026", monthsBack: null },
  { id: "h1-2026", label: "Started Jan–Jun 2026", monthsBack: null },
];

/** Parse a "12 July 2026" style date into a comparable ordinal, or null. */
function monthIndex(date: string): number | null {
  const m = date.match(/([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const mi = months.indexOf(m[1].toLowerCase());
  if (mi < 0) return null;
  return Number(m[2]) * 12 + mi;
}

function periodContains(periodId: string, startsOn: string): boolean {
  if (periodId === "all") return true;
  const idx = monthIndex(startsOn);
  if (idx === null) return true; // never hide a row we cannot date
  const year = 2026;
  const h1 = { from: year * 12 + 0, to: year * 12 + 5 };
  const h2 = { from: year * 12 + 6, to: year * 12 + 11 };
  if (periodId === "h1-2026") return idx >= h1.from && idx <= h1.to;
  if (periodId === "h2-2026") return idx >= h2.from && idx <= h2.to;
  return true;
}

export default function MinistryReports() {
  const { toast } = useToast();
  const [location] = useLocation();
  const { focus, ministries, people, credentials } = useFederalData();
  const { cohorts } = useEntityAdmin();

  const ministry = ministries.find((m) => m.id === focus.ministryId) ?? MINISTRY_BY_ID[focus.ministryId];
  const rollup = useMemo(() => ministryRollup(focus.ministryId), [focus.ministryId]);
  const departments = rollup?.departments ?? [];

  const [view, setView] = useState<ReportView>("engagement");
  const [cohortFilter, setCohortFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");

  // Select the capability-gaps tab when arrived from the dashboard CTA.
  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search);
    if (params.get("view") === "gaps") setView("gaps");
    // location dependency keeps this honest if the query changes.
  }, [location]);

  // -- Scope the cohorts to the active filters --------------------------------
  const scopedCohorts = useMemo(
    () =>
      cohorts.filter(
        (c) =>
          (cohortFilter === "all" || c.id === cohortFilter) &&
          (departmentFilter === "all" || c.departmentId === departmentFilter) &&
          periodContains(periodFilter, c.startsOn),
      ),
    [cohorts, cohortFilter, departmentFilter, periodFilter],
  );

  const scopedDepartments = useMemo(
    () => departments.filter((d) => departmentFilter === "all" || d.id === departmentFilter),
    [departments, departmentFilter],
  );

  // -- Derived report data ----------------------------------------------------
  const engagement = useMemo(
    () => engagementRows(focus.ministryId, scopedCohorts).filter((r) => scopedDepartments.some((d) => d.id === r.department.id)),
    [focus.ministryId, scopedCohorts, scopedDepartments],
  );
  const completion = useMemo(() => completionRows(scopedCohorts), [scopedCohorts]);
  const assessment = useMemo(
    () => assessmentRows(scopedCohorts, people, credentials),
    [scopedCohorts, people, credentials],
  );
  const certification = useMemo(
    () => certificationRows(ministry, credentials),
    [ministry, credentials],
  );
  const gaps = useMemo(() => entityCompetencyGaps(ministry), [ministry]);
  const deptGaps = useMemo(() => departmentGapRows(ministry), [ministry]);
  const bands = useMemo(() => entityCapabilityBands(ministry), [ministry]);
  const totalCredentials = credentialTotal(ministry, credentials);

  const cohortsForFilter = cohorts.filter(
    (c) => departmentFilter === "all" || c.departmentId === departmentFilter,
  );

  const activeTab = REPORT_TABS.find((t) => t.id === view) ?? REPORT_TABS[0];

  // -- Filter notes carried into every export --------------------------------
  const filterNotes = useMemo(() => {
    const cohortLabel = cohortFilter === "all" ? "All cohorts" : cohorts.find((c) => c.id === cohortFilter)?.name ?? cohortFilter;
    const deptLabel = departmentFilter === "all" ? "All departments" : departments.find((d) => d.id === departmentFilter)?.name ?? departmentFilter;
    const periodLabel = PERIODS.find((p) => p.id === periodFilter)?.label ?? "All time";
    return [
      `Entity: ${ministry.name}`,
      `Cohort filter: ${cohortLabel}`,
      `Department filter: ${deptLabel}`,
      `Reporting period: ${periodLabel} (applies to cohort start date; entity-level distributions cover the whole entity)`,
    ];
  }, [cohortFilter, departmentFilter, periodFilter, cohorts, departments, ministry.name]);

  // -- Sheets for each report -------------------------------------------------
  function engagementSheet(): ExportSheet {
    return {
      filename: "mohap-engagement",
      title: "Engagement report",
      notes: filterNotes,
      headers: ["Department", "Employees", "Active learners", "Coverage %", "Active this week", "At risk", "Avg progress %"],
      rows: engagement.map((r) => [r.department.name, r.employees, r.activeLearners, r.coverage, r.activeThisWeek, r.atRisk, r.averageProgress]),
    };
  }
  function completionSheet(): ExportSheet {
    return {
      filename: "mohap-completion",
      title: "Completion report",
      notes: filterNotes,
      headers: ["Cohort", "Pathway", "Enrolled", "Completed", "In progress", "Not started", "Completion %"],
      rows: completion.map((r) => [r.cohort.name, r.cohort.pathway, r.enrolled, r.completed, r.inProgress, r.notStarted, r.completionRate]),
    };
  }
  function competencySheet(): ExportSheet {
    return {
      filename: "mohap-competency",
      title: "Competency development report",
      notes: filterNotes,
      headers: ["Competency", "Entity average", "National target", "Gap", "Learners below practitioner"],
      rows: gaps.map((g) => [g.competency.label, g.score, g.target, g.gap, g.learnersBelow]),
    };
  }
  function assessmentSheet(): ExportSheet {
    return {
      filename: "mohap-assessment",
      title: "Assessment outcomes report",
      notes: filterNotes,
      headers: ["Cohort", "Assessed", "Average score", "Pass rate %", "Retakes", "Awaiting"],
      rows: assessment.map((r) => [r.cohort.name, r.assessed, r.averageScore, r.passRate, r.retakes, r.awaiting]),
    };
  }
  function certificationSheet(): ExportSheet {
    return {
      filename: "mohap-certification",
      title: "Certification report",
      notes: [...filterNotes, `Total credentials issued: ${totalCredentials}`],
      headers: ["Capability level", "Credentials issued", "Share %"],
      rows: certification.map((r) => [r.level.label, r.issued, r.share]),
    };
  }
  function gapsSheet(): ExportSheet {
    return {
      filename: "mohap-capability-gaps",
      title: "Capability gaps — department heat map",
      notes: filterNotes,
      headers: ["Department", ...COMPETENCIES.map((c) => c.short), "Weakest"],
      rows: deptGaps.map((r) => [
        r.department.name,
        ...COMPETENCIES.map((c) => r.scores[c.id]),
        competencyLabel(r.weakestCompetencyId),
      ]),
    };
  }

  function sheetForView(v: ReportView): ExportSheet {
    switch (v) {
      case "engagement": return engagementSheet();
      case "completion": return completionSheet();
      case "competency": return competencySheet();
      case "assessment": return assessmentSheet();
      case "certification": return certificationSheet();
      case "gaps": return gapsSheet();
    }
  }

  const allSheets = () => [
    engagementSheet(),
    completionSheet(),
    competencySheet(),
    assessmentSheet(),
    certificationSheet(),
    gapsSheet(),
  ];

  const handleExportView = () => {
    const name = downloadCsv(sheetForView(view));
    toast({ title: "Report exported", description: `${activeTab.label} saved as ${name}.` });
  };
  const handleExportPack = () => {
    const name = downloadCsvPack("mohap-reporting-pack", allSheets(), `${ministry.name} — reporting pack`);
    toast({ title: "Reporting pack exported", description: `All six reports saved as ${name}.` });
  };
  const handlePrint = () => {
    printReport({
      title: `${ministry.name} — ${activeTab.label} report`,
      subtitle: "FAHR AI Learning & Development Platform",
      notes: filterNotes,
      sheets: [sheetForView(view)],
    });
    toast({
      title: "Print view opened",
      description: "Save as PDF from the print dialog.",
    });
  };

  const topGap = gaps[0];

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <PageHeader
          tone="primary"
          icon={<FileText className="w-7 h-7 text-primary" />}
          title="Programme Reports"
          description="Engagement, completion, competency development, assessment outcomes and certification for the entity, with a capability-gap view. Filters flow through to every export."
          actions={
            <>
              <Button variant="outline" onClick={handlePrint} data-testid="button-print-report">
                <Printer className="w-4 h-4 mr-2" /> Print / PDF
              </Button>
              <Button variant="outline" onClick={handleExportPack} data-testid="button-export-pack">
                <Download className="w-4 h-4 mr-2" /> Export full pack
              </Button>
              <Button onClick={handleExportView} data-testid="button-export-view">
                <Download className="w-4 h-4 mr-2" /> Export this report
              </Button>
            </>
          }
        />

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Cohort</label>
                <Select value={cohortFilter} onValueChange={setCohortFilter}>
                  <SelectTrigger data-testid="select-cohort-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cohorts</SelectItem>
                    {cohortsForFilter.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Department</label>
                <Select
                  value={departmentFilter}
                  onValueChange={(v) => {
                    setDepartmentFilter(v);
                    setCohortFilter("all");
                  }}
                >
                  <SelectTrigger data-testid="select-department-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Reporting period</label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger data-testid="select-period-filter"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={view} onValueChange={(v) => setView(v as ReportView)}>
          <TabsList className="flex flex-wrap h-auto">
            {REPORT_TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} data-testid={`tab-${t.id}`} className="gap-1.5">
                <t.icon className="w-4 h-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {view === "engagement" && (
          <EngagementReport rows={engagement} />
        )}
        {view === "completion" && (
          <CompletionReport rows={completion} />
        )}
        {view === "competency" && (
          <CompetencyReport rows={gaps} />
        )}
        {view === "assessment" && (
          <AssessmentReport rows={assessment} />
        )}
        {view === "certification" && (
          <CertificationReport rows={certification} total={totalCredentials} />
        )}
        {view === "gaps" && (
          <GapsReport
            gaps={gaps}
            deptGaps={deptGaps}
            bands={bands}
            topGap={topGap}
            entityName={ministry.name}
          />
        )}
      </PageEnter>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// Engagement
// ---------------------------------------------------------------------------

function EngagementReport({ rows }: { rows: ReturnType<typeof engagementRows> }) {
  const totalActive = rows.reduce((s, r) => s + r.activeLearners, 0);
  const totalWeek = rows.reduce((s, r) => s + r.activeThisWeek, 0);
  const totalAtRisk = rows.reduce((s, r) => s + r.atRisk, 0);
  const avgCoverage = rows.length ? Math.round(rows.reduce((s, r) => s + r.coverage, 0) / rows.length) : 0;
  const chartData = rows.map((r) => ({ name: r.department.name.split(" ")[0], active: r.activeThisWeek, atRisk: r.atRisk }));

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem><ReportKpi label="Active learners" value={totalActive} icon={Users} tone="text-primary" testId="kpi-active" /></StaggerItem>
        <StaggerItem><ReportKpi label="Active this week" value={totalWeek} icon={Activity} tone="text-secondary" testId="kpi-week" /></StaggerItem>
        <StaggerItem><ReportKpi label="At risk of dropping off" value={totalAtRisk} icon={Target} tone="text-accent" testId="kpi-atrisk" /></StaggerItem>
        <StaggerItem><ReportKpi label="Avg department coverage" value={avgCoverage} suffix="%" icon={CheckCircle2} tone="text-[hsl(var(--chart-3))]" testId="kpi-coverage" /></StaggerItem>
      </Stagger>

      <Card>
        <CardHeader><CardTitle className="text-lg">Weekly engagement by department</CardTitle></CardHeader>
        <CardContent className="h-[300px]">
          <ChartReveal className="h-full" direction="rise">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="active" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} name="Active this week" />
                <Bar dataKey="atRisk" stackId="a" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="At risk" />
              </BarChart>
            </ResponsiveContainer>
          </ChartReveal>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Engagement detail</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <ReportEmpty message="No departments match the current filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="text-right">Active learners</TableHead>
                    <TableHead className="text-right">Coverage</TableHead>
                    <TableHead className="text-right">Active this week</TableHead>
                    <TableHead className="text-right">At risk</TableHead>
                    <TableHead className="text-right">Avg progress</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <Stagger as="tbody">
                  {rows.map((r) => (
                    <StaggerItem as="tr" variant="row" key={r.department.id} className="border-b transition-colors hover:bg-muted/50 focus-within:bg-muted/50" data-testid={`row-engagement-${r.department.id}`}>
                      <TableCell className="font-medium">{r.department.name}</TableCell>
                      <TableCell className="text-right">{r.employees.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.activeLearners.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.coverage}%</TableCell>
                      <TableCell className="text-right">{r.activeThisWeek.toLocaleString()}</TableCell>
                      <TableCell className="text-right"><ReportPill tone={r.atRisk > r.activeThisWeek ? "bad" : "muted"}>{r.atRisk.toLocaleString()}</ReportPill></TableCell>
                      <TableCell className="text-right">{r.averageProgress}%</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/ministry/departments/${r.department.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus:underline focus:outline-none" data-testid={`link-department-${r.department.id}`}>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

function CompletionReport({ rows }: { rows: ReturnType<typeof completionRows> }) {
  const enrolled = rows.reduce((s, r) => s + r.enrolled, 0);
  const completed = rows.reduce((s, r) => s + r.completed, 0);
  const inProgress = rows.reduce((s, r) => s + r.inProgress, 0);
  const rate = enrolled ? Math.round((completed / enrolled) * 100) : 0;
  const chartData = rows.map((r) => ({ name: r.cohort.name.length > 16 ? `${r.cohort.name.slice(0, 15)}…` : r.cohort.name, completed: r.completed, inProgress: r.inProgress, notStarted: r.notStarted }));

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem><ReportKpi label="Learners enrolled" value={enrolled} icon={Users} tone="text-primary" testId="kpi-enrolled" /></StaggerItem>
        <StaggerItem><ReportKpi label="Completed" value={completed} icon={CheckCircle2} tone="text-secondary" testId="kpi-completed" /></StaggerItem>
        <StaggerItem><ReportKpi label="In progress" value={inProgress} icon={Activity} tone="text-accent" testId="kpi-inprogress" /></StaggerItem>
        <StaggerItem><ReportKpi label="Overall completion" value={rate} suffix="%" icon={Target} tone="text-[hsl(var(--chart-3))]" testId="kpi-rate" /></StaggerItem>
      </Stagger>

      <Card>
        <CardHeader><CardTitle className="text-lg">Completion by cohort</CardTitle></CardHeader>
        <CardContent className="h-[320px]">
          <ChartReveal className="h-full" direction="rise">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} height={60} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="completed" stackId="a" fill="hsl(var(--primary))" name="Completed" />
                <Bar dataKey="inProgress" stackId="a" fill="hsl(var(--secondary))" name="In progress" />
                <Bar dataKey="notStarted" stackId="a" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Not started" />
              </BarChart>
            </ResponsiveContainer>
          </ChartReveal>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Completion detail</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <ReportEmpty message="No cohorts match the current filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort</TableHead>
                    <TableHead>Pathway</TableHead>
                    <TableHead className="text-right">Enrolled</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">In progress</TableHead>
                    <TableHead className="text-right">Not started</TableHead>
                    <TableHead className="text-right">Completion</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <Stagger as="tbody">
                  {rows.map((r) => (
                    <StaggerItem as="tr" variant="row" key={r.cohort.id} className="border-b transition-colors hover:bg-muted/50 focus-within:bg-muted/50" data-testid={`row-completion-${r.cohort.id}`}>
                      <TableCell className="font-medium">{r.cohort.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.cohort.pathway}</TableCell>
                      <TableCell className="text-right">{r.enrolled.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.completed.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.inProgress.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.notStarted.toLocaleString()}</TableCell>
                      <TableCell className="text-right"><ReportPill tone={r.completionRate >= 70 ? "good" : r.completionRate >= 40 ? "warn" : "bad"}>{r.completionRate}%</ReportPill></TableCell>
                      <TableCell className="text-right">
                        <Link href={`/ministry/cohorts/${r.cohort.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus:underline focus:outline-none" data-testid={`link-cohort-${r.cohort.id}`}>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Competency development
// ---------------------------------------------------------------------------

function CompetencyReport({ rows }: { rows: ReturnType<typeof entityCompetencyGaps> }) {
  const avgScore = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
  const target = rows[0]?.target ?? 0;
  const atTarget = rows.filter((r) => r.gap === 0).length;
  const learnersBelow = rows.reduce((s, r) => s + r.learnersBelow, 0);
  const chartData = rows.map((r) => ({ name: r.competency.short, score: r.score, target: r.target }));

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem><ReportKpi label="Entity capability average" value={avgScore} suffix="%" icon={BarChart3} tone="text-primary" testId="kpi-avg" /></StaggerItem>
        <StaggerItem><ReportKpi label="National target" value={target} suffix="%" icon={Target} tone="text-secondary" testId="kpi-target" /></StaggerItem>
        <StaggerItem><ReportKpi label="Competencies at target" value={atTarget} suffix={` / ${rows.length}`} icon={CheckCircle2} tone="text-[hsl(var(--chart-3))]" testId="kpi-attarget" /></StaggerItem>
        <StaggerItem><ReportKpi label="Learners below practitioner" value={learnersBelow} icon={Users} tone="text-accent" testId="kpi-below" /></StaggerItem>
      </Stagger>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Competency development vs national target</CardTitle>
          <CardDescription>Entity average capability score per competency, against the national readiness target.</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ChartReveal className="h-full" direction="rise">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <ReferenceLine y={target} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: "Target", position: "right", fontSize: 11, fill: "hsl(var(--accent))" }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Entity average">
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.score >= d.target ? "hsl(var(--primary))" : "hsl(var(--chart-5))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartReveal>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Competency detail</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competency</TableHead>
                  <TableHead className="text-right">Entity average</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Gap</TableHead>
                  <TableHead className="text-right">Learners below practitioner</TableHead>
                </TableRow>
              </TableHeader>
              <Stagger as="tbody">
                {rows.map((r) => (
                  <StaggerItem as="tr" variant="row" key={r.competency.id} className="border-b transition-colors hover:bg-muted/50" data-testid={`row-competency-${r.competency.id}`}>
                    <TableCell className="font-medium">
                      {r.competency.label}
                      {r.isTopGap && <Badge variant="outline" className="ml-2 bg-accent/10 text-accent border-accent/20">Top gap</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{r.score}%</TableCell>
                    <TableCell className="text-right text-muted-foreground">{r.target}%</TableCell>
                    <TableCell className="text-right"><ReportPill tone={r.gap === 0 ? "good" : r.gap > 10 ? "bad" : "warn"}>{r.gap === 0 ? "At target" : `−${r.gap}`}</ReportPill></TableCell>
                    <TableCell className="text-right">{r.learnersBelow.toLocaleString()}</TableCell>
                  </StaggerItem>
                ))}
              </Stagger>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assessment outcomes
// ---------------------------------------------------------------------------

function AssessmentReport({ rows }: { rows: ReturnType<typeof assessmentRows> }) {
  const assessed = rows.reduce((s, r) => s + r.assessed, 0);
  const retakes = rows.reduce((s, r) => s + r.retakes, 0);
  const awaiting = rows.reduce((s, r) => s + r.awaiting, 0);
  const avgScore = rows.length ? Math.round(rows.reduce((s, r) => s + r.averageScore, 0) / rows.length) : 0;
  const chartData = rows.map((r) => ({ name: r.cohort.name.length > 16 ? `${r.cohort.name.slice(0, 15)}…` : r.cohort.name, passRate: r.passRate }));

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem><ReportKpi label="Learners assessed" value={assessed} icon={Target} tone="text-primary" testId="kpi-assessed" /></StaggerItem>
        <StaggerItem><ReportKpi label="Average score" value={avgScore} suffix="%" icon={BarChart3} tone="text-secondary" testId="kpi-avgscore" /></StaggerItem>
        <StaggerItem><ReportKpi label="Retakes needed" value={retakes} icon={Activity} tone="text-accent" testId="kpi-retakes" /></StaggerItem>
        <StaggerItem><ReportKpi label="Awaiting assessment" value={awaiting} icon={Users} tone="text-[hsl(var(--chart-3))]" testId="kpi-awaiting" /></StaggerItem>
      </Stagger>

      <Card>
        <CardHeader><CardTitle className="text-lg">Pass rate by cohort</CardTitle></CardHeader>
        <CardContent className="h-[320px]">
          <ChartReveal className="h-full" direction="rise">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} height={60} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="passRate" radius={[4, 4, 0, 0]} name="Pass rate %">
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.passRate >= 70 ? "hsl(var(--primary))" : d.passRate >= 50 ? "hsl(var(--chart-3))" : "hsl(var(--chart-5))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartReveal>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Assessment detail</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <ReportEmpty message="No cohorts match the current filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort</TableHead>
                    <TableHead className="text-right">Assessed</TableHead>
                    <TableHead className="text-right">Average score</TableHead>
                    <TableHead className="text-right">Pass rate</TableHead>
                    <TableHead className="text-right">Retakes</TableHead>
                    <TableHead className="text-right">Awaiting</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <Stagger as="tbody">
                  {rows.map((r) => (
                    <StaggerItem as="tr" variant="row" key={r.cohort.id} className="border-b transition-colors hover:bg-muted/50 focus-within:bg-muted/50" data-testid={`row-assessment-${r.cohort.id}`}>
                      <TableCell className="font-medium">{r.cohort.name}</TableCell>
                      <TableCell className="text-right">{r.assessed.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.averageScore}%</TableCell>
                      <TableCell className="text-right"><ReportPill tone={r.passRate >= 70 ? "good" : r.passRate >= 50 ? "warn" : "bad"}>{r.passRate}%</ReportPill></TableCell>
                      <TableCell className="text-right">{r.retakes.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{r.awaiting.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/ministry/cohorts/${r.cohort.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus:underline focus:outline-none" data-testid={`link-acohort-${r.cohort.id}`}>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Certification
// ---------------------------------------------------------------------------

function CertificationReport({ rows, total }: { rows: ReturnType<typeof certificationRows>; total: number }) {
  const topLevel = [...rows].sort((a, b) => b.issued - a.issued)[0];
  const chartData = rows.map((r) => ({ name: r.level.label, issued: r.issued }));

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StaggerItem><ReportKpi label="Credentials issued" value={total} icon={Award} tone="text-primary" testId="kpi-credentials" /></StaggerItem>
        <StaggerItem><ReportKpi label="Capability levels" value={rows.length} icon={Layers} tone="text-secondary" testId="kpi-levels" /></StaggerItem>
        <StaggerItem><ReportKpi label={`Most-earned: ${topLevel?.level.label ?? "—"}`} value={topLevel?.issued ?? 0} icon={Target} tone="text-accent" testId="kpi-toplevel" /></StaggerItem>
        <StaggerItem><ReportKpi label="Top-level share" value={topLevel?.share ?? 0} suffix="%" icon={CheckCircle2} tone="text-[hsl(var(--chart-3))]" testId="kpi-topshare" /></StaggerItem>
      </Stagger>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Credentials across the capability ladder</CardTitle>
          <CardDescription>Verified credentials issued to entity learners, by capability level.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartReveal className="h-full" direction="rise">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="issued" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Credentials issued" />
              </BarChart>
            </ResponsiveContainer>
          </ChartReveal>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Certification detail</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Capability level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Credentials issued</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <Stagger as="tbody">
                {rows.map((r) => (
                  <StaggerItem as="tr" variant="row" key={r.level.id} className="border-b transition-colors hover:bg-muted/50" data-testid={`row-certification-${r.level.id}`}>
                    <TableCell className="font-medium">{r.level.label}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.level.description}</TableCell>
                    <TableCell className="text-right">{r.issued.toLocaleString()}</TableCell>
                    <TableCell className="text-right"><ReportPill tone="accent">{r.share}%</ReportPill></TableCell>
                  </StaggerItem>
                ))}
              </Stagger>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Capability gaps
// ---------------------------------------------------------------------------

function GapsReport({
  gaps,
  deptGaps,
  bands,
  topGap,
  entityName,
}: {
  gaps: ReturnType<typeof entityCompetencyGaps>;
  deptGaps: ReturnType<typeof departmentGapRows>;
  bands: ReturnType<typeof entityCapabilityBands>;
  topGap: ReturnType<typeof entityCompetencyGaps>[number] | undefined;
  entityName: string;
}) {
  const gapChart = gaps.map((g) => ({ name: g.competency.short, gap: g.gap, score: g.score }));
  const bandChart = bands.map((b) => ({ name: b.level.label, count: b.count }));

  return (
    <div className="space-y-6">
      {/* Top gap call-out with next actions */}
      {topGap && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <Lightbulb className="w-5 h-5" />
                <span className="font-semibold">Biggest capability gap</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">{topGap.competency.label}</h3>
              <p className="text-sm text-muted-foreground max-w-2xl">
                {entityName} averages <span className="font-semibold text-foreground">{topGap.score}%</span> against a
                national target of {topGap.target}% — a gap of{" "}
                <span className="font-semibold text-accent">{topGap.gap} points</span>, with{" "}
                <span className="font-semibold text-foreground">{topGap.learnersBelow.toLocaleString()}</span> learners
                below the practitioner threshold. {topGap.competency.description}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link href="/ministry/cohorts" data-testid="link-assign-pathway">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Target className="w-4 h-4" /> Assign a pathway
                </Button>
              </Link>
              <Link href="/ministry/events" data-testid="link-schedule-session">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Activity className="w-4 h-4" /> Schedule a session
                </Button>
              </Link>
              <Link href="/ministry/content" data-testid="link-publish-content">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="w-4 h-4" /> Publish content
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gap to national target by competency</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartReveal className="h-full" direction="rise">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gapChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="gap" radius={[4, 4, 0, 0]} name="Gap (points)">
                    {gapChart.map((d, i) => (
                      <Cell key={i} fill={d.gap > 10 ? "hsl(var(--chart-5))" : d.gap > 0 ? "hsl(var(--chart-3))" : "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartReveal>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capability ladder distribution</CardTitle>
            <CardDescription>Where the entity's learners sit on the capability ladder.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartReveal className="h-full" direction="rise">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bandChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Learners" />
                </BarChart>
              </ResponsiveContainer>
            </ChartReveal>
          </CardContent>
        </Card>
      </div>

      {/* Department-by-competency heat table */}
      <ScrollReveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Department × competency heat map</CardTitle>
            <CardDescription>Average capability score per department and competency. Click a department to drill in.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    {COMPETENCIES.map((c) => (
                      <TableHead key={c.id} className="text-center">{c.short}</TableHead>
                    ))}
                    <TableHead>Weakest</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <Stagger as="tbody">
                  {deptGaps.map((r) => (
                    <StaggerItem as="tr" variant="row" key={r.department.id} className="border-b transition-colors hover:bg-muted/50 focus-within:bg-muted/50" data-testid={`row-heat-${r.department.id}`}>
                      <TableCell className="font-medium">{r.department.name}</TableCell>
                      {COMPETENCIES.map((c) => (
                        <TableCell key={c.id} className="text-center">
                          <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-medium ${scoreTone(r.scores[c.id])}`}>
                            {r.scores[c.id]}
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="text-sm text-muted-foreground">{competencyLabel(r.weakestCompetencyId)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/ministry/departments/${r.department.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus:underline focus:outline-none" data-testid={`link-heat-department-${r.department.id}`}>
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </TableCell>
                    </StaggerItem>
                  ))}
                </Stagger>
              </Table>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>
    </div>
  );
}

function ReportEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
      <FileText className="w-8 h-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
