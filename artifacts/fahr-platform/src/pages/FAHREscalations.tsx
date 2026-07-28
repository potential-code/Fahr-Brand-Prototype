import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Inbox,
  Loader2 as LoaderIcon,
  CheckCircle2,
  UserX,
  Clock,
  Search,
  FileDown,
  Printer,
  ArrowUpRight,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  FAHR_STAFF,
  LEVEL_BY_ID,
  MINISTRY_BY_ID,
  SUBMISSION_STATE_LABEL,
  competencyLabel,
  type Escalation,
} from "@/lib/federal";
import { CountUp, PageEnter, PanelEnter, Stagger, StaggerItem } from "@/components/motion";
import { downloadCsv, printReport } from "@/lib/exportFile";

const STATUS_TABS: (Escalation["status"] | "All")[] = ["All", "Open", "In progress", "Resolved"];
const KIND_FILTERS: (Escalation["kind"] | "All")[] = ["All", "Approval", "Quota", "Policy", "Support"];

/** Kind pill styling. */
function kindPill(kind: Escalation["kind"]) {
  switch (kind) {
    case "Approval":
      return "bg-primary/10 text-primary border-primary/20";
    case "Quota":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Policy":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "Support":
      return "bg-sky-50 text-sky-700 border-sky-200";
  }
}

/** Status pill styling, matching the green/amber/muted convention. */
function statusPill(status: Escalation["status"]) {
  if (status === "Resolved") return "bg-green-50 text-green-700 border-green-200";
  if (status === "In progress") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-muted text-muted-foreground border-border";
}

/**
 * Parses the seeded "15 July 2026" date form into a Date, so an average age can
 * be derived honestly from `raisedOn`. Returns null when the string is a
 * relative form we cannot place ("Just now", "Today, …").
 */
