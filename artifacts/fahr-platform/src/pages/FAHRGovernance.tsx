import React, { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Activity,
  Cpu,
  Download,
  Printer,
  Search,
  X,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { MINISTRY_BY_ID, type AuditEvent } from "@/lib/federal";
import { CountUp, ChartReveal, MOTION, PageEnter, PanelEnter, Stagger, StaggerItem } from "@/components/motion";
import { downloadCsv, printReport } from "@/lib/exportFile";

/** Entities whose quotas the federal team monitors most closely. */
const MONITORED_ENTITY_COUNT = 5;

/** The governance officer taking these decisions in the demo. */
const GOVERNANCE_OFFICER = "Sultan Al Rashdi";

export default function FAHRGovernance() {
  const { toast } = useToast();
  const { ministries, auditEvents, adjustQuota } = useFederalData();
  const reduceMotion = useReducedMotion();

  const [quotaTarget, setQuotaTarget] = useState<string | null>(null);
  const [quotaDraft, setQuotaDraft] = useState("");
  const [auditAgent, setAuditAgent] = useState("all");
  const [auditEntity, setAuditEntity] = useState("all");
  const [auditQuery, setAuditQuery] = useState("");
  const [openEvent, setOpenEvent] = useState<AuditEvent | null>(null);

  /**
   * Entries recorded during this session are highlighted as they animate in, so
   * a guardrail toggle visibly lands in the trail.
   */
  const seenEventIds = useRef<Set<string> | null>(null);
  if (seenEventIds.current === null) seenEventIds.current = new Set(auditEvents.map((e) => e.id));
  const knownIds = seenEventIds.current;
  const freshIds = useMemo(() => {
    const fresh = auditEvents.filter((e) => !knownIds.has(e.id)).map((e) => e.id);
    return new Set(fresh);
  }, [auditEvents, knownIds]);

  /** Quota status derives from utilisation so it can never contradict the bar. */
  const tokenUsage = useMemo(
    () =>
      [...ministries]
        .sort((a, b) => b.tokensUsedM / b.tokenQuotaM - a.tokensUsedM / a.tokenQuotaM)
        .slice(0, MONITORED_ENTITY_COUNT)
        .map((m) => {
          const utilisation = m.tokensUsedM / m.tokenQuotaM;
          const status =
            utilisation >= 1
              ? "Throttled"
              : utilisation >= 0.95
                ? "Critical"
                : utilisation >= 0.8
                  ? "Warning"
                  : "Normal";
          return {
            id: m.id,
            entity: m.name,
            short: m.shortName,
            used: m.tokensUsedM,
            quota: m.tokenQuotaM,
            status,
            percentage: Math.min(100, Math.round(utilisation * 100)),
          };
        }),
    [ministries],
  );

  const usageChartData = tokenUsage.map((t) => ({
    name: t.short,
    Used: t.used,
    Remaining: Math.max(0, Math.round((t.quota - t.used) * 10) / 10),
  }));

  const federalQuota = useMemo(
    () => ({
      allocated: Math.round(ministries.reduce((sum, m) => sum + m.tokenQuotaM, 0) * 10) / 10,
      used: Math.round(ministries.reduce((sum, m) => sum + m.tokensUsedM, 0) * 10) / 10,
    }),
    [ministries],
  );

  // ------------------------------------------------------------------
  // Guardrails and policy versions
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // Quotas
  // ------------------------------------------------------------------

  const openQuota = (ministryId: string, current: number) => {
    setQuotaTarget(ministryId);
    setQuotaDraft(String(current));
  };

  const applyQuota = () => {
    if (!quotaTarget) return;
    const value = Number(quotaDraft);
    const ministry = MINISTRY_BY_ID[quotaTarget];
    if (!Number.isFinite(value) || value <= 0) {
      toast({ title: "Enter a quota above zero", variant: "destructive" });
      return;
    }
    const rounded = Math.round(value * 10) / 10;
    adjustQuota(quotaTarget, rounded, { by: GOVERNANCE_OFFICER });
    setQuotaTarget(null);
    toast({
      title: "Quota applied",
      description: `${ministry?.name ?? "Entity"} now has ${rounded}M tokens this period — consumption recalculated across the platform.`,
    });
  };

  // ------------------------------------------------------------------
  // Audit trail
  // ------------------------------------------------------------------

  const agentOptions = useMemo(
    () => Array.from(new Set(auditEvents.map((e) => e.agent))).sort(),
    [auditEvents],
  );

  const filteredEvents = useMemo(() => {
    const query = auditQuery.trim().toLowerCase();
    return auditEvents.filter((event) => {
      if (auditAgent !== "all" && event.agent !== auditAgent) return false;
      if (auditEntity !== "all" && (event.ministryId ?? "federal") !== auditEntity) return false;
      if (!query) return true;
      return [event.actor, event.agent, event.action, event.status, event.time, event.detail ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [auditEvents, auditAgent, auditEntity, auditQuery]);

  const filtersActive = auditAgent !== "all" || auditEntity !== "all" || auditQuery !== "";

  const clearFilters = () => {
    setAuditAgent("all");
    setAuditEntity("all");
    setAuditQuery("");
  };

  const filterSummary = [
    auditAgent === "all" ? "All agents" : `Agent: ${auditAgent}`,
    auditEntity === "all"
      ? "All entities"
      : `Entity: ${auditEntity === "federal" ? "Federal" : (MINISTRY_BY_ID[auditEntity]?.name ?? auditEntity)}`,
    auditQuery ? `Search: “${auditQuery}”` : "No text search",
  ];

  const auditRows = filteredEvents.map((event) => [
    event.time,
    event.actor,
    event.agent,
    event.action,
    event.ministryId ? (MINISTRY_BY_ID[event.ministryId]?.name ?? event.ministryId) : "Federal",
  ]);

  const auditHeaders = ["Time", "Actor", "Agent system", "Activity", "Scope"];

  const exportAuditCsv = () => {
    const filename = downloadCsv({ filename: "fahr-audit-trail", headers: auditHeaders, rows: auditRows });
    toast({ title: "Audit log exported", description: `${auditRows.length} entries written to ${filename}.` });
  };

  const printAuditLog = () => {
    printReport({
      title: "Federal AI governance audit log",
      subtitle: `${auditRows.length} of ${auditEvents.length} entries`,
      meta: filterSummary,
      sections: [
        {
          heading: "Federal token allocation",
          facts: [
            { label: "Allocated", value: `${federalQuota.allocated}M` },
            { label: "Used", value: `${federalQuota.used}M` },
            { label: "Entities monitored", value: String(ministries.length) },
          ],
        },
        { heading: "Audit entries", table: { headers: auditHeaders, rows: auditRows } },
      ],
      footnote:
        "Entries include activity from this session across the learner, manager, entity and federal views.",
    });
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Governance and infrastructure"
          description="Federal token quotas, and a record of what every person and agent did on the platform."
          actions={
            <>
              <Button variant="outline" className="gap-2" onClick={printAuditLog} data-testid="button-print-audit">
                <Printer className="w-4 h-4" /> Print governance pack
              </Button>
            </>
          }
        />

        <Stagger className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Audit entries this period", value: auditEvents.length },
            { label: "Entities monitored", value: ministries.length },
            {
              label: "Federal tokens used",
              value: federalQuota.used,
              decimals: 1,
              suffix: `M of ${federalQuota.allocated}M`,
            },
          ].map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">
                    <CountUp to={kpi.value} decimals={kpi.decimals ?? 0} suffix={kpi.suffix} />
                  </p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Token consumption */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-2 border-b border-border/50">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" /> Token consumption (millions)
                </CardTitle>
                <CardDescription>Monthly LLM quota by entity — edit a quota to reallocate it.</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/5">
                Live monitoring
              </Badge>
            </CardHeader>
            <CardContent className="pt-6 flex-1 space-y-6">
              <ChartReveal className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "transparent" }} formatter={(value) => [`${value}M tokens`, ""]} />
                    <Bar dataKey="Used" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="Remaining" stackId="a" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartReveal>

              <div className="space-y-4">
                {tokenUsage.map((entity) => {
                  const isCritical = entity.status === "Critical" || entity.status === "Throttled";
                  const isWarning = entity.status === "Warning";
                  return (
                    <div key={entity.id} className="space-y-1" data-testid={`quota-${entity.id}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{entity.entity}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {entity.used}M / {entity.quota}M
                          </span>
                          {entity.status !== "Normal" && (
                            <Badge
                              variant={isCritical ? "destructive" : "secondary"}
                              className="h-4 px-1.5 text-[10px]"
                            >
                              {entity.status}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => openQuota(entity.id, entity.quota)}
                            data-testid={`button-edit-quota-${entity.id}`}
                          >
                            Edit quota
                          </Button>
                        </div>
                      </div>
                      {/* The bar animates to its new level when the quota changes. */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={`h-full rounded-full ${
                            isCritical ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-primary"
                          }`}
                          initial={false}
                          animate={{ width: `${entity.percentage}%` }}
                          transition={
                            reduceMotion
                              ? { duration: 0 }
                              : { duration: MOTION.duration.slow, ease: MOTION.ease.out }
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                Quota requests from entities arrive in the{" "}
                <Link href="/fahr/escalations" className="text-primary underline-offset-4 hover:underline">
                  escalation queue
                </Link>
                , where approving a request applies the quota here.
              </p>
            </CardContent>
          </Card>

        {/* Audit trail */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Security audit trail
                </CardTitle>
                <CardDescription>
                  Showing {filteredEvents.length} of {auditEvents.length} entries — every sign-in, course, Digital
                  Twin, project and approval on the platform. Actions taken in this session appear here as they happen.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={exportAuditCsv} data-testid="button-export-audit">
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
                <Button variant="secondary" size="sm" className="gap-2" onClick={printAuditLog}>
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={auditQuery}
                  onChange={(e) => setAuditQuery(e.target.value)}
                  placeholder="Search actor, agent or action"
                  className="pl-8"
                  data-testid="input-audit-search"
                />
              </div>
              <Select value={auditAgent} onValueChange={setAuditAgent}>
                <SelectTrigger className="md:w-[210px]" data-testid="select-audit-agent">
                  <SelectValue placeholder="Agent system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agent systems</SelectItem>
                  {agentOptions.map((agent) => (
                    <SelectItem key={agent} value={agent}>
                      {agent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={auditEntity} onValueChange={setAuditEntity}>
                <SelectTrigger className="md:w-[210px]" data-testid="select-audit-entity">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  <SelectItem value="federal">Federal only</SelectItem>
                  {ministries.map((ministry) => (
                    <SelectItem key={ministry.id} value={ministry.id}>
                      {ministry.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filtersActive && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={clearFilters} data-testid="button-clear-audit-filters">
                  <X className="w-4 h-4" /> Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center" data-testid="empty-audit">
                <Activity className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No entries match these filters</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {auditEvents.length} entries are recorded in total. Clear the filters to see the full trail.
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Agent system</TableHead>
                      <TableHead>Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {filteredEvents.map((log) => (
                        <motion.tr
                          layout={!reduceMotion}
                          key={log.id}
                          initial={
                            reduceMotion
                              ? false
                              : { opacity: 0, y: -10, backgroundColor: "hsl(var(--primary) / 0.12)" }
                          }
                          animate={{ opacity: 1, y: 0, backgroundColor: "hsl(var(--primary) / 0)" }}
                          exit={reduceMotion ? undefined : { opacity: 0 }}
                          transition={{
                            duration: MOTION.duration.base,
                            backgroundColor: { duration: freshIds.has(log.id) ? 2.4 : 0 },
                          }}
                          className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                          onClick={() => setOpenEvent(log)}
                          data-testid={`row-audit-${log.id}`}
                        >
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{log.time}</TableCell>
                          <TableCell className="font-medium">{log.actor}</TableCell>
                          <TableCell>{log.agent}</TableCell>
                          <TableCell>{log.action}</TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>

      {/* Quota edit. */}
      <Dialog open={quotaTarget !== null} onOpenChange={(open) => !open && setQuotaTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Set monthly AI token quota</DialogTitle>
            <DialogDescription>
              {quotaTarget ? MINISTRY_BY_ID[quotaTarget]?.name : ""} currently consumes{" "}
              {quotaTarget ? MINISTRY_BY_ID[quotaTarget]?.tokensUsedM : 0}M tokens a month. The new quota applies
              immediately to consumption here and in the entity's own console.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="quota-value">Quota (millions of tokens)</Label>
            <Input
              id="quota-value"
              type="number"
              min={0.1}
              step={0.1}
              value={quotaDraft}
              onChange={(e) => setQuotaDraft(e.target.value)}
              data-testid="input-quota-value"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuotaTarget(null)}>
              Cancel
            </Button>
            <Button onClick={applyQuota} data-testid="button-apply-quota">
              Apply quota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-entry audit detail. */}
      <Sheet open={openEvent !== null} onOpenChange={(open) => !open && setOpenEvent(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {openEvent && (
            <PanelEnter>
              <SheetHeader>
                <SheetTitle>{openEvent.action}</SheetTitle>
                <SheetDescription>
                  Recorded {openEvent.time} · entry {openEvent.id}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {openEvent.ministryId
                      ? (MINISTRY_BY_ID[openEvent.ministryId]?.name ?? openEvent.ministryId)
                      : "Federal scope"}
                  </Badge>
                </div>
                <dl className="space-y-2">
                  {[
                    { label: "Actor", value: openEvent.actor },
                    { label: "Agent system", value: openEvent.agent },
                    {
                      label: "Scope",
                      value: openEvent.ministryId
                        ? (MINISTRY_BY_ID[openEvent.ministryId]?.name ?? openEvent.ministryId)
                        : "Federal",
                    },
                    { label: "Recorded", value: openEvent.time },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                {openEvent.detail && (
                  <div className="rounded-md border border-border p-3" data-testid="text-audit-detail">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      What happened
                    </p>
                    <p className="mt-1">{openEvent.detail}</p>
                  </div>
                )}
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Who did this
                  </p>
                  <p className="mt-1">
                    {openEvent.agent === "Human decision"
                      ? `${openEvent.actor} did this themselves, so the entry is attributable to a named person.`
                      : `${openEvent.actor} did this through ${openEvent.agent}.`}
                  </p>
                </div>
                {openEvent.ministryId && (
                  <Link
                    href={`/fahr?ministry=${openEvent.ministryId}`}
                    className="inline-flex text-primary underline-offset-4 hover:underline"
                  >
                    Open {MINISTRY_BY_ID[openEvent.ministryId]?.shortName ?? "the entity"} in the national drill-down
                  </Link>
                )}
              </div>
            </PanelEnter>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
