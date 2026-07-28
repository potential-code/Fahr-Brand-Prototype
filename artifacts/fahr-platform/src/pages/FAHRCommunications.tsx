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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Megaphone,
  Users,
  MailOpen,
  CalendarClock,
  Send,
  Inbox,
  Mail,
  Monitor,
  MessagesSquare,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  PageEnter,
  Stagger,
  StaggerItem,
  CountUp,
  PanelEnter,
  MOTION,
} from "@/components/motion";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { useFederalData } from "@/lib/FederalDataContext";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import {
  FEDERAL_ROLES,
  MINISTRY_BY_ID,
  type Announcement,
  type AnnouncementChannel,
  type AnnouncementKind,
  type AnnouncementAudience,
} from "@/lib/federal";
import { downloadCsv, printReport, stampedFilename } from "@/lib/exportFile";

const CHANNELS: { id: AnnouncementChannel; icon: typeof Mail }[] = [
  { id: "In-app", icon: Monitor },
  { id: "Email", icon: Mail },
  { id: "Microsoft Teams", icon: MessagesSquare },
];

const KIND_OPTIONS: AnnouncementKind[] = ["Announcement", "Campaign"];

/** Roles a communication can be targeted at (learners, managers, admins etc.). */
const TARGETABLE_ROLES = FEDERAL_ROLES.map((r) => r.label);

const LEVEL_BY_ID = Object.fromEntries(CAPABILITY_LEVELS.map((l) => [l.id, l.label]));

function statusPill(status: Announcement["status"]) {
  if (status === "Sent") return "bg-green-50 text-green-700 border-green-200";
  if (status === "Scheduled") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-muted text-muted-foreground border-border";
}

function kindPill(kind: AnnouncementKind) {
  if (kind === "Campaign") return "bg-primary/10 text-primary border-primary/20";
  if (kind === "Coach nudge") return "bg-accent/10 text-accent border-accent/20";
  return "bg-secondary/10 text-secondary border-secondary/20";
}

/** Human-readable audience summary, resolving ids to labels. */
function audienceSummary(audience: AnnouncementAudience): string {
  const parts: string[] = [];
  parts.push(
    audience.entityIds.length === 0
      ? "All entities"
      : audience.entityIds.map((id) => MINISTRY_BY_ID[id]?.shortName ?? id).join(", "),
  );
  if (audience.roleLabels.length > 0) parts.push(audience.roleLabels.join(", "));
  if (audience.levelIds.length > 0)
    parts.push(audience.levelIds.map((id) => LEVEL_BY_ID[id] ?? id).join(", "));
  return parts.join(" · ");
}

