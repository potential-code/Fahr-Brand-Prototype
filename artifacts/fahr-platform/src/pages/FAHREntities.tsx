import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  Gauge,
  AlertTriangle,
  ChevronRight,
  ChevronsUpDown,
  ArrowRight,
  Search,
  Download,
  Printer,
  UserCog,
  PlusCircle,
  Rocket,
  Inbox,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import {
  FEDERAL,
  ON_TRACK_READINESS,
  competencyLabel,
  departmentsOf,
  ministryRollup,
  riskForReadiness,
  type Ministry,
} from "@/lib/federal";
import {
  ENTITY_SECTORS,
  ONBOARDING_STAGES,
  ONBOARDING_STAGE_ORDER,
} from "@/lib/federal";
import {
  CountUp,
  PageEnter,
  PanelEnter,
  Stagger,
  StaggerItem,
} from "@/components/motion";
import { downloadCsv, printReport } from "@/lib/exportFile";

type SortKey = "readiness" | "coverage" | "quota";
type RiskFilter = "all" | "Low" | "Medium" | "High";

/** Coverage as a whole percentage — active learners over targeted workforce. */
const coverageOf = (m: Ministry): number => Math.round((m.activeLearners / m.employees) * 100);
/** Quota utilisation as a whole percentage of the current period's allocation. */
const utilisationOf = (m: Ministry): number => Math.round((m.tokensUsedM / m.tokenQuotaM) * 100);

const riskPillClass = (risk: "Low" | "Medium" | "High"): string =>
  risk === "High"
    ? "text-destructive border-destructive/30 bg-destructive/10"
    : risk === "Medium"
      ? "text-amber-700 border-amber-200 bg-amber-50"
      : "text-green-700 border-green-200 bg-green-50";

