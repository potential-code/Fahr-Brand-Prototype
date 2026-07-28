import { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  RotateCcw,
  Clock,
  Layers,
  BookOpen,
  CheckCircle2,
  Dumbbell,
  MessagesSquare,
  CalendarCheck,
  FileText,
  CalendarDays,
  Briefcase,
  MapPin,
  Quote,
} from "lucide-react";
import { COMPETENCIES, COMPETENCY_BY_ID, COURSE_BY_ID } from "@/lib/learningData";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { buildRecommendations } from "@/lib/recommendations";
import { AGENTS } from "@/lib/constants";

const BASE = import.meta.env.BASE_URL;

const SECTIONS = [
  { id: "priorities", label: "Priorities" },
  { id: "courses", label: "Courses" },
  { id: "practice", label: "Practice" },
  { id: "coaching", label: "Coaching" },
  { id: "resources", label: "Resources" },
];

function ScoreRing({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-white/15" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white leading-none">{value}%</span>
        <span className="text-[10px] uppercase tracking-wider text-white/60 mt-1">Readiness</span>
      </div>
    </div>
  );
}

function CompetencyBar({ id, score, delay }: { id: string; score: number; delay: number }) {
  const competency = COMPETENCY_BY_ID[id];
  return (
    <div data-testid={`bar-competency-${id}`}>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="text-sm font-medium text-foreground">{competency.label}</span>
        <span className="text-sm font-semibold text-primary tabular-nums">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, delay, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{competency.description}</p>
    </div>
  );
}

