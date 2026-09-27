import React, { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { RecognitionBand } from "@/components/recognition/RecognitionSurface";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  User,
  ArrowRight,
  Activity,
  MessagesSquare,
  CheckCircle2,
  ArrowUpRight,
  Undo2,
  Megaphone,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  PageEnter,
  Stagger,
  StaggerItem,
  PanelEnter,
  CountUp,
} from "@/components/motion";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  DEPARTMENT_BY_ID,
  MINISTRY_BY_ID,
  METRICS,
  SUBMISSION_STATE_LABEL,
  competencyLabel,
  workingDaysPerYear,
} from "@/lib/federal";
import { useLiveProjects } from "@/components/leadership/LiveProjects";
import type { Submission } from "@/lib/federal/model";
import { ENTITY_ADMIN } from "@/lib/entityAdmin/seed";
import { downloadCsv } from "@/lib/exportFile";
import { AIAnalysisInline } from "@/components/ai/AIAnalysis";
import { AGENTS } from "@/lib/constants";
import { ProjectJourney } from "@/components/project/ProjectJourney";
import { ProjectConversation } from "@/components/project/ProjectConversation";
import { ProjectBriefView, ProjectImpactStrip } from "@/components/project/ProjectBrief";
import { SubmissionStateBadge } from "@/components/project/SubmissionStateBadge";
import { ApprovalsDecisionDialog, type DecisionKind } from "@/components/ministry/ApprovalsDecisionDialog";

const impactBadge = (impact: Submission["impact"]): string =>
  impact === "High"
    ? "bg-accent/15 text-accent border-accent/30"
    : impact === "Medium"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-muted text-muted-foreground";

