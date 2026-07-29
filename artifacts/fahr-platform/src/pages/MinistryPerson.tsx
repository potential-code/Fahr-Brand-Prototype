import React, { useMemo } from "react";
import { Link, useParams } from "wouter";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { PageEnter, ChartReveal, CountUp } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { STAT_SURFACE_ATTRS, STAT_SURFACE_CLASS } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  ArrowLeft,
  UserRound,
  Award,
  BookOpen,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";
import {
  DEPARTMENT_BY_ID,
  MINISTRY_BY_ID,
  SUBMISSION_STATE_LABEL,
  competencyLabel,
  levelForScore,
  peopleOf,
  PERSON_BY_ID,
} from "@/lib/federal";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { COMPETENCIES } from "@/lib/learningData";
import { departmentGapRows } from "@/lib/entityAdmin/selectors";
import { useEntityAdmin } from "@/lib/EntityAdminContext";
import { UsersAccountPanel } from "@/components/ministry/UsersAccountPanel";
import type { Person } from "@/lib/federal/model";

const LEVEL_BY_ID = Object.fromEntries(CAPABILITY_LEVELS.map((l) => [l.id, l]));

/**
 * Resolves a person id to a roster entry. Authored people are in the federal
 * store; generated department people (ids like `mohap-x-syn-1`) are not, so we
 * fall back to regenerating that department's roster from the id prefix.
 */
function resolvePerson(personId: string, storePeople: Person[]): Person | undefined {
  const fromStore = storePeople.find((p) => p.id === personId) ?? PERSON_BY_ID[personId];
  if (fromStore) return fromStore;
  const synMatch = personId.match(/^(.*)-syn-\d+$/);
  if (synMatch) {
    const departmentId = synMatch[1];
    return peopleOf(departmentId).find((p) => p.id === personId);
  }
  return undefined;
}

