import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Users,
  Bot,
  Zap,
  Lightbulb,
  Rocket,
  Activity,
  ChevronRight,
  User,
  Award,
  Download,
  Printer,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CAPABILITY_LEVELS, AGENTS } from "@/lib/constants";
import { useFederalData } from "@/lib/FederalDataContext";
import { CountUp, ChartReveal, MOTION, PageEnter, Stagger, StaggerItem } from "@/components/motion";
import { AIAnalysisPanel } from "@/components/ai/AIAnalysis";
import { downloadCsv, printReport, stampedFilename, type CsvRow } from "@/lib/exportFile";
import {
  DEPARTMENT_BY_ID,
  LEVEL_BY_ID,
  MINISTRY_BY_ID,
  SUBMISSION_STATE_LABEL,
  competencyLabel,
  departmentsOf,
  nationalGaps,
  nationalLine,
  peopleOf,
  type Person,
} from "@/lib/federal";

/** Entities shown in the federal comparison chart and value breakdown. */
const TOP_ENTITY_COUNT = 4;

type DrillLevel = "federal" | "ministry" | "department" | "individual";

const DRILL_DEPTH: Record<DrillLevel, number> = { federal: 0, ministry: 1, department: 2, individual: 3 };

export default function FAHRDashboard() {
  const { toast } = useToast();
  const { ministries, submissions, credentials, getPerson } = useFederalData();
  const reduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();

  const [drillLevel, setDrillLevel] = useState<DrillLevel>("federal");
  const [previousDepth, setPreviousDepth] = useState(0);
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [selectedIndividual, setSelectedIndividual] = useState<Person | null>(null);
  const [individualTab, setIndividualTab] = useState<"journey" | "projects">("journey");

  /**
   * Other screens link straight into an entity's view, e.g. the entity
   * administration table's "Open in national drill-down".
   */
  const requestedMinistry = searchParams.get("ministry");
  useEffect(() => {
    if (!requestedMinistry || !MINISTRY_BY_ID[requestedMinistry]) return;
    setSelectedMinistryId(requestedMinistry);
    setPreviousDepth(0);
    setDrillLevel("ministry");
  }, [requestedMinistry]);

  /** National figures are summed from the live entity records, not a constant. */
  const national = useMemo(() => nationalLine(ministries), [ministries]);
  const twins = useMemo(() => ministries.reduce((sum, m) => sum + m.twins, 0), [ministries]);

  const kpis = useMemo(
    () => [
      { label: "Federal employees targeted", value: national.employees, icon: Users },
      { label: "Active learners", value: national.activeLearners, icon: Activity },
      { label: "Federal readiness", value: national.readiness, suffix: "%", icon: Zap },
      { label: "AI digital twins", value: twins, icon: Bot },
      { label: "Projects submitted", value: national.projects, icon: Rocket },
      {
        label: "Est. value created",
        value: national.valueCreatedAedM,
        prefix: "AED ",
        suffix: "M",
        decimals: 1,
        icon: Lightbulb,
      },
    ],
    [national, twins],
  );

  /** The entities the federal view leads with, largest workforce first. */
  const leadEntities = useMemo(
    () => [...ministries].sort((a, b) => b.employees - a.employees).slice(0, TOP_ENTITY_COUNT),
    [ministries],
  );

  const selectedMinistry = selectedMinistryId ? MINISTRY_BY_ID[selectedMinistryId] : null;
  const selectedDepartment = selectedDepartmentId ? DEPARTMENT_BY_ID[selectedDepartmentId] : null;

  const departments = useMemo(
    () => (selectedMinistryId ? departmentsOf(selectedMinistryId) : []),
    [selectedMinistryId],
  );
  const individuals = useMemo(
    () => (selectedDepartmentId ? peopleOf(selectedDepartmentId) : []),
    [selectedDepartmentId],
  );

  const federalChartData = leadEntities.map((m) => ({ id: m.id, name: m.shortName, score: m.readiness }));
  const ministryChartData = departments.map((d) => ({ id: d.id, name: d.name.split(" ")[0], score: d.readiness }));

  /** Value contribution, so the bars reconcile with the federal headline. */
  const valueBreakdown = useMemo(() => {
    const top = [...ministries].sort((a, b) => b.valueCreatedAedM - a.valueCreatedAedM).slice(0, 3);
    const other =
      Math.round((national.valueCreatedAedM - top.reduce((a, m) => a + m.valueCreatedAedM, 0)) * 10) / 10;
    return [
      ...top.map((m) => ({ label: m.shortName, value: m.valueCreatedAedM })),
      { label: "All other entities", value: other },
    ];
  }, [ministries, national.valueCreatedAedM]);

  const gaps = useMemo(() => nationalGaps(), []);
  const strongest = useMemo(
    () => [...ministries].sort((a, b) => b.readiness - a.readiness).slice(0, 3),
    [ministries],
  );

  const projectsFor = (personId: string) => submissions.filter((s) => s.personId === personId);
  const credentialsFor = (personId: string) => credentials.filter((c) => c.personId === personId);

  /** Drill transitions animate in the direction of travel. */
  const goTo = (level: DrillLevel) => {
    setPreviousDepth(DRILL_DEPTH[drillLevel]);
    setDrillLevel(level);
  };
  const direction = DRILL_DEPTH[drillLevel] >= previousDepth ? 1 : -1;

  const handleMinistryClick = (ministryId: string) => {
    setSelectedMinistryId(ministryId);
    setSelectedDepartmentId(null);
    setSelectedIndividual(null);
    goTo("ministry");
  };

  const handleDeptClick = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setSelectedIndividual(null);
    goTo("department");
  };

  const handleIndividualClick = (person: Person, tab: "journey" | "projects" = "journey") => {
    setSelectedIndividual(person);
    setIndividualTab(tab);
    goTo("individual");
  };

  // ------------------------------------------------------------------
  // Exports — the file always carries the view the operator is looking at
  // ------------------------------------------------------------------

  type ViewExport = { title: string; headers: string[]; rows: CsvRow[]; facts: { label: string; value: string }[] };

  const viewExport = (): ViewExport => {
    if (drillLevel === "ministry" && selectedMinistry) {
      return {
        title: `${selectedMinistry.name} — departments`,
        headers: ["Department", "Employees", "Active learners", "Readiness %"],
        rows: departments.map((d) => [d.name, d.employees, d.activeLearners, d.readiness]),
        facts: [
          { label: "Readiness", value: `${selectedMinistry.readiness}%` },
          { label: "Active learners", value: selectedMinistry.activeLearners.toLocaleString() },
          { label: "Priority gap", value: competencyLabel(selectedMinistry.topGapCompetencyId) },
          {
            label: "Token quota",
            value: `${selectedMinistry.tokensUsedM}M of ${selectedMinistry.tokenQuotaM}M used`,
          },
        ],
      };
    }
    if (drillLevel === "department" && selectedDepartment) {
      return {
        title: `${selectedDepartment.name} — learners`,
        headers: ["Learner", "Role", "Capability level", "Assessment %", "Pathway %", "Projects"],
        rows: individuals.map((p) => [
          p.name,
          p.role,
          LEVEL_BY_ID[p.levelId]?.label ?? p.levelId,
          p.assessmentScore,
          p.pathwayProgress,
          projectsFor(p.id).length,
        ]),
        facts: [
          { label: "Employees", value: selectedDepartment.employees.toLocaleString() },
          { label: "Active learners", value: selectedDepartment.activeLearners.toLocaleString() },
          { label: "Readiness", value: `${selectedDepartment.readiness}%` },
        ],
      };
    }
    if (drillLevel === "individual" && selectedIndividual) {
      return {
        title: `${selectedIndividual.name} — workplace projects`,
        headers: ["Project", "State", "Impact", "Hours saved / month", "Est. value (AED)", "Submitted"],
        rows: projectsFor(selectedIndividual.id).map((s) => [
          s.title,
          SUBMISSION_STATE_LABEL[s.state],
          s.impact,
          s.hoursSavedPerMonth,
          s.estimatedValueAed,
          s.submittedOn,
        ]),
        facts: [
          { label: "Role", value: selectedIndividual.role },
          {
            label: "Capability level",
            value: LEVEL_BY_ID[selectedIndividual.levelId]?.label ?? selectedIndividual.levelId,
          },
          { label: "Assessment", value: `${selectedIndividual.assessmentScore}%` },
          { label: "Pathway progress", value: `${selectedIndividual.pathwayProgress}%` },
          { label: "Credentials", value: String(credentialsFor(selectedIndividual.id).length) },
        ],
      };
    }
    return {
      title: "Federal entity comparison",
      headers: [
        "Entity",
        "Readiness %",
        "Active learners",
        "Digital twins",
        "Projects",
        "Est. value (AED M)",
        "Priority gap",
      ],
      rows: ministries.map((m) => [
        m.name,
        m.readiness,
        m.activeLearners,
        m.twins,
        m.projectsSubmitted,
        m.valueCreatedAedM,
        competencyLabel(m.topGapCompetencyId),
      ]),
      facts: [
        { label: "Entities on the programme", value: `${national.entities} of ${national.ofEntities}` },
        { label: "Workforce targeted", value: national.employees.toLocaleString() },
        { label: "Active learners", value: national.activeLearners.toLocaleString() },
        { label: "Federal readiness", value: `${national.readiness}%` },
        { label: "Est. value created", value: `AED ${national.valueCreatedAedM}M` },
      ],
    };
  };

  const handleExportCsv = () => {
    const view = viewExport();
    const filename = stampedFilename(`fahr-${drillLevel}-view`, "csv");
    downloadCsv({ filename, headers: view.headers, rows: view.rows });
    toast({ title: "Export downloaded", description: `${view.title} — ${filename}` });
  };

  const handlePrintView = () => {
    const view = viewExport();
    printReport({
      title: "FAHR AI Learning Platform",
      subtitle: view.title,
      meta: [
        `View: ${drillLevel === "federal" ? "Federal" : drillLevel.charAt(0).toUpperCase() + drillLevel.slice(1)}`,
        `Entities on the programme: ${national.entities}`,
      ],
      sections: [
        { heading: "Headline figures", facts: view.facts },
        {
          heading: view.title,
          table: { headers: view.headers, rows: view.rows },
        },
      ],
      footnote:
        "Figures are summed from the entity records held on the platform and reconcile with the entity and manager views.",
    });
  };

  // ------------------------------------------------------------------
  // Individual-level actions
  // ------------------------------------------------------------------

  const drillContent = () => {
    if (drillLevel === "federal") {
      return (
        <div className="space-y-6">
          {/* Analytics agent insight, read from the live entity records. */}
          <AIAnalysisPanel
            agent={AGENTS.analytics}
            title="Federal Adoption Insights"
            sources={`${national.ofEntities} entities · ${national.activeLearners.toLocaleString()} learners`}
            steps={[
              "Aggregating entity readiness scores",
              "Identifying common capability gaps across the federal workforce",
              "Evaluating momentum trends",
              "Synthesising intervention recommendations"
            ]}
            className="bg-primary/5 border-primary/20"
          >
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold text-foreground">Insight 1:</span> Adoption is strongest in{" "}
                {strongest.map((m) => m.shortName).join(", ")}, all at or above{" "}
                {strongest[strongest.length - 1]?.readiness}% readiness.
              </p>
              <p>
                <span className="font-semibold text-foreground">Insight 2:</span> The biggest capability gap
                across entities is {gaps[0] ? competencyLabel(gaps[0].competency.id) : "—"}, reported by{" "}
                {gaps[0]?.ministries ?? 0} of {national.ofEntities}.
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <span>
                  <span className="font-semibold text-primary">Recommendation:</span> Run a federal challenge on{" "}
                  {gaps[0] ? competencyLabel(gaps[0].competency.id) : "capability transfer"} next quarter.
                </span>
                <Link
                  href="/fahr/communications"
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  data-testid="link-launch-campaign"
                >
                  Compose the campaign
                </Link>
              </p>
            </div>
          </AIAnalysisPanel>

          <Stagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi, i) => (
              <StaggerItem key={kpi.label}>
                <StatCard className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <kpi.icon className="w-6 h-6 mb-2 text-primary" />
                    <p className="text-2xl font-bold" data-testid={`kpi-fahr-${i}`}>
                      <CountUp
                        to={kpi.value}
                        decimals={kpi.decimals ?? 0}
                        prefix={kpi.prefix}
                        suffix={kpi.suffix}
                      />
                    </p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </CardContent>
                </StatCard>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIAnalysisPanel
              agent={AGENTS.analytics}
              title="Federal AI readiness by entity"
              steps={[
                "Processing entity readiness scores",
                "Ranking by overall capability adoption",
                "Generating comparative visualization"
              ]}
              className="h-full"
            >
              <Card className="h-full border-0 shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                  <CardDescription>Click a bar to drill into the entity.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <ChartReveal className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={federalChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} fontSize={12} />
                      <Tooltip cursor={{ fill: "transparent" }} formatter={(value) => [`${value}%`, "Readiness"]} />
                      <Bar
                        dataKey="score"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={(data: { payload?: { id?: string } }) => {
                          const id = data?.payload?.id;
                          if (id) handleMinistryClick(id);
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartReveal>
              </CardContent>
            </Card>
            </AIAnalysisPanel>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Est. value created by entity (AED millions)</CardTitle>
                <CardDescription>Contributions to the AED {national.valueCreatedAedM}M federal total</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartReveal className="h-[300px]" direction="rise">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={valueBreakdown} margin={{ top: 24, right: 12, left: -12, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" fontSize={11} axisLine={false} tickLine={false} interval={0} />
                      <YAxis fontSize={11} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "transparent" }} formatter={(value) => [`AED ${value}M`, "Value"]} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={44}>
                        {valueBreakdown.map((bar, i) => (
                          <Cell
                            key={bar.label}
                            fill={
                              i === 3
                                ? "hsl(var(--muted-foreground) / 0.4)"
                                : i === 2
                                  ? "hsl(var(--accent))"
                                  : i === 1
                                    ? "hsl(var(--secondary))"
                                    : "hsl(var(--primary))"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartReveal>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entity comparison</CardTitle>
              <CardDescription>Click any row to drill down. Figures are the live entity records.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead className="text-right">Readiness</TableHead>
                      <TableHead className="text-right">Learners</TableHead>
                      <TableHead className="text-right">Digital twins</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Est. value</TableHead>
                      <TableHead>Priority gap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Stagger as="tbody" gap={MOTION.stagger.rows}>
                    {ministries.map((min) => (
                      <StaggerItem
                        as="tr"
                        variant="row"
                        key={min.id}
                        className="cursor-pointer border-b transition-colors hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none"
                        data-testid={`row-ministry-${min.id}`}
                      >
                        <TableCell
                          className="font-medium text-nowrap text-primary"
                          onClick={() => handleMinistryClick(min.id)}
                        >
                          <button className="text-left hover:underline" data-testid={`button-ministry-${min.id}`}>
                            {min.name}
                          </button>
                        </TableCell>
                        <TableCell className="text-right font-bold" onClick={() => handleMinistryClick(min.id)}>
                          {min.readiness}%
                        </TableCell>
                        <TableCell className="text-right" onClick={() => handleMinistryClick(min.id)}>
                          {min.activeLearners.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right" onClick={() => handleMinistryClick(min.id)}>
                          {min.twins.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right" onClick={() => handleMinistryClick(min.id)}>
                          {min.projectsSubmitted.toLocaleString()}
                        </TableCell>
                        <TableCell
                          className="text-right text-primary font-medium"
                          onClick={() => handleMinistryClick(min.id)}
                        >
                          AED {min.valueCreatedAedM}M
                        </TableCell>
                        <TableCell onClick={() => handleMinistryClick(min.id)}>
                          <Badge variant="outline">{competencyLabel(min.topGapCompetencyId)}</Badge>
                        </TableCell>
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

    if (drillLevel === "ministry" && selectedMinistry) {
      const quotaUse = Math.min(100, Math.round((selectedMinistry.tokensUsedM / selectedMinistry.tokenQuotaM) * 100));
      return (
        <div className="space-y-6">
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Readiness", value: selectedMinistry.readiness, suffix: "%" },
              { label: "Active learners", value: selectedMinistry.activeLearners },
              { label: "Projects submitted", value: selectedMinistry.projectsSubmitted },
              { label: "Credentials issued", value: selectedMinistry.credentialsIssued },
            ].map((kpi) => (
              <StaggerItem key={kpi.label}>
                <StatCard className="h-full">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold">
                      <CountUp to={kpi.value} suffix={kpi.suffix} />
                    </p>
                  </CardContent>
                </StatCard>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">{selectedMinistry.name}</CardTitle>
                <CardDescription>Readiness by department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ChartReveal className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ministryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} fontSize={12} />
                      <Tooltip cursor={{ fill: "transparent" }} formatter={(value) => [`${value}%`, "Readiness"]} />
                      <Bar
                        dataKey="score"
                        fill="hsl(var(--secondary))"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={(data: { payload?: { id?: string } }) => {
                          const id = data?.payload?.id;
                          if (id) handleDeptClick(id);
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartReveal>
                <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">AI token quota this period</span>
                    <span className="font-medium">
                      {selectedMinistry.tokensUsedM}M of {selectedMinistry.tokenQuotaM}M
                    </span>
                  </div>
                  <Progress value={quotaUse} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Entity administrator: {selectedMinistry.entityAdmin}. Quota is allocated from{" "}
                    <Link href="/fahr/entities" className="text-primary underline-offset-4 hover:underline">
                      entity administration
                    </Link>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Departments</CardTitle>
                <CardDescription>Click a row to view its people.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Employees</TableHead>
                      <TableHead className="text-right">Active learners</TableHead>
                      <TableHead className="text-right">Readiness</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Stagger as="tbody" gap={MOTION.stagger.rows}>
                    {departments.map((dept) => (
                      <StaggerItem
                        as="tr"
                        variant="row"
                        key={dept.id}
                        className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                        data-testid={`row-fahr-department-${dept.id}`}
                      >
                        <TableCell className="font-medium text-primary" onClick={() => handleDeptClick(dept.id)}>
                          {dept.name}
                        </TableCell>
                        <TableCell className="text-right" onClick={() => handleDeptClick(dept.id)}>
                          {dept.employees.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right" onClick={() => handleDeptClick(dept.id)}>
                          {dept.activeLearners.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold" onClick={() => handleDeptClick(dept.id)}>
                          {dept.readiness}%
                        </TableCell>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (drillLevel === "department" && selectedDepartment) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{selectedDepartment.name}</CardTitle>
            <CardDescription>Individual learner readiness</CardDescription>
          </CardHeader>
          <CardContent>
            {individuals.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <User className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <h3 className="font-medium">No individual records for this department</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Individual-level records arrive with the department's next HRIS sync.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Capability level</TableHead>
                    <TableHead className="text-right">Assessment</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <Stagger as="tbody" gap={MOTION.stagger.rows}>
                  {individuals.map((ind) => (
                    <StaggerItem
                      as="tr"
                      variant="row"
                      key={ind.id}
                      className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                      data-testid={`row-individual-${ind.id}`}
                    >
                      <TableCell className="font-medium" onClick={() => handleIndividualClick(ind)}>
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" /> {ind.name}
                        </span>
                      </TableCell>
                      <TableCell onClick={() => handleIndividualClick(ind)}>{ind.role}</TableCell>
                      <TableCell onClick={() => handleIndividualClick(ind)}>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {LEVEL_BY_ID[ind.levelId]?.label ?? ind.levelId}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold" onClick={() => handleIndividualClick(ind)}>
                        {ind.assessmentScore}%
                      </TableCell>
                      <TableCell className="text-right" onClick={() => handleIndividualClick(ind)}>
                        {projectsFor(ind.id).length}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleIndividualClick(ind)}
                          data-testid={`button-profile-${ind.id}`}
                        >
                          View profile <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </StaggerItem>
                  ))}
                </Stagger>
              </Table>
            )}
          </CardContent>
        </Card>
      );
    }

    if (drillLevel === "individual" && selectedIndividual) {
      const person = getPerson(selectedIndividual.id) ?? selectedIndividual;
      const level = LEVEL_BY_ID[person.levelId];
      const personProjects = projectsFor(person.id);
      const personCredentials = credentialsFor(person.id);
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{person.name}</h2>
                <p className="text-muted-foreground">{person.role}</p>
                <p className="text-sm mt-1">
                  {selectedDepartment?.name} · {selectedMinistry?.name}
                </p>
              </div>
              <Badge variant="outline" className="text-sm px-4 py-1 border-accent/40 bg-accent/10 text-accent">
                {level?.label ?? person.levelId}
              </Badge>
              <div className="w-full pt-4 space-y-2 border-t border-border mt-4">
                {[
                  { label: "Assessment score", value: `${person.assessmentScore}%` },
                  { label: "Pathway progress", value: `${person.pathwayProgress}%` },
                  { label: "Workplace projects", value: String(personProjects.length) },
                  { label: "Credentials", value: String(personCredentials.length) },
                  { label: "Last active", value: person.lastActive },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-bold">{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">
                    {individualTab === "journey" ? "Capability journey" : "Workplace projects"}
                  </CardTitle>
                  <CardDescription>
                    {individualTab === "journey"
                      ? "Progress along the unified agentic AI capability ladder"
                      : "Applied projects, their decisions and the impact recorded against them"}
                  </CardDescription>
                </div>
                <div className="flex gap-1 rounded-md border border-border bg-muted/50 p-1">
                  {(
                    [
                      { id: "journey" as const, label: "Capability journey" },
                      { id: "projects" as const, label: `Projects (${personProjects.length})` },
                    ]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setIndividualTab(tab.id)}
                      data-testid={`tab-individual-${tab.id}`}
                      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                        individualTab === tab.id
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={individualTab}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.out }}
                >
                  {individualTab === "journey" ? (
                    <div className="space-y-6">
                      {CAPABILITY_LEVELS.map((step) => {
                        const isCurrent = step.id === level?.id;
                        const isAchieved = step.order <= (level?.order ?? 0);
                        return (
                          <div key={step.id} className={`flex items-start gap-4 ${isAchieved ? "" : "opacity-50"}`}>
                            <div
                              className={`mt-1 rounded-full p-1 border-2 ${
                                isCurrent
                                  ? "border-primary bg-primary/20 text-primary"
                                  : isAchieved
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-muted-foreground bg-muted text-muted-foreground"
                              }`}
                            >
                              {isAchieved && !isCurrent ? (
                                <Award className="w-4 h-4" />
                              ) : (
                                <div className="w-4 h-4 flex items-center justify-center text-xs font-bold">
                                  {step.order}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className={`flex items-center gap-2 font-semibold ${isCurrent ? "text-primary" : ""}`}>
                                {step.label}
                                {isCurrent && (
                                  <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                                    Current level
                                  </Badge>
                                )}
                              </h4>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                        );
                      })}
                      {person.gapCompetencyIds && person.gapCompetencyIds.length > 0 && (
                        <div className="pt-4 border-t border-border text-sm text-muted-foreground">
                          Development priorities: {person.gapCompetencyIds.map(competencyLabel).join(", ")}
                        </div>
                      )}
                    </div>
                  ) : personProjects.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center">
                      <Briefcase className="w-10 h-10 text-muted-foreground/50 mb-3" />
                      <h3 className="font-medium">No workplace projects submitted yet</h3>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {person.name} is at {person.pathwayProgress}% of their pathway; the applied project comes at the
                        end of it.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {personProjects.map((project) => (
                        <motion.div
                          key={project.id}
                          layout
                          className="rounded-md border border-border p-4 transition-colors hover:bg-muted/40"
                          data-testid={`project-${project.id}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{project.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {project.submittedOn} · {project.competencyIds.map(competencyLabel).join(", ")}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{SUBMISSION_STATE_LABEL[project.state]}</Badge>
                              <Badge
                                variant="outline"
                                className={
                                  project.impact === "High"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : project.impact === "Medium"
                                      ? "border-amber-200 bg-amber-50 text-amber-700"
                                      : "border-border bg-muted text-muted-foreground"
                                }
                              >
                                {project.impact} impact
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
                          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Hours saved / month</p>
                              <p className="font-semibold">{project.hoursSavedPerMonth}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Est. value</p>
                              <p className="font-semibold">AED {project.estimatedValueAed.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Governance</p>
                              <p className="font-semibold">{project.governanceStatus}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Metrics</p>
                              <p className="font-semibold">{project.metrics}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {personCredentials.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {personCredentials.length} credential
                          {personCredentials.length === 1 ? "" : "s"} issued against these projects.
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 pt-4 border-t border-border flex flex-wrap items-center justify-end gap-2">
                <Button
                  onClick={() => setIndividualTab("projects")}
                  data-testid="button-view-projects"
                  className="gap-2"
                >
                  <Briefcase className="w-4 h-4" /> View projects
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Federal executive view"
          description="National workforce readiness, drilled from the federation down to the individual."
          actions={
            <>
              <Button variant="outline" className="gap-2" onClick={handleExportCsv} data-testid="button-export-view">
                <Download className="w-4 h-4" /> Export current view
              </Button>
              <Button variant="secondary" className="gap-2" onClick={handlePrintView} data-testid="button-print-view">
                <Printer className="w-4 h-4" /> Print pack
              </Button>
            </>
          }
        />

        {/* Breadcrumbs: the drill path, always clickable back up the chain. */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted p-3 text-sm font-medium">
          <button
            className={`transition-colors hover:text-primary ${drillLevel === "federal" ? "text-primary" : "text-muted-foreground"}`}
            onClick={() => goTo("federal")}
            data-testid="crumb-federal"
          >
            Federal view
          </button>
          {drillLevel !== "federal" && selectedMinistry && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button
                className={`transition-colors hover:text-primary ${drillLevel === "ministry" ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => goTo("ministry")}
                data-testid="crumb-ministry"
              >
                {selectedMinistry.name}
              </button>
            </>
          )}
          {(drillLevel === "department" || drillLevel === "individual") && selectedDepartment && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button
                className={`transition-colors hover:text-primary ${drillLevel === "department" ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => goTo("department")}
                data-testid="crumb-department"
              >
                {selectedDepartment.name}
              </button>
            </>
          )}
          {drillLevel === "individual" && selectedIndividual && (
            <>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="text-primary">{selectedIndividual.name}</span>
            </>
          )}
        </div>

        {/* The drill transitions in the direction of travel rather than swapping. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${drillLevel}-${selectedMinistryId ?? ""}-${selectedDepartmentId ?? ""}-${selectedIndividual?.id ?? ""}`}
            initial={reduceMotion ? false : { opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: direction * -24 }}
            transition={{ duration: MOTION.duration.base, ease: MOTION.ease.out }}
          >
            {drillContent()}
          </motion.div>
        </AnimatePresence>
      </PageEnter>

    </Layout>
  );
}