export default function MinistryPortfolio() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    focus,
    submissions,
    credentials,
    getPerson,
    endorse,
    escalate,
    returnToManager,
    issueCredential,
  } = useFederalData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ id: string; kind: Extract<DecisionKind, "return" | "escalate"> } | null>(
    null,
  );

  const ministry = MINISTRY_BY_ID[focus.ministryId];
  const projects = useMemo(
    () => submissions.filter((s) => s.ministryId === focus.ministryId),
    [submissions, focus.ministryId],
  );
  const selectedProject = selectedId ? projects.find((s) => s.id === selectedId) ?? null : null;
  const selectedCredential = selectedProject
    ? credentials.find((c) => c.submissionId === selectedProject.id)
    : undefined;

  const ownerName = (personId: string) => getPerson(personId)?.name ?? "Entity team";
  const departmentName = (departmentId: string) => DEPARTMENT_BY_ID[departmentId]?.name ?? departmentId;

  const { fresh } = useLiveProjects();
  const kpis = useMemo(() => {
    // The entity record since launch, plus anything that went live in this session.
    const freshHere = fresh.filter((p) => p.submission.ministryId === focus.ministryId);
    const sessionHours = freshHere.reduce((sum, p) => sum + p.submission.hoursSavedPerMonth, 0);
    const awaiting = projects.filter(
      (p) => p.state === "awaiting_entity" || p.state === "awaiting_manager",
    ).length;
    const hoursPerMonth = ministry.hoursSavedPerMonth + sessionHours;
    return {
      submitted: Math.max(ministry.projectsSubmitted, projects.length),
      live: ministry.projectsLive + freshHere.length,
      awaiting,
      hoursPerMonth,
      workingDays: workingDaysPerYear(hoursPerMonth),
    };
  }, [projects, fresh, focus.ministryId, ministry]);

  /** The learner and their line manager, named for the "who was notified" toasts. */
  const notifiedNames = (submission: Submission) => {
    const learner = getPerson(submission.personId);
    const manager =
      (learner?.managerId ? getPerson(learner.managerId)?.name : undefined) ??
      (submission.reviewer && submission.reviewer !== "Department manager" ? submission.reviewer : undefined) ??
      "their line manager";
    return { learner: learner?.name ?? "the learner", manager };
  };

  const handleEndorse = (submission: Submission) => {
    const { learner, manager } = notifiedNames(submission);
    endorse(submission.id, { by: ENTITY_ADMIN });
    toast({
      title: "Endorsed — project is live",
      description: `"${submission.title}" is endorsed for entity deployment. ${learner} and ${manager} have been notified.`,
    });
  };

  const runDecision = (submissionId: string, kind: "return" | "escalate", note: string) => {
    const submission = projects.find((p) => p.id === submissionId);
    setDialog(null);
    if (!submission) return;
    const { learner, manager } = notifiedNames(submission);
    if (kind === "escalate") {
      escalate(submissionId, { by: ENTITY_ADMIN, note });
      toast({
        title: "Escalated to FAHR",
        description: `"${submission.title}" now sits in the FAHR queue. The FAHR Programme Team, ${learner} and ${manager} have been notified.`,
      });
    } else {
      returnToManager(submissionId, { by: ENTITY_ADMIN, note });
      toast({
        title: "Returned to line manager",
        description: `"${submission.title}" is back with ${manager}. ${manager} and ${learner} have been notified.`,
      });
    }
  };

  const exportPortfolio = () => {
    const filename = downloadCsv({
      filename: "workplace-project-portfolio",
      title: `${ministry.name} — Workplace Project Portfolio`,
      headers: [
        "Project", "Owner", "Department", "State", "Impact", "Governance",
        "Hours returned/mo", "Reviewer",
      ],
      rows: projects.map((p) => [
        p.title,
        ownerName(p.personId),
        departmentName(p.departmentId),
        SUBMISSION_STATE_LABEL[p.state],
        p.impact,
        p.governanceStatus,
        p.hoursSavedPerMonth,
        p.reviewer ?? "Unassigned",
      ]),
    });
    toast({ title: "Export ready", description: `Downloaded ${filename}.` });
  };

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <RecognitionBand
          testId="band-portfolio"
          eyebrow="Verified entity record"
          title="Workplace Project Portfolio"
          description={`${ministry.name} — every AI workplace project this entity has in flight, from sign-off to deployment.`}
          actions={
            <>
              <Button
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={exportPortfolio}
                data-testid="button-export-portfolio"
              >
                <Download className="mr-2 h-4 w-4" /> Export portfolio
              </Button>
              <Button onClick={() => setLocation("/ministry/approvals")} data-testid="button-goto-approvals">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approvals queue
              </Button>
            </>
          }
        />

        <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            {
              key: "submitted",
              value: kpis.submitted,
              label: METRICS.projectsSubmitted.label,
              caption: METRICS.projectsSubmitted.caption,
              tone: "",
            },
            {
              key: "live",
              value: kpis.live,
              label: METRICS.projectsLive.label,
              caption: METRICS.projectsLive.caption,
              tone: "text-green-600",
            },
            {
              key: "awaiting",
              value: kpis.awaiting,
              label: "Awaiting a decision",
              caption: "With a line manager or this entity now",
              tone: "text-amber-600",
            },
            {
              key: "hours",
              value: kpis.hoursPerMonth,
              label: METRICS.hoursSaved.label,
              caption: METRICS.hoursSaved.caption,
              tone: "text-accent",
            },
            {
              key: "days",
              value: kpis.workingDays,
              label: "Working days returned / year",
              caption: "Hours a month × 12, at 7.5 h a working day",
              tone: "text-primary",
            },
          ].map((kpi) => (
            <StaggerItem as="div" key={kpi.key}>
              <StatCard className="h-full" data-testid={`kpi-portfolio-${kpi.key}`}>
                <CardContent className="p-4 text-center">
                  <p className={`text-2xl font-bold ${kpi.tone}`}>
                    <CountUp to={kpi.value} />
                  </p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/70">{kpi.caption}</p>
                </CardContent>
              </StatCard>
            </StaggerItem>
          ))}
        </Stagger>

        {projects.length < kpis.submitted && (
          <p className="text-xs text-muted-foreground" data-testid="text-portfolio-shown">
            Showing {projects.length} recent of {kpis.submitted.toLocaleString()} projects submitted since launch
          </p>
        )}

        <Stagger className="grid grid-cols-1 gap-4">
          {projects.map((proj) => (
            <StaggerItem as="div" key={proj.id} variant="row">
              <Card
                className="cursor-pointer border-border transition-colors hover:border-primary/50"
                onClick={() => setSelectedId(proj.id)}
                data-testid={`card-project-${proj.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-primary">{proj.title}</h3>
                        <Badge variant="outline" className={`text-xs ${impactBadge(proj.impact)}`}>
                          {proj.impact} impact
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" /> {ownerName(proj.personId)}
                        </span>
                        <span>•</span>
                        <span>{departmentName(proj.departmentId)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm lg:flex-nowrap lg:gap-8">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Status</p>
                        <p className="flex items-center gap-1 font-medium" data-testid={`text-status-${proj.id}`}>
                          {(proj.state === "deployed" || proj.state === "endorsed") && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {SUBMISSION_STATE_LABEL[proj.state]}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <ShieldCheck className="h-4 w-4" /> Governance
                        </p>
                        <p className="font-medium">{proj.governanceStatus}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Reviewer</p>
                        <p className="font-medium">{proj.reviewer ?? "Unassigned"}</p>
                      </div>
                      <ArrowRight className="hidden h-5 w-5 text-muted-foreground lg:block" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <Sheet open={!!selectedProject} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
            {selectedProject && (
              <PanelEnter className="space-y-8 py-6">
                <SheetHeader className="space-y-4 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${impactBadge(selectedProject.impact)}`}>
                      {selectedProject.impact} impact
                    </Badge>
                    <SubmissionStateBadge submission={selectedProject} className="text-xs" />
                  </div>
                  <SheetTitle className="text-2xl">{selectedProject.title}</SheetTitle>
                  <SheetDescription>
                    Submitted by {ownerName(selectedProject.personId)} on {selectedProject.submittedOn}
                  </SheetDescription>
                </SheetHeader>

                <ProjectJourney submission={selectedProject} variant="full" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Owner</span>
                    <Link href={`/ministry/people/${selectedProject.personId}`}>
                      <p
                        className="flex items-center gap-2 font-medium text-primary hover:underline"
                        data-testid={`link-person-${selectedProject.id}`}
                      >
                        <User className="h-4 w-4" /> {ownerName(selectedProject.personId)}
                        <ExternalLink className="h-3 w-3" />
                      </p>
                    </Link>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Department</span>
                    <p className="font-medium">{departmentName(selectedProject.departmentId)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Governance Status</span>
                    <p className="flex items-center gap-2 font-medium">
                      <ShieldCheck
                        className={`h-4 w-4 ${selectedProject.governanceStatus === "Compliant" ? "text-green-600" : "text-amber-500"}`}
                      />
                      {selectedProject.governanceStatus}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Assigned Reviewer</span>
                    <p className="font-medium">{selectedProject.reviewer ?? "Unassigned"}</p>
                  </div>
                </div>

                <div className="space-y-3" data-testid="portfolio-learner-brief">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <FileText className="h-5 w-5 text-primary" /> Learner's brief
                  </h4>
                  <ProjectBriefView submission={selectedProject} showImpact={false} />
                </div>

                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <Activity className="h-5 w-5 text-primary" /> Impact Evidence
                  </h4>
                  <AIAnalysisInline
                    agent={AGENTS.analytics}
                    label="Validating projected impact"
                    steps={["Analysing project metrics", "Verifying federal application", "Extracting impact figures"]}
                    runKey={selectedProject.id}
                  >
                    <div className="space-y-3">
                      <ProjectImpactStrip submission={selectedProject} />
                      <p className="text-xs text-muted-foreground">
                        Competencies evidenced: {selectedProject.competencyIds.map(competencyLabel).join(", ")}
                      </p>
                    </div>
                  </AIAnalysisInline>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-semibold">
                      <MessagesSquare className="h-5 w-5 text-primary" /> Conversation
                    </h4>
                    <Link href={`/ministry/approvals?project=${selectedProject.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-primary hover:underline"
                        data-testid={`link-approvals-${selectedProject.id}`}
                      >
                        Open in approvals <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Every decision and note on this project, from the learner's submission onward.
                  </p>
                  <ProjectConversation submission={selectedProject} />
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-6">
                  {selectedProject.state === "awaiting_entity" && (
                    <>
                      <Button
                        data-testid={`button-endorse-${selectedProject.id}`}
                        onClick={() => handleEndorse(selectedProject)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Endorse Project
                      </Button>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          data-testid={`button-return-${selectedProject.id}`}
                          onClick={() => setDialog({ id: selectedProject.id, kind: "return" })}
                        >
                          <Undo2 className="h-4 w-4" /> Return to manager
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          data-testid={`button-escalate-${selectedProject.id}`}
                          onClick={() => setDialog({ id: selectedProject.id, kind: "escalate" })}
                        >
                          <ArrowUpRight className="h-4 w-4" /> Escalate to FAHR
                        </Button>
                      </div>
                    </>
                  )}
                  {selectedProject.state === "awaiting_manager" && (
                    <p className="text-sm text-muted-foreground">
                      Waiting on the line manager's sign-off before this entity can endorse it.
                    </p>
                  )}
                  {selectedProject.state === "revision_requested" && (
                    <p className="text-sm text-muted-foreground">
                      Returned for revision — with the line manager and learner until it is resubmitted.
                    </p>
                  )}
                  {selectedProject.state === "escalated" && (
                    <p className="text-sm text-muted-foreground" data-testid={`text-fahr-waiting-${selectedProject.id}`}>
                      Escalated — waiting for a FAHR decision. FAHR will approve it for federal rollout or return it
                      here.
                    </p>
                  )}
                  {selectedCredential ? (
                    <div
                      className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"
                      data-testid={`credential-issued-${selectedProject.id}`}
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-medium">Credential issued</p>
                        <p className="text-xs">
                          {selectedCredential.title} · issued {selectedCredential.issuedOn} ·{" "}
                          {selectedCredential.verificationCode}
                        </p>
                      </div>
                    </div>
                  ) : selectedProject.state === "endorsed" && (
                    <Button
                      className="w-full gap-2"
                      data-testid={`button-credential-${selectedProject.id}`}
                      onClick={() => {
                        issueCredential({
                          personId: selectedProject.personId,
                          personName: ownerName(selectedProject.personId),
                          title: `Applied AI Practitioner — ${selectedProject.title}`,
                          submissionId: selectedProject.id,
                          by: ENTITY_ADMIN,
                        });
                        toast({
                          title: "Credential issued",
                          description: `${ownerName(selectedProject.personId)} now holds a verified credential for this project.`,
                        });
                      }}
                    >
                      <ShieldCheck className="h-4 w-4" /> Issue Verified Credential
                    </Button>
                  )}
                  {(selectedProject.state === "deployed" || selectedProject.state === "escalated") && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      data-testid={`button-announce-${selectedProject.id}`}
                      onClick={() => setLocation("/ministry/communications")}
                    >
                      <Megaphone className="h-4 w-4" /> Announce this project
                    </Button>
                  )}
                </div>
              </PanelEnter>
            )}
          </SheetContent>
        </Sheet>
      </PageEnter>

      <ApprovalsDecisionDialog
        kind={dialog?.kind ?? null}
        projectTitle={dialog ? projects.find((p) => p.id === dialog.id)?.title ?? "" : ""}
        onCancel={() => setDialog(null)}
        onConfirm={(note) => dialog && runDecision(dialog.id, dialog.kind, note)}
      />
    </Layout>
  );
}
