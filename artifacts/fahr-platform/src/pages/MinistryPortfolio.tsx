import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, User, ArrowRight, Activity, Calendar, FileText, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  DEPARTMENT_BY_ID,
  MINISTRY_BY_ID,
  SUBMISSION_STATE_LABEL,
  competencyLabel,
} from "@/lib/federal";

export default function MinistryPortfolio() {
  const { toast } = useToast();
  const { focus, submissions, getPerson, approvalsFor, endorse, escalate, issueCredential } = useFederalData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ministry = MINISTRY_BY_ID[focus.ministryId];
  const projects = useMemo(
    () => submissions.filter((s) => s.ministryId === focus.ministryId),
    [submissions, focus.ministryId],
  );
  const selectedProject = selectedId ? projects.find((s) => s.id === selectedId) ?? null : null;
  const decisions = selectedProject ? approvalsFor(selectedProject.id) : [];

  const ownerName = (personId: string) => getPerson(personId)?.name ?? "Entity team";
  const departmentName = (departmentId: string) => DEPARTMENT_BY_ID[departmentId]?.name ?? departmentId;

  const handleEndorse = (submissionId: string, title: string) => {
    endorse(submissionId, { by: ministry.entityAdmin });
    toast({ title: "Endorsed", description: `"${title}" is endorsed for entity deployment.` });
  };

  const handleEscalate = (submissionId: string, title: string) => {
    escalate(submissionId, {
      by: ministry.entityAdmin,
      note: "Federal-scale impact — requesting FAHR review.",
    });
    toast({ title: "Escalated to FAHR", description: `"${title}" now appears in the FAHR escalations queue.` });
  };

  return (
    <Layout role="ministry">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <PageHeader
          className="mb-6"
          title="Workplace Project Portfolio"
          description={ministry.name}
          actions={
            <Button onClick={() => toast({ title: "Challenge Wizard", description: "Opening AI Challenge creation tool..." })}>
              Launch Ministry Challenge
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4">
          {projects.map((proj) => (
            <Card 
              key={proj.id} 
              className="hover-elevate transition-all cursor-pointer border-border hover:border-primary/50"
              onClick={() => setSelectedId(proj.id)}
              data-testid={`card-project-${proj.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-primary">{proj.title}</h3>
                      <Badge variant={proj.impact === 'High' ? 'default' : 'secondary'} className={proj.impact === 'High' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}>
                        {proj.impact} Impact
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-4 h-4"/> {ownerName(proj.personId)}</span>
                      <span>•</span>
                      <span>{departmentName(proj.departmentId)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap lg:flex-nowrap gap-4 lg:gap-8 items-center text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium flex items-center gap-1" data-testid={`text-status-${proj.id}`}>
                        {(proj.state === 'deployed' || proj.state === 'endorsed') && <CheckCircle2 className="w-4 h-4 text-green-600"/>}
                        {SUBMISSION_STATE_LABEL[proj.state]}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Governance</p>
                      <p className="font-medium">{proj.governanceStatus}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Reviewer</p>
                      <p className="font-medium">{proj.reviewer ?? "Unassigned"}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground hidden lg:block" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Sheet open={!!selectedProject} onOpenChange={(open) => !open && setSelectedId(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedProject && (
              <div className="space-y-8 py-6">
                <SheetHeader className="space-y-4 text-left">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedProject.impact === 'High' ? 'default' : 'secondary'} className={selectedProject.impact === 'High' ? 'bg-accent text-accent-foreground' : ''}>
                      {selectedProject.impact} Impact
                    </Badge>
                    <Badge variant="outline" className={selectedProject.state === 'deployed' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                      {SUBMISSION_STATE_LABEL[selectedProject.state]}
                    </Badge>
                  </div>
                  <SheetTitle className="text-2xl">{selectedProject.title}</SheetTitle>
                  <SheetDescription className="text-base">
                    {selectedProject.description}
                  </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Owner</span>
                    <p className="font-medium flex items-center gap-2"><User className="w-4 h-4"/> {ownerName(selectedProject.personId)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Department</span>
                    <p className="font-medium">{departmentName(selectedProject.departmentId)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Governance Status</span>
                    <p className="font-medium flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${selectedProject.governanceStatus === 'Compliant' ? 'text-green-600' : 'text-amber-500'}`}/> 
                      {selectedProject.governanceStatus}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Assigned Reviewer</span>
                    <p className="font-medium">{selectedProject.reviewer ?? "Unassigned"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Impact Evidence</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm border border-border space-y-2">
                    <p>{selectedProject.metrics}</p>
                    <p className="text-muted-foreground text-xs">
                      Estimated annual value AED {selectedProject.estimatedValueAed.toLocaleString()} ·{" "}
                      {selectedProject.hoursSavedPerMonth} hours saved per month · Competencies evidenced:{" "}
                      {selectedProject.competencyIds.map(competencyLabel).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary"/> Project Timeline</h4>
                  <div className="space-y-4 pl-2 border-l-2 border-primary/20 ml-2">
                    {selectedProject.timeline.map((event, idx) => (
                      <div key={`${event.date}-${idx}`} className="relative pl-6">
                        <div className="absolute -left-[33px] top-1 w-3 h-3 rounded-full bg-background border-2 border-primary"></div>
                        <p className="text-xs text-muted-foreground mb-1">{event.date}</p>
                        <p className="text-sm font-medium">{event.event}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {decisions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Decision Trail</h4>
                    <ul className="space-y-2 text-sm">
                      {decisions.map((decision) => (
                        <li key={decision.id} className="flex justify-between gap-3">
                          <span className="text-muted-foreground capitalize">
                            {decision.role} · {decision.decision.replace(/_/g, " ")}
                          </span>
                          <span className="font-medium shrink-0">{decision.by}, {decision.on}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-6 border-t border-border flex flex-col gap-3">
                  {selectedProject.state === 'awaiting_entity' && (
                    <div className="flex gap-3">
                      <Button
                        className="flex-1"
                        data-testid={`button-endorse-${selectedProject.id}`}
                        onClick={() => handleEndorse(selectedProject.id, selectedProject.title)}
                      >
                        Endorse Project
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        data-testid={`button-escalate-${selectedProject.id}`}
                        onClick={() => handleEscalate(selectedProject.id, selectedProject.title)}
                      >
                        <ArrowUpRight className="w-4 h-4" /> Escalate to FAHR
                      </Button>
                    </div>
                  )}
                  {selectedProject.state === 'awaiting_manager' && (
                    <p className="text-sm text-muted-foreground">
                      Waiting on the line manager's sign-off before this entity can endorse it.
                    </p>
                  )}
                  {selectedProject.state === 'endorsed' && (
                    <Button
                      className="w-full gap-2"
                      data-testid={`button-credential-${selectedProject.id}`}
                      onClick={() => {
                        issueCredential({
                          personId: selectedProject.personId,
                          personName: ownerName(selectedProject.personId),
                          title: `Applied AI Practitioner — ${selectedProject.title}`,
                          submissionId: selectedProject.id,
                          by: ministry.entityAdmin,
                        });
                        toast({
                          title: "Credential issued",
                          description: `${ownerName(selectedProject.personId)} now holds a verified credential for this project.`,
                        });
                      }}
                    >
                      <ShieldCheck className="w-4 h-4" /> Issue Verified Credential
                    </Button>
                  )}
                  {(selectedProject.state === 'deployed' || selectedProject.state === 'escalated' || selectedProject.state === 'revision_requested') && (
                    <Button variant="outline" className="w-full gap-2" onClick={() => {
                      toast({ title: "Opening Lab", description: "Loading the Agentic AI Lab Twin..." });
                    }}>
                      <FileText className="w-4 h-4"/> View in Agentic Lab
                    </Button>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

      </div>
    </Layout>
  );
}
