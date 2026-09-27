import React, { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, Stagger, StaggerItem } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFederalData } from "@/lib/FederalDataContext";
import { filterSubmissions } from "@/lib/federal";
import { ClipboardCheck, RotateCcw, AlertCircle, BrainCircuit, CheckCircle2, MessagesSquare } from "lucide-react";
import { ManagerActionDialogs, type ManagerActionType } from "@/components/manager/ManagerActionDialogs";
import { AIAnalysisInline } from "@/components/ai/AIAnalysis";
import { AGENTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { SubmissionStateBadge } from "@/components/project/SubmissionStateBadge";
import { ProjectJourney } from "@/components/project/ProjectJourney";
import { ProjectConversation } from "@/components/project/ProjectConversation";
import { ProjectBriefView, ProjectSummary } from "@/components/project/ProjectBrief";
import { ReturnContext } from "@/components/manager/ReturnContext";

export default function ManagerValidations() {
  const { focus, teamOf, submissions, getPerson, signOff, requestRevision } = useFederalData();
  const { toast } = useToast();
  
  const team = teamOf(focus.managerId);
  const teamIds = useMemo(() => new Set(team.map((p) => p.id)), [team]);
  
  const teamSubmissions = useMemo(
    () => submissions.filter((s) => teamIds.has(s.personId)),
    [submissions, teamIds]
  );
  
  const awaitingSignOff = useMemo(
    () => filterSubmissions(teamSubmissions, { state: "awaiting_manager" }),
    [teamSubmissions]
  );

  const flaggedLearners = team.filter(p => p.status === 'at-risk' || p.status === 'needs-attention');

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [actionDialog, setActionDialog] = useState<{action: ManagerActionType, subject: any} | null>(null);

  // Deep link from a notification: /manager/validations?project=<id> opens that
  // project's review sheet, provided it belongs to this manager's team.
  const search = useSearch();
  const linkedProjectId = new URLSearchParams(search).get("project");
  useEffect(() => {
    if (linkedProjectId && teamSubmissions.some((s) => s.id === linkedProjectId)) {
      setSelectedSubmissionId(linkedProjectId);
    }
    // Only react to the link changing, not to every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedProjectId]);

  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);
  const submissionOwner = selectedSubmission ? getPerson(selectedSubmission.personId) : null;

  const handleSignOff = () => {
    if (!selectedSubmission || !submissionOwner) return;
    
    // Sign-off hands the project to the entity admin; the credential is issued
    // by the store when the project goes live.
    signOff(selectedSubmission.id, { by: getPerson(focus.managerId)?.name ?? "Department Manager" });

    toast({
      title: "Project signed off",
      description: `"${selectedSubmission.title}" is now with the entity admin for endorsement. ${submissionOwner.name} has been notified.`
    });
    setSelectedSubmissionId(null);
  };

  const handleRevision = () => {
    if (!selectedSubmission || !submissionOwner || !revisionNote) return;
    
    requestRevision(selectedSubmission.id, { by: getPerson(focus.managerId)?.name ?? "Department Manager", note: revisionNote });

    toast({
      title: "Sent to learner",
      description: `"${selectedSubmission.title}" has gone back to ${submissionOwner.name} with your comments. They have been notified and will see it in their Messages.`
    });
    setRevisionNote("");
    setShowRevisionInput(false);
    setSelectedSubmissionId(null);
  };

  return (
    <Layout role="manager">
      <PageEnter className="space-y-6 max-w-7xl mx-auto w-full pb-12">
        <PageHeader
          tone="primary"
          icon={<ClipboardCheck className="w-7 h-7 text-primary" />}
          title="Team Projects"
          description="Review your team's workplace projects and follow up on learners who are falling behind."
        />

        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="submissions">
              Pending Submissions <Badge variant="secondary" className="ms-2">{awaitingSignOff.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="interventions">
              Interventions <Badge variant="secondary" className="ms-2">{flaggedLearners.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            {awaitingSignOff.length === 0 ? (
              <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
                  <p className="text-lg font-semibold text-foreground">All caught up</p>
                  <p className="text-sm text-muted-foreground mt-1">No workplace projects are waiting for your sign-off.</p>
                </CardContent>
              </Card>
            ) : (
              <Stagger className="grid grid-cols-1 gap-4">
                {awaitingSignOff.map(s => {
                  const owner = getPerson(s.personId);
                  return (
                    <StaggerItem key={s.id} as="div">
                      <Card className="hover-elevate cursor-pointer border-border transition-colors" onClick={() => setSelectedSubmissionId(s.id)}>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <SubmissionStateBadge submission={s} />
                                <span className="text-xs text-muted-foreground">Submitted {s.submittedOn}</span>
                              </div>
                              <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">From: {owner?.name}</p>
                            </div>
                            <Button variant="ghost" className="shrink-0"><ClipboardCheck className="w-4 h-4 me-2" /> Review</Button>
                          </div>
                          <ProjectSummary submission={s} />
                          <ReturnContext submission={s} />
                          <ProjectJourney submission={s} variant="compact" />
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            )}
          </TabsContent>

          <TabsContent value="interventions">
            <Stagger className="grid grid-cols-1 gap-4">
              {flaggedLearners.map(p => (
                <StaggerItem key={p.id} as="div">
                  <Card>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <AlertCircle className={`w-6 h-6 mt-1 ${p.status === 'at-risk' ? 'text-destructive' : 'text-accent'}`} />
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
                          <p className="text-sm font-medium mt-1 text-foreground">{p.status === 'at-risk' ? 'High risk of disengagement' : 'Falling behind cohort'}</p>
                          <p className="text-xs text-muted-foreground mt-1">{p.pathwayProgress}% progress, last active {p.lastActive}.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" onClick={() => setActionDialog({ action: "Send Nudge", subject: p })}>Nudge</Button>
                         <Button size="sm" onClick={() => setActionDialog({ action: "Schedule Intervention", subject: p })}>Schedule</Button>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
              {flaggedLearners.length === 0 && (
                <p className="text-sm text-muted-foreground p-4">No learners currently flagged for intervention.</p>
              )}
            </Stagger>
          </TabsContent>

        </Tabs>
      </PageEnter>

      {/* Review Surface Sheet */}
      <Sheet open={!!selectedSubmissionId} onOpenChange={(open) => {
        if (!open) {
          setSelectedSubmissionId(null);
          setShowRevisionInput(false);
          setRevisionNote("");
        }
      }}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto w-full">
          {selectedSubmission && submissionOwner && (
            <div className="space-y-6 pb-12">
              <SheetHeader>
                <SheetTitle className="text-2xl">{selectedSubmission.title}</SheetTitle>
                <SheetDescription>
                  Submitted by {submissionOwner.name} on {selectedSubmission.submittedOn}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <ProjectJourney submission={selectedSubmission} variant="full" />

                <div data-testid="manager-learner-brief">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Learner's brief</p>
                  <ProjectBriefView submission={selectedSubmission} />
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="bg-primary/10 pb-3 border-b border-primary/20 flex flex-row items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                    <CardTitle className="text-sm uppercase tracking-wider text-primary">AI Evaluation</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <AIAnalysisInline
                      agent={AGENTS.analytics}
                      label="Evaluating project submission"
                      steps={["Analysing project metrics", "Verifying federal application", "Validating projected impact"]}
                      runKey={selectedSubmission.id}
                    >
                      <div className="space-y-4">
                        <p className="text-sm text-foreground leading-relaxed">
                          This project demonstrates strong practical application of <strong>{selectedSubmission.competencyIds.join(", ")}</strong> competencies. 
                          The estimate of {selectedSubmission.hoursSavedPerMonth} hours returned per month is realistic based on similar federal implementations.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge variant="outline" className="bg-background text-primary border-primary/30">Governance: {selectedSubmission.governanceStatus}</Badge>
                          <Badge variant="outline" className="bg-background text-primary border-primary/30">Impact: {selectedSubmission.impact}</Badge>
                        </div>
                      </div>
                    </AIAnalysisInline>
                  </CardContent>
                </Card>
              </div>

              <section className="space-y-3" aria-labelledby="review-conversation-heading">
                <h3 id="review-conversation-heading" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <MessagesSquare className="w-4 h-4" /> Review conversation
                </h3>
                <ProjectConversation submission={selectedSubmission} />
              </section>

              {selectedSubmission.state === "awaiting_manager" && (
                <div className="pt-6 border-t border-border flex flex-col gap-3">
                  {showRevisionInput ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                      <label htmlFor="revision-note" className="text-sm font-medium text-foreground">
                        Comments for {submissionOwner?.name ?? "the learner"}
                      </label>
                      <Textarea
                        id="revision-note"
                        data-testid="input-revision-comments"
                        rows={5}
                        placeholder="What needs to change before this can be signed off — the evidence, the measured impact, the governance step…"
                        value={revisionNote}
                        onChange={(e) => setRevisionNote(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Sent to {submissionOwner?.name ?? "the learner"} in full, with a notification, and shown on their
                        workplace project.
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowRevisionInput(false)}>Cancel</Button>
                        <Button size="sm" data-testid="button-send-revision" onClick={handleRevision} disabled={!revisionNote.trim()}>
                          Send to learner
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full gap-4">
                      <Button variant="outline" className="flex-1" data-testid="button-request-revision" onClick={() => setShowRevisionInput(true)}>
                        <RotateCcw className="w-4 h-4 me-2" /> Request revision
                      </Button>
                      <Button className="flex-1" onClick={handleSignOff}>
                        <ClipboardCheck className="w-4 h-4 me-2" /> Sign Off & Validate
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ManagerActionDialogs 
        action={actionDialog?.action ?? null} 
        subject={actionDialog?.subject ?? null} 
        onClose={() => setActionDialog(null)} 
      />
    </Layout>
  );
}
