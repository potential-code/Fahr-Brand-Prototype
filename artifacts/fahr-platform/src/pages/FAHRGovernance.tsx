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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Database,
  Download,
  FileText,
  GitBranch,
  Lock,
  Printer,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import {
  GOVERNANCE_POLICIES,
  GUARDRAIL_EFFECT_BY_ID,
  MINISTRY_BY_ID,
  type AuditEvent,
} from "@/lib/federal";
import { CountUp, ChartReveal, MOTION, PageEnter, PanelEnter, Stagger, StaggerItem } from "@/components/motion";
import { downloadCsv, printReport } from "@/lib/exportFile";

/** Icon per guardrail, keyed on the policy ids in the shared model. */
const POLICY_ICONS: Record<string, typeof ShieldCheck> = {
  humanInLoop: ShieldCheck,
  auditTrail: FileText,
  preventPII: Lock,
  dataResidency: Database,
  restrictPublicModels: Server,
  explainability: ShieldAlert,
};

/** Entities whose quotas the federal team monitors most closely. */
const MONITORED_ENTITY_COUNT = 5;

/** The governance officer taking these decisions in the demo. */
const GOVERNANCE_OFFICER = "Sultan Al Rashdi";

const RISK_CLASS: Record<string, string> = {
  High: "text-destructive border-destructive/30 bg-destructive/10",
  Medium: "text-secondary border-secondary/40 bg-secondary/10",
  Low: "text-green-700 border-green-200 bg-green-50",
};

