import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Clock,
  ListChecks,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  FileBarChart,
  BookOpen,
} from "lucide-react";
import { ASSESSMENT_QUESTIONS, COMPETENCY_BY_ID, COURSE_BY_ID } from "@/lib/learningData";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";

const BASE = import.meta.env.BASE_URL;

/**
 * Entry point to the baseline assessment on the learner dashboard.
 * Switches to a results summary once the assessment has been completed.
 */
export function BaselineAssessmentCard() {
  const [, setLocation] = useLocation();
  const { result, resetAssessment, getCoursePercent } = useLearnerProgress();

  if (!result) {
    return (
      <Card className="overflow-hidden border-card-border" data-testid="card-baseline-assessment">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            <div className="relative md:w-64 lg:w-72 shrink-0 h-44 md:h-auto overflow-hidden bg-muted">
              <img
                src={`${BASE}brand/learning/assessment-hero.jpg`}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/45 to-transparent" />
            </div>

            <div className="flex-1 p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full">Step 1 of your journey</Badge>
                <Badge variant="outline" className="rounded-full">
                  Not started
                </Badge>
              </div>

              <h2 className="mt-3 text-xl font-bold text-foreground leading-snug">
                Take your AI capability baseline
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Eight scenario questions drawn from real federal work. The AI Skills Advisor scores you against
                the five FAHR AI competencies and builds a personalised course pathway from the result.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> About 4 minutes
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" /> {ASSESSMENT_QUESTIONS.length} questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> No wrong answers
                </span>
              </div>

              <Button
                className="mt-6"
                size="lg"
                onClick={() => setLocation("/learner/assessment")}
                data-testid="button-start-assessment"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Start baseline assessment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topGap = COMPETENCY_BY_ID[result.gaps[0]];
  const courses = result.recommendedCourseIds.map((id) => COURSE_BY_ID[id]).filter(Boolean);

  return (
    <Card className="overflow-hidden border-card-border" data-testid="card-baseline-assessment">
      <CardContent className="p-6 md:p-7">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex items-center gap-5 shrink-0">
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" strokeWidth="12" className="stroke-muted" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="stroke-primary"
                  strokeDasharray={2 * Math.PI * 52}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - result.overall / 100) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">{result.overall}%</span>
              </div>
            </div>
            <div className="lg:hidden">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Your level</p>
              <p className="text-base font-bold text-primary">{result.levelLabel}</p>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full">Baseline complete</Badge>
              <span className="text-xs text-muted-foreground">{result.completedOn}</span>
            </div>
            <h2 className="mt-2.5 text-xl font-bold text-foreground leading-snug">
              <span className="hidden lg:inline">{result.levelLabel} — </span>
              your pathway is ready
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {result.levelBlurb} Your priority focus is{" "}
              <span className="text-foreground font-medium">{topGap.label}</span>, and{" "}
              {courses.length} courses have been matched to your profile.
            </p>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {courses.map((course) => {
                const percent = getCoursePercent(course.id);
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setLocation(`/learner/course/${course.id}`)}
                    data-testid={`chip-course-${course.id}`}
                    className="text-left rounded-xl border border-card-border p-3 hover:border-primary/40 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                          {course.title}
                        </p>
                        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{percent}% complete</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                onClick={() => setLocation("/learner/assessment/report")}
                data-testid="button-view-report"
              >
                <FileBarChart className="h-4 w-4 mr-2" /> View my full report
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  resetAssessment();
                  setLocation("/learner/assessment");
                }}
                data-testid="button-retake-assessment"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Retake
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
