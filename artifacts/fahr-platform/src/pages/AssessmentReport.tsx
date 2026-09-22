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
  Target,
  RotateCcw,
  Clock,
  Layers,
  BookOpen,
  Quote,
} from "lucide-react";
import { COMPETENCIES, COMPETENCY_BY_ID, COURSE_BY_ID } from "@/lib/learningData";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { buildRecommendations } from "@/lib/recommendations";
import { AGENTS } from "@/lib/constants";

const BASE = import.meta.env.BASE_URL;

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
        <span className="text-3xl font-bold leading-none text-white">{value}%</span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-white/60">Readiness</span>
      </div>
    </div>
  );
}

function CompetencyBar({ id, score, delay }: { id: string; score: number; delay: number }) {
  const competency = COMPETENCY_BY_ID[id];
  return (
    <div data-testid={`bar-competency-${id}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{competency.label}</span>
        <span className="text-sm font-semibold tabular-nums text-primary">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, delay, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{competency.description}</p>
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
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * The Capability Agent report. Deliberately short: where the learner stands,
 * what is strong, what is weak, the three priorities and the courses that close
 * them — then one action into the pathway. Practice, coaching and resources
 * live on the pathway and events screens, where the learner acts on them.
 */
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
      <div className="mx-auto w-full max-w-5xl pb-4">
        <Link
          href="/learner"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          data-testid="link-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* 1. Readiness score and capability level */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mt-5 overflow-hidden rounded-2xl bg-[#171310]"
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
                {AGENTS.capability} Report
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-7 md:flex-row md:items-center">
              <ScoreRing value={result.overall} />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl">
                  You are at <span className="text-primary">{result.levelLabel}</span> on the federal AI capability
                  ladder
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
                  {result.levelBlurb} Your strongest area is{" "}
                  <span className="font-medium text-white">{topStrength.label}</span>. The fastest gain available to
                  you is in <span className="font-medium text-white">{topGap.label}</span>, which is where your
                  pathway opens.
                </p>
                <p className="mt-4 text-xs text-white/45">
                  Completed {result.completedOn} · Benchmarked against 41,850 active federal learners
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. Capability breakdown across the five FAHR competencies */}
        <Card className="mt-6 border-card-border">
          <CardContent className="p-6 md:p-7">
            <h2 className="text-base font-semibold text-foreground">Capability breakdown</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your answers scored against the five FAHR AI competencies.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2 md:gap-x-8">
              {COMPETENCIES.map((c, i) => (
                <CompetencyBar key={c.id} id={c.id} score={result.scores[c.id]} delay={0.1 * i} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Development priorities */}
        <ReportSection
          id="priorities"
          agent={AGENTS.capability}
          title="Your top three development priorities"
          description="Where movement will change your capability level fastest, ranked by the size of the gain available."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {plan.priorities.map((p, i) => (
              <motion.div
                key={p.competency.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 * i }}
              >
                <Card className="h-full border-card-border" data-testid={`card-priority-${p.competency.id}`}>
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {p.rank}
                      </span>
                      <p className="text-sm font-semibold leading-tight text-foreground">{p.competency.label}</p>
                    </div>

                    <p className="mt-3 text-sm font-medium leading-snug text-foreground">{p.headline}</p>

                    <div className="mt-4">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-muted-foreground">Now {p.score}%</span>
                        <span className="font-semibold text-primary">Target {p.target}%</span>
                      </div>
                      <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
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
                      <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/60 p-3">
                        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <p className="text-xs leading-relaxed text-muted-foreground">{p.evidence}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ReportSection>

        {/* 5. Recommended courses */}
        <ReportSection
          id="courses"
          agent={AGENTS.content}
          title="Your recommended courses"
          description="Selected for your role, seniority and the priorities above, and already sequenced into your Personalised Learning Pathway."
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
                  <Card className="flex h-full flex-col overflow-hidden border-card-border transition-shadow hover:shadow-lg">
                    <div className="relative h-40 shrink-0 overflow-hidden bg-muted">
                      <img
                        src={`${BASE}${course.image}`}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <Badge className="absolute left-3 top-3 rounded-full bg-white text-foreground hover:bg-white">
                        {course.category}
                      </Badge>
                      {i === 0 && <Badge className="absolute right-3 top-3 rounded-full">Start here</Badge>}
                    </div>

                    <CardContent className="flex flex-1 flex-col p-5">
                      <h3 className="text-base font-semibold leading-snug text-foreground">{course.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{course.summary}</p>

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
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
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
                        <BookOpen className="me-2 h-4 w-4" />
                        {percent > 0 ? "Continue course" : "Start course"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ReportSection>

        {/* One way forward */}
        <div className="mt-10 rounded-2xl border border-card-border bg-card p-6 md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-xl items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-base font-semibold text-foreground">Continue to your pathway</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Your courses, practice assignments, live session, coaching plan and the re-check that closes these
                  gaps are already sequenced for you.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Button
                size="lg"
                variant="ghost"
                onClick={handleRetake}
                data-testid="button-retake"
                className="order-2 text-muted-foreground sm:order-1"
              >
                <RotateCcw className="me-2 h-4 w-4" /> Retake assessment
              </Button>
              <Button
                size="lg"
                onClick={() => setLocation("/learner/mission")}
                data-testid="button-mission"
                className="order-1 sm:order-2"
              >
                View my Learning Pathway <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
