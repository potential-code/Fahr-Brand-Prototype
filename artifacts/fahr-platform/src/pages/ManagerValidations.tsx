import React, { useMemo, useState } from "react";
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
import { ClipboardCheck, RotateCcw, AlertCircle, BrainCircuit, CheckCircle2 } from "lucide-react";
import { ManagerActionDialogs, type ManagerActionType } from "@/components/manager/ManagerActionDialogs";
import { AIAnalysisInline } from "@/components/ai/AIAnalysis";
import { AGENTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function ManagerValidations() {
  const { focus, teamOf, submissions, getPerson, signOff, requestRevision, issueCredential } = useFederalData();
  const { toast } = useToast();
  
  const team = teamOf(focus.managerId);
  const teamIds = new Set(team.map((p) => p.id));
  
  const teamSubmissions = useMemo(
    () => submissions.filter((s) => teamIds.has(s.personId)),
    [submissions, teamIds]
  );
  
  const awaitingSignOff = useMemo(
    () => filterSubmissions(teamSubmissions, { state: "awaiting_manager" }),
    [teamSubmissions]
  );

  const flaggedLearners = team.filter(p => p.status === 'at-risk' || p.status === 'needs-attention');
  const recommendations = team.filter(p => p.status === 'excelling');

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [actionDialog, setActionDialog] = useState<{action: ManagerActionType, subject: any} | null>(null);

  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);
  const submissionOwner = selectedSubmission ? getPerson(selectedSubmission.personId) : null;

  const handleSignOff = () => {
    if (!selectedSubmission || !submissionOwner) return;
    
    signOff(selectedSubmission.id, { by: "Department Manager" });
    issueCredential({
      personId: submissionOwner.id,
      personName: submissionOwner.name,
      title: "Workplace Project Validated: " + selectedSubmission.title,
      levelId: "practitioner",
      submissionId: selectedSubmission.id,
      by: "Department Manager"
    });
    
    toast({
      title: "Project Signed Off",
      description: `"${selectedSubmission.title}" has been endorsed and a credential issued.`
    });
    setSelectedSubmissionId(null);
  };

  const handleRevision = () => {
    if (!selectedSubmission || !submissionOwner || !revisionNote) return;
    
    requestRevision(selectedSubmission.id, { by: "Department Manager", note: revisionNote });
    
    toast({
      title: "Sent to learner",
      description: `"${selectedSubmission.title}" has gone back to ${submissionOwner.name} with your comments.`
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
          description="Review workplace projects, address flagged learner risks, and approve system recommendations."
        />

        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="submissions">
              Pending Submissions <Badge variant="secondary" className="ms-2">{awaitingSignOff.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="interventions">
              Interventions <Badge variant="secondary" className="ms-2">{flaggedLearners.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              Recommendations <Badge variant="secondary" className="ms-2">{recommendations.length}</Badge>
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
                        <CardContent className="p-5 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-primary/10 text-primary border-none">High Priority</Badge>
                              <span className="text-xs text-muted-foreground">Submitted {s.submittedOn}</span>
                            </div>
                            <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">From: {owner?.name}</p>
                          </div>
                          <Button variant="ghost" className="shrink-0"><ClipboardCheck className="w-4 h-4 me-2" /> Review</Button>
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

          <TabsContent value="recommendations">
            <Stagger className="grid grid-cols-1 gap-4">
              {recommendations.map(p => (
                <StaggerItem key={p.id} as="div">
                  <Card>
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-start gap-4">
                        <BrainCircuit className="w-6 h-6 mt-1 text-primary" />
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
                          <p className="text-sm font-medium mt-1 text-foreground">Ready to mentor peers</p>
                          <p className="text-xs text-muted-foreground mt-1">Excelling with {p.pathwayProgress}% completion and {p.assessmentScore}% baseline.</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => setActionDialog({ action: "Send Encouragement Message", subject: p })}>Send Recognition</Button>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
              {recommendations.length === 0 && (
                <p className="text-sm text-muted-foreground p-4">No active recommendations.</p>
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
                <Card>
                  <CardHeader className="bg-muted/30 pb-3 border-b border-border">
                    <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Learner's Submission</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedSubmission.description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Metrics & Impact</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{selectedSubmission.metrics}</p>
                    </div>
                  </CardContent>
                </Card>

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
                          The estimated value of {selectedSubmission.estimatedValueAed.toLocaleString()} AED and {selectedSubmission.hoursSavedPerMonth} hours saved per month is realistic based on similar federal implementations.
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
