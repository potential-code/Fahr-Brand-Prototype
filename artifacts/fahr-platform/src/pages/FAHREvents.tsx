import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, PlusCircle, Users, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { useFederalData } from "@/lib/FederalDataContext";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { COMPETENCIES, COMPETENCY_BY_ID } from "@/lib/learningData";
import { MINISTRY_BY_ID } from "@/lib/federal";
import { FORMAT_LABEL, audienceLabel, type AudienceScope, type SessionFormat } from "@/lib/events";
import { CountUp, PageEnter, Stagger, StaggerItem } from "@/components/motion";

const FORMATS: SessionFormat[] = ["virtual", "webinar", "in-person", "hybrid"];

const AUDIENCE_SCOPES: { id: AudienceScope; label: string; hint: string }[] = [
  { id: "everyone", label: "All federal employees", hint: "Everyone on the platform sees it." },
  { id: "entity", label: "One entity", hint: "Only that entity's learners see it." },
  { id: "level", label: "A rung of the capability ladder", hint: "Only learners at that level see it." },
  {
    id: "competency",
    label: "People with a competency gap",
    hint: "Only learners whose profile names that competency as a priority see it.",
  },
];

/** Turns a stored audience into the words the console and the learner both read. */
function useAudienceResolver() {
  return (scope: AudienceScope, value: string): string => {
    if (scope === "entity") return MINISTRY_BY_ID[value]?.name ?? value;
    if (scope === "level") return `${CAPABILITY_LEVELS.find((l) => l.id === value)?.label ?? value} and equivalent`;
    return `Learners with a ${COMPETENCY_BY_ID[value]?.label ?? value} gap`;
  };
}

/**
 * Federal events: workshops, clinics and webinars FAHR schedules for learners
 * to attend.
 *
 * Audience is the point of the screen. An event configured for one entity, or
 * for the people with a particular competency gap, reaches only them on the
 * learner's Workshops & Events listing — so scheduling here is targeting, not
 * broadcasting.
 */