export default function FAHRGovernance() {
  const { toast } = useToast();
  const { ministries, auditEvents, adjustQuota } = useFederalData();
  const {
    guardrails,
    guardrailBehaviour,
    policyVersions,
    policyDrift,
    setGuardrail,
    publishPolicyVersion,
  } = useFahrConsole();
  const reduceMotion = useReducedMotion();

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishSummary, setPublishSummary] = useState("");
  const [quotaTarget, setQuotaTarget] = useState<string | null>(null);
  const [quotaDraft, setQuotaDraft] = useState("");
  const [auditRisk, setAuditRisk] = useState("all");
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

  const policies = GOVERNANCE_POLICIES.map((policy) => ({
    ...policy,
    icon: POLICY_ICONS[policy.id] ?? ShieldCheck,
    effect: GUARDRAIL_EFFECT_BY_ID[policy.id],
    enforced: guardrails[policy.id],
  }));

  const enforcedCount = guardrailBehaviour.enforced.length;
  const latestVersion = policyVersions[0];

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

  const handleToggle = (id: string, next: boolean) => {
    const policy = GOVERNANCE_POLICIES.find((p) => p.id === id);
    const effect = GUARDRAIL_EFFECT_BY_ID[id];
    setGuardrail(id, next, { by: GOVERNANCE_OFFICER });
    toast({
      title: next ? "Guardrail enforced" : "Guardrail relaxed",
      description: `${policy?.label ?? id} — ${next ? effect?.whenOn : effect?.whenOff}`,
      variant: next ? undefined : "destructive",
    });
  };

  const handlePublish = () => {
    publishPolicyVersion({ by: GOVERNANCE_OFFICER, summary: publishSummary.trim() || undefined });
    setPublishOpen(false);
    setPublishSummary("");
    toast({
      title: "Policy version published",
      description: `${enforcedCount} of ${GOVERNANCE_POLICIES.length} guardrails recorded as the federal policy set.`,
    });
  };

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
      if (auditRisk !== "all" && event.risk !== auditRisk) return false;
      if (auditAgent !== "all" && event.agent !== auditAgent) return false;
      if (auditEntity !== "all" && (event.ministryId ?? "federal") !== auditEntity) return false;
      if (!query) return true;
      return [event.actor, event.agent, event.action, event.status, event.time]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [auditEvents, auditRisk, auditAgent, auditEntity, auditQuery]);

  const filtersActive = auditRisk !== "all" || auditAgent !== "all" || auditEntity !== "all" || auditQuery !== "";

  const clearFilters = () => {
    setAuditRisk("all");
    setAuditAgent("all");
    setAuditEntity("all");
    setAuditQuery("");
  };

  const filterSummary = [
    auditRisk === "all" ? "All risk levels" : `Risk: ${auditRisk}`,
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
    event.risk,
    event.status,
    event.ministryId ? (MINISTRY_BY_ID[event.ministryId]?.name ?? event.ministryId) : "Federal",
  ]);

  const auditHeaders = ["Time", "Actor", "Agent system", "Action", "Risk", "Status", "Scope"];

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
          heading: "Policy set in force",
          facts: [
            { label: "Policy version", value: latestVersion?.version ?? "—" },
            { label: "Guardrails enforced", value: `${enforcedCount} of ${GOVERNANCE_POLICIES.length}` },
            {
              label: "Relaxed guardrails",
              value:
                guardrailBehaviour.relaxed.length === 0
                  ? "None"
                  : guardrailBehaviour.relaxed
                      .map((effect) => GOVERNANCE_POLICIES.find((p) => p.id === effect.id)?.label ?? effect.id)
                      .join("; "),
            },
            { label: "Federal token allocation", value: `${federalQuota.used}M of ${federalQuota.allocated}M used` },
          ],
        },
        { heading: "Audit entries", table: { headers: auditHeaders, rows: auditRows } },
      ],
      footnote:
        "Entries include decisions taken during this session across the manager, entity and federal views. The trail is append-only while the audit-trail guardrail is enforced.",
    });
  };

  const exportPolicyHistory = () => {
    const filename = downloadCsv({
      filename: "fahr-ai-policy-history",
      headers: ["Version", "Recorded on", "Recorded by", "Guardrails enforced", "Summary", "Note"],
      rows: policyVersions.map((version) => [
        version.version,
        version.recordedOn,
        version.by,
        `${version.enabledIds.length} of ${GOVERNANCE_POLICIES.length}`,
        version.summary,
        version.note ?? "",
      ]),
    });
    toast({ title: "Policy history exported", description: filename });
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Governance and infrastructure"
          description="Federal AI guardrails, token quotas and the audit trail behind every agent decision."
          actions={
            <>
              <Button
                onClick={() => setPublishOpen(true)}
                className="gap-2"
                disabled={!policyDrift}
                data-testid="button-publish-policy"
              >
                <Upload className="w-4 h-4" />
                {policyDrift ? "Publish policy version" : "Policy set published"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={printAuditLog} data-testid="button-print-audit">
                <Printer className="w-4 h-4" /> Print governance pack
              </Button>
            </>
          }
        />

        {/* What the live guardrail set means for the platform right now. */}
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Guardrails enforced", value: enforcedCount, suffix: ` / ${GOVERNANCE_POLICIES.length}` },
            { label: "Guardrails relaxed", value: guardrailBehaviour.relaxed.length },
            { label: "Audit entries this period", value: auditEvents.length },
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

        <AnimatePresence initial={false}>
          {guardrailBehaviour.relaxed.length > 0 && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              className="overflow-hidden"
              data-testid="banner-relaxed-guardrails"
            >
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">
                      {guardrailBehaviour.relaxed.length} guardrail
                      {guardrailBehaviour.relaxed.length === 1 ? " is" : "s are"} relaxed — platform behaviour has
                      changed
                    </p>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      {guardrailBehaviour.relaxed.map((effect) => (
                        <li key={effect.id}>
                          {effect.whenOff} <span className="text-xs">(affects {effect.surfaces.join(", ")})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Guardrails */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> AI behaviour guardrails
              </CardTitle>
              <CardDescription>
                Each switch changes stated platform behaviour immediately and writes an audit entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              <div className="space-y-4">
                {policies.map((policy) => (
                  <motion.div
                    layout={!reduceMotion}
                    key={policy.id}
                    className={`rounded-md border p-3 transition-colors ${
                      policy.enforced ? "border-border bg-background" : "border-destructive/30 bg-destructive/5"
                    }`}
                    data-testid={`guardrail-${policy.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-full border p-2 ${
                            policy.enforced ? "bg-green-50 border-green-200" : "bg-muted border-border"
                          }`}
                        >
                          <policy.icon
                            className={`w-5 h-5 ${policy.enforced ? "text-green-600" : "text-muted-foreground"}`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{policy.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {policy.scope} scope · owner {policy.owner} · reviewed {policy.lastReviewed}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={policy.enforced}
                        onCheckedChange={(next) => handleToggle(policy.id, next)}
                        className="data-[state=checked]:bg-green-600"
                        data-testid={`switch-${policy.id}`}
                        aria-label={policy.label}
                      />
                    </div>

                    {/* The stated consequence of the switch as it currently sits. */}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={policy.enforced ? "on" : "off"}
                        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: MOTION.duration.fast }}
                        className="mt-3 space-y-2 text-xs"
                      >
                        <p className={policy.enforced ? "text-muted-foreground" : "text-destructive"}>
                          {policy.enforced ? policy.effect?.whenOn : policy.effect?.whenOff}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {policy.effect?.surfaces.map((surface) => (
                            <Badge key={surface} variant="outline" className="text-[10px] font-normal">
                              {surface}
                            </Badge>
                          ))}
                          {!policy.enforced && policy.effect && (
                            <Badge variant="outline" className={`text-[10px] ${RISK_CLASS[policy.effect.offRisk]}`}>
                              {policy.effect.offRisk} risk while relaxed
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
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

            {/* Policy version history */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between pb-2 border-b border-border/50">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-primary" /> AI policy version history
                  </CardTitle>
                  <CardDescription>
                    {policyDrift
                      ? "The live guardrail set differs from the published version."
                      : `Live guardrails match published version ${latestVersion?.version ?? "—"}.`}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={exportPolicyHistory} data-testid="button-export-policy-history">
                  <Download className="w-4 h-4" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <ol className="space-y-4">
                  <AnimatePresence initial={false}>
                    {policyVersions.map((version, index) => (
                      <motion.li
                        layout={!reduceMotion}
                        key={version.id}
                        initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                        data-testid={`policy-version-${version.id}`}
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/40"}`}
                          />
                          {index < policyVersions.length - 1 && <span className="w-px flex-1 bg-border" />}
                        </div>
                        <div className="pb-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {version.version}
                            {index === 0 && (
                              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                                Published
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {version.recordedOn} · {version.by} · {version.enabledIds.length} of{" "}
                            {GOVERNANCE_POLICIES.length} guardrails enforced
                          </p>
                          <p className="mt-1 text-sm">{version.summary}</p>
                          {version.note && <p className="mt-1 text-xs text-muted-foreground">{version.note}</p>}
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Audit trail */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Security audit trail
                </CardTitle>
                <CardDescription>
                  Showing {filteredEvents.length} of {auditEvents.length} entries. Decisions taken elsewhere in this
                  session appear here.
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
              <Select value={auditRisk} onValueChange={setAuditRisk}>
                <SelectTrigger className="md:w-[150px]" data-testid="select-audit-risk">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk levels</SelectItem>
                  <SelectItem value="High">High risk</SelectItem>
                  <SelectItem value="Medium">Medium risk</SelectItem>
                  <SelectItem value="Low">Low risk</SelectItem>
                </SelectContent>
              </Select>
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
                <ShieldCheck className="w-12 h-12 text-muted-foreground/50 mb-4" />
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
                      <TableHead>Action</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
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
                          <TableCell>
                            <Badge variant="outline" className={RISK_CLASS[log.risk]}>
                              {log.risk}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                log.status === "Blocked"
                                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                                  : log.status === "Approved"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-primary/30 bg-primary/10 text-primary"
                              }
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
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

      {/* Publish a policy version from the live guardrail set. */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish the federal AI policy set</DialogTitle>
            <DialogDescription>
              Records the live guardrail configuration as a new version, with {enforcedCount} of{" "}
              {GOVERNANCE_POLICIES.length} guardrails enforced.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm space-y-1">
              {policies.map((policy) => (
                <div key={policy.id} className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">{policy.label}</span>
                  <span className={policy.enforced ? "text-green-700" : "text-destructive"}>
                    {policy.enforced ? "Enforced" : "Relaxed"}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="policy-summary">Change summary (optional)</Label>
              <Textarea
                id="policy-summary"
                value={publishSummary}
                onChange={(e) => setPublishSummary(e.target.value)}
                rows={3}
                placeholder="What changed and why the Governance Board agreed it"
                data-testid="input-policy-summary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} data-testid="button-confirm-publish">
              Publish version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <Badge variant="outline" className={RISK_CLASS[openEvent.risk]}>
                    {openEvent.risk} risk
                  </Badge>
                  <Badge variant="outline">{openEvent.status}</Badge>
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
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Why this entry exists
                  </p>
                  <p className="mt-1">
                    {openEvent.agent === "Human decision"
                      ? "A named person took this decision; the human-in-the-loop guardrail requires it to be attributable."
                      : `${openEvent.agent} acted under the federal guardrail set and its action is recorded for review.`}
                  </p>
                  {!guardrails.auditTrail && (
                    <p className="mt-2 text-xs text-destructive">
                      The audit-trail guardrail is currently relaxed, so newer agent actions are no longer being
                      recorded.
                    </p>
                  )}
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
