import React, { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, ChartReveal } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useFederalData } from "@/lib/FederalDataContext";
import { LEVEL_BY_ID, SUBMISSION_STATE_LABEL } from "@/lib/federal";
import { COMPETENCIES } from "@/lib/learningData";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ManagerActionDialogs, type ManagerActionType } from "@/components/manager/ManagerActionDialogs";
import { AIAnalysisPanel } from "@/components/ai/AIAnalysis";
import { AGENTS } from "@/lib/constants";
import { ArrowLeft, UserRound, BookOpen, ShieldCheck, FileText, Sparkles, Send, Target, AlertCircle, Clock, Award, BadgeCheck } from "lucide-react";
import { CertificationBadge, TeamStatusBadge } from "@/components/manager/TeamStatusBadge";
import { teamRosterRow } from "@/lib/manager/selectors";

export default function TeamMemberDetail() {
  const { memberId } = useParams<{ memberId: string }>();
  const { getPerson, submissions, credentials, auditEvents, approvalsFor } = useFederalData();
  const [actionDialog, setActionDialog] = useState<{action: ManagerActionType, subject: any} | null>(null);

  const person = getPerson(memberId || "");

  const personProjects = useMemo(() => submissions.filter(s => s.personId === person?.id), [submissions, person]);
  const personCredentials = useMemo(() => credentials.filter(c => c.personId === person?.id), [credentials, person]);
  const personAudit = useMemo(() => auditEvents.filter(a => a.action.includes(person?.name ?? "")), [auditEvents, person]);

  if (!person) {
    return (
      <Layout role="manager">
        <PageEnter>
          <PageHeader tone="primary" title="Team member not found" />
          <Link href="/manager/team"><Button className="mt-4"><ArrowLeft className="me-2 h-4 w-4"/> Back to Team</Button></Link>
        </PageEnter>
      </Layout>
    );
  }

  const level = LEVEL_BY_ID[person.levelId];
  const isLive = Boolean(person.live);
  // The same roster derivation the team table uses, so a row and this page can
  // never disagree about a pathway, an assessment outcome or certification.
  const standing = teamRosterRow(person, credentials);

  const scoreFor = (competencyId: string): number =>
    person.competencyScores?.[competencyId] ?? person.assessmentScore;

  const radarData = COMPETENCIES.map((c) => ({
    competency: c.short,
    score: scoreFor(c.id),
  }));

  return (
    <Layout role="manager">
      <PageEnter className="space-y-6 max-w-7xl mx-auto w-full pb-12">
        <Link href="/manager/team" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Team
        </Link>

        <PageHeader
          tone="primary"
          icon={<UserRound className="h-7 w-7 text-primary" />}
          title={person.name}
          description={`${person.role} · Last active: ${person.lastActive}`}
          actions={
            <>
              <Badge variant="outline">{level.label}</Badge>
              {isLive && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="me-1 h-3 w-3" /> Live demo learner
                </Badge>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <AIAnalysisPanel
              agent={AGENTS.analytics}
              title="Capability Profile & Competency Map"
              sources="Baseline assessment & recent activity"
              steps={["Reading baseline assessment", "Mapping to Agentic AI framework", "Identifying development areas"]}
              runKey={person.id}
            >
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">Baseline assessment: {person.assessmentScore}%</p>
                <ChartReveal direction="rise" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="competency" fontSize={12} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip />
                      <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartReveal>
              </div>
            </AIAnalysisPanel>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Learning Pathway Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Personalised Learning Pathway, generated from {person.name.split(" ")[0]}&apos;s own baseline ·{" "}
                  {standing.cohortName}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Overall Completion</span>
                  <span className="font-bold">{person.pathwayProgress}%</span>
                </div>
                <Progress value={person.pathwayProgress} className="h-2 mb-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Workplace Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {personProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects submitted yet.</p>
                ) : (
                  <div className="space-y-4">
                    {personProjects.map(p => {
                      const decisions = approvalsFor(p.id);
                      return (
                        <div key={p.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-medium text-foreground">{p.title}</span>
                            <Badge variant="outline">{SUBMISSION_STATE_LABEL[p.state]}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{p.impact} impact · Submitted {p.submittedOn}</p>
                          {decisions.length > 0 && (
                            <>
                              <Separator className="my-3" />
                              <ul className="space-y-1.5 text-sm">
                                {decisions.map(d => (
                                  <li key={d.id} className="flex justify-between gap-3 text-xs">
                                    <span className="capitalize text-muted-foreground">{d.role} · {d.decision.replace(/_/g, " ")}</span>
                                    <span className="shrink-0 font-medium">{d.by}, {d.on}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Activity & Trace</CardTitle>
              </CardHeader>
              <CardContent>
                {personAudit.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recorded actions for this member.</p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ms-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {personAudit.map(a => (
                      <div key={a.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-foreground">{a.actor}</span>
                            <span className="text-[10px] font-medium text-muted-foreground">{a.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{a.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manager Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => setActionDialog({ action: "Send Direct Message", subject: person })}>
                  <Send className="w-4 h-4 text-secondary" /> Send Direct Message
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-12" onClick={() => setActionDialog({ action: "Send Encouragement Message", subject: person })}>
                  <Award className="w-4 h-4 text-[hsl(var(--chart-3))]" /> Send Recognition
                </Button>
                {person.status === 'at-risk' && (
                  <Button variant="default" className="w-full justify-start gap-3 h-12" onClick={() => setActionDialog({ action: "Schedule Intervention Meeting", subject: person })}>
                    <AlertCircle className="w-4 h-4" /> Schedule Intervention
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-member-standing">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" /> Completion &amp; Certification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Certification standing</span>
                  <CertificationBadge state={standing.certification} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Pathway completion</span>
                  <span className="font-semibold tabular-nums">{standing.pathwayProgress}%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Assessment outcome</span>
                  <span className="font-medium">{standing.assessmentOutcome}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Capability average</span>
                  <span className="font-semibold tabular-nums">{standing.capabilityAverage}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Progress status</span>
                  <TeamStatusBadge status={person.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Last active {standing.lastActive}
                  {standing.activeThisWeek ? "" : " — dormant this week"}.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                {personCredentials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No credentials issued yet.</p>
                ) : (
                  <div className="space-y-3">
                    {personCredentials.map((c) => (
                      <div key={c.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{c.title}</p>
                          <p className="text-xs text-muted-foreground">Issued {c.issuedOn}</p>
                          <p className="mt-1 font-mono text-[10px] text-muted-foreground">Code: {c.verificationCode}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </PageEnter>

      <ManagerActionDialogs 
        action={actionDialog?.action ?? null} 
        subject={actionDialog?.subject ?? null} 
        onClose={() => setActionDialog(null)} 
      />
    </Layout>
  );
}
