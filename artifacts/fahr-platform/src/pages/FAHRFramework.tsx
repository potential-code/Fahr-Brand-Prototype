import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Pencil,
  BookOpen,
  Layers,
  Route,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Rocket,
  ArrowRight,
  Library,
  Search,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  PageEnter,
  Stagger,
  StaggerItem,
  PanelEnter,
  MOTION,
} from "@/components/motion";
import { CAPABILITY_LEVELS, AGENTS } from "@/lib/constants";
import { AIAnalysisPanel } from "@/components/ai/AIAnalysis";
import { COMPETENCY_BY_ID } from "@/lib/learningData";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import {
  FRAMEWORK_VERSION,
  PERSONALISATION_RULES,
  PERSONALISATION_RULE_BY_COMPETENCY,
  competencyRows,
  levelForScore,
  nationalGaps,
  type ContentItem,
} from "@/lib/federal";
import { useFederalData } from "@/lib/FederalDataContext";
import { downloadCsv, printReport, stampedFilename } from "@/lib/exportFile";

const CONTENT_TYPES = ["Course", "Microlearning", "Simulation", "Assignment", "Virtual session"];
const CONTENT_STATUSES: ContentItem["status"][] = ["Published", "In review", "Draft", "Scheduled"];

function catalogueStatusPill(status: ContentItem["status"]) {
  if (status === "Published") return "bg-green-50 text-green-700 border-green-200";
  if (status === "In review") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "Scheduled") return "bg-primary/10 text-primary border-primary/20";
  return "bg-muted text-muted-foreground border-border";
}

