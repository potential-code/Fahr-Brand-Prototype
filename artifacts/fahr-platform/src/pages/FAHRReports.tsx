import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Building2,
  Activity,
  Zap,
  Award,
  Clock,
  Coins,
  Rocket,
  FileBarChart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  PageEnter,
  Stagger,
  StaggerItem,
  ChartReveal,
  CountUp,
} from "@/components/motion";
import {
  REPORT_TYPES,
  REPORT_PERIODS,
  REPORT_PERIOD_BY_ID,
  DEFAULT_REPORT_PERIOD,
  REPORT_NOTES,
  engagementRows,
  competencyRows,
  assessmentRows,
  certificationRows,
  impactRows,
  ladderRows,
  nationalLine,
  type ReportTypeId,
  type ReportScope,
} from "@/lib/federal";
import { downloadCsv, printReport } from "@/lib/exportFile";

const CHART_FILL = "hsl(var(--primary))";
const CHART_FILL_ALT = "hsl(var(--secondary))";

type ColumnKind = "text" | "number" | "percent";

type Column<Row> = {
  key: string;
  header: string;
  align?: "left" | "right";
  kind: ColumnKind;
  /** The display string shown in the table cell. */
  cell: (row: Row) => string;
  /** The raw value used for sorting and CSV/print export. */
  value: (row: Row) => string | number;
};

type SortState = { key: string; direction: "asc" | "desc" } | null;

/** Formats a number with grouping for tables and facts. */
const fmt = (n: number) => n.toLocaleString("en-US");

