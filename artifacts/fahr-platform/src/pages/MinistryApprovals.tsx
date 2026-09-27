import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearch } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useToast } from "@/hooks/use-toast";
import {
  PageEnter,
  Stagger,
  StaggerItem,
  CountUp,
} from "@/components/motion";
import {
  Inbox,
  CheckCircle2,
  Undo2,
  ArrowUpRight,
  Timer,
  Download,
  ClipboardCheck,
} from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  DEPARTMENT_BY_ID,
  MINISTRY_BY_ID,
  QUEUE_STATE,
  SUBMISSION_STATE_LABEL,
} from "@/lib/federal";
import type { Submission, Escalation, ApprovalRecord } from "@/lib/federal/model";
import { ENTITY_ADMIN } from "@/lib/entityAdmin/seed";
import { downloadCsvPack } from "@/lib/exportFile";
import { ApprovalsQueueCard } from "@/components/ministry/ApprovalsQueueCard";
import { ApprovalsLegend } from "@/components/ministry/ApprovalsLegend";
import { ApprovalsDecisionDialog, type DecisionKind } from "@/components/ministry/ApprovalsDecisionDialog";

type QueueTab = "awaiting" | "returned" | "escalated" | "endorsed";

/** Which tab a project lives under, so a deep link can open the right one. */
function tabForState(state: Submission["state"]): QueueTab {
  if (state === "revision_requested" || state === "awaiting_manager") return "returned";
  if (state === "escalated") return "escalated";
  if (state === "endorsed" || state === "deployed") return "endorsed";
  return "awaiting";
}

/** Month names as the seed writes them, for parsing "22 July 2026". */
const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function parseSeedDate(label: string): number | null {
  const m = label.trim().toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS.indexOf(m[2]);
  const year = Number(m[3]);
  if (month < 0) return null;
  return Date.UTC(year, month, day);
}

