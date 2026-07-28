import React, { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  User,
  ArrowRight,
  Activity,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  Undo2,
  Megaphone,
  Download,
  FolderKanban,
  ExternalLink,
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
  SUBMISSION_STATE_LABEL,
  competencyLabel,
} from "@/lib/federal";
import type { Submission } from "@/lib/federal/model";
import { ENTITY_ADMIN } from "@/lib/entityAdmin/seed";
import { downloadCsv } from "@/lib/exportFile";

const impactBadge = (impact: Submission["impact"]): string =>
  impact === "High"
    ? "bg-accent/15 text-accent border-accent/30"
    : impact === "Medium"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-muted text-muted-foreground";

const stateBadge = (state: Submission["state"]): string => {
  if (state === "deployed" || state === "endorsed") return "bg-green-50 text-green-700 border-green-200";
  if (state === "escalated") return "bg-primary/10 text-primary border-primary/20";
  if (state === "revision_requested" || state === "awaiting_manager")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-muted text-muted-foreground";
};

export default function MinistryPortfolio() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    focus,
    submissions,
    getPerson,
    approvalsFor,
    endorse,
    escalate,
    returnToManager,
    issueCredential,
  } = useFederalData();
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

  const kpis = useMemo(() => {
    const deployed = projects.filter((p) => p.state === "deployed").length;
    const endorsed = projects.filter((p) => p.state === "endorsed").length;
    const awaiting = projects.filter(
      (p) => p.state === "awaiting_entity" || p.state === "awaiting_manager",
    ).length;
    const value = projects.reduce((sum, p) => sum + p.estimatedValueAed, 0);
    return { total: projects.length, deployed, endorsed, awaiting, value };
  }, [projects]);

  const handleEndorse = (submissionId: string, title: string) => {
    endorse(submissionId, { by: ENTITY_ADMIN });
    toast({ title: "Endorsed", description: `"${title}" is endorsed for entity deployment.` });
  };

  const handleEscalate = (submissionId: string, title: string) => {
    escalate(submissionId, {
      by: ENTITY_ADMIN,
      note: "Federal-scale impact — requesting FAHR review.",
    });
    toast({ title: "Escalated to FAHR", description: `"${title}" now appears in the FAHR escalations queue.` });
  };

  const handleReturn = (submissionId: string, title: string) => {
    returnToManager(submissionId, {
      by: ENTITY_ADMIN,
      note: "Returned for the line manager to strengthen the evidence with the learner.",
    });
    toast({ title: "Returned to manager", description: `"${title}" is back with the line manager.` });
  };

  const exportPortfolio = () => {
    const filename = downloadCsv({
      filename: "workplace-project-portfolio",
      title: `${ministry.name} — Workplace Project Portfolio`,
      headers: [
        "Project", "Owner", "Department", "State", "Impact", "Governance",
        "Est. value (AED/yr)", "Hours saved/mo", "Reviewer",
      ],
      rows: projects.map((p) => [
        p.title,
        ownerName(p.personId),
        departmentName(p.departmentId),
        SUBMISSION_STATE_LABEL[p.state],
        p.impact,
        p.governanceStatus,
        p.estimatedValueAed,
        p.hoursSavedPerMonth,
        p.reviewer ?? "Unassigned",
      ]),
    });
    toast({ title: "Export ready", description: `Downloaded ${filename}.` });
  };

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <PageHeader
          tone="primary"
          icon={<FolderKanban className="h-7 w-7 text-primary" />}
          title="Workplace Project Portfolio"
          description={`${ministry.name} — every AI workplace project this entity has in flight, from sign-off to deployment.`}
          actions={
            <>
              <Button variant="outline" onClick={exportPortfolio} data-testid="button-export-portfolio">
                <Download className="mr-2 h-4 w-4" /> Export portfolio
              </Button>
              <Button onClick={() => setLocation("/ministry/approvals")} data-testid="button-goto-approvals">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approvals queue
              </Button>
            </>
          }
        />

        <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StaggerItem as="div">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold"><CountUp to={kpis.total} /></p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem as="div">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600"><CountUp to={kpis.deployed} /></p>
                <p className="text-xs text-muted-foreground">Deployed</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem as="div">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary"><CountUp to={kpis.endorsed} /></p>
                <p className="text-xs text-muted-foreground">Endorsed</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem as="div">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600"><CountUp to={kpis.awaiting} /></p>
                <p className="text-xs text-muted-foreground">Awaiting a decision</p>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem as="div">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-accent">
                  <CountUp to={Math.round(kpis.value / 1000)} prefix="AED " suffix="k" />
                </p>
                <p className="text-xs text-muted-foreground">Est. annual value</p>
              </CardContent>
            </Card>
          </StaggerItem>
        </Stagger>

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
          <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
            {selectedProject && (
              <PanelEnter className="space-y-8 py-6">
                <SheetHeader className="space-y-4 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${impactBadge(selectedProject.impact)}`}>
                      {selectedProject.impact} impact
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${stateBadge(selectedProject.state)}`}>
                      {SUBMISSION_STATE_LABEL[selectedProject.state]}
                    </Badge>
                  </div>
                  <SheetTitle className="text-2xl">{selectedProject.title}</SheetTitle>
                  <SheetDescription className="text-base">{selectedProject.description}</SheetDescription>
                </SheetHeader>

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

                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <Activity className="h-5 w-5 text-primary" /> Impact Evidence
                  </h4>
                  <div className="space-y-2 rounded-lg border border-border bg-muted p-4 text-sm">
                    <p>{selectedProject.metrics}</p>
                    <p className="text-xs text-muted-foreground">
                      Estimated annual value AED {selectedProject.estimatedValueAed.toLocaleString()} ·{" "}
                      {selectedProject.hoursSavedPerMonth} hours saved per month · Competencies evidenced:{" "}
                      {selectedProject.competencyIds.map(competencyLabel).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <Calendar className="h-5 w-5 text-primary" /> Project Timeline
                  </h4>
                  <div className="ml-2 space-y-4 border-l-2 border-primary/20 pl-2">
                    {selectedProject.timeline.map((event, idx) => (
                      <div key={`${event.date}-${idx}`} className="relative pl-6">
                        <div className="absolute -left-[33px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                        <p className="mb-1 text-xs text-muted-foreground">{event.date}</p>
                        <p className="text-sm font-medium">{event.event}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Decision Trail</h4>
                    <Link href="/ministry/approvals">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-primary hover:underline"
                        data-testid={`link-approvals-${selectedProject.id}`}
                      >
                        Full trail <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  {decisions.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      <AnimatePresence initial={false}>
                        {decisions.map((decision) => (
                          <motion.li
                            key={decision.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-between gap-3 rounded-md border border-border p-2"
                          >
                            <span className="capitalize text-muted-foreground">
                              {decision.role} · {decision.decision.replace(/_/g, " ")}
                              {decision.note && <span className="not-italic text-foreground/70"> — {decision.note}</span>}
                            </span>
                            <span className="shrink-0 font-medium">
                              {decision.by}, {decision.on}
                            </span>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No decisions recorded on this project yet.</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-border pt-6">
                  {selectedProject.state === "awaiting_entity" && (
                    <>
                      <Button
                        data-testid={`button-endorse-${selectedProject.id}`}
                        onClick={() => handleEndorse(selectedProject.id, selectedProject.title)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Endorse Project
                      </Button>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          data-testid={`button-return-${selectedProject.id}`}
                          onClick={() => handleReturn(selectedProject.id, selectedProject.title)}
                        >
                          <Undo2 className="h-4 w-4" /> Return to manager
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          data-testid={`button-escalate-${selectedProject.id}`}
                          onClick={() => handleEscalate(selectedProject.id, selectedProject.title)}
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
                  {selectedProject.state === "endorsed" && (
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
    </Layout>
  );
}