export default function FAHRReports() {
  const { toast } = useToast();
  const { ministries, submissions, credentials } = useFederalData();

  const [reportType, setReportType] = useState<ReportTypeId>("engagement");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>(() => ministries.map((m) => m.id));
  const [periodId, setPeriodId] = useState<string>(DEFAULT_REPORT_PERIOD);
  const [sort, setSort] = useState<SortState>(null);

  const period = REPORT_PERIOD_BY_ID[periodId] ?? REPORT_PERIOD_BY_ID[DEFAULT_REPORT_PERIOD];

  // Entities in scope, in the authored order. Everything below re-derives from
  // these two facts, so a filter change moves the KPI row, charts and table.
  const scopedMinistries = useMemo(
    () => ministries.filter((m) => selectedEntityIds.includes(m.id)),
    [ministries, selectedEntityIds],
  );

  const scope: ReportScope = useMemo(() => ({ ministries: scopedMinistries, period }), [scopedMinistries, period]);
  const national = useMemo(() => nationalLine(scopedMinistries), [scopedMinistries]);
  const reportMeta = REPORT_TYPES.find((r) => r.id === reportType)!;
  const hasScope = scopedMinistries.length > 0;

  const allSelected = selectedEntityIds.length === ministries.length;

  const toggleEntity = (id: string) => {
    setSelectedEntityIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSort(null);
  };

  // Reset sort when the report type changes so a stale key can't crash a sort.
  const changeReport = (id: ReportTypeId) => {
    setReportType(id);
    setSort(null);
  };

  const periodLabel = period?.label ?? "Rolling 12 months";
  const entityLabel = allSelected
    ? `All ${ministries.length} entities`
    : `${scopedMinistries.length} of ${ministries.length} entities`;

  // ---- Column and row definitions per report ----------------------------
  type EngRow = ReturnType<typeof engagementRows>[number];
  type CompRow = ReturnType<typeof competencyRows>[number];
  type AssessRow = ReturnType<typeof assessmentRows>[number];
  type CertRow = ReturnType<typeof certificationRows>[number];
  type ImpRow = ReturnType<typeof impactRows>[number];

  const engColumns: Column<EngRow>[] = [
    { key: "entity", header: "Entity", kind: "text", cell: (r) => r.entity, value: (r) => r.entity },
    { key: "employees", header: "Targeted workforce", kind: "number", align: "right", cell: (r) => fmt(r.employees), value: (r) => r.employees },
    { key: "activeLearners", header: "Active learners", kind: "number", align: "right", cell: (r) => fmt(r.activeLearners), value: (r) => r.activeLearners },
    { key: "coverage", header: "Coverage", kind: "percent", align: "right", cell: (r) => `${r.coverage}%`, value: (r) => r.coverage },
    { key: "learningHours", header: "Learning hours", kind: "number", align: "right", cell: (r) => fmt(r.learningHours), value: (r) => r.learningHours },
    { key: "pathwayCompletions", header: "Pathway completions", kind: "number", align: "right", cell: (r) => fmt(r.pathwayCompletions), value: (r) => r.pathwayCompletions },
    { key: "readiness", header: "Readiness", kind: "percent", align: "right", cell: (r) => `${r.readiness}%`, value: (r) => r.readiness },
  ];

  const compColumns: Column<CompRow>[] = [
    { key: "competency", header: "Competency", kind: "text", cell: (r) => r.competency, value: (r) => r.competency },
    { key: "score", header: "Average capability", kind: "percent", align: "right", cell: (r) => `${r.score}%`, value: (r) => r.score },
    { key: "learnersInDevelopment", header: "Learners in development", kind: "number", align: "right", cell: (r) => fmt(r.learnersInDevelopment), value: (r) => r.learnersInDevelopment },
    { key: "entitiesReportingGap", header: "Entities reporting gap", kind: "number", align: "right", cell: (r) => fmt(r.entitiesReportingGap), value: (r) => r.entitiesReportingGap },
    { key: "trend", header: "Trend", kind: "text", cell: (r) => r.trend, value: (r) => r.trend },
  ];

  const assessColumns: Column<AssessRow>[] = [
    { key: "entity", header: "Entity", kind: "text", cell: (r) => r.entity, value: (r) => r.entity },
    { key: "assessmentsCompleted", header: "Assessments completed", kind: "number", align: "right", cell: (r) => fmt(r.assessmentsCompleted), value: (r) => r.assessmentsCompleted },
    { key: "averageBaseline", header: "Average baseline", kind: "percent", align: "right", cell: (r) => `${r.averageBaseline}%`, value: (r) => r.averageBaseline },
    { key: "atPractitionerOrAbove", header: "At Practitioner or above", kind: "number", align: "right", cell: (r) => fmt(r.atPractitionerOrAbove), value: (r) => r.atPractitionerOrAbove },
    { key: "reassessments", header: "Re-assessments", kind: "number", align: "right", cell: (r) => fmt(r.reassessments), value: (r) => r.reassessments },
  ];

  const certColumns: Column<CertRow>[] = [
    { key: "entity", header: "Entity", kind: "text", cell: (r) => r.entity, value: (r) => r.entity },
    { key: "issued", header: "Credentials issued", kind: "number", align: "right", cell: (r) => fmt(r.issued), value: (r) => r.issued },
    { key: "practitioner", header: "Practitioner", kind: "number", align: "right", cell: (r) => fmt(r.practitioner), value: (r) => r.practitioner },
    { key: "advanced", header: "Advanced", kind: "number", align: "right", cell: (r) => fmt(r.advanced), value: (r) => r.advanced },
    { key: "champion", header: "Champion", kind: "number", align: "right", cell: (r) => fmt(r.champion), value: (r) => r.champion },
    { key: "issuedThisPeriod", header: "Issued this period", kind: "number", align: "right", cell: (r) => fmt(r.issuedThisPeriod), value: (r) => r.issuedThisPeriod },
    { key: "onRegister", header: "On register", kind: "number", align: "right", cell: (r) => fmt(r.onRegister), value: (r) => r.onRegister },
  ];

  const impColumns: Column<ImpRow>[] = [
    { key: "entity", header: "Entity", kind: "text", cell: (r) => r.entity, value: (r) => r.entity },
    { key: "projects", header: "Projects submitted", kind: "number", align: "right", cell: (r) => fmt(r.projects), value: (r) => r.projects },
    { key: "deployed", header: "Deployed", kind: "number", align: "right", cell: (r) => fmt(r.deployed), value: (r) => r.deployed },
    { key: "hoursSavedPerMonth", header: "Hours saved / month", kind: "number", align: "right", cell: (r) => fmt(r.hoursSavedPerMonth), value: (r) => r.hoursSavedPerMonth },
    { key: "valueCreatedAedM", header: "Est. value (AED M)", kind: "number", align: "right", cell: (r) => r.valueCreatedAedM.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), value: (r) => r.valueCreatedAedM },
    { key: "projectsThisPeriod", header: "Projects this period", kind: "number", align: "right", cell: (r) => fmt(r.projectsThisPeriod), value: (r) => r.projectsThisPeriod },
  ];

  // Raw rows for the active report, before sorting.
  const rawRows = useMemo(() => {
    switch (reportType) {
      case "engagement":
        return engagementRows(scope);
      case "competency":
        return competencyRows(scope);
      case "assessment":
        return assessmentRows(scope);
      case "certification":
        return certificationRows(scope, credentials);
      case "impact":
        return impactRows(scope, submissions);
    }
  }, [reportType, scope, credentials, submissions]);

  const columns = useMemo(() => {
    switch (reportType) {
      case "engagement":
        return engColumns as Column<unknown>[];
      case "competency":
        return compColumns as Column<unknown>[];
      case "assessment":
        return assessColumns as Column<unknown>[];
      case "certification":
        return certColumns as Column<unknown>[];
      case "impact":
        return impColumns as Column<unknown>[];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  const sortedRows = useMemo(() => {
    const rows = [...(rawRows as unknown[])];
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    return rows.sort((a, b) => {
      const av = col.value(a);
      const bv = col.value(b);
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [rawRows, columns, sort]);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "desc" };
      if (prev.direction === "desc") return { key, direction: "asc" };
      return null;
    });
  };

  // ---- Totals row (only over numeric columns that make sense to sum) ------
  const numericTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const col of columns) {
      if (col.kind !== "number") continue;
      // Percentages and trends are never summed; averages are not summed here
      // because the national roll-up already carries the weighted figure.
      totals[col.key] = (rawRows as unknown[]).reduce<number>((sum, row) => sum + Number(col.value(row) || 0), 0);
    }
    return totals;
  }, [columns, rawRows]);

  // ---- KPI row per report -------------------------------------------------
  const kpis = useMemo(() => {
    const base = [
      { key: "entities", label: "Entities in scope", to: national.entities, suffix: `/${national.ofEntities}`, icon: Building2 },
    ];
    switch (reportType) {
      case "engagement":
        return [
          ...base,
          { key: "learners", label: "Active learners", to: national.activeLearners, icon: Activity },
          { key: "coverage", label: "Workforce coverage", to: national.coverage, suffix: "%", icon: Zap },
          { key: "readiness", label: "Readiness index", to: national.readiness, suffix: "%", icon: Award },
        ];
      case "competency":
        return [
          ...base,
          { key: "readiness", label: "Average capability", to: national.readiness, suffix: "%", icon: Zap },
          { key: "learners", label: "Active learners", to: national.activeLearners, icon: Activity },
          { key: "dev", label: "Learners in development", to: (rawRows as CompRow[]).reduce((a, r) => a + r.learnersInDevelopment, 0), icon: Award },
        ];
      case "assessment":
        return [
          ...base,
          { key: "completed", label: "Assessments completed", to: (rawRows as AssessRow[]).reduce((a, r) => a + r.assessmentsCompleted, 0), icon: Activity },
          { key: "baseline", label: "Average baseline", to: national.readiness, suffix: "%", icon: Zap },
          { key: "practitioner", label: "At Practitioner or above", to: (rawRows as AssessRow[]).reduce((a, r) => a + r.atPractitionerOrAbove, 0), icon: Award },
        ];
      case "certification":
        return [
          ...base,
          { key: "credentials", label: "Credentials issued", to: national.credentials, icon: Award },
          { key: "thisPeriod", label: "Issued this period", to: (rawRows as CertRow[]).reduce((a, r) => a + r.issuedThisPeriod, 0), icon: Activity },
          { key: "onRegister", label: "On register", to: (rawRows as CertRow[]).reduce((a, r) => a + r.onRegister, 0), icon: Building2 },
        ];
      case "impact":
        return [
          ...base,
          { key: "projects", label: "Projects submitted", to: national.projects, icon: Rocket },
          { key: "hours", label: "Hours saved / month", to: national.hoursSavedPerMonth, icon: Clock },
          { key: "value", label: "Est. value (AED M)", to: national.valueCreatedAedM, decimals: 1, prefix: "AED ", suffix: "M", icon: Coins },
        ];
    }
  }, [reportType, national, rawRows]);

  // ---- Chart data per report ----------------------------------------------
  const ladder = useMemo(() => ladderRows(scopedMinistries), [scopedMinistries]);

  // ---- Exports ------------------------------------------------------------
  const exportCsv = () => {
    if (!hasScope) return;
    const headers = columns.map((c) => c.header);
    const rows = (sortedRows as unknown[]).map((row) => columns.map((c) => c.value(row)));
    // Totals row for the numeric columns, matching the on-screen totals.
    rows.push(
      columns.map((c, i) => {
        if (i === 0) return "Total";
        if (c.kind === "number") return numericTotals[c.key];
        return "";
      }),
    );
    const filename = downloadCsv({
      filename: `fahr-${reportType}-report-${period.id}`,
      headers,
      rows,
    });
    toast({ title: "CSV exported", description: `${filename} downloaded with ${sortedRows.length} entity rows.` });
  };

  const exportPrint = () => {
    if (!hasScope) return;
    const numericColumns = columns.map((c, i) => (c.align === "right" ? i : -1)).filter((i) => i >= 0);
    const tableRows = (sortedRows as unknown[]).map((row) => columns.map((c) => c.cell(row)));
    tableRows.push(
      columns.map((c, i) => {
        if (i === 0) return "Total";
        if (c.kind === "number") return fmt(numericTotals[c.key]);
        return "";
      }),
    );
    printReport({
      title: `Programme ${reportMeta.label.toLowerCase()} report`,
      subtitle: reportMeta.description,
      meta: [`Period: ${periodLabel}`, entityLabel, `Reference: ${reportMeta.reference}`, `Generated: ${new Date().toISOString().slice(0, 10)}`],
      sections: [
        {
          heading: "National summary",
          facts: [
            { label: "Entities in scope", value: `${national.entities} of ${national.ofEntities}` },
            { label: "Active learners", value: fmt(national.activeLearners) },
            { label: "Workforce coverage", value: `${national.coverage}%` },
            { label: "Readiness index", value: `${national.readiness}%` },
            { label: "Credentials issued", value: fmt(national.credentials) },
            { label: "Est. value (AED M)", value: national.valueCreatedAedM.toFixed(1) },
          ],
        },
        {
          heading: `${reportMeta.label} — by entity`,
          paragraphs: [`Measures: ${reportMeta.measures.join(" · ")}.`],
          table: { headers: columns.map((c) => c.header), rows: tableRows, numericColumns },
        },
      ],
      footnote: REPORT_NOTES[reportType],
    });
    toast({ title: "Print pack opened", description: "The print dialogue carries the current filters." });
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (!sort || sort.key !== colKey) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sort.direction === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Programme reporting"
          description="Engagement, competency, assessment, certification and impact reporting across entities."
          actions={
            <>
              <Button variant="outline" onClick={exportCsv} disabled={!hasScope} data-testid="button-export-csv">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button onClick={exportPrint} disabled={!hasScope} data-testid="button-print-report">
                <Printer className="w-4 h-4 mr-2" /> Print / PDF
              </Button>
            </>
          }
        />

        {/* Filter bar */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Report type">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  role="tab"
                  aria-selected={reportType === rt.id}
                  onClick={() => changeReport(rt.id)}
                  data-testid={`tab-${rt.id}`}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    reportType === rt.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between min-w-[220px]" data-testid="button-entity-filter">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {entityLabel}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-sm font-medium">Entities in scope</span>
                    <div className="flex gap-2">
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                          setSelectedEntityIds(ministries.map((m) => m.id));
                          setSort(null);
                        }}
                        data-testid="button-entity-all"
                      >
                        All
                      </button>
                      <button
                        className="text-xs text-muted-foreground hover:underline"
                        onClick={() => {
                          setSelectedEntityIds([]);
                          setSort(null);
                        }}
                        data-testid="button-entity-none"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {ministries.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/60 transition-colors"
                        data-testid={`row-entity-option-${m.id}`}
                      >
                        <Checkbox
                          checked={selectedEntityIds.includes(m.id)}
                          onCheckedChange={() => toggleEntity(m.id)}
                          data-testid={`input-entity-${m.id}`}
                        />
                        <span className="flex-1">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Select
                value={periodId}
                onValueChange={(v) => {
                  setPeriodId(v);
                  setSort(null);
                }}
              >
                <SelectTrigger className="w-[220px]" data-testid="input-period">
                  <SelectValue placeholder="Reporting period" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_PERIODS.map((p) => (
                    <SelectItem key={p.id} value={p.id} data-testid={`row-period-${p.id}`}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{reportMeta.reference}</span> · {reportMeta.measures.join(" · ")}
              </div>
            </div>
          </CardContent>
        </Card>

        {!hasScope ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center text-center gap-3">
              <FileBarChart className="w-10 h-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No entities selected</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Select at least one entity above to derive the {reportMeta.label.toLowerCase()} report. Nothing is shown
                while the entity filter is empty.
              </p>
              <Button variant="outline" onClick={() => setSelectedEntityIds(ministries.map((m) => m.id))}>
                Select all entities
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI row */}
            <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4" as="div">
              {kpis.map((kpi, i) => (
                <StaggerItem key={kpi.key}>
                  <Card>
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <kpi.icon className="w-6 h-6 mb-2 text-primary" />
                      <p className="text-2xl font-bold" data-testid={`kpi-${kpi.key}`}>
                        <CountUp
                          to={kpi.to}
                          decimals={"decimals" in kpi ? (kpi as { decimals?: number }).decimals : 0}
                          prefix={"prefix" in kpi ? (kpi as { prefix?: string }).prefix : undefined}
                          suffix={"suffix" in kpi ? (kpi as { suffix?: string }).suffix : undefined}
                        />
                      </p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reportType === "engagement" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Coverage by entity</CardTitle>
                    <CardDescription>Share of the targeted workforce that is learning</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ChartReveal className="h-full" direction="wipe">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(rawRows as EngRow[]).map((r) => ({ name: r.short, value: r.coverage }))} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} unit="%" />
                          <YAxis dataKey="name" type="category" width={90} fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: "transparent" }} formatter={(v: number) => [`${v}%`, "Coverage"]} />
                          <Bar dataKey="value" fill={CHART_FILL} radius={[0, 4, 4, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartReveal>
                  </CardContent>
                </Card>
              )}

              {reportType === "competency" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Average capability by competency</CardTitle>
                      <CardDescription>Weighted mean across entities in scope</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ChartReveal className="h-full" direction="wipe">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(rawRows as CompRow[]).map((r) => ({ name: r.competency, value: r.score }))} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} unit="%" />
                            <YAxis dataKey="name" type="category" width={130} fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: "transparent" }} formatter={(v: number) => [`${v}%`, "Capability"]} />
                            <Bar dataKey="value" fill={CHART_FILL} radius={[0, 4, 4, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartReveal>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Capability ladder distribution</CardTitle>
                      <CardDescription>Learners across the ladder in scope</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ChartReveal className="h-full" direction="rise">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ladder.map((l) => ({ name: l.label, value: l.learners }))} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: "transparent" }} formatter={(v: number) => [fmt(v), "Learners"]} />
                            <Bar dataKey="value" fill={CHART_FILL_ALT} radius={[4, 4, 0, 0]} barSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartReveal>
                    </CardContent>
                  </Card>
                </>
              )}

              {reportType === "assessment" && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Baseline vs at Practitioner or above</CardTitle>
                    <CardDescription>Assessments completed and how many reach Practitioner, by entity</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ChartReveal className="h-full" direction="rise">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(rawRows as AssessRow[]).map((r) => ({ name: r.short, completed: r.assessmentsCompleted, practitioner: r.atPractitionerOrAbove }))} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                          <YAxis fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: "transparent" }} />
                          <Bar dataKey="completed" name="Assessed" fill={CHART_FILL} radius={[4, 4, 0, 0]} barSize={14} />
                          <Bar dataKey="practitioner" name="At Practitioner+" fill={CHART_FILL_ALT} radius={[4, 4, 0, 0]} barSize={14} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartReveal>
                  </CardContent>
                </Card>
              )}

              {reportType === "certification" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Credentials by entity</CardTitle>
                      <CardDescription>Total credentials issued to date</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ChartReveal className="h-full" direction="wipe">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(rawRows as CertRow[]).map((r) => ({ name: r.short, value: r.issued }))} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis dataKey="name" type="category" width={90} fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: "transparent" }} formatter={(v: number) => [fmt(v), "Credentials"]} />
                            <Bar dataKey="value" fill={CHART_FILL} radius={[0, 4, 4, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartReveal>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Credentials by capability level</CardTitle>
                      <CardDescription>Practitioner, Advanced and Champion across the scope</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ChartReveal className="h-full" direction="rise">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: "Practitioner", value: (rawRows as CertRow[]).reduce((a, r) => a + r.practitioner, 0) },
                              { name: "Advanced", value: (rawRows as CertRow[]).reduce((a, r) => a + r.advanced, 0) },
                              { name: "Champion", value: (rawRows as CertRow[]).reduce((a, r) => a + r.champion, 0) },
                            ]}
                            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: "transparent" }} formatter={(v: number) => [fmt(v), "Credentials"]} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                              {["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))"].map((c, i) => (
                                <Cell key={i} fill={c} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartReveal>
                    </CardContent>
                  </Card>
                </>
              )}

              {reportType === "impact" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hours saved per month by entity</CardTitle>
                      <CardDescription>Estimated monthly hours returned</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ChartReveal className="h-full" direction="wipe">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(rawRows as ImpRow[]).map((r) => ({ name: r.short, value: r.hoursSavedPerMonth }))} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis dataKey="name" type="category" width={90} fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: "transparent" }} formatter={(v: number) => [fmt(v), "Hours / month"]} />
                            <Bar dataKey="value" fill={CHART_FILL} radius={[0, 4, 4, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartReveal>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Estimated value created by entity</CardTitle>
                      <CardDescription>AED millions per year</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ChartReveal className="h-full" direction="rise">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={(rawRows as ImpRow[]).map((r) => ({ name: r.short, value: r.valueCreatedAedM }))} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: "transparent" }} formatter={(v: number) => [`AED ${v}M`, "Value"]} />
                            <Bar dataKey="value" fill={CHART_FILL_ALT} radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartReveal>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Data table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{reportMeta.label} — {periodLabel}</CardTitle>
                <CardDescription>{reportMeta.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map((col) => (
                          <TableHead key={col.key} className={col.align === "right" ? "text-right" : ""}>
                            <button
                              className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
                                col.align === "right" ? "flex-row-reverse" : ""
                              }`}
                              onClick={() => toggleSort(col.key)}
                              data-testid={`button-sort-${col.key}`}
                            >
                              {col.header}
                              <SortIcon colKey={col.key} />
                            </button>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <Stagger as="tbody" gap={0.02}>
                      {(sortedRows as unknown[]).map((row, ri) => (
                        <StaggerItem as="tr" variant="row" key={ri} className="border-b border-border hover:bg-muted/50 transition-colors" data-testid={`row-report-${ri}`}>
                          {columns.map((col) => (
                            <TableCell key={col.key} className={col.align === "right" ? "text-right tabular-nums" : "font-medium"}>
                              {col.kind === "text" && (col.key === "trend" ) ? (
                                <Badge variant="outline" className={trendClass(col.cell(row))}>{col.cell(row)}</Badge>
                              ) : (
                                col.cell(row)
                              )}
                            </TableCell>
                          ))}
                        </StaggerItem>
                      ))}
                    </Stagger>
                    <TableFooter>
                      <TableRow className="font-semibold bg-muted/40" data-testid="row-report-total">
                        {columns.map((col, i) => (
                          <TableCell key={col.key} className={col.align === "right" ? "text-right tabular-nums" : ""}>
                            {i === 0 ? "Total" : col.kind === "number" ? fmt(numericTotals[col.key]) : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  <span className="font-medium text-foreground">How this is derived: </span>
                  {REPORT_NOTES[reportType]}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </PageEnter>
    </Layout>
  );
}

/** Legible pill colours for the competency trend column. */
function trendClass(trend: string): string {
  if (trend === "rising") return "bg-green-50 text-green-700 border-green-200";
  if (trend === "declining") return "bg-red-50 text-destructive border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}