export default function MinistryApprovals() {
  const { toast } = useToast();
  const {
    focus,
    submissions,
    escalations,
    auditEvents,
    approvals,
    getPerson,
    approvalsFor,
    endorse,
    returnToManager,
    escalate,
  } = useFederalData();

  const ministry = MINISTRY_BY_ID[focus.ministryId];
  const search = useSearch();
  const deepLinkId = useMemo(() => new URLSearchParams(search).get("project"), [search]);
  const [tab, setTab] = useState<QueueTab>("awaiting");
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Count session decisions honestly.
  const [sessionCounts, setSessionCounts] = useState({ endorsed: 0, returned: 0, escalated: 0 });
  const [dialog, setDialog] = useState<{ id: string; kind: DecisionKind } | null>(null);

  const entityMinistryId = focus.ministryId;

  const ownerName = (personId: string) => getPerson(personId)?.name ?? "Federal employee";
  const departmentName = (departmentId: string) => DEPARTMENT_BY_ID[departmentId]?.name ?? departmentId;

  const entitySubmissions = useMemo(
    () => submissions.filter((s) => s.ministryId === entityMinistryId),
    [submissions, entityMinistryId],
  );

  // A notification deep link (?project=<id>) opens the project's tab and rings its card.
  useEffect(() => {
    if (!deepLinkId) return;
    const target = entitySubmissions.find((s) => s.id === deepLinkId);
    if (!target) return;
    setTab(tabForState(target.state));
    setHighlightId(target.id);
    // Deliberately keyed on the link only: later decisions must not yank the tab around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId]);

  useEffect(() => {
    if (!highlightId) return;
    const frame = window.requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-testid="card-queue-${highlightId}"]`);
      el?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [highlightId, tab]);

  const awaiting = entitySubmissions.filter((s) => s.state === QUEUE_STATE.ministry);
  const returned = entitySubmissions.filter(
    (s) => s.state === "revision_requested" || s.state === "awaiting_manager",
  );
  const escalated = entitySubmissions.filter((s) => s.state === "escalated");
  const endorsedDeployed = entitySubmissions.filter(
    (s) => s.state === "endorsed" || s.state === "deployed",
  );

  const entityEscalations = useMemo(
    () => escalations.filter((e) => e.ministryId === entityMinistryId),
    [escalations, entityMinistryId],
  );

  // Trail = audit events for this entity, newest first.
  const trailEvents = useMemo(
    () => auditEvents.filter((e) => e.ministryId === entityMinistryId),
    [auditEvents, entityMinistryId],
  );

  // Average days in queue for items awaiting an entity decision.
  const now = Date.now();
  const queueDays = awaiting
    .map((s) => parseSeedDate(s.submittedOn))
    .filter((t): t is number => t !== null)
    .map((t) => Math.max(0, Math.round((now - t) / 86_400_000)));
  const avgDaysInQueue =
    queueDays.length > 0 ? Math.round(queueDays.reduce((a, b) => a + b, 0) / queueDays.length) : null;

  const runDecision = (id: string, kind: DecisionKind, note: string) => {
    const submission = entitySubmissions.find((s) => s.id === id);
    const title = submission?.title ?? "the project";
    const learner = submission ? getPerson(submission.personId) : undefined;
    const learnerName = learner?.name ?? "the learner";
    const managerName =
      (learner?.managerId ? getPerson(learner.managerId)?.name : undefined) ??
      (submission?.reviewer && submission.reviewer !== "Department manager" ? submission.reviewer : undefined) ??
      "their line manager";
    if (kind === "endorse") {
      endorse(id, { by: ENTITY_ADMIN, note: note || undefined });
      setSessionCounts((c) => ({ ...c, endorsed: c.endorsed + 1 }));
      toast({
        title: "Endorsed — project is live",
        description: `"${title}" is endorsed for entity deployment. ${learnerName} and ${managerName} have been notified.`,
      });
    } else if (kind === "return") {
      returnToManager(id, { by: ENTITY_ADMIN, note });
      setSessionCounts((c) => ({ ...c, returned: c.returned + 1 }));
      toast({
        title: "Returned to line manager",
        description: `"${title}" is back with ${managerName}. ${managerName} and ${learnerName} have been notified.`,
      });
    } else if (kind === "escalate") {
      escalate(id, { by: ENTITY_ADMIN, note });
      setSessionCounts((c) => ({ ...c, escalated: c.escalated + 1 }));
      toast({
        title: "Escalated to FAHR",
        description: `"${title}" now sits in the FAHR queue. The FAHR Programme Team, ${learnerName} and ${managerName} have been notified.`,
      });
    }
    setDialog(null);
  };

  const exportQueueAndTrail = () => {
    const queueRows = awaiting.map((s) => {
      const manager = approvalsFor(s.id).find((a) => a.role === "manager");
      return [
        s.title,
        ownerName(s.personId),
        departmentName(s.departmentId),
        SUBMISSION_STATE_LABEL[s.state],
        s.impact,
        s.governanceStatus,
        s.hoursSavedPerMonth,
        s.submittedOn,
        manager ? `${manager.by} (${manager.on})` : "—",
      ];
    });
    const trailRows = trailEvents.map((e) => [e.time, e.actor, e.agent, e.action, e.risk, e.status]);
    const filename = downloadCsvPack(
      "entity-approvals",
      [
        {
          filename: "queue",
          title: "Awaiting entity endorsement",
          headers: [
            "Project", "Learner", "Department", "State", "Impact", "Governance",
            "Hours returned/mo", "Submitted", "Department manager sign-off",
          ],
          rows: queueRows,
          notes: [`${ministry.name} — generated for the entity approvals queue`],
        },
        {
          filename: "trail",
          title: "Entity decision trail",
          headers: ["Time", "Actor", "Agent", "Action", "Risk", "Status"],
          rows: trailRows,
        },
      ],
      `${ministry.name} — Approvals`,
    );
    toast({ title: "Export ready", description: `Downloaded ${filename}.` });
  };

  const kpis = [
    {
      label: "Awaiting decision",
      value: awaiting.length,
      icon: Inbox,
      color: "text-primary",
      caption: "Signed off by a line manager, now with this entity",
    },
    {
      label: "Endorsed this session",
      value: sessionCounts.endorsed,
      icon: CheckCircle2,
      color: "text-green-600",
      caption: "Decisions you took since opening the platform",
    },
    {
      label: "Returned this session",
      value: sessionCounts.returned,
      icon: Undo2,
      color: "text-amber-600",
      caption: "Sent back to the line manager",
    },
    {
      label: "Escalated this session",
      value: sessionCounts.escalated,
      icon: ArrowUpRight,
      color: "text-accent",
      caption: "Sent to FAHR for a federal decision",
    },
  ];

  const escalationStatusClass = (status: Escalation["status"]): string =>
    status === "Resolved"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "In progress"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-primary/10 text-primary border-primary/20";

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <PageHeader
          tone="primary"
          icon={<ClipboardCheck className="h-7 w-7 text-primary" />}
          title="Entity Approvals"
          description="Projects that cleared line manager sign-off arrive here for an entity decision. Endorse, return or escalate to FAHR — every decision is recorded in the project's conversation."
          actions={
            <Button variant="outline" onClick={exportQueueAndTrail} data-testid="button-export-approvals">
              <Download className="mr-2 h-4 w-4" /> Export queue &amp; trail
            </Button>
          }
        />

        <ApprovalsLegend />

        <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {kpis.map((kpi) => (
            <StaggerItem as="div" key={kpi.label}>
              <StatCard className="h-full">
                <CardContent className="flex flex-col items-center p-4 text-center">
                  <kpi.icon className={`mb-2 h-5 w-5 ${kpi.color}`} />
                  <p className="text-2xl font-bold">
                    <CountUp to={kpi.value} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/70">{kpi.caption}</p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
          <StaggerItem as="div">
            <StatCard className="h-full">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <Timer className="mb-2 h-5 w-5 text-[hsl(var(--chart-4))]" />
                <p className="text-2xl font-bold">
                  {avgDaysInQueue === null ? "—" : <CountUp to={avgDaysInQueue} suffix="d" />}
                </p>
                <p className="text-xs text-muted-foreground">Avg days in queue</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/70">
                  Since submission, for projects awaiting you now
                </p>
              </CardContent>
            </StatCard>
          </StaggerItem>
        </Stagger>

        <div>
          <div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as QueueTab)}>
              <TabsList className="flex w-full flex-wrap justify-start">
                <TabsTrigger value="awaiting" data-testid="tab-awaiting">
                  Awaiting endorsement
                  <Badge variant="secondary" className="ml-2">{awaiting.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="returned" data-testid="tab-returned">
                  Returned
                  <Badge variant="secondary" className="ml-2">{returned.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="escalated" data-testid="tab-escalated">
                  Escalated
                  <Badge variant="secondary" className="ml-2">{escalated.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="endorsed" data-testid="tab-endorsed">
                  Endorsed &amp; deployed
                  <Badge variant="secondary" className="ml-2">{endorsedDeployed.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="awaiting" className="mt-4">
                {awaiting.length === 0 ? (
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CheckCircle2 className="text-green-600" />
                      </EmptyMedia>
                      <EmptyTitle>Queue is clear</EmptyTitle>
                      <EmptyDescription>
                        No projects are waiting on an entity decision. Decisions you take appear in each project's
                        conversation.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Showing {awaiting.length} of {awaiting.length} awaiting an entity decision.
                    </p>
                    <AnimatePresence initial={false} mode="popLayout">
                      {awaiting.map((s) => (
                        <motion.div
                          key={s.id}
                          layout
                          initial={false}
                          exit={{ opacity: 0, x: 40, scale: 0.97, transition: { duration: 0.3 } }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                          <ApprovalsQueueCard
                            submission={s}
                            ownerName={ownerName(s.personId)}
                            departmentName={departmentName(s.departmentId)}
                            approvals={approvalsFor(s.id)}
                            onDecide={(kind) => setDialog({ id: s.id, kind })}
                            highlighted={highlightId === s.id}
                            defaultConversationOpen={highlightId === s.id}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="returned" className="mt-4">
                <ReadOnlyList
                  items={returned}
                  emptyTitle="Nothing returned"
                  emptyDescription="Projects you send back to a department manager show here until they are resubmitted."
                  ownerName={ownerName}
                  departmentName={departmentName}
                  approvalsFor={approvalsFor}
                  highlightId={highlightId}
                />
              </TabsContent>

              <TabsContent value="escalated" className="mt-4">
                <div className="space-y-4">
                  {entityEscalations.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Escalations at FAHR</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {entityEscalations.map((e) => (
                          <div
                            key={e.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm hover:bg-muted/40"
                            data-testid={`row-escalation-${e.id}`}
                          >
                            <div className="min-w-0">
                              <p className="font-medium">{e.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {e.kind} · raised {e.raisedOn} by {e.raisedBy}
                              </p>
                            </div>
                            <Badge variant="outline" className={`text-xs ${escalationStatusClass(e.status)}`}>
                              {e.status}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  <ReadOnlyList
                    items={escalated}
                    emptyTitle="Nothing escalated"
                    emptyDescription="Projects referred to FAHR for a federal decision appear here."
                    ownerName={ownerName}
                    departmentName={departmentName}
                    approvalsFor={approvalsFor}
                    highlightId={highlightId}
                  />
                </div>
              </TabsContent>

              <TabsContent value="endorsed" className="mt-4">
                <ReadOnlyList
                  items={endorsedDeployed}
                  emptyTitle="Nothing endorsed yet"
                  emptyDescription="Endorsed and deployed projects show here so the entity can see what has shipped."
                  ownerName={ownerName}
                  departmentName={departmentName}
                  approvalsFor={approvalsFor}
                  highlightId={highlightId}
                />
              </TabsContent>
            </Tabs>
          </div>

        </div>
      </PageEnter>

      <ApprovalsDecisionDialog
        kind={dialog?.kind ?? null}
        projectTitle={
          dialog ? entitySubmissions.find((s) => s.id === dialog.id)?.title ?? "" : ""
        }
        onCancel={() => setDialog(null)}
        onConfirm={(note) => dialog && runDecision(dialog.id, dialog.kind, note)}
      />
    </Layout>
  );
}

function ReadOnlyList({
  items,
  emptyTitle,
  emptyDescription,
  ownerName,
  departmentName,
  approvalsFor,
  highlightId,
}: {
  highlightId: string | null;
  items: Submission[];
  emptyTitle: string;
  emptyDescription: string;
  ownerName: (id: string) => string;
  departmentName: (id: string) => string;
  approvalsFor: (id: string) => ApprovalRecord[];
}) {
  if (items.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <Stagger className="space-y-4">
      {items.map((s) => (
        <StaggerItem as="div" key={s.id}>
          <ApprovalsQueueCard
            submission={s}
            ownerName={ownerName(s.personId)}
            departmentName={departmentName(s.departmentId)}
            approvals={approvalsFor(s.id)}
            highlighted={highlightId === s.id}
            defaultConversationOpen={highlightId === s.id}
          />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
