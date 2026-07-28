import { useEffect } from "react";
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
} from "lucide-react";
import { COMPETENCIES, COMPETENCY_BY_ID, COURSE_BY_ID } from "@/lib/learningData";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";

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

export default function AssessmentReport() {
  const [, setLocation] = useLocation();
  const { result, resetAssessment, getCoursePercent } = useLearnerProgress();

  // The report has no meaning without a completed assessment.
  useEffect(() => {
    if (!result) setLocation("/learner/assessment");
  }, [result, setLocation]);

  if (!result) return null;

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
                AI Skills Advisor Report
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

          <div className="space-y-6">
            <Card className="border-card-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">What you already do well</h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {result.strengths.map((id) => (
                    <li key={id} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{COMPETENCY_BY_ID[id].label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Scored {result.scores[id]}% — above your personal average.
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Where to focus next</h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {result.gaps.map((id, i) => (
                    <li key={id} className="flex items-start gap-2.5">
                      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{COMPETENCY_BY_ID[id].label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Scored {result.scores[id]}% — addressed by your recommended courses.
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommended courses */}
        <div className="mt-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-foreground">Your recommended courses</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Selected for your role, seniority and the gaps above. Completing these feeds directly into your
                Personalised Development Mission.
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {recommended.length} courses · matched to your profile
            </Badge>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>

        {/* Footer actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-card-border bg-card p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Ready to begin?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your Development Mission has been rebuilt around this report.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={handleRetake} data-testid="button-retake">
              <RotateCcw className="h-4 w-4 mr-2" /> Retake assessment
            </Button>
            <Button variant="outline" onClick={() => setLocation("/learner")} data-testid="button-dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <Button onClick={() => setLocation("/learner/mission")} data-testid="button-mission">
              View Development Mission <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