export default function FAHREntities() {
  const { toast } = useToast();
  const { ministries, escalations, adjustQuota, assignEntityAdmin } = useFederalData();
  const {
    onboardings,
    startOnboarding,
    advanceOnboarding,
    addOnboardingAdmin,
  } = useFahrConsole();

  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("readiness");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Detail sheet.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Quota + admin editing inside the sheet.
  const [quotaDraft, setQuotaDraft] = useState<string>("");
  const [adminDraft, setAdminDraft] = useState<string>("");

  // Onboarding dialogs.
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [inviteFor, setInviteFor] = useState<string | null>(null);

  // Onboard-entity draft.
  const [obName, setObName] = useState("");
  const [obShort, setObShort] = useState("");
  const [obSector, setObSector] = useState<string>(ENTITY_SECTORS[0]);
  const [obWorkforce, setObWorkforce] = useState("");
  const [obQuota, setObQuota] = useState("");
  const [obAdminName, setObAdminName] = useState("");
  const [obAdminEmail, setObAdminEmail] = useState("");

  // Invite-admin draft.
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");

  // Weighted national readiness comes from the shared federal totals so it can
  // never disagree with the leadership view.
  const entitiesAtRisk = useMemo(
    () => ministries.filter((m) => m.readiness < ON_TRACK_READINESS).length,
    [ministries],
  );

  const kpis = [
    {
      label: "Entities live",
      icon: Building2,
      node: <CountUp to={FEDERAL.ministriesTotal} />,
      testid: "kpi-entities-live",
      hint: `${FEDERAL.ministriesOnTrack} on track at ${ON_TRACK_READINESS}%+`,
    },
    {
      label: "Workforce covered",
      icon: Users,
      node: <CountUp to={FEDERAL.employees} />,
      testid: "kpi-workforce",
      hint: `${FEDERAL.coverage}% active on the programme`,
    },
    {
      label: "Weighted national readiness",
      icon: Gauge,
      node: <CountUp to={FEDERAL.readiness} suffix="%" />,
      testid: "kpi-readiness",
      hint: "Employee-weighted across all entities",
    },
    {
      label: "Entities at risk",
      icon: AlertTriangle,
      node: <CountUp to={entitiesAtRisk} />,
      testid: "kpi-at-risk",
      hint: `Below ${ON_TRACK_READINESS}% readiness`,
    },
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = ministries.filter((m) => {
      const matchesText =
        q.length === 0 ||
        m.name.toLowerCase().includes(q) ||
        m.shortName.toLowerCase().includes(q) ||
        m.entityAdmin.toLowerCase().includes(q);
      const matchesRisk = riskFilter === "all" || riskForReadiness(m.readiness) === riskFilter;
      return matchesText && matchesRisk;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va =
        sortKey === "readiness" ? a.readiness : sortKey === "coverage" ? coverageOf(a) : utilisationOf(a);
      const vb =
        sortKey === "readiness" ? b.readiness : sortKey === "coverage" ? coverageOf(b) : utilisationOf(b);
      return (va - vb) * dir;
    });
  }, [ministries, query, riskFilter, sortKey, sortDir]);

  const setSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const selected = selectedId ? ministries.find((m) => m.id === selectedId) ?? null : null;
  const rollup = useMemo(() => (selectedId ? ministryRollup(selectedId) : null), [selectedId, ministries]);
  const departments = useMemo(() => (selectedId ? departmentsOf(selectedId) : []), [selectedId]);
  const entityEscalations = useMemo(
    () => (selectedId ? escalations.filter((e) => e.ministryId === selectedId) : []),
    [selectedId, escalations],
  );

  const openEntity = (m: Ministry) => {
    setSelectedId(m.id);
    setQuotaDraft(String(m.tokenQuotaM));
    setAdminDraft(m.entityAdmin);
  };

  const closeSheet = () => setSelectedId(null);

  const handleAdjustQuota = () => {
    if (!selected) return;
    const value = Math.round(Number(quotaDraft) * 10) / 10;
    if (!Number.isFinite(value) || value <= 0) {
      toast({ title: "Quota not changed", description: "Enter a positive figure in millions of tokens." });
      return;
    }
    adjustQuota(selected.id, value, { by: "FAHR Programme Team" });
    toast({
      title: "Quota adjusted",
      description: `${selected.shortName} set to ${value}M tokens for this period.`,
    });
  };

  const handleAssignAdmin = () => {
    if (!selected) return;
    const name = adminDraft.trim();
    if (!name) {
      toast({ title: "Administrator not changed", description: "Enter the administrator's name." });
      return;
    }
    if (name === selected.entityAdmin) return;
    assignEntityAdmin(selected.id, name, { by: "FAHR Programme Team" });
    toast({ title: "Entity administrator assigned", description: `${name} now administers ${selected.shortName}.` });
  };

  const resetOnboardDraft = () => {
    setObName("");
    setObShort("");
    setObSector(ENTITY_SECTORS[0]);
    setObWorkforce("");
    setObQuota("");
    setObAdminName("");
    setObAdminEmail("");
  };

  const handleStartOnboarding = () => {
    const employees = Number(obWorkforce);
    const quotaM = Math.round(Number(obQuota) * 10) / 10;
    if (!obName.trim() || !obShort.trim() || !Number.isFinite(employees) || employees <= 0) {
      toast({ title: "Cannot onboard entity", description: "Name, short name and a valid workforce are required." });
      return;
    }
    const admins =
      obAdminName.trim() && obAdminEmail.trim()
        ? [{ name: obAdminName.trim(), email: obAdminEmail.trim() }]
        : undefined;
    startOnboarding({
      name: obName.trim(),
      shortName: obShort.trim(),
      sector: obSector,
      employees,
      quotaM: Number.isFinite(quotaM) && quotaM > 0 ? quotaM : 0.5,
      admins,
      by: "FAHR Programme Team",
    });
    toast({
      title: "Entity onboarding started",
      description: `${obShort.trim()} added to the pipeline. Its figures stay out of national totals until it goes live.`,
    });
    resetOnboardDraft();
    setOnboardOpen(false);
  };

  const handleAddAdmin = () => {
    if (!inviteFor) return;
    if (!invName.trim() || !invEmail.trim()) {
      toast({ title: "Invite not sent", description: "Enter the administrator's name and email." });
      return;
    }
    addOnboardingAdmin(
      inviteFor,
      { name: invName.trim(), email: invEmail.trim() },
      { by: "FAHR Programme Team" },
    );
    toast({ title: "Entity admin invited", description: `${invName.trim()} invited to administer the entity.` });
    setInvName("");
    setInvEmail("");
    setInviteFor(null);
  };

  const handleExportCsv = () => {
    const name = downloadCsv({
      filename: "fahr-entity-administration",
      headers: [
        "Entity",
        "Descriptor",
        "Targeted workforce",
        "Active learners",
        "Coverage %",
        "Readiness",
        "Risk band",
        "Tokens used (M)",
        "Token quota (M)",
        "Utilisation %",
        "Entity administrator",
      ],
      rows: filtered.map((m) => [
        m.name,
        m.shortName,
        m.employees,
        m.activeLearners,
        coverageOf(m),
        m.readiness,
        riskForReadiness(m.readiness),
        m.tokensUsedM,
        m.tokenQuotaM,
        utilisationOf(m),
        m.entityAdmin,
      ]),
    });
    toast({ title: "Entity table exported", description: `Saved ${name}.` });
  };

  const handlePrintPack = () => {
    printReport({
      title: "Entity administration pack",
      subtitle: "Federal AI Learning Programme — entity readiness, coverage and quota",
      meta: [
        `Entities: ${filtered.length} of ${FEDERAL.ministriesTotal}`,
        `Risk filter: ${riskFilter === "all" ? "All bands" : riskFilter}`,
        query.trim() ? `Search: "${query.trim()}"` : "Search: none",
      ],
      sections: [
        {
          heading: "National position",
          facts: [
            { label: "Weighted readiness", value: `${FEDERAL.readiness}%` },
            { label: "Workforce covered", value: FEDERAL.employees.toLocaleString() },
            { label: "Active learners", value: FEDERAL.activeLearners.toLocaleString() },
            { label: "Entities at risk", value: String(entitiesAtRisk) },
          ],
        },
        {
          heading: "Entities",
          table: {
            headers: [
              "Entity",
              "Workforce",
              "Learners",
              "Coverage %",
              "Readiness",
              "Risk",
              "Quota (used/allocated M)",
              "Administrator",
            ],
            numericColumns: [1, 2, 3, 4],
            rows: filtered.map((m) => [
              m.name,
              m.employees.toLocaleString(),
              m.activeLearners.toLocaleString(),
              `${coverageOf(m)}%`,
              `${m.readiness}%`,
              riskForReadiness(m.readiness),
              `${m.tokensUsedM}M / ${m.tokenQuotaM}M`,
              m.entityAdmin,
            ]),
          },
        },
      ],
      footnote:
        "Onboarding entities are excluded — their figures join the national totals only once they go live on the programme.",
    });
    toast({ title: "Pack ready", description: "The entity administration pack has opened for printing." });
  };

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      type="button"
      onClick={() => setSort(k)}
      className="inline-flex items-center gap-1 font-medium hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      data-testid={`sort-${k}`}
    >
      {label}
      <ChevronsUpDown className={`h-3.5 w-3.5 ${sortKey === k ? "text-primary" : "text-muted-foreground"}`} />
    </button>
  );

  // Top capability gap for the selected entity, from its authored headline.
  const topGap = selected ? competencyLabel(selected.topGapCompetencyId) : "";
  const liveQuotaUtilisation = selected ? utilisationOf(selected) : 0;

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Entities"
          description="Every federal entity on the programme, with readiness, coverage, quota and administrators."
          actions={
            <>
              <Button variant="outline" onClick={handleExportCsv} className="gap-2" data-testid="button-export-csv">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" onClick={handlePrintPack} className="gap-2" data-testid="button-print-pack">
                <Printer className="h-4 w-4" /> Administration pack
              </Button>
              <Button onClick={() => setOnboardOpen(true)} className="gap-2" data-testid="button-onboard-entity">
                <PlusCircle className="h-4 w-4" /> Onboard an entity
              </Button>
            </>
          }
        />

        {/* KPI row */}
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <kpi.icon className="h-4 w-4" />
                    <span className="text-xs">{kpi.label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground" data-testid={kpi.testid}>
                    {kpi.node}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Entity table */}
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Entities on the programme</CardTitle>
                <CardDescription>
                  Sort by readiness, coverage or quota utilisation. Click a row to open the entity.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search entity or admin"
                    className="pl-8 w-56"
                    data-testid="input-entity-search"
                  />
                </div>
                <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
                  <SelectTrigger className="w-40" data-testid="select-risk-filter">
                    <SelectValue placeholder="Risk band" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All risk bands</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <Building2 className="mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No entities match these filters</h3>
                <p className="mt-1 max-w-sm text-muted-foreground">
                  Clear the search or choose a different risk band to see entities again.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead className="text-right">Workforce</TableHead>
                      <TableHead className="text-right">Learners</TableHead>
                      <TableHead><SortHead label="Coverage" k="coverage" /></TableHead>
                      <TableHead><SortHead label="Readiness" k="readiness" /></TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead><SortHead label="Quota" k="quota" /></TableHead>
                      <TableHead>Administrator</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <Stagger as="tbody">
                    {filtered.map((m) => {
                      const coverage = coverageOf(m);
                      const utilisation = utilisationOf(m);
                      const risk = riskForReadiness(m.readiness);
                      return (
                        <StaggerItem
                          as="tr"
                          variant="row"
                          key={m.id}
                          className="cursor-pointer border-b border-border hover:bg-muted/50 focus-within:bg-muted/50"
                          data-testid={`row-entity-${m.id}`}
                        >
                          <TableCell onClick={() => openEntity(m)} className="font-medium text-primary max-w-[220px]">
                            <span className="block truncate" title={m.name}>{m.name}</span>
                            <span className="block text-xs text-muted-foreground">{m.shortName}</span>
                          </TableCell>
                          <TableCell className="text-right" onClick={() => openEntity(m)}>
                            {m.employees.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right" onClick={() => openEntity(m)}>
                            {m.activeLearners.toLocaleString()}
                          </TableCell>
                          <TableCell onClick={() => openEntity(m)} className="text-sm text-muted-foreground">
                            {coverage}%
                          </TableCell>
                          <TableCell onClick={() => openEntity(m)}>
                            <div className="flex items-center gap-2">
                              <span className="w-9 text-sm font-medium tabular-nums">{m.readiness}%</span>
                              <Progress value={m.readiness} className="h-1.5 w-16" />
                            </div>
                          </TableCell>
                          <TableCell onClick={() => openEntity(m)}>
                            <Badge variant="outline" className={riskPillClass(risk)}>{risk}</Badge>
                          </TableCell>
                          <TableCell onClick={() => openEntity(m)}>
                            <div className="flex items-center gap-2">
                              <span className="w-24 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                                {m.tokensUsedM}M / {m.tokenQuotaM}M
                              </span>
                              <Progress
                                value={Math.min(100, utilisation)}
                                className={`h-1.5 w-16 ${
                                  utilisation >= 95
                                    ? "[&>div]:bg-destructive"
                                    : utilisation >= 80
                                      ? "[&>div]:bg-amber-500"
                                      : ""
                                }`}
                              />
                            </div>
                          </TableCell>
                          <TableCell onClick={() => openEntity(m)} className="text-sm">{m.entityAdmin}</TableCell>
                          <TableCell onClick={() => openEntity(m)}>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </StaggerItem>
                      );
                    })}
                  </Stagger>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Onboarding pipeline */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" /> Onboarding pipeline
                </CardTitle>
                <CardDescription>
                  Entities being brought onto the programme. Their figures are <strong>not</strong> in the national
                  totals until they go live.
                </CardDescription>
              </div>
              <Button onClick={() => setOnboardOpen(true)} variant="outline" className="gap-2" data-testid="button-onboard-entity-2">
                <PlusCircle className="h-4 w-4" /> Onboard an entity
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {onboardings.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center">
                <Inbox className="mb-3 h-10 w-10 text-muted-foreground opacity-50" />
                <h3 className="font-medium text-foreground">No entities in onboarding</h3>
                <p className="mt-1 max-w-sm text-muted-foreground text-sm">
                  Every requested entity is live. Use “Onboard an entity” to add the next one.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {onboardings.map((ob) => {
                  const stageIndex = ONBOARDING_STAGE_ORDER.indexOf(ob.stage);
                  const isLive = ob.stage === "live";
                  return (
                    <motion.div
                      key={ob.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-border p-4"
                      data-testid={`onboarding-${ob.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{ob.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ob.sector} · {ob.employees.toLocaleString()} staff · {ob.quotaM}M token quota · requested {ob.requestedOn}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInviteFor(ob.id)}
                            data-testid={`button-invite-admin-${ob.id}`}
                          >
                            Invite entity admin
                          </Button>
                          <Button
                            size="sm"
                            disabled={isLive}
                            onClick={() => {
                              advanceOnboarding(ob.id, { by: "FAHR Programme Team" });
                              toast({
                                title: "Onboarding advanced",
                                description: `${ob.shortName} moved to the next stage.`,
                              });
                            }}
                            data-testid={`button-advance-${ob.id}`}
                          >
                            {isLive ? "Live" : "Advance stage"}
                          </Button>
                        </div>
                      </div>

                      {/* Stage tracker */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-2">
                        {ONBOARDING_STAGES.map((stage, i) => {
                          const done = i < stageIndex;
                          const current = i === stageIndex;
                          return (
                            <div
                              key={stage.id}
                              className={`rounded-md border p-2 ${
                                current
                                  ? "border-primary/40 bg-primary/5"
                                  : done
                                    ? "border-green-200 bg-green-50"
                                    : "border-border bg-muted/30"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                                    done
                                      ? "bg-green-600 text-white"
                                      : current
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <AnimatePresence mode="wait">
                                  <motion.span
                                    key={`${stage.id}-${current}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`text-[11px] font-medium ${current ? "text-primary" : "text-foreground"}`}
                                  >
                                    {stage.label}
                                  </motion.span>
                                </AnimatePresence>
                              </div>
                              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{stage.description}</p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        {ob.admins.length === 0 ? (
                          <span className="text-amber-700">No entity admin invited yet.</span>
                        ) : (
                          <span>
                            Admins: {ob.admins.map((a) => `${a.name} (${a.email})`).join(", ")}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        {/* Entity detail sheet */}
        <Sheet open={selectedId !== null} onOpenChange={(open) => !open && closeSheet()}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selected && rollup && (
              <PanelEnter className="space-y-6">
                <SheetHeader>
                  <SheetTitle className="text-primary">{selected.name}</SheetTitle>
                  <SheetDescription>
                    {selected.shortName} · administered by {selected.entityAdmin}
                  </SheetDescription>
                </SheetHeader>

                {/* Rollup figures */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Readiness", value: `${selected.readiness}%` },
                    { label: "Coverage", value: `${rollup.coverage}%` },
                    { label: "Departments at risk", value: String(rollup.departmentsAtRisk) },
                    { label: "Active learners", value: selected.activeLearners.toLocaleString() },
                    { label: "Projects", value: selected.projectsSubmitted.toLocaleString() },
                    { label: "Quota use", value: `${rollup.tokenUtilisation}%` },
                  ].map((f) => (
                    <div key={f.label} className="rounded-md border border-border p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
                      <p className="mt-1 text-lg font-bold text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Top capability gap</p>
                  <p className="mt-1 font-medium text-foreground">{topGap}</p>
                </div>

                {/* Quota control */}
                <div className="space-y-2 rounded-md border border-border p-4">
                  <Label htmlFor="quota-input" className="text-sm font-medium">Monthly token quota (millions)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="quota-input"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={quotaDraft}
                      onChange={(e) => setQuotaDraft(e.target.value)}
                      className="w-32"
                      data-testid="input-quota"
                    />
                    <Button onClick={handleAdjustQuota} data-testid="button-adjust-quota">Apply quota</Button>
                  </div>
                  <div className="pt-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Consumption</span>
                      <span>{selected.tokensUsedM}M used of {selected.tokenQuotaM}M</span>
                    </div>
                    <Progress
                      value={Math.min(100, liveQuotaUtilisation)}
                      className={`mt-1 h-2 transition-all ${
                        liveQuotaUtilisation >= 95
                          ? "[&>div]:bg-destructive"
                          : liveQuotaUtilisation >= 80
                            ? "[&>div]:bg-amber-500"
                            : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Admin control */}
                <div className="space-y-2 rounded-md border border-border p-4">
                  <Label htmlFor="admin-input" className="text-sm font-medium flex items-center gap-1.5">
                    <UserCog className="h-4 w-4" /> Entity administrator
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="admin-input"
                      value={adminDraft}
                      onChange={(e) => setAdminDraft(e.target.value)}
                      className="flex-1"
                      data-testid="input-admin"
                    />
                    <Button onClick={handleAssignAdmin} data-testid="button-assign-admin">Assign</Button>
                  </div>
                </div>

                {/* Departments */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">Departments</h4>
                  <div className="space-y-1.5">
                    {departments.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                      >
                        <span className="text-foreground">{d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground tabular-nums">{d.readiness}%</span>
                          <Badge variant="outline" className={riskPillClass(d.risk)}>{d.risk}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Escalations raised by this entity */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-foreground">Escalations raised</h4>
                  {entityEscalations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No escalations raised by this entity.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {entityEscalations.map((e) => (
                        <div key={e.id} className="rounded-md border border-border px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">{e.subject}</span>
                            <Badge
                              variant="outline"
                              className={
                                e.status === "Resolved"
                                  ? "text-green-700 border-green-200 bg-green-50"
                                  : e.status === "In progress"
                                    ? "text-amber-700 border-amber-200 bg-amber-50"
                                    : "text-primary border-primary/30 bg-primary/5"
                              }
                            >
                              {e.status}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {e.kind} · raised {e.raisedOn} by {e.raisedBy}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={`/fahr?ministry=${selected.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  data-testid="link-drilldown"
                >
                  Open in national drill-down <ArrowRight className="h-4 w-4" />
                </Link>
              </PanelEnter>
            )}
          </SheetContent>
        </Sheet>

        {/* Onboard an entity dialog */}
        <Dialog open={onboardOpen} onOpenChange={(open) => { setOnboardOpen(open); if (!open) resetOnboardDraft(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Onboard an entity</DialogTitle>
              <DialogDescription>
                The entity enters the onboarding pipeline. Its figures join the national totals only when it goes live.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ob-name">Entity name</Label>
                <Input id="ob-name" value={obName} onChange={(e) => setObName(e.target.value)} data-testid="input-ob-name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ob-short">Short name</Label>
                  <Input id="ob-short" value={obShort} onChange={(e) => setObShort(e.target.value)} data-testid="input-ob-short" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ob-sector">Sector</Label>
                  <Select value={obSector} onValueChange={setObSector}>
                    <SelectTrigger id="ob-sector" data-testid="select-ob-sector">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ob-workforce">Targeted workforce</Label>
                  <Input id="ob-workforce" type="number" min="1" value={obWorkforce} onChange={(e) => setObWorkforce(e.target.value)} data-testid="input-ob-workforce" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ob-quota">Initial quota (M tokens)</Label>
                  <Input id="ob-quota" type="number" step="0.1" min="0.1" value={obQuota} onChange={(e) => setObQuota(e.target.value)} data-testid="input-ob-quota" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ob-admin-name">First admin (optional)</Label>
                  <Input id="ob-admin-name" value={obAdminName} onChange={(e) => setObAdminName(e.target.value)} placeholder="Name" data-testid="input-ob-admin-name" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ob-admin-email">Admin email (optional)</Label>
                  <Input id="ob-admin-email" type="email" value={obAdminEmail} onChange={(e) => setObAdminEmail(e.target.value)} placeholder="name@entity.gov.ae" data-testid="input-ob-admin-email" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOnboardOpen(false); resetOnboardDraft(); }}>Cancel</Button>
              <Button onClick={handleStartOnboarding} data-testid="button-confirm-onboard">Start onboarding</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite entity admin dialog */}
        <Dialog open={inviteFor !== null} onOpenChange={(open) => { if (!open) { setInviteFor(null); setInvName(""); setInvEmail(""); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Invite entity admin</DialogTitle>
              <DialogDescription>Invite an administrator to the entity being onboarded.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="inv-name">Name</Label>
                <Input id="inv-name" value={invName} onChange={(e) => setInvName(e.target.value)} data-testid="input-inv-name" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-email">Email</Label>
                <Input id="inv-email" type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="name@entity.gov.ae" data-testid="input-inv-email" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setInviteFor(null); setInvName(""); setInvEmail(""); }}>Cancel</Button>
              <Button onClick={handleAddAdmin} data-testid="button-confirm-invite">Send invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageEnter>
    </Layout>
  );
}