function parseRaisedOn(raisedOn: string): Date | null {
  const parsed = new Date(raisedOn);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function FAHREscalations() {
  const { toast } = useToast();
  const {
    escalations,
    ministries,
    getSubmission,
    getPerson,
    approvalsFor,
    triageEscalation,
    adjustQuota,
  } = useFederalData();

  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("All");
  const [kindFilter, setKindFilter] = useState<(typeof KIND_FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  // --- KPIs ----------------------------------------------------------------
  const openCount = escalations.filter((e) => e.status === "Open").length;
  const inProgressCount = escalations.filter((e) => e.status === "In progress").length;
  const resolvedCount = escalations.filter((e) => e.status === "Resolved").length;
  const unassignedCount = escalations.filter((e) => e.status !== "Resolved" && !e.assignee).length;

  // Average age of open/in-progress items, derived from `raisedOn` where it can
  // be parsed. Dropped from the KPI row when no dates are placeable.
  const nowMs = Date.now();
  const openAges = escalations
    .filter((e) => e.status !== "Resolved")
    .map((e) => parseRaisedOn(e.raisedOn))
    .filter((d): d is Date => d !== null)
    .map((d) => Math.max(0, Math.round((nowMs - d.getTime()) / 86_400_000)));
  const avgAge = openAges.length > 0 ? Math.round(openAges.reduce((a, b) => a + b, 0) / openAges.length) : null;

  const kpis = [
    { label: "Open", value: openCount, icon: Inbox, tone: "text-muted-foreground", testid: "kpi-open" },
    { label: "In progress", value: inProgressCount, icon: LoaderIcon, tone: "text-amber-600", testid: "kpi-in-progress" },
    { label: "Resolved", value: resolvedCount, icon: CheckCircle2, tone: "text-green-600", testid: "kpi-resolved" },
    { label: "Unassigned", value: unassignedCount, icon: UserX, tone: "text-destructive", testid: "kpi-unassigned" },
    ...(avgAge !== null
      ? [{ label: "Avg age (days)", value: avgAge, icon: Clock, tone: "text-primary", testid: "kpi-avg-age" }]
      : []),
  ];

  // --- Filtering -----------------------------------------------------------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return escalations.filter((e) => {
      if (statusTab !== "All" && e.status !== statusTab) return false;
      if (kindFilter !== "All" && e.kind !== kindFilter) return false;
      if (q) {
        const ministry = MINISTRY_BY_ID[e.ministryId];
        const haystack = [e.subject, e.detail, e.raisedBy, ministry?.name, ministry?.shortName, e.assignee]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [escalations, statusTab, kindFilter, query]);

  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        STATUS_TABS.map((tab) => [
          tab,
          tab === "All" ? escalations.length : escalations.filter((e) => e.status === tab).length,
        ]),
      ) as Record<(typeof STATUS_TABS)[number], number>,
    [escalations],
  );

  const selected = selectedId ? escalations.find((e) => e.id === selectedId) ?? null : null;
  const resolveTarget = resolveId ? escalations.find((e) => e.id === resolveId) ?? null : null;

  // --- Triage actions ------------------------------------------------------
  const assign = (escalation: Escalation, assigneeName: string) => {
    triageEscalation(escalation.id, { assignee: assigneeName }, { by: "FAHR Programme Team" });
    toast({ title: "Assigned", description: `${escalation.subject} assigned to ${assigneeName}.` });
  };

  const setPriority = (escalation: Escalation, priority: Escalation["priority"]) => {
    triageEscalation(escalation.id, { priority }, { by: "FAHR Programme Team" });
    toast({ title: "Priority updated", description: `${escalation.subject} set to ${priority}.` });
  };

  const moveInProgress = (escalation: Escalation) => {
    triageEscalation(escalation.id, { status: "In progress" }, { by: "FAHR Programme Team" });
    toast({ title: "Moved to in progress", description: escalation.subject });
  };

  const submitResolution = () => {
    if (!resolveTarget || !resolutionNote.trim()) return;
    triageEscalation(
      resolveTarget.id,
      { status: "Resolved", resolution: resolutionNote.trim() },
      { by: "FAHR Programme Team" },
    );
    toast({ title: "Escalation resolved", description: resolveTarget.subject });
    setResolveId(null);
    setResolutionNote("");
  };

  /** Quota approval: raises the entity's quota AND resolves the item together. */
  const approveQuota = (escalation: Escalation) => {
    if (escalation.kind !== "Quota" || !escalation.requestedQuotaM) return;
    const ministry = MINISTRY_BY_ID[escalation.ministryId];
    adjustQuota(escalation.ministryId, escalation.requestedQuotaM, { by: "FAHR Programme Team" });
    triageEscalation(
      escalation.id,
      {
        status: "Resolved",
        resolution: `Approved ${escalation.requestedQuotaM}M token quota for ${ministry?.shortName ?? "the entity"}.`,
      },
      { by: "FAHR Programme Team" },
    );
    toast({
      title: "Quota approved",
      description: `${ministry?.shortName ?? "Entity"} quota raised to ${escalation.requestedQuotaM}M and the escalation resolved.`,
    });
  };

  // --- Exports -------------------------------------------------------------
  const filterMeta = () => {
    const bits: string[] = [];
    bits.push(`Status: ${statusTab}`);
    bits.push(`Kind: ${kindFilter}`);
    if (query.trim()) bits.push(`Search: “${query.trim()}”`);
    return bits;
  };

  const exportCsv = () => {
    const name = downloadCsv({
      filename: "fahr-escalation-queue",
      headers: [
        "Subject",
        "Kind",
        "Entity",
        "Raised by",
        "Raised on",
        "Priority",
        "Assignee",
        "Status",
        "Resolution",
        "Resolved on",
      ],
      rows: filtered.map((e) => [
        e.subject,
        e.kind,
        MINISTRY_BY_ID[e.ministryId]?.name ?? e.ministryId,
        e.raisedBy,
        e.raisedOn,
        e.priority ?? "Standard",
        e.assignee ?? "Unassigned",
        e.status,
        e.resolution ?? "",
        e.resolvedOn ?? "",
      ]),
    });
    toast({ title: "Queue exported", description: `Saved ${name}.` });
  };

  const printRegister = () => {
    printReport({
      title: "Escalation register",
      subtitle: "FAHR programme triage queue",
      meta: [
        ...filterMeta(),
        `${filtered.length} item${filtered.length === 1 ? "" : "s"}`,
        `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      ],
      sections: [
        {
          heading: "Queue",
          facts: [
            { label: "Open", value: String(openCount) },
            { label: "In progress", value: String(inProgressCount) },
            { label: "Resolved", value: String(resolvedCount) },
            { label: "Unassigned", value: String(unassignedCount) },
            ...(avgAge !== null ? [{ label: "Avg age (days)", value: String(avgAge) }] : []),
          ],
          table: {
            headers: ["Subject", "Kind", "Entity", "Raised by", "Raised on", "Priority", "Assignee", "Status"],
            rows: filtered.map((e) => [
              e.subject,
              e.kind,
              MINISTRY_BY_ID[e.ministryId]?.shortName ?? e.ministryId,
              e.raisedBy,
              e.raisedOn,
              e.priority ?? "Standard",
              e.assignee ?? "Unassigned",
              e.status,
            ]),
          },
        },
      ],
      footnote: "Front-end programme administration view — session data only.",
    });
    toast({ title: "Register ready", description: "Sending the escalation register to print." });
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Escalations"
          description="One federal triage queue for approvals, quota requests, policy questions and support escalations."
          actions={
            <>
              <Button variant="outline" onClick={exportCsv} data-testid="button-export-queue">
                <FileDown className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button variant="outline" onClick={printRegister} data-testid="button-print-register">
                <Printer className="w-4 h-4 mr-2" /> Register
              </Button>
            </>
          }
        />

        {/* KPI row */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <kpi.icon className={`w-6 h-6 mb-2 ${kpi.tone}`} />
                  <p className="text-2xl font-bold" data-testid={kpi.testid}>
                    <CountUp to={kpi.value} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Triage queue</CardTitle>
            <CardDescription>
              Filter by status and kind, search, then open an item to assign, prioritise and resolve it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as (typeof STATUS_TABS)[number])}>
                <TabsList>
                  {STATUS_TABS.map((tab) => (
                    <TabsTrigger key={tab} value={tab} data-testid={`tab-status-${tab.replace(/\s+/g, "-").toLowerCase()}`}>
                      {tab}
                      <span className="ml-1.5 text-xs text-muted-foreground">{statusCounts[tab]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as (typeof KIND_FILTERS)[number])}>
                  <SelectTrigger className="w-[150px]" data-testid="select-kind">
                    <SelectValue placeholder="Kind" />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_FILTERS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {kind === "All" ? "All kinds" : kind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search subject, entity…"
                    className="pl-8 w-[220px]"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center" data-testid="empty-queue">
                <Inbox className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">Nothing in this view</h3>
                <p className="text-muted-foreground max-w-sm mt-1">
                  No escalations match the current status, kind and search filters. Clear a filter to see more.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Raised by</TableHead>
                      <TableHead>Raised on</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Stagger as="tbody">
                    <AnimatePresence initial={false}>
                      {filtered.map((e) => {
                        const ministry = MINISTRY_BY_ID[e.ministryId];
                        return (
                          <motion.tr
                            layout
                            key={e.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.28 }}
                            className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => setSelectedId(e.id)}
                            data-testid={`row-escalation-${e.id}`}
                          >
                            <TableCell className="font-medium max-w-[260px]">
                              <span className="line-clamp-2">{e.subject}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={kindPill(e.kind)}>
                                {e.kind}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{ministry?.shortName ?? e.ministryId}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{e.raisedBy}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{e.raisedOn}</TableCell>
                            <TableCell>
                              {e.priority === "High" ? (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                                  High
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">Standard</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {e.assignee ?? <span className="text-destructive">Unassigned</span>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusPill(e.status)}>
                                {e.status}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </Stagger>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>

      {/* Detail sheet */}
      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <EscalationDetail
              key={selected.id}
              escalation={selected}
              ministries={ministries}
              getSubmission={getSubmission}
              getPerson={getPerson}
              approvalsFor={approvalsFor}
              onAssign={assign}
              onSetPriority={setPriority}
              onMoveInProgress={moveInProgress}
              onOpenResolve={() => setResolveId(selected.id)}
              onApproveQuota={approveQuota}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Resolve dialog */}
      <Dialog open={resolveId !== null} onOpenChange={(open) => !open && (setResolveId(null), setResolutionNote(""))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve escalation</DialogTitle>
            <DialogDescription>{resolveTarget?.subject}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="resolution-note">Resolution note (required)</Label>
            <Textarea
              id="resolution-note"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="How the federal team closed this item…"
              rows={4}
              data-testid="input-resolution"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setResolveId(null), setResolutionNote(""))}>
              Cancel
            </Button>
            <Button onClick={submitResolution} disabled={!resolutionNote.trim()} data-testid="button-submit-resolution">
              Mark resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// ---------------------------------------------------------------------------
// Detail sheet body
// ---------------------------------------------------------------------------

type DetailProps = {
  escalation: Escalation;
  ministries: ReturnType<typeof useFederalData>["ministries"];
  getSubmission: ReturnType<typeof useFederalData>["getSubmission"];
  getPerson: ReturnType<typeof useFederalData>["getPerson"];
  approvalsFor: ReturnType<typeof useFederalData>["approvalsFor"];
  onAssign: (escalation: Escalation, assignee: string) => void;
  onSetPriority: (escalation: Escalation, priority: Escalation["priority"]) => void;
  onMoveInProgress: (escalation: Escalation) => void;
  onOpenResolve: () => void;
  onApproveQuota: (escalation: Escalation) => void;
};

function EscalationDetail({
  escalation,
  ministries,
  getSubmission,
  getPerson,
  approvalsFor,
  onAssign,
  onSetPriority,
  onMoveInProgress,
  onOpenResolve,
  onApproveQuota,
}: DetailProps) {
  // The entity's live figures come from the session ministries list so quota
  // approvals made this session are reflected here.
  const ministry = ministries.find((m) => m.id === escalation.ministryId) ?? MINISTRY_BY_ID[escalation.ministryId];
  const quotaUtilisation = ministry ? Math.round((ministry.tokensUsedM / ministry.tokenQuotaM) * 100) : null;

  const submission = escalation.submissionId ? getSubmission(escalation.submissionId) : undefined;
  const trail = submission ? approvalsFor(submission.id) : [];
  const person = escalation.personId ? getPerson(escalation.personId) : undefined;

  const resolved = escalation.status === "Resolved";

  return (
    <PanelEnter className="space-y-5">
      <SheetHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={kindPill(escalation.kind)}>
            {escalation.kind}
          </Badge>
          <Badge variant="outline" className={statusPill(escalation.status)}>
            {escalation.status}
          </Badge>
          {escalation.priority === "High" && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              High priority
            </Badge>
          )}
        </div>
        <SheetTitle className="text-left">{escalation.subject}</SheetTitle>
        <SheetDescription className="text-left">
          {ministry?.name ?? escalation.ministryId} · raised by {escalation.raisedBy} on {escalation.raisedOn}
        </SheetDescription>
      </SheetHeader>

      <p className="text-sm text-muted-foreground">{escalation.detail}</p>

      {resolved && escalation.resolution && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800" data-testid="detail-resolution">
          <p className="font-medium">Resolved{escalation.resolvedOn ? ` on ${escalation.resolvedOn}` : ""}</p>
          <p className="mt-1">{escalation.resolution}</p>
        </div>
      )}

      {/* Entity context */}
      {ministry && (
        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Entity context</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Readiness</span>
              <p className="font-medium">{ministry.readiness}%</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Quota utilisation</span>
              <p className="font-medium">
                {ministry.tokensUsedM}M / {ministry.tokenQuotaM}M ({quotaUtilisation}%)
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Entity admin</span>
              <p className="font-medium">{ministry.entityAdmin}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Top gap</span>
              <p className="font-medium">{competencyLabel(ministry.topGapCompetencyId)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Linked project and its approval trail */}
      {submission && (
        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Linked project</p>
          <p className="text-sm font-medium">{submission.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {SUBMISSION_STATE_LABEL[submission.state]} · {submission.impact} impact · {submission.governanceStatus}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{submission.description}</p>
          {trail.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Approval trail</p>
              {trail.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-xs">
                  <ArrowUpRight className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span>
                    <span className="font-medium capitalize">{a.role}</span> — {a.decision.replace(/_/g, " ")} by {a.by} ({a.on})
                    {a.note ? ` · ${a.note}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked learner */}
      {person && (
        <div className="rounded-md border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Learner</p>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{person.name}</span>
            <span className="text-muted-foreground">· {person.role}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {LEVEL_BY_ID[person.levelId]?.label ?? person.levelId} · assessment {person.assessmentScore}% · pathway{" "}
            {person.pathwayProgress}%
          </p>
        </div>
      )}

      {/* Triage controls */}
      {!resolved && (
        <div className="rounded-md border border-border p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Triage</p>

          <div className="space-y-1.5">
            <Label className="text-xs">Assign to</Label>
            <Select value={escalation.assignee ?? ""} onValueChange={(name) => onAssign(escalation, name)}>
              <SelectTrigger data-testid="select-assignee">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {FAHR_STAFF.map((staff) => (
                  <SelectItem key={staff.id} value={staff.name}>
                    {staff.name} — {staff.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select
              value={escalation.priority ?? "Standard"}
              onValueChange={(p) => onSetPriority(escalation, p as Escalation["priority"])}
            >
              <SelectTrigger data-testid="select-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {escalation.kind === "Quota" && escalation.requestedQuotaM && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="text-amber-800">
                Entity requested <span className="font-semibold">{escalation.requestedQuotaM}M</span> tokens
                {ministry ? ` (currently ${ministry.tokenQuotaM}M).` : "."}
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => onApproveQuota(escalation)}
                data-testid="button-approve-quota"
              >
                Approve requested quota
              </Button>
              <p className="text-xs text-amber-700 mt-1.5">
                Raises {ministry?.shortName ?? "the entity"}'s quota to {escalation.requestedQuotaM}M and resolves this
                escalation in one action.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {escalation.status === "Open" && (
              <Button size="sm" variant="outline" onClick={() => onMoveInProgress(escalation)} data-testid="button-in-progress">
                Move to in progress
              </Button>
            )}
            <Button size="sm" onClick={onOpenResolve} data-testid="button-resolve">
              Resolve…
            </Button>
          </div>
        </div>
      )}
    </PanelEnter>
  );
}