export default function MinistryPerson() {
  const { personId } = useParams<{ personId: string }>();
  const { people, live, credentials, submissions, approvalsFor } = useFederalData();
  const { accounts, cohorts } = useEntityAdmin();

  const person = useMemo(
    () => (personId ? resolvePerson(personId, people) : undefined),
    [personId, people],
  );

  const account = useMemo(
    () => (person ? accounts.find((a) => a.personId === person.id) : undefined),
    [accounts, person],
  );

  const ministryForProfile = person ? MINISTRY_BY_ID[person.ministryId] ?? MINISTRY_BY_ID["mohap"] : MINISTRY_BY_ID["mohap"];
  const departmentProfile = useMemo(
    () =>
      person
        ? departmentGapRows(ministryForProfile).find((r) => r.department.id === person.departmentId)
        : undefined,
    [ministryForProfile, person],
  );

  if (!person || !personId) {
    return (
      <Layout role="ministry">
        <PageEnter className="space-y-6">
          <PageHeader tone="primary" title="Learner not found" description="This learner is not in the entity roster." />
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><UserRound className="h-6 w-6" /></EmptyMedia>
              <EmptyTitle>We could not find that learner</EmptyTitle>
              <EmptyDescription>The link may be stale. Return to the dashboard to pick a department and drill in.</EmptyDescription>
            </EmptyHeader>
            <Link href="/ministry">
              <Button className="mt-4" data-testid="button-back-dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard</Button>
            </Link>
          </Empty>
        </PageEnter>
      </Layout>
    );
  }

  const department = DEPARTMENT_BY_ID[person.departmentId];
  const ministry = ministryForProfile;
  const level = LEVEL_BY_ID[person.levelId] ?? levelForScore(person.assessmentScore);
  const isLive = Boolean(person.live);

  // Competency scores: the person's own if assessed, otherwise the department profile as a stated proxy.
  const usingProxy = !person.competencyScores;
  const scoreFor = (competencyId: string): number =>
    person.competencyScores?.[competencyId] ?? departmentProfile?.scores[competencyId] ?? person.assessmentScore;

  const radarData = COMPETENCIES.map((c) => ({
    competency: c.short,
    score: scoreFor(c.id),
  }));

  const gaps = person.gapCompetencyIds ?? [];
  const strengths = [...COMPETENCIES]
    .map((c) => ({ id: c.id, score: scoreFor(c.id) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((s) => s.id);

  const personCredentials = credentials.filter((c) => c.personId === person.id);
  const personProjects = submissions.filter((s) => s.personId === person.id);

  const liveCourses = isLive ? live.courses : [];
  const cohortName = account?.cohortId
    ? cohorts.find((c) => c.id === account.cohortId)?.name ?? account.cohortId
    : undefined;

  return (
    <Layout role="ministry">
      <PageEnter className="space-y-6">
        <Link
          href={department ? `/ministry/departments/${department.id}` : "/ministry"}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          data-testid="link-back-department"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {department?.name ?? "the dashboard"}
        </Link>

        <PageHeader
          tone="primary"
          icon={<UserRound className="h-7 w-7 text-primary" />}
          title={person.name}
          description={`${person.role} · ${department?.name ?? "—"} · ${ministry.name}`}
          actions={
            <>
              <Badge variant="outline" data-testid="badge-level">{level.label}</Badge>
              {isLive && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="mr-1 h-3 w-3" /> Live demo learner
                </Badge>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Capability profile */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Capability Profile</CardTitle>
              <CardDescription>
                Baseline assessment {person.assessmentScore}% · {level.label}.{" "}
                {usingProxy ? "Per-competency scores shown are the department profile, used as a proxy where a detailed assessment has not been recorded." : "Scored from the learner's baseline assessment."}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-green-700"><TrendingUp className="h-4 w-4" /> Strengths</p>
                  <div className="flex flex-wrap gap-1.5">
                    {strengths.map((id) => (
                      <Badge key={id} variant="outline" className="bg-green-50 text-green-700 border-green-200">{competencyLabel(id)}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-amber-700">Development priorities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {gaps.length > 0 ? (
                      gaps.map((id) => (
                        <Badge key={id} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{competencyLabel(id)}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None flagged.</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account & access */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account & Access</CardTitle>
              <CardDescription>Platform role, status and consent, editable inline.</CardDescription>
            </CardHeader>
            <CardContent>
              {account ? (
                <UsersAccountPanel accountId={account.id} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  This learner does not have a managed platform account in the entity directory.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pathway progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Learning Pathway</CardTitle>
            <CardDescription>
              {cohortName ? `Cohort: ${cohortName}` : "No cohort allocated."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div {...STAT_SURFACE_ATTRS} className={`rounded-lg border p-4 text-center ${STAT_SURFACE_CLASS}`}>
                <p className="text-2xl font-bold"><CountUp to={person.pathwayProgress} suffix="%" /></p>
                <p className="text-xs text-muted-foreground">Pathway progress</p>
              </div>
              <div {...STAT_SURFACE_ATTRS} className={`rounded-lg border p-4 text-center ${STAT_SURFACE_CLASS}`}>
                <p className="text-2xl font-bold"><CountUp to={person.assessmentScore} suffix="%" /></p>
                <p className="text-xs text-muted-foreground">Baseline assessment</p>
              </div>
              <div {...STAT_SURFACE_ATTRS} className={`rounded-lg border p-4 text-center ${STAT_SURFACE_CLASS}`}>
                <p className="text-2xl font-bold">{personCredentials.length}</p>
                <p className="text-xs text-muted-foreground">Credentials held</p>
              </div>
            </div>

            {isLive && liveCourses.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Course progress (live)</p>
                {liveCourses.map((course) => (
                  <div key={course.courseId} className="flex items-center gap-3" data-testid={`row-course-${course.courseId}`}>
                    <span className="w-56 truncate text-sm">{course.title}</span>
                    <Progress value={course.percent} className="h-2 flex-1" />
                    <span className="w-10 text-right text-xs text-muted-foreground">{course.percent}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment & certification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Assessment & Certification</CardTitle>
          </CardHeader>
          <CardContent>
            {personCredentials.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No credentials issued yet. Baseline assessment outcome: {person.assessmentScore}% ({level.label}).
              </p>
            ) : (
              <div className="space-y-3">
                {personCredentials.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-3" data-testid={`row-credential-${c.id}`}>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {LEVEL_BY_ID[c.levelId]?.label ?? c.levelId} · Issued {c.issuedOn}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">Code: {c.verificationCode}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workplace projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Workplace Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {personProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">This learner has not submitted a workplace project.</p>
            ) : (
              <div className="space-y-4">
                {personProjects.map((p) => {
                  const decisions = approvalsFor(p.id);
                  return (
                    <div key={p.id} className="rounded-lg border border-border p-4" data-testid={`row-project-${p.id}`}>
                      <div className="flex items-center justify-between gap-4">
                        <Link href="/ministry/portfolio" className="font-medium text-primary hover:underline" data-testid={`link-project-${p.id}`}>
                          {p.title}
                        </Link>
                        <Badge variant="outline">{SUBMISSION_STATE_LABEL[p.state]}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{p.impact} impact · {p.governanceStatus}</p>
                      {decisions.length > 0 && (
                        <>
                          <Separator className="my-3" />
                          <ul className="space-y-1.5 text-sm">
                            {decisions.map((d) => (
                              <li key={d.id} className="flex justify-between gap-3">
                                <span className="capitalize text-muted-foreground">{d.role} · {d.decision.replace(/_/g, " ")}</span>
                                <span className="shrink-0 font-medium">{d.by}, {d.on}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </PageEnter>
    </Layout>
  );
}