export default function FAHRCommunications() {
  const { toast } = useToast();
  const { ministries } = useFederalData();
  const { announcements, estimateRecipients, sendAnnouncement } = useFahrConsole();
  const reduceMotion = useReducedMotion();

  // Composer state.
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<AnnouncementKind>("Announcement");
  const [channels, setChannels] = useState<AnnouncementChannel[]>(["In-app"]);
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [roleLabels, setRoleLabels] = useState<string[]>([]);
  const [levelIds, setLevelIds] = useState<string[]>([]);

  // History filters + detail sheet.
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const audience: AnnouncementAudience = useMemo(
    () => ({ entityIds, roleLabels, levelIds }),
    [entityIds, roleLabels, levelIds],
  );
  const estimatedRecipients = estimateRecipients(audience);

  // --- KPI row (all derived from `announcements`) --------------------------
  const kpis = useMemo(() => {
    const sent = announcements.filter((a) => a.status === "Sent");
    const scheduled = announcements.filter((a) => a.status === "Scheduled").length;
    const recipientsReached = sent.reduce((sum, a) => sum + a.recipients, 0);
    // Average open rate excludes items without an `opened` figure, per brief.
    const withOpens = sent.filter((a) => typeof a.opened === "number" && a.recipients > 0);
    const avgOpenRate =
      withOpens.length === 0
        ? 0
        : Math.round(
            (withOpens.reduce((sum, a) => sum + (a.opened as number) / a.recipients, 0) /
              withOpens.length) *
              100,
          );
    return { sent: sent.length, recipientsReached, avgOpenRate, scheduled };
  }, [announcements]);

  const filtered = useMemo(
    () =>
      announcements.filter(
        (a) =>
          (kindFilter === "all" || a.kind === kindFilter) &&
          (statusFilter === "all" || a.status === statusFilter),
      ),
    [announcements, kindFilter, statusFilter],
  );

  const selected = selectedId ? announcements.find((a) => a.id === selectedId) ?? null : null;

  const toggle = <T,>(list: T[], value: T, setList: (v: T[]) => void) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const clearComposer = () => {
    setTitle("");
    setBody("");
    setKind("Announcement");
    setChannels(["In-app"]);
    setEntityIds([]);
    setRoleLabels([]);
    setLevelIds([]);
  };

  const validationError = (() => {
    if (!title.trim()) return "Add a title before sending.";
    if (!body.trim()) return "Add a message body before sending.";
    if (channels.length === 0) return "Choose at least one channel.";
    return null;
  })();

  const submit = (status: Announcement["status"]) => {
    if (validationError) {
      toast({ title: "Not sent", description: validationError });
      return;
    }
    const id = sendAnnouncement({
      title: title.trim(),
      body: body.trim(),
      kind,
      channels,
      audience,
      status,
      scheduledFor: status === "Scheduled" ? "Next scheduling window" : undefined,
      by: "FAHR Programme Team",
    });
    toast({
      title: status === "Scheduled" ? "Scheduled" : "Sent",
      description:
        status === "Scheduled"
          ? `"${title.trim()}" is scheduled to ${estimatedRecipients.toLocaleString()} recipients.`
          : `"${title.trim()}" sent to ${estimatedRecipients.toLocaleString()} recipients.`,
    });
    clearComposer();
    setSelectedId(id);
  };

  // --- Exports -------------------------------------------------------------
  const exportHeaders = [
    "Title",
    "Kind",
    "Channels",
    "Audience",
    "Recipients",
    "Status",
    "Date",
    "Opened",
    "Acted",
  ];
  const exportRows = filtered.map((a) => [
    a.title,
    a.kind,
    a.channels.join(" / "),
    audienceSummary(a.audience),
    a.recipients,
    a.status,
    a.sentOn,
    a.opened ?? "",
    a.acted ?? "",
  ]);

  const handleExportCsv = () => {
    const name = downloadCsv({ filename: "fahr-communications-log", headers: exportHeaders, rows: exportRows });
    toast({ title: "CSV downloaded", description: name });
  };

  const handlePrint = () => {
    printReport({
      title: "Federal communications log",
      subtitle: "National announcements and campaigns to entities, administrators and learners",
      meta: [
        `${filtered.length} of ${announcements.length} communications`,
        kindFilter === "all" ? "All kinds" : kindFilter,
        statusFilter === "all" ? "All statuses" : statusFilter,
      ],
      sections: [
        {
          heading: "This period",
          facts: [
            { label: "Sent", value: String(kpis.sent) },
            { label: "Recipients reached", value: kpis.recipientsReached.toLocaleString() },
            { label: "Average open rate", value: `${kpis.avgOpenRate}%` },
            { label: "Scheduled", value: String(kpis.scheduled) },
          ],
        },
        {
          heading: "Communications",
          table: {
            headers: exportHeaders,
            rows: exportRows,
            numericColumns: [4, 7, 8],
          },
        },
      ],
      footnote: `Generated ${stampedFilename("communications", "pdf").replace(/^.*-(\d{4}-\d{2}-\d{2})\.pdf$/, "$1")} · FAHR AI Learning Platform.`,
    });
    toast({ title: "Print pack ready", description: "Federal communications log sent to print." });
  };

  const kpiCards = [
    { label: "Sent this period", value: kpis.sent, icon: Send, suffix: "" },
    { label: "Recipients reached", value: kpis.recipientsReached, icon: Users, suffix: "" },
    { label: "Average open rate", value: kpis.avgOpenRate, icon: MailOpen, suffix: "%" },
    { label: "Scheduled", value: kpis.scheduled, icon: CalendarClock, suffix: "" },
  ];

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Communications"
          description="National announcements and campaigns to entities, administrators and learners."
          actions={
            <>
              <Button variant="outline" onClick={handleExportCsv} data-testid="button-export-csv">
                Export CSV
              </Button>
              <Button variant="secondary" onClick={handlePrint} data-testid="button-print-log">
                Print log
              </Button>
            </>
          }
        />

        {/* KPI row */}
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => (
            <StaggerItem key={kpi.label}>
              <Card>
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <kpi.icon className="w-6 h-6 mb-2 text-primary" />
                  <p className="text-2xl font-bold" data-testid={`kpi-comms-${i}`}>
                    <CountUp to={kpi.value} suffix={kpi.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Composer */}
          <Card className="xl:col-span-2 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" /> Compose
              </CardTitle>
              <CardDescription>Draft a federal announcement or campaign and target the audience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="space-y-1.5">
                <Label htmlFor="comms-title">Title</Label>
                <Input
                  id="comms-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 federal AI capability challenge"
                  data-testid="input-comms-title"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comms-body">Message</Label>
                <Textarea
                  id="comms-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What are you telling entities, administrators or learners?"
                  className="min-h-[110px]"
                  data-testid="input-comms-body"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Kind</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as AnnouncementKind)}>
                  <SelectTrigger data-testid="select-comms-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KIND_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Channels</Label>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map(({ id, icon: Icon }) => {
                    const on = channels.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggle(channels, id, setChannels)}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          on
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                        aria-pressed={on}
                        data-testid={`button-channel-${id}`}
                      >
                        <Icon className="w-4 h-4" /> {id}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target entities</Label>
                <p className="text-xs text-muted-foreground">Leave empty for all entities.</p>
                <div className="max-h-36 overflow-y-auto rounded-md border border-border p-2 space-y-1.5">
                  {ministries.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 text-sm rounded px-1.5 py-1 hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={entityIds.includes(m.id)}
                        onCheckedChange={() => toggle(entityIds, m.id, setEntityIds)}
                        data-testid={`checkbox-entity-${m.id}`}
                      />
                      <span>{m.shortName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Target roles</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TARGETABLE_ROLES.map((role) => {
                      const on = roleLabels.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggle(roleLabels, role, setRoleLabels)}
                          className={`rounded-md border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            on
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          }`}
                          aria-pressed={on}
                          data-testid={`button-role-${role}`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target capability levels</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CAPABILITY_LEVELS.map((level) => {
                      const on = levelIds.includes(level.id);
                      return (
                        <button
                          key={level.id}
                          type="button"
                          onClick={() => toggle(levelIds, level.id, setLevelIds)}
                          className={`rounded-md border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            on
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          }`}
                          aria-pressed={on}
                          data-testid={`button-level-${level.id}`}
                        >
                          {level.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Live audience readout */}
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Estimated recipients</p>
                  <p className="text-xs text-muted-foreground/80">{audienceSummary(audience)}</p>
                </div>
                <motion.p
                  key={estimatedRecipients}
                  initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: MOTION.duration.fast, ease: MOTION.ease.out }}
                  className="text-2xl font-bold text-primary"
                  data-testid="text-estimated-recipients"
                >
                  {estimatedRecipients.toLocaleString()}
                </motion.p>
              </div>

              {validationError && (
                <p className="text-xs text-destructive" data-testid="text-validation">
                  {validationError}
                </p>
              )}
            </CardContent>
            <div className="flex gap-2 p-4 pt-0">
              <Button className="flex-1 gap-2" onClick={() => submit("Sent")} data-testid="button-send">
                <Send className="w-4 h-4" /> Send now
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => submit("Scheduled")}
                data-testid="button-schedule"
              >
                <CalendarClock className="w-4 h-4" /> Schedule
              </Button>
            </div>
          </Card>

          {/* History */}
          <Card className="xl:col-span-3 flex flex-col">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Communications history</CardTitle>
                <CardDescription>Every announcement, campaign and coach nudge.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={kindFilter} onValueChange={setKindFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-filter-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All kinds</SelectItem>
                    <SelectItem value="Announcement">Announcement</SelectItem>
                    <SelectItem value="Campaign">Campaign</SelectItem>
                    <SelectItem value="Coach nudge">Coach nudge</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {filtered.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center">
                  <Inbox className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No communications match</h3>
                  <p className="text-muted-foreground max-w-sm mt-1 text-sm">
                    No items match the current filters. Clear a filter or compose a new communication.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Communication</TableHead>
                        <TableHead>Audience</TableHead>
                        <TableHead className="text-right">Recipients</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Engagement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <Stagger as="tbody" onView>
                      <AnimatePresence initial={false}>
                        {filtered.map((a) => (
                          <StaggerItem
                            as="tr"
                            variant="row"
                            key={a.id}
                            className="cursor-pointer hover:bg-muted/50 border-b transition-colors"
                            data-testid={`row-announcement-${a.id}`}
                          >
                            <TableCell
                              className="align-top"
                              onClick={() => setSelectedId(a.id)}
                            >
                              <div className="font-medium text-primary">{a.title}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="outline" className={`text-[10px] ${kindPill(a.kind)}`}>
                                  {a.kind === "Coach nudge" && <Sparkles className="w-3 h-3 mr-1" />}
                                  {a.kind}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {a.channels.join(" · ")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="align-top text-sm text-muted-foreground" onClick={() => setSelectedId(a.id)}>
                              {audienceSummary(a.audience)}
                            </TableCell>
                            <TableCell className="align-top text-right font-medium" onClick={() => setSelectedId(a.id)}>
                              {a.recipients.toLocaleString()}
                            </TableCell>
                            <TableCell className="align-top" onClick={() => setSelectedId(a.id)}>
                              <Badge variant="outline" className={statusPill(a.status)}>
                                {a.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap" onClick={() => setSelectedId(a.id)}>
                              {a.sentOn}
                            </TableCell>
                            <TableCell className="align-top text-right text-sm" onClick={() => setSelectedId(a.id)}>
                              {typeof a.opened === "number" ? (
                                <span className="text-muted-foreground">
                                  {Math.round((a.opened / Math.max(1, a.recipients)) * 100)}% opened
                                  {typeof a.acted === "number" ? ` · ${a.acted.toLocaleString()} acted` : ""}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                          </StaggerItem>
                        ))}
                      </AnimatePresence>
                    </Stagger>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail sheet */}
        <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selected && (
              <PanelEnter>
                <SheetHeader className="space-y-3 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={kindPill(selected.kind)}>
                      {selected.kind}
                    </Badge>
                    <Badge variant="outline" className={statusPill(selected.status)}>
                      {selected.status}
                    </Badge>
                  </div>
                  <SheetTitle className="text-2xl">{selected.title}</SheetTitle>
                  <SheetDescription className="text-base text-foreground/80">
                    {selected.body}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">Recipients</p>
                      <p className="text-lg font-bold">{selected.recipients.toLocaleString()}</p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">Channels</p>
                      <p className="font-medium">{selected.channels.join(", ")}</p>
                    </div>
                  </div>

                  {typeof selected.opened === "number" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border border-border p-3">
                        <p className="text-xs text-muted-foreground">Opened</p>
                        <p className="font-medium">
                          {selected.opened.toLocaleString()} (
                          {Math.round((selected.opened / Math.max(1, selected.recipients)) * 100)}%)
                        </p>
                      </div>
                      {typeof selected.acted === "number" && (
                        <div className="rounded-md border border-border p-3">
                          <p className="text-xs text-muted-foreground">Acted</p>
                          <p className="font-medium">{selected.acted.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-md border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Resolved audience
                    </p>
                    <div>
                      <p className="text-xs text-muted-foreground">Entities</p>
                      <p>
                        {selected.audience.entityIds.length === 0
                          ? "All entities"
                          : selected.audience.entityIds
                              .map((id) => MINISTRY_BY_ID[id]?.name ?? id)
                              .join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Roles</p>
                      <p>{selected.audience.roleLabels.length === 0 ? "All roles" : selected.audience.roleLabels.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Capability levels</p>
                      <p>
                        {selected.audience.levelIds.length === 0
                          ? "All levels"
                          : selected.audience.levelIds.map((id) => LEVEL_BY_ID[id] ?? id).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {selected.status === "Scheduled" ? "Scheduled for" : "Sent"} {selected.sentOn} · by{" "}
                    {selected.sentBy}
                  </div>
                </div>
              </PanelEnter>
            )}
          </SheetContent>
        </Sheet>
      </PageEnter>
    </Layout>
  );
}