function TrendIcon({ trend }: { trend: "rising" | "stable" | "declining" }) {
  if (trend === "rising") return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
  if (trend === "declining") return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default function FAHRFramework() {
  const { toast } = useToast();
  const { ministries } = useFederalData();
  const {
    competencies,
    expectationFor,
    mappedContentIds,
    catalogue,
    catalogueRevisions,
    updateCompetency,
    setExpectation,
    setContentMapping,
    setCatalogueStatus,
    publishCatalogueVersion,
  } = useFahrConsole();
  const reduceMotion = useReducedMotion();

  // --- National picture (derived once from reporting selectors) -----------
  const gaps = useMemo(() => nationalGaps(), []);
  const gapByCompetency = useMemo(
    () => Object.fromEntries(gaps.map((g) => [g.competency.id, g])),
    [gaps],
  );
  // National weighted score per competency, from the reporting suite.
  const scoreRows = useMemo(
    () => competencyRows({ ministries, period: { id: "ytd", label: "Year to date", share: 1 } }),
    [ministries],
  );
  const scoreByCompetency = useMemo(
    () => Object.fromEntries(scoreRows.map((r) => [r.competencyId, r])),
    [scoreRows],
  );

  const catalogueById = useMemo(
    () => Object.fromEntries(catalogue.map((c) => [c.id, c])),
    [catalogue],
  );

  // --- Expectation edit dialog --------------------------------------------
  const [expEdit, setExpEdit] = useState<{ competencyId: string; levelId: string } | null>(null);
  const [expDraft, setExpDraft] = useState("");

  const openExpEdit = (competencyId: string, levelId: string) => {
    setExpDraft(expectationFor(competencyId, levelId));
    setExpEdit({ competencyId, levelId });
  };
  const saveExpEdit = () => {
    if (!expEdit) return;
    setExpectation(expEdit.competencyId, expEdit.levelId, expDraft);
    const level = CAPABILITY_LEVELS.find((l) => l.id === expEdit.levelId);
    const comp = competencies.find((c) => c.id === expEdit.competencyId);
    toast({ title: "Expectation updated", description: `${comp?.short ?? ""} — ${level?.label ?? ""} rewritten.` });
    setExpEdit(null);
  };

  // --- Competency definition edit dialog ----------------------------------
  const [compEdit, setCompEdit] = useState<string | null>(null);
  const [compLabel, setCompLabel] = useState("");
  const [compDesc, setCompDesc] = useState("");
  const openCompEdit = (competencyId: string) => {
    const comp = competencies.find((c) => c.id === competencyId);
    if (!comp) return;
    setCompLabel(comp.label);
    setCompDesc(comp.description);
    setCompEdit(competencyId);
  };
  const saveCompEdit = () => {
    if (!compEdit) return;
    updateCompetency(compEdit, { label: compLabel.trim(), description: compDesc.trim() });
    toast({ title: "Competency updated", description: compLabel.trim() });
    setCompEdit(null);
  };

  // --- Mapping editor dialog ----------------------------------------------
  const [mapEdit, setMapEdit] = useState<string | null>(null);
  const [mapDraft, setMapDraft] = useState<string[]>([]);
  const openMapEdit = (competencyId: string) => {
    setMapDraft(mappedContentIds(competencyId));
    setMapEdit(competencyId);
  };
  const saveMapEdit = () => {
    if (!mapEdit) return;
    setContentMapping(mapEdit, mapDraft);
    const comp = competencies.find((c) => c.id === mapEdit);
    toast({
      title: "Mapping updated",
      description: `${comp?.short ?? ""} now maps to ${mapDraft.length} item${mapDraft.length === 1 ? "" : "s"}. Pathways rebuild from the mapping.`,
    });
    setMapEdit(null);
  };

  // --- Catalogue filters + detail sheet -----------------------------------
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [compFilter, setCompFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const filteredCatalogue = useMemo(
    () =>
      catalogue.filter(
        (c) =>
          (typeFilter === "all" || c.type === typeFilter) &&
          (statusFilter === "all" || c.status === statusFilter) &&
          (compFilter === "all" || c.competencyId === compFilter),
      ),
    [catalogue, typeFilter, statusFilter, compFilter],
  );
  const detailItem = detailId ? catalogueById[detailId] ?? null : null;
  const detailRevisions = useMemo(
    () => (detailId ? catalogueRevisions.filter((r) => r.contentId === detailId) : []),
    [detailId, catalogueRevisions],
  );

  // --- Personalisation trace ----------------------------------------------
  const [traceCompetency, setTraceCompetency] = useState(competencies[0]?.id ?? "literacy");
  const [traceScore, setTraceScore] = useState(45);
  const traceRule = PERSONALISATION_RULE_BY_COMPETENCY[traceCompetency];
  const traceFires = traceRule ? traceScore <= traceRule.gapAtOrBelow : false;
  const traceLevel = levelForScore(traceScore);
  const traceContent = traceFires
    ? mappedContentIds(traceCompetency)
        .map((id) => catalogueById[id])
        .filter(Boolean)
    : [];

  // --- Catalogue exports ---------------------------------------------------
  const catalogueHeaders = [
    "Title",
    "Type",
    "Competency",
    "Language",
    "Version",
    "Status",
    "Updated",
    "Author",
  ];
  const catalogueExportRows = filteredCatalogue.map((c) => [
    c.title,
    c.type,
    COMPETENCY_BY_ID[c.competencyId]?.label ?? c.competencyId,
    c.language,
    c.version,
    c.status,
    c.updatedOn,
    c.owner,
  ]);

  const handleCsv = () => {
    const name = downloadCsv({ filename: "fahr-catalogue", headers: catalogueHeaders, rows: catalogueExportRows });
    toast({ title: "CSV downloaded", description: name });
  };
  const handlePack = () => {
    printReport({
      title: "Federal catalogue pack",
      subtitle: `Competency framework ${FRAMEWORK_VERSION.version} · national learning catalogue`,
      meta: [
        `${filteredCatalogue.length} of ${catalogue.length} items`,
        typeFilter === "all" ? "All types" : typeFilter,
        statusFilter === "all" ? "All statuses" : statusFilter,
      ],
      sections: [
        {
          heading: "Catalogue",
          table: { headers: catalogueHeaders, rows: catalogueExportRows },
        },
      ],
      footnote: `Framework owner ${FRAMEWORK_VERSION.owner} · approved ${FRAMEWORK_VERSION.approvedOn} · generated ${stampedFilename("catalogue", "pdf").replace(/^.*-(\d{4}-\d{2}-\d{2})\.pdf$/, "$1")}.`,
    });
    toast({ title: "Catalogue pack ready", description: "Sent to print." });
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Framework and catalogue"
          description="The federal AI capability framework and the national catalogue built on it."
        />

        {/* Framework version summary */}
        <Card>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {[
              { label: "Framework version", value: FRAMEWORK_VERSION.version },
              { label: "Approved", value: FRAMEWORK_VERSION.approvedOn },
              { label: "Owner", value: FRAMEWORK_VERSION.owner },
              { label: "Competencies", value: String(FRAMEWORK_VERSION.competencies) },
              { label: "Capability levels", value: String(FRAMEWORK_VERSION.levels) },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-sm font-semibold text-primary">{f.value}</p>
                <p className="text-xs text-muted-foreground">{f.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="framework" className="space-y-6">
          <TabsList>
            <TabsTrigger value="framework" data-testid="tab-framework">
              <Layers className="w-4 h-4 mr-1.5" /> Framework
            </TabsTrigger>
            <TabsTrigger value="catalogue" data-testid="tab-catalogue">
              <Library className="w-4 h-4 mr-1.5" /> Catalogue
            </TabsTrigger>
            <TabsTrigger value="personalisation" data-testid="tab-personalisation">
              <Route className="w-4 h-4 mr-1.5" /> Personalisation
            </TabsTrigger>
          </TabsList>

          {/* ============================= FRAMEWORK ============================= */}
          <TabsContent value="framework" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Competency × capability-level matrix</CardTitle>
                <CardDescription>
                  What each competency looks like at each rung of the ladder — the mapping the AI Skills Advisor scores
                  against. Click a cell to rewrite the expectation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[220px]">Competency</TableHead>
                        {CAPABILITY_LEVELS.map((level) => (
                          <TableHead key={level.id} className="min-w-[200px]">
                            {level.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competencies.map((comp) => {
                        const score = scoreByCompetency[comp.id];
                        const gap = gapByCompetency[comp.id];
                        return (
                          <TableRow key={comp.id} data-testid={`row-competency-${comp.id}`}>
                            <TableCell className="align-top">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium">{comp.label}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{comp.description}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={() => openCompEdit(comp.id)}
                                  data-testid={`button-edit-competency-${comp.id}`}
                                  aria-label={`Edit ${comp.label}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              {/* National picture — not abstract */}
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                {score && (
                                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                    National score {score.score}
                                  </Badge>
                                )}
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <TrendIcon trend={score?.trend ?? "stable"} /> {score?.trend ?? "stable"}
                                </span>
                                {gap && (
                                  <span className="text-muted-foreground">
                                    · priority gap for {gap.ministries} entit{gap.ministries === 1 ? "y" : "ies"}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Mapped to {mappedContentIds(comp.id).length} catalogue item(s) ·{" "}
                                <button
                                  className="text-primary hover:underline focus-visible:outline-none focus-visible:underline"
                                  onClick={() => openMapEdit(comp.id)}
                                  data-testid={`button-map-${comp.id}`}
                                >
                                  edit mapping
                                </button>
                              </div>
                            </TableCell>
                            {CAPABILITY_LEVELS.map((level) => (
                              <TableCell key={level.id} className="align-top">
                                <button
                                  type="button"
                                  onClick={() => openExpEdit(comp.id, level.id)}
                                  className="text-left text-xs w-full rounded-md border border-transparent p-2 -m-2 hover:border-border hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  data-testid={`button-cell-${comp.id}-${level.id}`}
                                >
                                  {expectationFor(comp.id, level.id)}
                                </button>
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================= CATALOGUE ============================= */}
          <TabsContent value="catalogue" className="space-y-6">
            <Card>
              <CardHeader className="pb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">National catalogue</CardTitle>
                  <CardDescription>Every course, microlearning, simulation, assignment and session.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]" data-testid="select-cat-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {CONTENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-cat-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {CONTENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={compFilter} onValueChange={setCompFilter}>
                    <SelectTrigger className="w-[160px]" data-testid="select-cat-competency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All competencies</SelectItem>
                      {competencies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.short}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleCsv} data-testid="button-catalogue-csv">
                    Export CSV
                  </Button>
                  <Button variant="secondary" onClick={handlePack} data-testid="button-catalogue-pack">
                    Print pack
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCatalogue.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center">
                    <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No catalogue items match</h3>
                    <p className="text-muted-foreground max-w-sm mt-1 text-sm">
                      No content matches the current filters. Clear a filter to see the full catalogue.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Competency</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <Stagger as="tbody" onView>
                        {filteredCatalogue.map((item) => (
                          <StaggerItem
                            as="tr"
                            variant="row"
                            key={item.id}
                            className="hover:bg-muted/50 border-b transition-colors"
                            data-testid={`row-content-${item.id}`}
                          >
                            <TableCell
                              className="font-medium text-primary cursor-pointer"
                              onClick={() => setDetailId(item.id)}
                            >
                              {item.title}
                            </TableCell>
                            <TableCell className="text-sm">{item.type}</TableCell>
                            <TableCell className="text-sm">
                              {COMPETENCY_BY_ID[item.competencyId]?.short ?? item.competencyId}
                            </TableCell>
                            <TableCell className="text-sm">{item.language}</TableCell>
                            <TableCell className="text-sm font-mono">{item.version}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={catalogueStatusPill(item.status)}>
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {item.updatedOn}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.owner}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {item.status !== "In review" && item.status !== "Published" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setCatalogueStatus(item.id, "In review", { by: "FAHR Programme Team" });
                                      toast({ title: "Moved to review", description: item.title });
                                    }}
                                    data-testid={`button-review-${item.id}`}
                                  >
                                    To review
                                  </Button>
                                )}
                                {item.status !== "Published" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-green-700"
                                    onClick={() => {
                                      setCatalogueStatus(item.id, "Published", { by: "FAHR Programme Team" });
                                      toast({ title: "Published", description: `${item.title} ${item.version}` });
                                    }}
                                    data-testid={`button-publish-${item.id}`}
                                  >
                                    Publish
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    publishCatalogueVersion(item.id, { by: "FAHR Programme Team" });
                                    toast({ title: "New version published", description: item.title });
                                  }}
                                  data-testid={`button-version-${item.id}`}
                                >
                                  New version
                                </Button>
                              </div>
                            </TableCell>
                          </StaggerItem>
                        ))}
                      </Stagger>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================== PERSONALISATION ========================== */}
          <TabsContent value="personalisation" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">From assessment to pathway</CardTitle>
                <CardDescription>
                  How a capability gap becomes assigned learning: assessment score → gap → rule → assigned content →
                  workplace project. Rules read the live framework mapping, so a remap on the Framework tab changes what
                  a pathway becomes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {PERSONALISATION_RULES.map((rule) => {
                  const comp = competencies.find((c) => c.id === rule.competencyId);
                  const items = mappedContentIds(rule.competencyId)
                    .map((id) => catalogueById[id])
                    .filter(Boolean);
                  return (
                    <div
                      key={rule.competencyId}
                      className="rounded-md border border-border p-4"
                      data-testid={`rule-${rule.competencyId}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-medium">{comp?.label ?? rule.competencyId}</span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Fires at score ≤ {rule.gapAtOrBelow}
                        </Badge>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-stretch gap-2 text-sm">
                        <div className="flex-1 rounded bg-muted/50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Assigned content
                          </p>
                          <ul className="space-y-1">
                            {items.length === 0 ? (
                              <li className="text-muted-foreground">No content mapped yet.</li>
                            ) : (
                              items.map((item) => (
                                <li key={item.id} className="flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" /> {item.title}
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                        <div className="hidden md:flex items-center">
                          <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 rounded bg-primary/5 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Workplace project
                          </p>
                          <p className="flex items-start gap-1.5">
                            <Rocket className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> {rule.projectBrief}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Trace a learner — computes live */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Trace a learner</CardTitle>
                <CardDescription>
                  Pick a competency and a baseline score to see which rule fires and what the pathway becomes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Competency</Label>
                    <Select value={traceCompetency} onValueChange={setTraceCompetency}>
                      <SelectTrigger data-testid="select-trace-competency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {competencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Baseline score</Label>
                      <span className="text-sm font-bold text-primary" data-testid="text-trace-score">
                        {traceScore}
                      </span>
                    </div>
                    <Slider
                      value={[traceScore]}
                      onValueChange={(v) => setTraceScore(v[0])}
                      min={0}
                      max={100}
                      step={1}
                      data-testid="slider-trace-score"
                    />
                    <p className="text-xs text-muted-foreground">
                      Places the learner at{" "}
                      <span className="font-medium text-foreground">{traceLevel.label}</span> on the capability ladder.
                    </p>
                  </div>
                </div>

                <AIAnalysisPanel
                  bare
                  agent={AGENTS.advisor}
                  title="Mapping learner pathway"
                  steps={[
                    "Evaluating baseline score against capability ladder",
                    "Checking competency threshold rules",
                    "Retrieving mapped catalogue items",
                    "Structuring workplace project assignment"
                  ]}
                  runKey={`${traceCompetency}-${traceScore}`}
                >
                <motion.div
                  key={`${traceCompetency}-${traceFires}-${traceContent.length}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: MOTION.duration.base, ease: MOTION.ease.out }}
                  className={`rounded-md border p-4 ${
                    traceFires ? "border-primary/30 bg-primary/5" : "border-border bg-muted/40"
                  }`}
                  data-testid="panel-trace-result"
                >
                  {traceFires ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-primary">
                        Rule fires — score {traceScore} is at or below the {traceRule?.gapAtOrBelow} threshold.
                      </p>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                          Pathway assigned
                        </p>
                        <ul className="space-y-1 text-sm">
                          {traceContent.length === 0 ? (
                            <li className="text-muted-foreground">No content mapped — map items on the Framework tab.</li>
                          ) : (
                            traceContent.map((item, i) => (
                              <li key={item.id} className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                                <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" /> {item.title}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                      <div className="text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Ends on
                        </p>
                        <p className="flex items-start gap-1.5">
                          <Rocket className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> {traceRule?.projectBrief}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No rule fires — score {traceScore} is above the {traceRule?.gapAtOrBelow ?? "—"} threshold for this
                      competency, so it is not treated as a development priority. The learner keeps their current pathway.
                    </p>
                  )}
                </motion.div>
                </AIAnalysisPanel>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Expectation edit dialog */}
        <Dialog open={!!expEdit} onOpenChange={(open) => !open && setExpEdit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {competencies.find((c) => c.id === expEdit?.competencyId)?.short} —{" "}
                {CAPABILITY_LEVELS.find((l) => l.id === expEdit?.levelId)?.label}
              </DialogTitle>
              <DialogDescription>
                Rewrite what this competency looks like at this level. The change persists this session and writes an
                audit entry.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={expDraft}
              onChange={(e) => setExpDraft(e.target.value)}
              className="min-h-[120px]"
              data-testid="input-expectation"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setExpEdit(null)}>
                Cancel
              </Button>
              <Button onClick={saveExpEdit} disabled={!expDraft.trim()} data-testid="button-save-expectation">
                Save expectation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Competency definition dialog */}
        <Dialog open={!!compEdit} onOpenChange={(open) => !open && setCompEdit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit competency</DialogTitle>
              <DialogDescription>Update the competency label and description across the framework.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="comp-label">Label</Label>
                <Input
                  id="comp-label"
                  value={compLabel}
                  onChange={(e) => setCompLabel(e.target.value)}
                  data-testid="input-competency-label"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-desc">Description</Label>
                <Textarea
                  id="comp-desc"
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  className="min-h-[90px]"
                  data-testid="input-competency-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompEdit(null)}>
                Cancel
              </Button>
              <Button onClick={saveCompEdit} disabled={!compLabel.trim()} data-testid="button-save-competency">
                Save competency
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mapping editor dialog */}
        <Dialog open={!!mapEdit} onOpenChange={(open) => !open && setMapEdit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Map catalogue items — {competencies.find((c) => c.id === mapEdit)?.label}
              </DialogTitle>
              <DialogDescription>
                Choose the catalogue items assigned when this competency is a development priority. Personalised
                pathways rebuild from the mapping.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[320px] overflow-y-auto space-y-1.5">
              {catalogue.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2 rounded px-2 py-1.5 hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={mapDraft.includes(item.id)}
                    onCheckedChange={() =>
                      setMapDraft((prev) =>
                        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                      )
                    }
                    data-testid={`checkbox-map-${item.id}`}
                  />
                  <span className="text-sm">
                    {item.title}
                    <span className="text-xs text-muted-foreground block">
                      {item.type} · {COMPETENCY_BY_ID[item.competencyId]?.short}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMapEdit(null)}>
                Cancel
              </Button>
              <Button onClick={saveMapEdit} data-testid="button-save-mapping">
                Save mapping ({mapDraft.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Catalogue item detail sheet */}
        <Sheet open={!!detailItem} onOpenChange={(open) => !open && setDetailId(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {detailItem && (
              <PanelEnter>
                <SheetHeader className="space-y-3 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={catalogueStatusPill(detailItem.status)}>
                      {detailItem.status}
                    </Badge>
                    <Badge variant="outline">{detailItem.type}</Badge>
                    <Badge variant="outline" className="font-mono">
                      {detailItem.version}
                    </Badge>
                  </div>
                  <SheetTitle className="text-2xl">{detailItem.title}</SheetTitle>
                  <SheetDescription className="text-base">
                    {COMPETENCY_BY_ID[detailItem.competencyId]?.label} · {detailItem.language} · {detailItem.owner}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 flex flex-wrap gap-2">
                  {detailItem.status !== "Published" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setCatalogueStatus(detailItem.id, "Published", { by: "FAHR Programme Team" });
                        toast({ title: "Published", description: `${detailItem.title} ${detailItem.version}` });
                      }}
                      data-testid="button-detail-publish"
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      publishCatalogueVersion(detailItem.id, { by: "FAHR Programme Team" });
                      toast({ title: "New version published", description: detailItem.title });
                    }}
                    data-testid="button-detail-version"
                  >
                    Publish new version
                  </Button>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                    <FileText className="w-4 h-4 text-muted-foreground" /> Revision history
                  </h4>
                  {detailRevisions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recorded revisions before this session.</p>
                  ) : (
                    <ol className="space-y-3 border-l border-border pl-4">
                      <AnimatePresence initial={false}>
                        {detailRevisions.map((rev) => (
                          <motion.li
                            key={rev.id}
                            layout
                            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative"
                            data-testid={`revision-${rev.id}`}
                          >
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{rev.version}</span>
                              <Badge variant="outline" className={`text-[10px] ${catalogueStatusPill(rev.status)}`}>
                                {rev.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {rev.on} · {rev.by}
                            </p>
                            {rev.note && <p className="text-sm mt-0.5">{rev.note}</p>}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ol>
                  )}
                </div>
              </PanelEnter>
            )}
          </SheetContent>
        </Sheet>
      </PageEnter>
    </Layout>
  );
}