/** One consistently-styled band of the report, attributed to the agent that produced it. */
function ReportSection({
  id,
  agent,
  title,
  description,
  aside,
  children,
}: {
  id: string;
  agent: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-24" data-testid={`section-${id}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{agent}</p>
          <h2 className="mt-1.5 text-xl font-bold text-foreground">{title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function AssessmentReport() {
  const [, setLocation] = useLocation();
  const { result, answers, resetAssessment, getCoursePercent } = useLearnerProgress();

  // The report has no meaning without a completed assessment.
  useEffect(() => {
    if (!result) setLocation("/learner/assessment");
  }, [result, setLocation]);

  const plan = useMemo(
    () => (result ? buildRecommendations(result, answers) : null),
    [result, answers],
  );

  if (!result || !plan) return null;

  const topStrength = COMPETENCY_BY_ID[result.strengths[0]];
  const topGap = COMPETENCY_BY_ID[result.gaps[0]];
  const recommended = result.recommendedCourseIds.map((id) => COURSE_BY_ID[id]).filter(Boolean);

  const handleRetake = () => {
    resetAssessment();
    setLocation("/learner/assessment");
  };

  return (
    <Layout role="learner">
      <div className="w-full max-w-5xl mx-auto">
        <Link
          href="/learner"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-testid="link-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-5 relative overflow-hidden rounded-2xl bg-[#171310]"
        >
          <img
            src={`${BASE}brand/learning/assessment-hero.jpg`}
            alt=""
            aria-hidden="true"
            className="absolute inset-y-0 right-0 h-full w-1/2 object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171310] via-[#171310]/95 to-[#171310]/40" />

          <div className="relative p-6 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                {AGENTS.advisor} Report
              </span>
            </div>

            <div className="mt-5 flex flex-col md:flex-row md:items-center gap-7">
              <ScoreRing value={result.overall} />
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  You are at{" "}
                  <span className="text-primary">{result.levelLabel}</span> on the federal AI capability ladder
                </h1>
                <p className="mt-3 text-sm md:text-base text-white/70 leading-relaxed max-w-2xl">
                  {result.levelBlurb} Your strongest area is{" "}
                  <span className="text-white font-medium">{topStrength.label}</span>. The fastest gain available
                  to you is in <span className="text-white font-medium">{topGap.label}</span>, which is why your
                  pathway below opens there.
                </p>
                <p className="mt-4 text-xs text-white/45">
                  Completed {result.completedOn} · Benchmarked against 41,850 active federal learners
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* In-report navigation */}
        <nav
          aria-label="Report sections"
          className="mt-5 flex flex-wrap items-center gap-2"
          data-testid="nav-report-sections"
        >
          <span className="text-xs font-medium text-muted-foreground me-1">In this report:</span>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-card-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Breakdown */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border-card-border">
            <CardContent className="p-6 md:p-7">
              <h2 className="text-base font-semibold text-foreground">Capability breakdown</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your answers scored against the five FAHR AI competencies.
              </p>
              <div className="mt-6 space-y-5">
                {COMPETENCIES.map((c, i) => (
                  <CompetencyBar key={c.id} id={c.id} score={result.scores[c.id]} delay={0.1 * i} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">What you already do well</h2>
              </div>
              <ul className="mt-4 space-y-4">
                {result.strengths.map((id, i) => (
                  <li key={id} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{COMPETENCY_BY_ID[id].label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Scored {result.scores[id]}% — above your personal average
                        {i === 0
                          ? ", and the basis for the mentoring session in your coaching plan."
                          : ", so it needs consolidation rather than new instruction."}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* 1. Development priorities */}
        <ReportSection
          id="priorities"
          agent={AGENTS.advisor}
          title="Your development priorities"
          description="The three FAHR competencies where movement will change your capability level fastest, ranked by the size of the gain available."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {plan.priorities.map((p, i) => (
              <motion.div
                key={p.competency.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 * i }}
              >
                <Card
                  className="h-full border-card-border"
                  data-testid={`card-priority-${p.competency.id}`}
                >
                  <CardContent className="p-5 h-full flex flex-col">
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {p.rank}
                      </span>
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {p.competency.label}
                      </p>
                    </div>

                    <p className="mt-3 text-sm text-foreground font-medium leading-snug">{p.headline}</p>

                    <div className="mt-4">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground">Now {p.score}%</span>
                        <span className="text-primary font-semibold">Target {p.target}%</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden relative">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
                          style={{ width: `${p.target}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary"
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                    </div>

                    {p.evidence && (
                      <div className="mt-4 rounded-lg bg-muted/60 p-3 flex items-start gap-2">
                        <Quote className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{p.evidence}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ReportSection>

        {/* 2. Recommended courses */}
        <ReportSection
          id="courses"
          agent={AGENTS.content}
          title="Your recommended courses"
          description="Selected for your role, seniority and the priorities above. Completing these feeds directly into your Personalised Learning Pathway."
          aside={
            <Badge variant="secondary" className="rounded-full">
              {recommended.length} courses · matched to your profile
            </Badge>
          }
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((course, i) => {
              const percent = getCoursePercent(course.id);
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                >
                  <Card className="h-full flex flex-col overflow-hidden border-card-border hover:shadow-lg transition-shadow">
                    <div className="relative h-40 shrink-0 overflow-hidden bg-muted">
                      <img
                        src={`${BASE}${course.image}`}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <Badge className="absolute top-3 left-3 rounded-full bg-white text-foreground hover:bg-white">
                        {course.category}
                      </Badge>
                      {i === 0 && (
                        <Badge className="absolute top-3 right-3 rounded-full">Start here</Badge>
                      )}
                    </div>

                    <CardContent className="flex-1 flex flex-col p-5">
                      <h3 className="text-base font-semibold text-foreground leading-snug">{course.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                        {course.summary}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {course.duration}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" /> {course.moduleCount} modules
                        </span>
                      </div>

                      {percent > 0 && (
                        <div className="mt-3">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">{percent}% complete</p>
                        </div>
                      )}

                      <Button
                        className="mt-5 w-full"
                        onClick={() => setLocation(`/learner/course/${course.id}`)}
                        data-testid={`button-start-course-${course.id}`}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        {percent > 0 ? "Continue course" : "Start course"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ReportSection>

        {/* 3. Practice and application */}
        <ReportSection
          id="practice"
          agent={AGENTS.practice}
          title="Practice and workplace application"
          description="Short scenario exercises that rehearse each priority in a federal context, plus the workplace project that turns the learning into a delivered outcome."
        >
          <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <div className="space-y-4">
              {plan.practice.map((a) => (
                <Card
                  key={a.competency.id}
                  className="border-card-border"
                  data-testid={`card-practice-${a.competency.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="h-9 w-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="h-4.5 w-4.5 text-primary" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground leading-snug">{a.title}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{a.scenario}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="rounded-full text-xs">
                            {a.competency.short}
                          </Badge>
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> {a.duration}
                          </span>
                          <span className="text-xs text-muted-foreground">{a.format}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-primary/30 bg-primary/[0.03]" data-testid="card-workplace-project">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Suggested workplace project
                  </p>
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground leading-snug">
                  {plan.project.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{plan.project.brief}</p>

                <div className="mt-4 rounded-lg border border-card-border bg-card p-3.5">
                  <p className="text-xs font-semibold text-foreground">Evidence you will produce</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {plan.project.outcome}
                  </p>
                </div>

                <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                  Chosen because {plan.project.competency.label} is your first priority. Your line manager signs
                  off the result.
                </p>

                <Button
                  variant="outline"
                  className="mt-auto w-full"
                  onClick={() => setLocation("/learner/lab/project")}
                  data-testid="button-open-project"
                >
                  Open in the Agentic AI Lab <ArrowRight className="h-4 w-4 ms-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </ReportSection>

        {/* 4. Coaching and checkpoints */}
        <ReportSection
          id="coaching"
          agent={AGENTS.coach}
          title="Coaching plan and next checkpoint"
          description="Contextual coaching paced to your capability level, and the targeted re-assessment that confirms the gaps have actually closed."
        >
          <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            <Card className="border-card-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <MessagesSquare className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Your coaching sessions</h3>
                </div>

                <ol className="mt-5 relative space-y-6">
                  {plan.coaching.map((s, i) => (
                    <li key={s.id} className="flex gap-4" data-testid={`row-coaching-${s.id}`}>
                      <div className="flex flex-col items-center">
                        <span className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        {i < plan.coaching.length - 1 && <span className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground leading-snug">{s.focus}</p>
                          <Badge
                            variant={s.kind === "strength" ? "outline" : "secondary"}
                            className="rounded-full text-xs"
                          >
                            {s.competency.short}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.detail}</p>
                        <p className="mt-2 text-xs font-medium text-primary">{s.when}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <Button
                  variant="outline"
                  className="mt-6 w-full sm:w-auto"
                  onClick={() => setLocation("/learner/agent")}
                  data-testid="button-open-coach"
                >
                  Talk to the {AGENTS.coach} <ArrowRight className="h-4 w-4 ms-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-card-border" data-testid="card-next-assessment">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Next targeted assessment</h3>
                </div>

                <p className="mt-4 text-2xl font-bold text-foreground leading-none">
                  {plan.nextAssessment.weeks} weeks
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Scheduled for {plan.nextAssessment.dueLabel}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {plan.nextAssessment.competencies.map((c) => (
                    <Badge key={c.id} variant="secondary" className="rounded-full text-xs">
                      {c.short}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 rounded-lg bg-muted/60 p-3.5">
                  <p className="text-xs font-semibold text-foreground">
                    {plan.nextAssessment.questionCount} scenario questions
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {plan.nextAssessment.note}
                  </p>
                </div>

                <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                  Your Capability Profile updates automatically when the re-check is scored.
                </p>
              </CardContent>
            </Card>
          </div>
        </ReportSection>

        {/* 5. Resources and events */}
        <ReportSection
          id="resources"
          agent={AGENTS.concierge}
          title="Just-in-time resources and live sessions"
          description="Short reads to reach for in the moment of need, and the upcoming federal sessions that match your priorities."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-card-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Knowledge articles and references</h3>
                </div>
                <ul className="mt-4 divide-y divide-border">
                  {plan.resources.map((r) => (
                    <li key={r.title} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">{r.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.summary}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{r.kind}</span>
                            <span>·</span>
                            <span>{r.readTime}</span>
                            <span>·</span>
                            <span className="text-primary font-medium">{r.competency.short}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Upcoming live sessions</h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {plan.events.map((e) => (
                    <li
                      key={e.title}
                      className="rounded-xl border border-card-border p-3.5"
                      data-testid={`row-event-${e.competency.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-foreground leading-snug">{e.title}</p>
                        <Badge variant="secondary" className="rounded-full text-xs shrink-0">
                          {e.competency.short}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" /> {e.dateLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> {e.format}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {e.host} · {e.seatsNote}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </ReportSection>

        {/* Footer actions */}
        <div className="mt-12 rounded-2xl border border-card-border bg-card p-6 md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5 max-w-xl">
              <span className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-base font-semibold text-foreground">Ready to begin?</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Your Personalised Learning Pathway has been rebuilt around this report — courses, practice,
                  coaching and your workplace project are already sequenced for you.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:shrink-0">
              <Button
                size="lg"
                onClick={() => setLocation("/learner/mission")}
                data-testid="button-mission"
                className="sm:order-3"
              >
                View Learning Pathway <ArrowRight className="h-4 w-4 ms-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/learner")}
                data-testid="button-dashboard"
                className="sm:order-2"
              >
                <ArrowLeft className="h-4 w-4 me-2" /> Dashboard
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={handleRetake}
                data-testid="button-retake"
                className="sm:order-1 text-muted-foreground"
              >
                <RotateCcw className="h-4 w-4 me-2" /> Retake
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
