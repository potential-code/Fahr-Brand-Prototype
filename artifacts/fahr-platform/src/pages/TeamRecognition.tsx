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
  BAND_LABEL,
  PRACTITIONER_THRESHOLD,
  teamBenchmark,
  teamCompetencyMatrix,
  teamCompetencyRecognition,
  teamRecognition,
  teamRoster,
} from "@/lib/manager/selectors";

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

  // Recognition arranged by competency rather than by person: which AI
  // capabilities the team is certified in, and where the holes are.
  const byCompetency = useMemo(
    () => teamCompetencyRecognition({ matrix, credentials: recognition.credentials, teamSubmissions }),
    [matrix, recognition.credentials, teamSubmissions],
  );

  const { impact } = recognition;

  return (
    <Layout role="manager">
      <PageEnter className="mx-auto w-full max-w-7xl space-y-6 pb-12">
        <RecognitionBand
          testId="band-team-recognition"
          eyebrow="Verified team record"
          title="Team Recognition & Impact"
          description="The credentials and badges your team has earned, arranged by AI competency, and where it stands on the federal capability ladder."
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
          <Card data-testid="card-competency-recognition">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="h-5 w-5 text-primary" /> Credentials &amp; badges by AI competency
              </CardTitle>
              <CardDescription>
                The team&apos;s verified record arranged by the five framework competencies rather than by person —
                which AI capabilities your {team.length} {team.length === 1 ? "report is" : "reports are"} certified
                in, and where the holes are. A badge is held at Practitioner ({PRACTITIONER_THRESHOLD}+), the same
                threshold a learner&apos;s own Recognition page uses. Credentials are attributed through the
                validated Workplace Project that earned them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.length === 0 ? (
                <SurfaceEmpty
                  title="No direct reports yet"
                  message="Competency coverage appears once your team is enrolled."
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <ReportPill tone={byCompetency.badgesHeld > 0 ? "good" : "muted"}>
                      {byCompetency.badgesHeld} of {byCompetency.badgesPossible} badges held
                    </ReportPill>
                    <span data-testid="text-competency-coverage">
                      across {byCompetency.rows.length} competencies and {team.length}{" "}
                      {team.length === 1 ? "person" : "people"}
                    </span>
                  </div>

                  <Stagger className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {byCompetency.rows.map((row) => {
                      const covered = row.badged.length > 0;
                      return (
                        <StaggerItem as="div" key={row.competency.id}>
                          <RecognitionItemCard
                            state={covered ? "earned" : "empty"}
                            data-testid={`competency-recognition-${row.competency.id}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold ${covered ? "text-white" : "text-foreground"}`}>
                                  {row.competency.label}
                                </p>
                                <p className={`mt-0.5 text-xs ${covered ? "text-white/60" : "text-muted-foreground"}`}>
                                  Team average {row.average} · {BAND_LABEL[row.band]}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                                  covered
                                    ? "border-primary/40 bg-primary/15 text-primary"
                                    : "border-border bg-muted text-muted-foreground"
                                }`}
                                data-testid={`competency-badged-${row.competency.id}`}
                              >
                                {row.badged.length} of {row.teamSize} badged
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div>
                                <p
                                  className={`text-[11px] font-medium uppercase tracking-wider ${
                                    covered ? "text-white/45" : "text-muted-foreground"
                                  }`}
                                >
                                  Badge held by
                                </p>
                                <p className={`mt-0.5 text-xs ${covered ? "text-white/70" : "text-muted-foreground"}`}>
                                  {row.badged.length > 0
                                    ? row.badged
                                        .map((h) => h.person.name.split(" ")[0])
                                        .join(", ")
                                    : `Nobody yet — the closest is ${
                                        row.developing[0]?.person.name.split(" ")[0] ?? "—"
                                      } at ${row.developing[0]?.score ?? 0}.`}
                                </p>
                              </div>

                              <div>
                                <p
                                  className={`text-[11px] font-medium uppercase tracking-wider ${
                                    covered ? "text-white/45" : "text-muted-foreground"
                                  }`}
                                >
                                  Credentials
                                </p>
                                {row.credentials.length === 0 ? (
                                  <p
                                    className={`mt-0.5 text-xs ${covered ? "text-white/60" : "text-muted-foreground"}`}
                                  >
                                    None issued against this competency yet.
                                  </p>
                                ) : (
                                  <ul className="mt-0.5 space-y-1">
                                    {row.credentials.map(({ credential, person }) => (
                                      <li
                                        key={credential.id}
                                        className={`text-xs ${covered ? "text-white/70" : "text-muted-foreground"}`}
                                        data-testid={`competency-credential-${row.competency.id}-${credential.id}`}
                                      >
                                        <span className={covered ? "text-white" : "text-foreground"}>
                                          {credential.title}
                                        </span>{" "}
                                        · {person?.name ?? credential.personName} ·{" "}
                                        <span className="font-mono text-[10px]">{credential.verificationCode}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {row.developing.length > 0 && (
                                <p
                                  className={`text-[11px] ${covered ? "text-white/45" : "text-muted-foreground"}`}
                                  data-testid={`competency-developing-${row.competency.id}`}
                                >
                                  Still building:{" "}
                                  {row.developing.map((h) => h.person.name.split(" ")[0]).join(", ")}
                                </p>
                              )}
                            </div>
                          </RecognitionItemCard>
                        </StaggerItem>
                      );
                    })}
                  </Stagger>

                  {byCompetency.unmappedCredentials.length > 0 && (
                    <p className="text-xs text-muted-foreground" data-testid="text-unmapped-credentials">
                      Also on the register, without a linked project to attribute them to a competency:{" "}
                      {byCompetency.unmappedCredentials
                        .map(({ credential, person }) => `${credential.title} (${person?.name ?? credential.personName})`)
                        .join(", ")}
                      .
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </ScrollReveal>

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

        <p className="text-xs text-muted-foreground">
          Recognition is derived from the same credential register, project records and entity roll-up as the learner,
          entity and leadership views — {manager?.name ?? "the department manager"}'s team, {ministry.name}.
        </p>
      </PageEnter>
    </Layout>
  );
}