export default function FAHREvents() {
  const { toast } = useToast();
  const { learningSessions, scheduleSession, cancelSession } = useFahrConsole();
  const { ministries } = useFederalData();
  const resolve = useAudienceResolver();

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    facilitator: "",
    format: "virtual" as SessionFormat,
    venue: "Microsoft Teams",
    competencyId: COMPETENCIES[0].id,
    inDays: "14",
    startTime: "10:00",
    durationMins: "90",
    seatsTotal: "120",
    audienceScope: "everyone" as AudienceScope,
    audienceValue: "",
  });

  const seatsOffered = learningSessions.reduce((sum, s) => sum + s.seatsTotal, 0);
  const seatsTaken = learningSessions.reduce((sum, s) => sum + s.seatsTaken, 0);

  const targeted = useMemo(
    () => learningSessions.filter((s) => s.audience && s.audience.scope !== "everyone").length,
    [learningSessions],
  );

  /** Options for the second dropdown, which depends on the scope chosen. */
  const audienceOptions = useMemo(() => {
    if (form.audienceScope === "entity") {
      return ministries.map((m) => ({ value: m.id, label: m.name }));
    }
    if (form.audienceScope === "level") {
      return CAPABILITY_LEVELS.map((l) => ({ value: l.id, label: l.label }));
    }
    if (form.audienceScope === "competency") {
      return COMPETENCIES.map((c) => ({ value: c.id, label: c.label }));
    }
    return [];
  }, [form.audienceScope, ministries]);

  const needsValue = form.audienceScope !== "everyone";
  const canSubmit = form.title.trim() !== "" && form.facilitator.trim() !== "" && (!needsValue || form.audienceValue);

  const submit = () => {
    if (!canSubmit) {
      toast({
        title: "Fill in the event first",
        description: needsValue && !form.audienceValue ? "Choose who the event is for." : "A title and a facilitator are required.",
        variant: "destructive",
      });
      return;
    }
    const session = scheduleSession({
      title: form.title,
      summary: form.summary,
      facilitator: form.facilitator,
      format: form.format,
      venue: form.venue,
      competencyId: form.competencyId,
      inDays: Math.max(1, Number(form.inDays) || 14),
      startTime: form.startTime,
      durationMins: Math.max(15, Number(form.durationMins) || 90),
      seatsTotal: Math.max(1, Number(form.seatsTotal) || 100),
      audience: needsValue
        ? { scope: form.audienceScope, value: form.audienceValue }
        : { scope: "everyone" },
      by: "FAHR Programme Team",
    });
    setCreateOpen(false);
    setForm((f) => ({ ...f, title: "", summary: "", facilitator: "", audienceValue: "" }));
    toast({
      title: "Event scheduled",
      description: `"${session.title}" is on the learner listing for ${audienceLabel(session.audience, resolve)}.`,
    });
  };

  const withdraw = (sessionId: string, title: string) => {
    cancelSession(sessionId, { by: "FAHR Programme Team" });
    toast({ title: "Event withdrawn", description: `"${title}" no longer appears to learners.` });
  };

  return (
    <Layout role="fahr">
      <PageEnter className="space-y-6 pb-12">
        <PageHeader
          tone="primary"
          title="Events"
          description="Workshops, clinics and webinars for learners to attend. Each is configured for an audience, and reaches only them."
          actions={
            <Button className="gap-2" onClick={() => setCreateOpen(true)} data-testid="button-create-event">
              <PlusCircle className="h-4 w-4" /> Schedule an event
            </Button>
          }
        />

        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Events scheduled", value: learningSessions.length, testid: "kpi-events-total" },
            { label: "Targeted to an audience", value: targeted, testid: "kpi-events-targeted" },
            { label: "Seats offered", value: seatsOffered, testid: "kpi-events-seats" },
            { label: "Seats taken", value: seatsTaken, testid: "kpi-events-taken" },
          ].map((kpi) => (
            <StaggerItem key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold" data-testid={kpi.testid}>
                    <CountUp to={kpi.value} />
                  </p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" /> Scheduled events
            </CardTitle>
            <CardDescription>
              Soonest first. The audience column is what decides whose Workshops &amp; Events listing an event
              appears on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {learningSessions.length === 0 ? (
              <div className="py-12 text-center" data-testid="empty-events">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium">No events scheduled</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Schedule one and it appears on the listing of every learner in its audience.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Competency</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead className="text-end">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {learningSessions.map((session) => (
                      <TableRow key={session.id} data-testid={`row-event-${session.id}`}>
                        <TableCell>
                          <p className="font-medium text-foreground">{session.title}</p>
                          <p className="text-xs text-muted-foreground">{session.facilitator}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {FORMAT_LABEL[session.format]}
                        </TableCell>
                        <TableCell className="text-sm">
                          {COMPETENCY_BY_ID[session.competencyId]?.short ?? session.competencyId}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          In {session.inDays} day{session.inDays === 1 ? "" : "s"} · {session.startTime}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              session.audience && session.audience.scope !== "everyone"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : ""
                            }
                            data-testid={`audience-${session.id}`}
                          >
                            <Users className="me-1 h-3 w-3" />
                            {audienceLabel(session.audience, resolve)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                          {session.seatsTaken} / {session.seatsTotal}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => withdraw(session.id, session.title)}
                            data-testid={`button-withdraw-${session.id}`}
                          >
                            <X className="me-1 h-4 w-4" /> Withdraw
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>

      {/* Schedule an event and configure who it is for. */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Schedule an event</DialogTitle>
            <DialogDescription>
              The audience decides who sees it. Everything else is what the learner reads on their listing.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-2">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Prompt craft clinic for service teams"
                data-testid="input-event-title"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-summary">What it covers</Label>
              <Textarea
                id="event-summary"
                rows={3}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                placeholder="One or two sentences the learner reads before registering."
                data-testid="input-event-summary"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="event-facilitator">Facilitator</Label>
                <Input
                  id="event-facilitator"
                  value={form.facilitator}
                  onChange={(e) => setForm((f) => ({ ...f, facilitator: e.target.value }))}
                  placeholder="Who runs it"
                  data-testid="input-event-facilitator"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Format</Label>
                <Select
                  value={form.format}
                  onValueChange={(v) => setForm((f) => ({ ...f, format: v as SessionFormat }))}
                >
                  <SelectTrigger data-testid="select-event-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {FORMAT_LABEL[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-venue">Where</Label>
                <Input
                  id="event-venue"
                  value={form.venue}
                  onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                  data-testid="input-event-venue"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Competency</Label>
                <Select
                  value={form.competencyId}
                  onValueChange={(v) => setForm((f) => ({ ...f, competencyId: v }))}
                >
                  <SelectTrigger data-testid="select-event-competency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPETENCIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-days">Days from today</Label>
                <Input
                  id="event-days"
                  type="number"
                  min={1}
                  value={form.inDays}
                  onChange={(e) => setForm((f) => ({ ...f, inDays: e.target.value }))}
                  data-testid="input-event-days"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-time">Start time</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  data-testid="input-event-time"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-duration">Minutes</Label>
                <Input
                  id="event-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={form.durationMins}
                  onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))}
                  data-testid="input-event-duration"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="event-seats">Seats</Label>
                <Input
                  id="event-seats"
                  type="number"
                  min={1}
                  value={form.seatsTotal}
                  onChange={(e) => setForm((f) => ({ ...f, seatsTotal: e.target.value }))}
                  data-testid="input-event-seats"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Audience</p>
                <p className="text-xs text-muted-foreground">
                  {AUDIENCE_SCOPES.find((s) => s.id === form.audienceScope)?.hint}
                </p>
              </div>
              <Select
                value={form.audienceScope}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, audienceScope: v as AudienceScope, audienceValue: "" }))
                }
              >
                <SelectTrigger data-testid="select-event-audience-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_SCOPES.map((scope) => (
                    <SelectItem key={scope.id} value={scope.id}>
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {needsValue && (
                <Select
                  value={form.audienceValue}
                  onValueChange={(v) => setForm((f) => ({ ...f, audienceValue: v }))}
                >
                  <SelectTrigger data-testid="select-event-audience-value">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!canSubmit} data-testid="button-submit-event">
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
