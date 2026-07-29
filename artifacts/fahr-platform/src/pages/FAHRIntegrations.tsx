import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plug,
  PlugZap,
  AlertTriangle,
  Database,
  KeyRound,
  Copy,
  Check,
  FileDown,
  Printer,
  Loader2,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { API_SCOPES, type Integration, type IntegrationCategory } from "@/lib/federal";
import { CountUp, PageEnter, Stagger, StaggerItem } from "@/components/motion";
import { downloadCsv, printReport } from "@/lib/exportFile";

/** Category order and copy for the connection card groups. */
const CATEGORY_ORDER: IntegrationCategory[] = [
  "Identity",
  "HR",
  "Analytics",
  "Productivity",
  "Content",
  "API",
];

const CATEGORY_BLURB: Record<IntegrationCategory, string> = {
  Identity: "How federal employees sign in.",
  HR: "The authoritative source of employee records.",
  Analytics: "Where programme figures are reported onward.",
  Productivity: "Calendar, mail and collaboration hand-offs.",
  Content: "How learning content reaches the catalogue.",
  API: "Programmatic surfaces and outbound registries.",
};

/** Status pill styling, matching the green/amber/muted convention. */
function statusPill(status: Integration["status"]) {
  if (status === "Connected") return "bg-green-50 text-green-700 border-green-200";
  if (status === "Degraded") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-muted text-muted-foreground border-border";
}

/** The staged lines a simulated connection test steps through, per integration. */
function testSteps(integration: Integration): string[] {
  const reads = integration.records
    ? `reading ${Math.min(3, integration.records)} sample records…`
    : "reading a sample payload…";
  return [
    `Resolving ${integration.vendor} endpoint…`,
    "Authenticating with the stored credential…",
    reads,
    "Verifying the response schema…",
  ];
}

type TestState = { running: boolean; lineIndex: number; done: boolean };

