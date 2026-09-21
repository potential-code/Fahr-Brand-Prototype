import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Megaphone,
  BellRing,
  Send,
  CalendarClock,
  Search,
  Users2,
  Mail,
  Plus,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import { useFederalData } from "@/lib/FederalDataContext";
import type {
  AudienceKind,
  Communication,
  CommunicationChannel,
  CommunicationKind,
} from "@/lib/entityAdmin/model";
import { COMMUNICATION_CHANNELS } from "@/lib/entityAdmin/model";
import { PLATFORM_ROLES } from "@/lib/entityAdmin/model";
import { REMINDER_CADENCES } from "@/lib/entityAdmin/seed";
import { departmentsOf, peopleOfMinistry } from "@/lib/federal";
import { downloadCsv } from "@/lib/exportFile";
import { KpiRow, FilterSelect, StatusPill, type Kpi } from "@/components/ministry/CatalogueKit";

type AudienceOption = {
  key: string;
  label: string;
  kind: AudienceKind;
  id?: string;
  recipients: number;
};

type Template = { name: string; kind: CommunicationKind; subject: string; body: string; audienceKey: string; cadence?: string };

export default function MinistryCommunications() {
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const { communications, cohorts, accounts, sendCommunication } = useEntityAdmin();
  const { focus } = useFederalData();

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [justSentId, setJustSentId] = useState<string | null>(null);

  // Resolve audience recipient counts from the real data spine.
  const audienceOptions = useMemo<AudienceOption[]>(() => {
    const people = peopleOfMinistry(focus.ministryId);
    const departments = departmentsOf(focus.ministryId);
    const entityActive = accounts.filter((a) => a.status === "Active").length || people.length;
    const atRisk = people.filter((p) => p.status === "at-risk" || p.status === "needs-attention").length;

    const options: AudienceOption[] = [
      { key: "entity", label: "Entity-wide", kind: "entity", recipients: entityActive },
      { key: "status:at-risk", label: "Learners flagged at risk", kind: "status", id: "at-risk", recipients: atRisk },
    ];
    for (const c of cohorts) {
      options.push({ key: `cohort:${c.id}`, label: c.name, kind: "cohort", id: c.id, recipients: c.learners });
    }
    for (const d of departments) {
      options.push({ key: `dept:${d.id}`, label: d.name, kind: "department", id: d.id, recipients: d.activeLearners });
    }
    for (const role of PLATFORM_ROLES) {
      const count = accounts.filter((a) => a.platformRole === role).length;
      options.push({ key: `role:${role}`, label: `All ${role.toLowerCase()}s`, kind: "role", id: role, recipients: count });
    }
    return options;
  }, [accounts, cohorts, focus.ministryId]);

  const audienceByKey = useMemo(
    () => Object.fromEntries(audienceOptions.map((o) => [o.key, o])),
    [audienceOptions],
  );

  const TEMPLATES: Template[] = useMemo(
    () => [
      {
        name: "Nudge at-risk learners",
        kind: "Reminder",
        subject: "Let's get your learning back on track",
        body: "You have not been active on your Personalised Learning Pathway recently. Twenty minutes this week keeps you on schedule — the Learning Agent can suggest where to pick up.",
        audienceKey: "status:at-risk",
        cadence: "Weekly until completed",
      },
      {
        name: "Remind managers to sign off",
        kind: "Reminder",
        subject: "Line managers: workplace projects awaiting your sign-off",
        body: "Your team has Workplace Project Evaluations awaiting a decision. Open the Validations screen to sign off or return them with a note.",
        audienceKey: "role:Line Manager",
        cadence: "Three days before the deadline",
      },
      {
        name: "Announce a new cohort",
        kind: "Announcement",
        subject: "A new cohort is opening — enrolment now live",
        body: "A new cohort is starting. Complete your baseline Capability Profile before the first session so your Personalised Learning Pathway is ready on day one.",
        audienceKey: "entity",
      },
    ],
    [],
  );

  const [form, setForm] = useState({
    kind: "Announcement" as CommunicationKind,
    subject: "",
    body: "",
    audienceKey: "entity",
    channel: "In-platform and email" as CommunicationChannel,
    schedule: false,
    scheduledFor: "",
    cadence: REMINDER_CADENCES[0],
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return communications.filter((c) => {
      if (kindFilter !== "all" && c.kind !== kindFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (channelFilter !== "all" && c.channel !== channelFilter) return false;
      if (q && !`${c.subject} ${c.audienceLabel} ${c.by}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [communications, search, kindFilter, statusFilter, channelFilter]);

  const kpiFigures = useMemo(() => {
    const sent = communications.filter((c) => c.status === "Sent");
    const scheduled = communications.filter((c) => c.status === "Scheduled");
    const reached = sent.reduce((a, c) => a + c.recipients, 0);
    const withRate = sent.filter((c) => typeof c.openRate === "number");
    const avgOpen = withRate.length === 0 ? 0 : Math.round(withRate.reduce((a, c) => a + (c.openRate ?? 0), 0) / withRate.length);
    return { sent: sent.length, scheduled: scheduled.length, reached, avgOpen };
  }, [communications]);

  const kpis: Kpi[] = [
    { label: "Sent this quarter", value: kpiFigures.sent, icon: Send, color: "text-green-600", testId: "kpi-sent" },
    { label: "Scheduled", value: kpiFigures.scheduled, icon: CalendarClock, color: "text-blue-600", testId: "kpi-scheduled" },
    { label: "Recipients reached", value: kpiFigures.reached, icon: Users2, color: "text-primary", testId: "kpi-reached" },
    { label: "Average open rate", value: kpiFigures.avgOpen, suffix: "%", icon: Mail, color: "text-accent", testId: "kpi-open-rate" },
  ];

  const resolvedAudience = audienceByKey[form.audienceKey];

  const resetForm = () =>
    setForm({
      kind: "Announcement",
      subject: "",
      body: "",
      audienceKey: "entity",
      channel: "In-platform and email",
      schedule: false,
      scheduledFor: "",
      cadence: REMINDER_CADENCES[0],
    });

  const applyTemplate = (t: Template) => {
    setForm((f) => ({
      ...f,
      kind: t.kind,
      subject: t.subject,
      body: t.body,
      audienceKey: audienceByKey[t.audienceKey] ? t.audienceKey : "entity",
      cadence: t.cadence ?? f.cadence,
    }));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim() || !resolvedAudience) return;
    if (form.schedule && !form.scheduledFor.trim()) return;
    const record = sendCommunication({
      kind: form.kind,
      subject: form.subject.trim(),
      body: form.body.trim(),
      audienceKind: resolvedAudience.kind,
      audienceId: resolvedAudience.id,
      audienceLabel: resolvedAudience.label,
      recipients: resolvedAudience.recipients,
      channel: form.channel,
      scheduledFor: form.schedule ? form.scheduledFor.trim() : undefined,
      cadence: form.kind === "Reminder" ? form.cadence : undefined,
    });
    setComposeOpen(false);
    resetForm();
    setJustSentId(record.id);
    window.setTimeout(() => setJustSentId((cur) => (cur === record.id ? null : cur)), 2400);
    toast({
      title: form.schedule ? "Scheduled" : "Sent",
      description: `"${record.subject}" ${form.schedule ? `scheduled for ${record.scheduledFor}` : "sent"} to ${record.audienceLabel} (${record.recipients} recipients).`,
    });
  };

  const handleExport = () => {
    const name = downloadCsv({
      filename: "entity-communications",
      title: "MOHAP — Communications History",
      notes: [`${filtered.length} of ${communications.length} messages`],
      headers: ["Kind", "Subject", "Audience", "Channel", "Recipients", "Status", "Sent/Scheduled", "Cadence", "Open rate", "Author"],
      rows: filtered.map((c) => [
        c.kind,
        c.subject,
        c.audienceLabel,
        c.channel,
        c.recipients,
        c.status,
        c.status === "Sent" ? c.sentOn ?? "" : c.scheduledFor ?? "",
        c.cadence ?? "",
        typeof c.openRate === "number" ? `${c.openRate}%` : "",
        c.by,
      ]),
    });
    toast({ title: "History exported", description: `Saved ${name}.` });
  };

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <PageHeader
          tone="primary"
          icon={<Megaphone className="h-7 w-7 text-primary" />}
          title="Communications Centre"
          description="Compose announcements and reminders with audience targeting and channel, schedule sends, and keep a full history."
          actions={
            <>
              <Button variant="outline" onClick={handleExport} data-testid="button-export-comms">
                Export history
              </Button>
              <Dialog open={composeOpen} onOpenChange={(o) => { setComposeOpen(o); if (!o) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-compose">
                    <Plus className="h-4 w-4" /> Compose
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-primary" /> Compose message
                    </DialogTitle>
                    <DialogDescription>Target a real audience, pick a channel, and send now or schedule it.</DialogDescription>
                  </DialogHeader>

                  <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
                    <p className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> Start from a template
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TEMPLATES.map((t) => (
                        <Button
                          key={t.name}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => applyTemplate(t)}
                          data-testid={`button-template-${t.name.replace(/\s+/g, "-").toLowerCase()}`}
                        >
                          {t.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSend} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Kind</label>
                        <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v as CommunicationKind }))}>
                          <SelectTrigger data-testid="select-comms-kind"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Announcement">Announcement</SelectItem>
                            <SelectItem value="Reminder">Reminder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Channel</label>
                        <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v as CommunicationChannel }))}>
                          <SelectTrigger data-testid="select-comms-channel"><SelectValue /></SelectTrigger>
                          <SelectContent>{COMMUNICATION_CHANNELS.map((ch) => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="comms-subject">Subject</label>
                      <Input id="comms-subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g. Complete your baseline assessment" data-testid="input-comms-subject" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="comms-body">Message</label>
                      <Textarea id="comms-body" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Write your message." className="min-h-[110px]" data-testid="input-comms-body" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Audience</label>
                      <Select value={form.audienceKey} onValueChange={(v) => setForm((f) => ({ ...f, audienceKey: v }))}>
                        <SelectTrigger data-testid="select-comms-audience"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {audienceOptions.map((o) => (
                            <SelectItem key={o.key} value={o.key}>{o.label} — {o.recipients} recipients</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {resolvedAudience && (
                        <p className="rounded-md bg-muted px-3 py-2 text-sm" data-testid="text-audience-resolved">
                          <span className="font-medium text-foreground">{resolvedAudience.label}</span>
                          <span className="text-muted-foreground"> — this reaches {resolvedAudience.recipients} recipients.</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-medium">Schedule for later</p>
                        <p className="text-xs text-muted-foreground">Off sends immediately.</p>
                      </div>
                      <Switch checked={form.schedule} onCheckedChange={(v) => setForm((f) => ({ ...f, schedule: v }))} data-testid="switch-schedule" />
                    </div>

                    {form.schedule && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="comms-date">Send date</label>
                        <Input id="comms-date" value={form.scheduledFor} onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))} placeholder="e.g. 3 August 2026" data-testid="input-comms-date" />
                      </div>
                    )}

                    {form.kind === "Reminder" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Cadence</label>
                        <Select value={form.cadence} onValueChange={(v) => setForm((f) => ({ ...f, cadence: v }))}>
                          <SelectTrigger data-testid="select-comms-cadence"><SelectValue /></SelectTrigger>
                          <SelectContent>{REMINDER_CADENCES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    )}

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
                      <Button
                        type="submit"
                        className="gap-2"
                        disabled={!form.subject.trim() || !form.body.trim() || (form.schedule && !form.scheduledFor.trim())}
                        data-testid="button-submit-comms"
                      >
                        {form.schedule ? <><CalendarClock className="h-4 w-4" /> Schedule</> : <><Send className="h-4 w-4" /> Send now</>}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          }
        />

        <KpiRow kpis={kpis} />

        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg">History</CardTitle>
                <CardDescription>Showing {filtered.length} of {communications.length} messages</CardDescription>
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject, audience or author" className="pl-9" data-testid="input-search-comms" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect label="Kind" value={kindFilter} onChange={setKindFilter} allLabel="All kinds" testId="select-filter-kind" options={[{ value: "Announcement", label: "Announcement" }, { value: "Reminder", label: "Reminder" }]} />
              <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} allLabel="All statuses" testId="select-filter-comms-status" options={[{ value: "Sent", label: "Sent" }, { value: "Scheduled", label: "Scheduled" }]} />
              <FilterSelect label="Channel" value={channelFilter} onChange={setChannelFilter} allLabel="All channels" testId="select-filter-channel" options={COMMUNICATION_CHANNELS.map((c) => ({ value: c, label: c }))} />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Megaphone /></EmptyMedia>
                  <EmptyTitle>No matching messages</EmptyTitle>
                  <EmptyDescription>Adjust the filters or compose a new message.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {filtered.map((c) => (
                    <motion.div
                      key={c.id}
                      layout={!reduceMotion}
                      initial={justSentId === c.id || c.createdInSession ? { opacity: 0, y: 12, backgroundColor: "rgba(15,124,116,0.08)" } : false}
                      animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0,0,0,0)" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <CommunicationCard comm={c} isNew={justSentId === c.id} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>
    </Layout>
  );
}

function CommunicationCard({ comm, isNew }: { comm: Communication; isNew: boolean }) {
  const KindIcon = comm.kind === "Reminder" ? BellRing : Megaphone;
  return (
    <div
      className="rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
      data-testid={`row-comm-${comm.id}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <KindIcon className="h-3 w-3" /> {comm.kind}
            </Badge>
            <StatusPill status={comm.status} testId={`status-comm-${comm.id}`} />
            {isNew && <Badge variant="secondary" className="bg-primary/10 text-primary">Just sent</Badge>}
          </div>
          <h3 className="font-semibold">{comm.subject}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{comm.body}</p>
          <p className="text-xs text-muted-foreground">
            <Users2 className="mr-1 inline h-3 w-3" />
            {comm.audienceLabel} · {comm.recipients} recipients · {comm.channel} · by {comm.by}
            {comm.cadence ? ` · ${comm.cadence}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right text-sm">
          <p className="font-medium" data-testid={`text-comm-recipients-${comm.id}`}>{comm.recipients.toLocaleString()} recipients</p>
          <p className="text-xs text-muted-foreground">
            {comm.status === "Sent" ? `Sent ${comm.sentOn}` : `Scheduled ${comm.scheduledFor}`}
          </p>
          {typeof comm.openRate === "number" && (
            <p className="text-xs text-muted-foreground">{comm.openRate}% open rate</p>
          )}
        </div>
      </div>
    </div>
  );
}
