import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, PanelEnter, CountUp } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  CalendarClock,
  CalendarDays,
  MapPin,
  Plus,
  Users2,
  UserCheck,
  Video,
  XCircle,
  Clock,
  Presentation,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import { useFederalData } from "@/lib/FederalDataContext";
import type { EntityEvent, EventFormat } from "@/lib/entityAdmin/model";
import { EVENT_FORMATS } from "@/lib/entityAdmin/model";
import { eventRegistrations, eventAttendance } from "@/lib/entityAdmin/selectors";
import { departmentsOf, competencyLabel } from "@/lib/federal";
import { COMPETENCIES } from "@/lib/learningData";
import { downloadCsv } from "@/lib/exportFile";
import { KpiRow, StatusPill, FillBar, type Kpi } from "@/components/ministry/CatalogueKit";

type Group = "upcoming" | "completed" | "cancelled";

const groupOf = (e: EntityEvent): Group => {
  if (e.status === "Cancelled") return "cancelled";
  if (e.status === "Completed") return "completed";
  return "upcoming";
};

const FORMAT_ICON: Record<EventFormat, typeof Video> = {
  "Instructor-led session": Presentation,
  Webinar: Video,
  "In person": MapPin,
  Hybrid: Users2,
};

export default function MinistryEvents() {
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();
  const { events, cohorts, scheduleEvent, rescheduleEvent, cancelEvent, updateEventSeats } = useEntityAdmin();
  const { focus } = useFederalData();
  const departments = useMemo(() => departmentsOf(focus.ministryId), [focus.ministryId]);

  const [tab, setTab] = useState<Group>("upcoming");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justScheduledId, setJustScheduledId] = useState<string | null>(null);
  const [seatDraft, setSeatDraft] = useState("");

  // Reschedule / cancel capture, keyed inside the detail panel.
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [cancelMode, setCancelMode] = useState(false);
  const [reDate, setReDate] = useState("");
  const [reTime, setReTime] = useState("");
  const [reNote, setReNote] = useState("");
  const [cancelNote, setCancelNote] = useState("");

  const AUDIENCE_OPTIONS = useMemo(
    () => [
      { value: "entity", label: "Entity-wide" },
      { value: "managers", label: "All department managers" },
      ...cohorts.map((c) => ({ value: `cohort:${c.id}`, label: c.name })),
      ...departments.map((d) => ({ value: `dept:${d.id}`, label: d.name })),
    ],
    [cohorts, departments],
  );

  const [form, setForm] = useState({
    title: "",
    summary: "",
    format: "Instructor-led session" as EventFormat,
    facilitator: "",
    date: "",
    time: "",
    location: "Microsoft Teams",
    seats: "40",
    audience: "entity",
    competencyId: "none",
  });

  const groups = useMemo(() => {
    const out: Record<Group, EntityEvent[]> = { upcoming: [], completed: [], cancelled: [] };
    for (const e of events) out[groupOf(e)].push(e);
    return out;
  }, [events]);

  const selected = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;
  const registrations = useMemo(() => (selected ? eventRegistrations(selected) : []), [selected]);
  const attendance = useMemo(() => (selected ? eventAttendance(selected) : null), [selected]);

  // KPIs across all events.
  const kpiFigures = useMemo(() => {
    const upcoming = groups.upcoming;
    const seatsOffered = upcoming.reduce((a, e) => a + e.seats, 0);
    const seatsFilled = upcoming.reduce((a, e) => a + Math.min(e.registered, e.seats), 0);
    const completed = groups.completed;
    let attended = 0;
    let registered = 0;
    for (const e of completed) {
      const att = eventAttendance(e);
      if (att) {
        attended += att.attended;
        registered += e.registered;
      }
    }
    return {
      upcoming: upcoming.length,
      seatsOffered,
      seatsFilled,
      fillRate: seatsOffered === 0 ? 0 : Math.round((seatsFilled / seatsOffered) * 100),
      attendanceRate: registered === 0 ? 0 : Math.round((attended / registered) * 100),
    };
  }, [groups]);

  const kpis: Kpi[] = [
    { label: "Upcoming sessions", value: kpiFigures.upcoming, icon: CalendarDays, color: "text-primary", testId: "kpi-upcoming" },
    { label: "Seats offered", value: kpiFigures.seatsOffered, icon: Users2, color: "text-secondary", testId: "kpi-seats-offered", hint: "across upcoming sessions" },
    { label: "Seats filled", value: kpiFigures.seatsFilled, suffix: ` · ${kpiFigures.fillRate}%`, icon: UserCheck, color: "text-accent", testId: "kpi-seats-filled" },
    { label: "Attendance rate", value: kpiFigures.attendanceRate, suffix: "%", icon: CalendarClock, color: "text-green-600", testId: "kpi-attendance", hint: "completed sessions" },
  ];

  const resetForm = () =>
    setForm({
      title: "",
      summary: "",
      format: "Instructor-led session",
      facilitator: "",
      date: "",
      time: "",
      location: "Microsoft Teams",
      seats: "40",
      audience: "entity",
      competencyId: "none",
    });

  const audienceLabel = (value: string): string =>
    AUDIENCE_OPTIONS.find((o) => o.value === value)?.label ?? "Entity-wide";

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date.trim() || !form.time.trim()) return;
    const record = scheduleEvent({
      title: form.title.trim(),
      summary: form.summary.trim() || "Entity learning session.",
      format: form.format,
      facilitator: form.facilitator.trim() || "Entity L&D team",
      date: form.date.trim(),
      time: form.time.trim(),
      location: form.location.trim() || "Microsoft Teams",
      seats: Math.max(1, Number(form.seats) || 40),
      audienceLabel: audienceLabel(form.audience),
      competencyId: form.competencyId === "none" ? undefined : form.competencyId,
    });
    setScheduleOpen(false);
    resetForm();
    setTab("upcoming");
    setJustScheduledId(record.id);
    window.setTimeout(() => setJustScheduledId((cur) => (cur === record.id ? null : cur)), 2400);
    toast({
      title: "Session scheduled",
      description: `"${record.title}" on ${record.date}, ${record.time} — ${record.seats} seats for ${record.audienceLabel}.`,
    });
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setRescheduleMode(false);
    setCancelMode(false);
    setReNote("");
    setCancelNote("");
    const ev = events.find((e) => e.id === id);
    setSeatDraft(ev ? String(ev.seats) : "");
    setReDate(ev?.date ?? "");
    setReTime(ev?.time ?? "");
  };

  const handleReschedule = () => {
    if (!selected || !reDate.trim() || !reTime.trim()) return;
    rescheduleEvent(selected.id, reDate.trim(), reTime.trim(), reNote.trim() || undefined);
    setRescheduleMode(false);
    toast({ title: "Rescheduled", description: `"${selected.title}" moved to ${reDate}, ${reTime}.` });
  };

  const handleCancel = () => {
    if (!selected) return;
    cancelEvent(selected.id, cancelNote.trim() || undefined);
    setCancelMode(false);
    setTab("cancelled");
    toast({ title: "Session cancelled", description: `"${selected.title}" has moved to the cancelled group.` });
  };

  const handleSeats = () => {
    if (!selected) return;
    const n = Number(seatDraft);
    if (!Number.isFinite(n) || n < 1) return;
    updateEventSeats(selected.id, n);
    toast({ title: "Capacity updated", description: `"${selected.title}" now offers ${Math.round(n)} seats.` });
  };

  const handleExport = () => {
    const name = downloadCsv({
      filename: "entity-events",
      title: "MOHAP — Events & Sessions",
      notes: [`${events.length} events`, "Upcoming, completed and cancelled"],
      headers: ["Title", "Format", "Facilitator", "Date", "Time", "Location", "Audience", "Seats", "Registered", "Status"],
      rows: events.map((e) => [
        e.title, e.format, e.facilitator, e.date, e.time, e.location, e.audienceLabel, e.seats, e.registered, e.status,
      ]),
    });
    toast({ title: "Events exported", description: `Saved ${name}.` });
  };

  const list = groups[tab];

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <PageHeader
          tone="primary"
          icon={<CalendarDays className="h-7 w-7 text-primary" />}
          title="Events & Sessions"
          description="Schedule instructor-led sessions and webinars, set seats and a facilitator, and track registrations and attendance."
          actions={
            <>
              <Button variant="outline" onClick={handleExport} data-testid="button-export-events">
                Export events
              </Button>
              <Dialog open={scheduleOpen} onOpenChange={(o) => { setScheduleOpen(o); if (!o) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-schedule-event">
                    <Plus className="h-4 w-4" /> Schedule session
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-primary" /> Schedule a session
                    </DialogTitle>
                    <DialogDescription>Set the format, facilitator, capacity and audience for a new event.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSchedule} className="space-y-4 py-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="event-title">Title</label>
                      <Input id="event-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Prompt craft clinic" data-testid="input-event-title" autoFocus />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="event-summary">Summary</label>
                      <Textarea id="event-summary" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="What participants do in the session." className="min-h-[70px]" data-testid="input-event-summary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Format</label>
                        <Select value={form.format} onValueChange={(v) => setForm((f) => ({ ...f, format: v as EventFormat }))}>
                          <SelectTrigger data-testid="select-event-format"><SelectValue /></SelectTrigger>
                          <SelectContent>{EVENT_FORMATS.map((ft) => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="event-facilitator">Facilitator</label>
                        <Input id="event-facilitator" value={form.facilitator} onChange={(e) => setForm((f) => ({ ...f, facilitator: e.target.value }))} placeholder="e.g. Mariam Al Zaabi" data-testid="input-event-facilitator" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="event-date">Date</label>
                        <Input id="event-date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} placeholder="e.g. 27 August 2026" data-testid="input-event-date" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="event-time">Time</label>
                        <Input id="event-time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="e.g. 10:00–12:00" data-testid="input-event-time" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="event-seats">Seats</label>
                        <Input id="event-seats" type="number" min={1} value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))} data-testid="input-event-seats" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="event-location">Location</label>
                      <Input id="event-location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} data-testid="input-event-location" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Audience</label>
                        <Select value={form.audience} onValueChange={(v) => setForm((f) => ({ ...f, audience: v }))}>
                          <SelectTrigger data-testid="select-event-audience"><SelectValue /></SelectTrigger>
                          <SelectContent>{AUDIENCE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Competency</label>
                        <Select value={form.competencyId} onValueChange={(v) => setForm((f) => ({ ...f, competencyId: v }))}>
                          <SelectTrigger data-testid="select-event-competency"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not competency-specific</SelectItem>
                            {COMPETENCIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={!form.title.trim() || !form.date.trim() || !form.time.trim()} data-testid="button-submit-event">
                        Schedule
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          }
        />

        <KpiRow kpis={kpis} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as Group)}>
          <TabsList>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming ({groups.upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">Completed ({groups.completed.length})</TabsTrigger>
            <TabsTrigger value="cancelled" data-testid="tab-cancelled">Cancelled ({groups.cancelled.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {list.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><CalendarDays /></EmptyMedia>
              <EmptyTitle>No {tab} sessions</EmptyTitle>
              <EmptyDescription>
                {tab === "upcoming" ? "Schedule a session to fill this list." : `Nothing ${tab} yet.`}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AnimatePresence initial={false}>
              {list.map((event) => {
                const Icon = FORMAT_ICON[event.format];
                const isNew = justScheduledId === event.id;
                return (
                  <motion.div
                    key={event.id}
                    layout={!reduceMotion}
                    initial={isNew || event.createdInSession ? { opacity: 0, y: 12, scale: 0.98 } : false}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card
                      className="h-full cursor-pointer transition-colors hover:border-primary/50"
                      onClick={() => openDetail(event.id)}
                      data-testid={`card-event-${event.id}`}
                    >
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 shrink-0 text-primary" />
                              <h3 className="truncate font-semibold">{event.title}</h3>
                              {isNew && <Badge variant="secondary" className="bg-primary/10 text-primary">New</Badge>}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{event.format} · {event.facilitator}</p>
                          </div>
                          <StatusPill status={event.status} testId={`status-event-${event.id}`} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {event.date}, {event.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>
                          <span className="col-span-2 flex items-center gap-1"><Users2 className="h-3.5 w-3.5" /> {event.audienceLabel}</span>
                        </div>
                        <div>
                          <p className="mb-1 text-xs text-muted-foreground">Seats</p>
                          <FillBar filled={Math.min(event.registered, event.seats)} total={event.seats} />
                        </div>
                        {event.competencyId && (
                          <Badge variant="outline" className="text-xs">{competencyLabel(event.competencyId)}</Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
            {selected && (
              <PanelEnter className="space-y-6 py-4">
                <SheetHeader className="space-y-3 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={selected.status} />
                    <Badge variant="outline">{selected.format}</Badge>
                  </div>
                  <SheetTitle className="text-2xl">{selected.title}</SheetTitle>
                  <SheetDescription className="text-base">{selected.summary}</SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Detail label="Facilitator" value={selected.facilitator} />
                  <Detail label="When" value={`${selected.date}, ${selected.time}`} />
                  <Detail label="Location" value={selected.location} />
                  <Detail label="Audience" value={selected.audienceLabel} />
                  {selected.competencyId && <Detail label="Competency" value={competencyLabel(selected.competencyId)} />}
                  <Detail label="Registered" value={`${selected.registered} of ${selected.seats} seats`} />
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Seat fill</p>
                  <FillBar filled={Math.min(selected.registered, selected.seats)} total={selected.seats} />
                </div>

                {attendance && (
                  <Card className="border-green-200 bg-green-50/60">
                    <CardContent className="flex items-center justify-between p-4 text-sm">
                      <span className="font-medium text-green-800">Attendance</span>
                      <span className="text-green-800">
                        <CountUp to={attendance.attended} /> of {selected.registered} attended · {attendance.rate}%
                      </span>
                    </CardContent>
                  </Card>
                )}

                {selected.status !== "Cancelled" && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Manage</h4>
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground" htmlFor="seat-draft">Capacity</label>
                          <Input id="seat-draft" type="number" min={1} value={seatDraft} onChange={(e) => setSeatDraft(e.target.value)} className="w-24" data-testid="input-seat-draft" />
                        </div>
                        <Button size="sm" variant="outline" onClick={handleSeats} data-testid="button-update-seats">Update seats</Button>
                        {selected.status !== "Completed" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setRescheduleMode((v) => !v); setCancelMode(false); }} data-testid="button-toggle-reschedule">
                              Reschedule
                            </Button>
                            <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => { setCancelMode((v) => !v); setRescheduleMode(false); }} data-testid="button-toggle-cancel">
                              <XCircle className="mr-1 h-4 w-4" /> Cancel session
                            </Button>
                          </>
                        )}
                      </div>

                      {rescheduleMode && (
                        <div className="space-y-2 rounded-lg border border-border p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={reDate} onChange={(e) => setReDate(e.target.value)} placeholder="New date" data-testid="input-reschedule-date" />
                            <Input value={reTime} onChange={(e) => setReTime(e.target.value)} placeholder="New time" data-testid="input-reschedule-time" />
                          </div>
                          <Input value={reNote} onChange={(e) => setReNote(e.target.value)} placeholder="Reason (optional)" data-testid="input-reschedule-note" />
                          <Button size="sm" onClick={handleReschedule} disabled={!reDate.trim() || !reTime.trim()} data-testid="button-confirm-reschedule">
                            Confirm new date
                          </Button>
                        </div>
                      )}

                      {cancelMode && (
                        <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                          <Textarea value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} placeholder="Reason for cancelling (recorded in the audit trail)" className="min-h-[60px]" data-testid="input-cancel-note" />
                          <Button size="sm" variant="destructive" onClick={handleCancel} data-testid="button-confirm-cancel">
                            Cancel this session
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <Users2 className="h-4 w-4 text-primary" /> Registrations
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {registrations.length} of {selected.registered} shown
                    </span>
                  </div>
                  {registrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No registrations yet.</p>
                  ) : (
                    <ScrollArea className="max-h-72 pr-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Registered</TableHead>
                            {selected.status === "Completed" && <TableHead>Attended</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrations.map((r) => (
                            <TableRow key={r.id} data-testid={`row-registration-${r.id}`}>
                              <TableCell className="font-medium">{r.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{r.departmentLabel}</TableCell>
                              <TableCell className="text-sm">{r.registeredOn}</TableCell>
                              {selected.status === "Completed" && (
                                <TableCell>
                                  {r.attended === undefined ? (
                                    <span className="text-muted-foreground">—</span>
                                  ) : r.attended ? (
                                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Yes</Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">No-show</Badge>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
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

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}