export default function FAHRIntegrations() {
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const {
    integrations,
    apiCredentials,
    syncIntegration,
    setIntegrationStatus,
    createApiCredential,
    revokeApiCredential,
  } = useFahrConsole();

  const [tests, setTests] = useState<Record<string, TestState>>({});
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newScopes, setNewScopes] = useState<string[]>([]);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /** The one-time secret panel — cleared once dismissed and never re-rendered. */
  const [freshSecret, setFreshSecret] = useState<{ label: string; prefix: string; secret: string } | null>(null);

  // --- KPIs (derived from the integration estate) --------------------------
  const liveCount = integrations.filter((i) => i.status === "Connected").length;
  const degradedCount = integrations.filter((i) => i.status === "Degraded").length;
  const notConnectedCount = integrations.filter((i) => i.status === "Not connected").length;
  // Records synced today: sum the record counts of connections whose last sync
  // reads "Today" or "Live", since those are the ones that moved data today.
  const recordsToday = integrations
    .filter((i) => i.status !== "Not connected" && (i.lastSync.startsWith("Today") || i.lastSync === "Live"))
    .reduce((sum, i) => sum + (i.records ?? 0), 0);

  const kpis = [
    { label: "Connections live", value: liveCount, icon: PlugZap, tone: "text-green-600", testid: "kpi-live" },
    { label: "Degraded", value: degradedCount, icon: AlertTriangle, tone: "text-amber-600", testid: "kpi-degraded" },
    { label: "Not connected", value: notConnectedCount, icon: Plug, tone: "text-muted-foreground", testid: "kpi-not-connected" },
    { label: "Records synced today", value: recordsToday, icon: Database, tone: "text-primary", testid: "kpi-records-today" },
  ];

  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: integrations.filter((i) => i.category === category),
      })).filter((group) => group.items.length > 0),
    [integrations],
  );

  const restApi = integrations.find((i) => i.id === "rest");

  // --- Test connection (simulated, in-card, <1.2s) -------------------------
  const runTest = (integration: Integration) => {
    if (tests[integration.id]?.running) return;
    const steps = testSteps(integration);
    setTests((prev) => ({ ...prev, [integration.id]: { running: true, lineIndex: 0, done: false } }));

    if (reduceMotion) {
      // No staged reveal under reduced motion — go straight to the result.
      syncIntegration(integration.id, { by: "FAHR Programme Team" });
      setTests((prev) => ({ ...prev, [integration.id]: { running: false, lineIndex: steps.length, done: true } }));
      toast({ title: "Connection tested", description: `${integration.name} synced and marked connected.` });
      return;
    }

    const perStep = 260; // 4 steps ≈ 1.04s total, under the 1.2s budget.
    steps.forEach((_, index) => {
      window.setTimeout(() => {
        setTests((prev) => ({
          ...prev,
          [integration.id]: { running: true, lineIndex: index + 1, done: false },
        }));
      }, perStep * (index + 1));
    });
    window.setTimeout(() => {
      syncIntegration(integration.id, { by: "FAHR Programme Team" });
      setTests((prev) => ({
        ...prev,
        [integration.id]: { running: false, lineIndex: steps.length, done: true },
      }));
      toast({ title: "Connection tested", description: `${integration.name} synced and marked connected.` });
    }, perStep * steps.length + 120);
  };

  const disconnectTarget = disconnectId ? integrations.find((i) => i.id === disconnectId) : null;

  const confirmDisconnect = () => {
    if (!disconnectTarget) return;
    setIntegrationStatus(disconnectTarget.id, "Not connected", {
      by: "FAHR Programme Team",
      statusNote: "Disconnected by the FAHR programme team.",
    });
    toast({ title: "Connection disconnected", description: `${disconnectTarget.name} is now not connected.` });
    setDisconnectId(null);
  };

  const reconnect = (integration: Integration) => {
    setIntegrationStatus(integration.id, "Connected", { by: "FAHR Programme Team", statusNote: undefined });
    toast({ title: "Connection restored", description: `${integration.name} is connected again.` });
  };

  // --- API credentials -----------------------------------------------------
  const toggleScope = (scope: string) => {
    setNewScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  };

  const submitCreate = () => {
    const result = createApiCredential({ label: newLabel, scopes: newScopes, owner: "FAHR Programme Team" });
    if (!result) {
      toast({
        title: "Cannot create credential",
        description: "Give the credential a label and at least one scope.",
        variant: "destructive",
      });
      return;
    }
    setFreshSecret({ label: result.credential.label, prefix: result.credential.prefix, secret: result.secret });
    setCreateOpen(false);
    setNewLabel("");
    setNewScopes([]);
    toast({ title: "Credential issued", description: `${result.credential.label} is now active.` });
  };

  const copySecret = async () => {
    if (!freshSecret) return;
    try {
      await navigator.clipboard.writeText(freshSecret.secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ title: "Copy failed", description: "Select the secret and copy it manually.", variant: "destructive" });
    }
  };

  const revokeTarget = revokeId ? apiCredentials.find((c) => c.id === revokeId) : null;
  const confirmRevoke = () => {
    if (!revokeTarget) return;
    revokeApiCredential(revokeTarget.id, { by: "FAHR Programme Team" });
    toast({ title: "Credential revoked", description: `${revokeTarget.label} can no longer be used.` });
    setRevokeId(null);
  };

  // --- Exports -------------------------------------------------------------
  const exportEstateCsv = () => {
    const name = downloadCsv({
      filename: "fahr-integration-estate",
      headers: [
        "Name",
        "Vendor",
        "Category",
        "Status",
        "Direction",
        "Last sync",
        "Records",
        "Owner",
        "Reference",
        "Purpose",
      ],
      rows: integrations.map((i) => [
        i.name,
        i.vendor,
        i.category,
        i.status,
        i.direction,
        i.lastSync,
        i.records ?? "",
        i.owner,
        i.reference,
        i.purpose,
      ]),
    });
    toast({ title: "Estate exported", description: `Saved ${name}.` });
  };

  const printEstate = () => {
    printReport({
      title: "Integration estate report",
      subtitle: "FAHR AI Learning Platform — connection administration",
      meta: [
        `${liveCount} live · ${degradedCount} degraded · ${notConnectedCount} not connected`,
        `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      ],
      sections: [
        {
          heading: "Connection estate",
          facts: [
            { label: "Live", value: String(liveCount) },
            { label: "Degraded", value: String(degradedCount) },
            { label: "Not connected", value: String(notConnectedCount) },
            { label: "Records synced today", value: recordsToday.toLocaleString() },
          ],
          table: {
            headers: ["Name", "Vendor", "Category", "Status", "Direction", "Last sync", "Records", "Owner"],
            numericColumns: [6],
            rows: integrations.map((i) => [
              i.name,
              i.vendor,
              i.category,
              i.status,
              i.direction,
              i.lastSync,
              i.records ? i.records.toLocaleString() : "—",
              i.owner,
            ]),
          },
        },
        {
          heading: "API credentials",
          paragraphs: ["Labels and key prefixes only — secrets are shown once on creation and are never stored."],
          table: {
            headers: ["Label", "Scopes", "Prefix", "Created", "Last used", "Status", "Owner"],
            rows: apiCredentials.map((c) => [
              c.label,
              c.scopes.join(", "),
              `${c.prefix}…`,
              c.createdOn,
              c.lastUsed,
              c.status,
              c.owner,
            ]),
          },
        },
      ],
      footnote: "Front-end administration view — no third-party systems are contacted and no secrets appear in this report.",
    });
    toast({ title: "Report ready", description: "Sending the integration estate report to print." });
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Integrations"
          description="Identity, HR, analytics, productivity and content connections, and the platform API."
          actions={
            <>
              <Button variant="outline" onClick={exportEstateCsv} data-testid="button-export-estate">
                <FileDown className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button variant="outline" onClick={printEstate} data-testid="button-print-estate">
                <Printer className="w-4 h-4 mr-2" /> Estate report
              </Button>
            </>
          }
        />

        {/* KPI row */}
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <kpi.icon className={`w-6 h-6 mb-2 ${kpi.tone}`} />
                  <p className="text-2xl font-bold" data-testid={kpi.testid}>
                    <CountUp to={kpi.value} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Connection cards grouped by category */}
        {grouped.map((group) => (
          <div key={group.category} className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.category}
              </h2>
              <p className="text-xs text-muted-foreground">{CATEGORY_BLURB[group.category]}</p>
            </div>
            <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4" onView>
              {group.items.map((integration) => {
                const test = tests[integration.id];
                const steps = testSteps(integration);
                return (
                  <StaggerItem key={integration.id}>
                    <Card className="h-full flex flex-col" data-testid={`card-integration-${integration.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            <CardDescription>{integration.vendor}</CardDescription>
                          </div>
                          <Badge variant="outline" className={statusPill(integration.status)} data-testid={`status-${integration.id}`}>
                            {integration.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-3 text-sm">
                        <p className="text-muted-foreground">{integration.purpose}</p>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div>
                            <span className="text-muted-foreground">Direction</span>
                            <p className="font-medium">{integration.direction}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last sync</span>
                            <p className="font-medium" data-testid={`lastsync-${integration.id}`}>
                              {integration.lastSync}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Records</span>
                            <p className="font-medium">
                              {integration.records ? integration.records.toLocaleString() : "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Owner</span>
                            <p className="font-medium">{integration.owner}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {integration.dataPoints.map((dp) => (
                            <span
                              key={dp}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground border border-border"
                            >
                              {dp}
                            </span>
                          ))}
                        </div>

                        <p className="text-[11px] text-muted-foreground">{integration.reference}</p>

                        {integration.statusNote && (
                          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                            {integration.statusNote}
                          </div>
                        )}

                        {/* Simulated test output */}
                        <AnimatePresence>
                          {test && (test.running || test.done) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.24 }}
                              className="rounded-md border border-border bg-muted/60 px-3 py-2 font-mono text-[11px] leading-relaxed overflow-hidden"
                              data-testid={`test-output-${integration.id}`}
                            >
                              {steps.slice(0, test.lineIndex).map((line) => (
                                <div key={line} className="text-muted-foreground">
                                  <span className="text-green-600">✓</span> {line}
                                </div>
                              ))}
                              {test.running && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Loader2 className="w-3 h-3 animate-spin" /> working…
                                </div>
                              )}
                              {test.done && (
                                <div className="mt-1 flex items-center gap-1 text-green-700">
                                  <ShieldCheck className="w-3 h-3" /> Connection healthy — synced and marked connected.
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="mt-auto flex flex-wrap gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={test?.running}
                            onClick={() => runTest(integration)}
                            data-testid={`button-test-${integration.id}`}
                          >
                            {test?.running ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Testing…
                              </>
                            ) : (
                              <>
                                <PlugZap className="w-4 h-4 mr-1.5" /> Test connection
                              </>
                            )}
                          </Button>
                          {integration.status === "Not connected" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => reconnect(integration)}
                              data-testid={`button-reconnect-${integration.id}`}
                            >
                              Reconnect
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDisconnectId(integration.id)}
                              data-testid={`button-disconnect-${integration.id}`}
                            >
                              Disconnect
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        ))}

        {/* REST API surface */}
        {restApi && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" /> Platform API surface
              </CardTitle>
              <CardDescription>
                Endpoints exposed by {restApi.name} for entity systems and the federal data office.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {restApi.dataPoints.map((endpoint) => (
                <span
                  key={endpoint}
                  className="rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-xs text-primary"
                  data-testid={`endpoint-${endpoint}`}
                >
                  {endpoint}
                </span>
              ))}
            </CardContent>
          </Card>
        )}

        {/* API credentials */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" /> API credentials
              </CardTitle>
              <CardDescription>Keys granting programmatic access to the platform API.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-credential">
              Create credential
            </Button>
          </CardHeader>
          <CardContent>
            {/* One-time secret panel — shown once, then cleared */}
            <AnimatePresence>
              {freshSecret && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 rounded-md border border-primary/30 bg-primary/5 p-4"
                  data-testid="secret-panel"
                >
                  <p className="text-sm font-medium text-primary">Credential secret for “{freshSecret.label}”</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Shown once — it cannot be retrieved. Copy it now and store it securely.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-background border border-border px-3 py-2 font-mono text-xs break-all" data-testid="text-secret">
                      {freshSecret.secret}
                    </code>
                    <Button size="sm" variant="outline" onClick={copySecret} data-testid="button-copy-secret">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setFreshSecret(null)} data-testid="button-dismiss-secret">
                      I've stored it
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <Stagger as="tbody" onView>
                  {apiCredentials.map((credential) => (
                    <StaggerItem
                      as="tr"
                      variant="row"
                      key={credential.id}
                      className="border-b transition-colors hover:bg-muted/50"
                      data-testid={`row-credential-${credential.id}`}
                    >
                      <TableCell className="font-medium">{credential.label}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {credential.scopes.map((scope) => (
                            <span
                              key={scope}
                              className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground border border-border"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{credential.prefix}…</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {credential.createdOn}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {credential.lastUsed}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            credential.status === "Active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-muted text-muted-foreground border-border"
                          }
                        >
                          {credential.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{credential.owner}</TableCell>
                      <TableCell className="text-right">
                        {credential.status === "Active" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRevokeId(credential.id)}
                            data-testid={`button-revoke-${credential.id}`}
                          >
                            Revoke
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Revoked</span>
                        )}
                      </TableCell>
                    </StaggerItem>
                  ))}
                </Stagger>
              </Table>
            </div>
          </CardContent>
        </Card>
      </PageEnter>

      {/* Disconnect confirmation */}
      <AlertDialog open={disconnectId !== null} onOpenChange={(open) => !open && setDisconnectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The connection will stop moving data until it is reconnected. This writes an audit entry —
              “Disconnected {disconnectTarget?.name} integration” at medium risk — visible on the Governance
              audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-disconnect">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-disconnect"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke confirmation */}
      <AlertDialog open={revokeId !== null} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {revokeTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Any system using this key will lose access immediately. This writes an audit entry —
              “Revoked API credential” at medium risk — visible on the Governance audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-revoke">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-revoke"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create credential dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API credential</DialogTitle>
            <DialogDescription>
              Grant a system programmatic access. The secret is shown once, immediately after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="credential-label">Label</Label>
              <Input
                id="credential-label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Entity reporting sync"
                data-testid="input-credential-label"
              />
            </div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="grid grid-cols-2 gap-2">
                {API_SCOPES.map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={newScopes.includes(scope)}
                      onCheckedChange={() => toggleScope(scope)}
                      data-testid={`checkbox-scope-${scope}`}
                    />
                    <span className="font-mono text-xs">{scope}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreate} data-testid="button-submit-credential">
              Create credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
