import React, { useMemo } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { PageEnter, Stagger, StaggerItem, ScrollReveal, CountUp } from "@/components/motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STAT_SURFACE_ATTRS, STAT_SURFACE_CLASS } from "@/components/StatCard";
import { RecognitionBand, RecognitionItemCard } from "@/components/recognition/RecognitionSurface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  Clock,
  Flame,
  Medal,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useFederalData } from "@/lib/FederalDataContext";
import { MINISTRY_BY_ID, SUBMISSION_STATE_LABEL } from "@/lib/federal";
import { ReportKpi, ReportPill } from "@/components/ministry/ReportShared";
import { TeamBenchmarkCard } from "@/components/manager/TeamBenchmark";
import {
  CHALLENGE_ENTRY_LIMIT,
  teamBenchmark,
  teamCompetencyMatrix,
  teamRecognition,
  teamRoster,
  type TeamBadgeIcon,
} from "@/lib/manager/selectors";

const BADGE_ICON: Record<TeamBadgeIcon, React.ComponentType<{ className?: string }>> = {
  target: Target,
  spark: Sparkles,
  flame: Flame,
  shield: ShieldCheck,
  trophy: Trophy,
  people: Users,
};

function SurfaceEmpty({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function TeamRecognition() {
  const { focus, teamOf, submissions, credentials, getPerson } = useFederalData();

  const manager = getPerson(focus.managerId);
  const team = teamOf(focus.managerId);
  const ministry = MINISTRY_BY_ID[focus.ministryId];

  const teamIds = useMemo(() => new Set(team.map((p) => p.id)), [team]);
  const teamSubmissions = useMemo(
    () => submissions.filter((s) => teamIds.has(s.personId)),
    [submissions, teamIds],
  );

  const matrix = useMemo(() => teamCompetencyMatrix(team), [team]);
  const roster = useMemo(() => teamRoster(team, credentials), [team, credentials]);
  const benchmark = useMemo(
    () => teamBenchmark(matrix, focus.departmentId, focus.ministryId),
    [matrix, focus.departmentId, focus.ministryId],
  );
  const recognition = useMemo(
    () =>
      teamRecognition({
        team,
        roster,
        matrix,
        teamSubmissions,
        credentials,
        ministryId: focus.ministryId,
      }),
    [team, roster, matrix, teamSubmissions, credentials, focus.ministryId],
  );

  const { impact, standing } = recognition;

  return (
    <Layout role="manager">
      <PageEnter className="mx-auto w-full max-w-7xl space-y-6 pb-12">
        <RecognitionBand
          testId="band-team-recognition"
          eyebrow="Verified team record"
          title="Team Recognition & Impact"
          description="Credentials and badges your team has earned, where it stands on the capability ladder, the impact its Workplace Projects return, and how that compares with the entity."
          actions={
            <>
              <Badge variant="outline" className="border-primary/40 bg-primary/15 text-primary">
                <ShieldCheck className="me-1 h-3 w-3" /> {recognition.credentials.length} credentials
              </Badge>
              {recognition.ladderLead && (
                <Badge
                  variant="outline"
                  className="border-white/25 bg-white/5 text-white/80"
                  data-testid="badge-ladder-lead"
                >
                  Highest level: {recognition.ladderLead.label}
                </Badge>
              )}
            </>
          }
        />

        <Stagger className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StaggerItem as="div">
            <ReportKpi
              label="Credentials earned"
              value={recognition.credentials.length}
              icon={ShieldCheck}
              testId="kpi-team-credentials"
            />
          </StaggerItem>
          <StaggerItem as="div">
            <ReportKpi
              label="Badges unlocked"
              value={recognition.badgesEarned}
              icon={Medal}
              testId="kpi-team-badges"
            />
          </StaggerItem>
          <StaggerItem as="div">
            <ReportKpi
              label="Hours saved / month"
              value={impact.hoursPerMonth}
              icon={Clock}
              testId="kpi-team-hours"
            />
          </StaggerItem>
          <StaggerItem as="div">
            <ReportKpi
              label="Est. annual value"
              value={impact.valueAed}
              prefix="AED "
              icon={TrendingUp}
              testId="kpi-team-value"
            />
          </StaggerItem>
        </Stagger>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ScrollReveal className="lg:col-span-2">
            <Card data-testid="card-ladder-standing">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> Capability ladder standing
                </CardTitle>
                <CardDescription>
                  Where your {team.length} direct {team.length === 1 ? "report sits" : "reports sit"} on the unified
                  federal capability ladder.
                  {recognition.ladderAverage && ` The team averages ${recognition.ladderAverage.label}.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {team.length === 0 ? (
                  <SurfaceEmpty
                    title="No direct reports yet"
                    message="Ladder standing appears once your team is enrolled."
                  />
                ) : (
                  recognition.ladder.map((row) => (
                    <div key={row.level.id} data-testid={`ladder-row-${row.level.id}`}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">{row.level.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {row.count} {row.count === 1 ? "person" : "people"} · {row.share}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${row.share}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
                <Separator />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{recognition.practitionersOrAbove}</span> of{" "}
                  {team.length} are Practitioner or above — the point at which someone applies AI independently to
                  deliver measurable work outcomes.
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>

          {benchmark && (
            <ScrollReveal>
              <TeamBenchmarkCard benchmark={benchmark} />
            </ScrollReveal>
          )}
        </div>

        <ScrollReveal>
          <Card data-testid="card-team-credentials">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Credentials earned by the team
              </CardTitle>
              <CardDescription>
                Verifiable federal credentials on the national register, issued as projects are validated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recognition.credentials.length === 0 ? (
                <SurfaceEmpty
                  title="No credentials issued yet"
                  message="Signing off a validated Workplace Project issues a credential to its owner, and it appears here."
                />
              ) : (
                <Stagger className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {recognition.credentials.map((credential) => (
                    <StaggerItem as="div" key={credential.id}>
                      <RecognitionItemCard data-testid={`credential-${credential.id}`}>
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{credential.title}</p>
                            <p className="text-xs text-white/60">
                              {credential.personName} · issued {credential.issuedOn}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-white/45">
                              {credential.verificationCode}
                            </p>
                          </div>
                        </div>
                      </RecognitionItemCard>
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal>
          <Card data-testid="card-team-badges">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="h-5 w-5 text-primary" /> Badges across the team
              </CardTitle>
              <CardDescription>
                Milestones across the learner journey — from the baseline assessment to reaching Practitioner —
                counted across your direct reports. Distinct from the five competency badges a learner sees on
                their own recognition page, which track mastery of each assessed competency rather than
                progress through the journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stagger className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {recognition.badges.map((badge) => {
                  const Icon = BADGE_ICON[badge.icon];
                  const earned = badge.earnedBy.length;
                  return (
                    <StaggerItem as="div" key={badge.id}>
                      <RecognitionItemCard
                        state={earned > 0 ? "earned" : "empty"}
                        data-testid={`badge-${badge.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Icon className={`h-5 w-5 ${earned > 0 ? "text-primary" : "text-muted-foreground"}`} />
                          {earned > 0 ? (
                            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                              {earned} of {team.length}
                            </span>
                          ) : (
                            <ReportPill tone="muted">
                              {earned} of {team.length}
                            </ReportPill>
                          )}
                        </div>
                        <p className={`mt-3 text-sm font-semibold ${earned > 0 ? "text-white" : "text-foreground"}`}>
                          {badge.label}
                        </p>
                        <p
                          className={`mt-1 text-xs leading-relaxed ${
                            earned > 0 ? "text-white/60" : "text-muted-foreground"
                          }`}
                        >
                          {badge.description}
                        </p>
                        <p className={`mt-2 text-[11px] ${earned > 0 ? "text-white/45" : "text-muted-foreground"}`}>
                          {earned > 0
                            ? badge.earnedBy.map((p) => p.name.split(" ")[0]).join(", ")
                            : badge.criteria}
                        </p>
                      </RecognitionItemCard>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </CardContent>
          </Card>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ScrollReveal>
            <Card className="h-full" data-testid="card-applied-impact">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" /> Applied impact
                </CardTitle>
                <CardDescription>
                  What the team's validated Workplace Projects return to the entity each month.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {impact.projectsValidated === 0 ? (
                  <SurfaceEmpty
                    title="No validated projects yet"
                    message={
                      impact.projectsAwaitingSignOff > 0
                        ? `${impact.projectsAwaitingSignOff} project${
                            impact.projectsAwaitingSignOff === 1 ? "" : "s"
                          } waiting on your sign-off — impact is counted from the moment you validate.`
                        : "Impact is counted once you sign off a Workplace Project."
                    }
                  />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div {...STAT_SURFACE_ATTRS} className={`rounded-lg border p-3 ${STAT_SURFACE_CLASS}`}>
                        <p className="text-2xl font-bold tabular-nums text-foreground" data-testid="text-impact-hours">
                          <CountUp to={impact.hoursPerMonth} />
                        </p>
                        <p className="text-xs text-muted-foreground">Hours saved each month</p>
                      </div>
                      <div {...STAT_SURFACE_ATTRS} className={`rounded-lg border p-3 ${STAT_SURFACE_CLASS}`}>
                        <p className="text-2xl font-bold tabular-nums text-foreground">
                          <CountUp to={impact.workingDaysReturned} />
                        </p>
                        <p className="text-xs text-muted-foreground">Working days returned a year</p>
                      </div>
                      <div {...STAT_SURFACE_ATTRS} className={`rounded-lg border p-3 ${STAT_SURFACE_CLASS}`}>
                        <p className="text-2xl font-bold tabular-nums text-foreground">
                          <CountUp to={impact.valueAed} prefix="AED " />
                        </p>
                        <p className="text-xs text-muted-foreground">Estimated annual value</p>
                      </div>
                      <div {...STAT_SURFACE_ATTRS} className={`rounded-lg border p-3 ${STAT_SURFACE_CLASS}`}>
                        <p className="text-2xl font-bold tabular-nums text-foreground" data-testid="text-impact-projects">
                          {impact.projectsDeployed}/{impact.projectsValidated}
                        </p>
                        <p className="text-xs text-muted-foreground">Deployed of validated</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {impact.categories.map((row) => (
                        <div
                          key={row.competency.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                          data-testid={`impact-category-${row.competency.id}`}
                        >
                          <span className="font-medium text-foreground">{row.competency.label}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {row.projects} {row.projects === 1 ? "project" : "projects"} ·{" "}
                            {row.hoursSavedPerMonth} h/month
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>

          <ScrollReveal>
            <Card className="h-full" data-testid="card-ministry-standing">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Standing in {ministry.shortName}
                </CardTitle>
                <CardDescription>
                  The team against the entity's own figures — impact per person, credentials per person and readiness.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {standing ? (
                  <>
                    <div className="rounded-lg border border-border p-4" data-testid="standing-hours">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">Hours returned per person / month</p>
                        <ReportPill tone={standing.aheadOnImpact ? "good" : "accent"}>
                          {standing.hoursRatio}× entity average
                        </ReportPill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Your team: <span className="font-semibold text-foreground">{standing.teamHoursPerPerson}</span>{" "}
                        · {ministry.shortName} average:{" "}
                        <span className="font-semibold text-foreground">{standing.ministryHoursPerLearner}</span>
                      </p>
                    </div>
                    <div className="rounded-lg border border-border p-4" data-testid="standing-credentials">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">Credentials per person</p>
                        <ReportPill tone={standing.aheadOnCredentials ? "good" : "accent"}>
                          {standing.credentialRatio}× entity average
                        </ReportPill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Your team:{" "}
                        <span className="font-semibold text-foreground">{standing.teamCredentialsPerPerson}</span> ·{" "}
                        {ministry.shortName} average:{" "}
                        <span className="font-semibold text-foreground">
                          {standing.ministryCredentialsPerLearner}
                        </span>
                      </p>
                    </div>
                    {benchmark && (
                      <p className="text-sm text-muted-foreground" data-testid="text-standing-readiness">
                        On capability, {benchmark.headline.charAt(0).toLowerCase() + benchmark.headline.slice(1)}
                      </p>
                    )}
                  </>
                ) : (
                  <SurfaceEmpty
                    title="Entity figures unavailable"
                    message="The comparison appears once the entity roll-up is in scope."
                  />
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <Card data-testid="card-top-contributors">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Top contributors
              </CardTitle>
              <CardDescription>
                Ranked on applied impact first, then credentials and capability — the people to recognise in your next
                team meeting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recognition.topContributors.length === 0 ? (
                <SurfaceEmpty
                  title="No contributions to recognise yet"
                  message="Contributors appear once a team member earns a credential or has a project validated."
                />
              ) : (
                <Stagger className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {recognition.topContributors.map((member, index) => (
                    <StaggerItem as="div" key={member.person.id}>
                      <div
                        className="h-full rounded-lg border border-border p-4"
                        data-testid={`contributor-${member.person.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            #{index + 1}
                          </Badge>
                          {member.person.live && (
                            <Badge variant="outline" className="text-[10px]">
                              <Sparkles className="me-1 h-3 w-3" /> Live demo learner
                            </Badge>
                          )}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">{member.person.name}</p>
                        <p className="text-xs text-muted-foreground">{member.level.label}</p>
                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <li>
                            {member.hoursSavedPerMonth} hours saved / month across {member.validatedProjects}{" "}
                            validated {member.validatedProjects === 1 ? "project" : "projects"}
                          </li>
                          <li>
                            {member.credentials.length}{" "}
                            {member.credentials.length === 1 ? "credential" : "credentials"} · {member.badgeCount}{" "}
                            badges
                          </li>
                          <li>Capability average {member.capabilityAverage}</li>
                          {member.impactPoints !== undefined && (
                            <li data-testid={`contributor-points-${member.person.id}`}>
                              {member.impactPoints.toLocaleString()} impact points on her own record
                            </li>
                          )}
                        </ul>
                        <Link href={`/manager/team/${member.person.id}`}>
                          <Button variant="ghost" size="sm" className="mt-3 gap-1 px-0">
                            View profile <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal>
          <Card data-testid="card-impact-challenge">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" /> Q3 federal AI capability challenge
              </CardTitle>
              <CardDescription>
                Every entity may enter up to {CHALLENGE_ENTRY_LIMIT} Workplace Projects. Entries close on 15 September
                2026 and shortlisted projects present to the FAHR Governance Board — these are the validated,
                compliant, high-impact projects you can put forward.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recognition.challengeEntries.length === 0 ? (
                <SurfaceEmpty
                  title="Nothing eligible yet"
                  message="A project qualifies once it is signed off, rated high impact and clear of governance warnings."
                />
              ) : (
                <div className="space-y-3">
                  {recognition.challengeEntries.map((entry) => (
                    <div
                      key={entry.submission.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border p-4"
                      data-testid={`challenge-entry-${entry.submission.id}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{entry.submission.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {entry.person?.name ?? "Team member"} · {entry.submission.hoursSavedPerMonth} hours saved
                          per month · AED {entry.submission.estimatedValueAed.toLocaleString()} estimated value
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <ReportPill tone="good">{entry.submission.governanceStatus}</ReportPill>
                        <ReportPill tone="muted">{SUBMISSION_STATE_LABEL[entry.submission.state]}</ReportPill>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    {recognition.challengeEntries.length} of {CHALLENGE_ENTRY_LIMIT} entry slots used by your team.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

        <p className="text-xs text-muted-foreground">
          Recognition is derived from the same credential register, project records and entity roll-up as the learner,
          entity and leadership views — {manager?.name ?? "the department manager"}'s team, {ministry.name}.
        </p>
      </PageEnter>
    </Layout>
  );
}
