import { useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { ProfileHero, ProfileHeroEmpty } from "@/components/profile/ProfileHero";
import { CompetencyMap } from "@/components/profile/CompetencyMap";
import { GrowthChart } from "@/components/profile/GrowthChart";
import { AssessmentHistory, CapabilityLadderTrack } from "@/components/profile/HistoryAndLadder";
import { AdvisorSignalsPanel, AdvisorSignalsPreview } from "@/components/profile/AdvisorSignalsPanel";
import { AchievementsPanel } from "@/components/profile/AchievementsPanel";
import { NextCapabilities } from "@/components/profile/NextCapabilities";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { AGENTS, CAPABILITY_LEVELS, LEARNER_PROFILE } from "@/lib/constants";
import {
  buildProfileAnalysis,
  summariseParticipation,
  type AdvisorSignal,
} from "@/lib/profileAnalysis";
import { ArrowRight, Check, ClipboardList, Sparkles } from "lucide-react";

/** Four headline numbers pulled straight off the analysis. */
function ProfileStats({
  overall,
  competencyCount,
  lessonsCompleted,
  credentialsEarned,
}: {
  overall: number;
  competencyCount: number;
  lessonsCompleted: number;
  credentialsEarned: number;
}) {
  // Impact points deliberately live only in the achievements panel, so the
  // page never states the same number twice.
  const stats = [
    { id: "readiness", label: "AI readiness", value: overall, suffix: "%" },
    { id: "competencies", label: "Competencies tracked", value: competencyCount },
    { id: "lessons", label: "Lessons completed", value: lessonsCompleted },
    { id: "credentials", label: "Credentials earned", value: credentialsEarned },
  ];

  // Returns bare cards: the surrounding ScrollReveal owns the grid so it can
  // stagger each card in as a direct child.
  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.id} className="border-card-border" data-testid={`stat-${stat.id}`}>
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">
              <CountUp to={stat.value} suffix={stat.suffix} />
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/**
 * Pre-assessment placeholder for the measured sections, so the page still
 * explains itself instead of showing empty cards.
 */
function UnmeasuredCard() {
  return (
    <Card className="border-dashed border-primary/30 bg-primary/[0.03]" data-testid="card-unmeasured">
      <CardContent className="p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardList className="h-5 w-5 text-primary" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          Your competency map, growth trend and ladder position appear here
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          They are all generated from one baseline assessment. It takes about four minutes, there are no wrong
          answers, and the profile updates automatically every time you re-assess.
        </p>
        <Button asChild className="mt-5">
          <Link href="/learner/assessment" data-testid="button-take-assessment">
            Take the baseline assessment <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** The five-step ladder with nothing reached yet. */
function LadderPreview() {
  return (
    <Card className="border-card-border" data-testid="card-ladder-preview">
      <CardContent className="p-6">
        <h2 className="text-base font-semibold text-foreground">Federal capability ladder</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your baseline result places you on one of these five steps.
        </p>
        <ol className="mt-5 space-y-2.5">
          {CAPABILITY_LEVELS.map((step) => (
            <li
              key={step.id}
              className="flex items-start gap-3 rounded-xl border border-dashed border-border p-3"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                {step.order}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{step.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function CapabilityProfile() {
  const { result, courseProgress, getCoursePercent } = useLearnerProgress();

  const participation = useMemo(
    () => summariseParticipation(courseProgress, getCoursePercent),
    [courseProgress, getCoursePercent],
  );

  const analysis = useMemo(
    () => (result ? buildProfileAnalysis(result, participation, courseProgress) : null),
    [result, participation, courseProgress],
  );

  // ---- Not yet assessed --------------------------------------------------
  if (!analysis) {
    const knownSignals: AdvisorSignal[] = [
      {
        id: "role",
        label: "Job role",
        value: LEARNER_PROFILE.role,
        detail: `Content will be weighted toward ${LEARNER_PROFILE.department.toLowerCase()} work rather than generic examples.`,
        weight: "high",
      },
      {
        id: "entity",
        label: "Entity and department",
        value: LEARNER_PROFILE.entity,
        detail: `${LEARNER_PROFILE.department} — scenarios, datasets and events are drawn from this entity's context.`,
        weight: "medium",
      },
      {
        id: "participation",
        label: "Programme participation",
        value: `${participation.coursesStarted} of ${participation.courseCount} courses started`,
        detail: `${participation.lessonsCompleted} lessons completed so far, which sets the starting depth of your pathway.`,
        weight: participation.coursesStarted > 0 ? "medium" : "low",
      },
    ];

    return (
      <Layout role="learner">
        <div className="mx-auto w-full max-w-6xl space-y-6 pb-6">
          <ProfileHeroEmpty />
          <ScrollReveal>
            <UnmeasuredCard />
          </ScrollReveal>
          <ScrollReveal className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]" stagger={0.12}>
            <AdvisorSignalsPreview signals={knownSignals} />
            <LadderPreview />
          </ScrollReveal>
        </div>
      </Layout>
    );
  }

  // ---- Assessed ----------------------------------------------------------
  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-6">
        <ProfileHero analysis={analysis} />

        <ScrollReveal stagger={0.08} className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
          <ProfileStats
            overall={analysis.overall}
            competencyCount={analysis.standings.length}
            lessonsCompleted={participation.lessonsCompleted}
            credentialsEarned={analysis.credentials.filter((c) => c.state === "earned").length}
          />
        </ScrollReveal>

        {/* Headline read on the profile, above the detail */}
        <ScrollReveal>
          <Card className="border-card-border bg-gradient-to-r from-primary/[0.06] to-transparent">
            <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Headline read
              </span>
              {/* min-w forces the sentence onto its own line rather than into a
                  narrow column between the label and the badge at tablet width. */}
              <p className="min-w-[20rem] flex-1 text-sm leading-relaxed text-foreground/85">
                Strongest in{" "}
                <span className="font-semibold text-foreground">
                  {analysis.strongest.competency.label}
                </span>{" "}
                at {analysis.strongest.score}%. Widest gap in{" "}
                <span className="font-semibold text-foreground">{analysis.weakest.competency.label}</span> at{" "}
                {analysis.weakest.score}%.
              </p>
              <Badge variant="outline" className="shrink-0 rounded-full border-primary/40 text-primary">
                Updated {analysis.completedOn}
              </Badge>
            </CardContent>
          </Card>
        </ScrollReveal>

        <ScrollReveal className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]" stagger={0.12}>
          <CompetencyMap standings={analysis.standings} />
          <AdvisorSignalsPanel signals={analysis.signals} conclusion={analysis.conclusion} />
        </ScrollReveal>

        <ScrollReveal className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]" stagger={0.12}>
          <GrowthChart history={analysis.history} />
          <CapabilityLadderTrack level={analysis.level} progressToNext={analysis.progressToNext} />
        </ScrollReveal>

        <ScrollReveal className="grid items-start gap-6 lg:grid-cols-[1fr_1.2fr]" stagger={0.12}>
          <AssessmentHistory records={analysis.assessments} />
          <AchievementsPanel credentials={analysis.credentials} participation={participation} />
        </ScrollReveal>

        <ScrollReveal>
          <NextCapabilities items={analysis.nextCapabilities} />
        </ScrollReveal>

        {/* Where this profile is used next */}
        <ScrollReveal>
          <Card className="border-card-border" data-testid="card-profile-uses">
            <CardContent className="p-6">
              <h2 className="text-base font-semibold text-foreground">Where this profile is used</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The {AGENTS.advisor} republishes this record to every part of the programme that needs it.
              </p>
              <ul className="mt-4 grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(265px,1fr))]">
                {[
                  { label: "Your Personalised Learning Pathway", href: "/learner/mission" },
                  { label: "Workplace Project scoping", href: "/learner/lab/project" },
                  { label: "Assessment & Certification", href: "/learner/evaluation" },
                  { label: "Recognition & Impact", href: "/learner/recognition" },
                ].map((use) => (
                  <motion.li key={use.href} whileHover={{ x: 3 }}>
                    <Link
                      href={use.href}
                      className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
                    >
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate">{use.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </Layout>
  );
}
