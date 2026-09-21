import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  PenLine,
  Lock,
  Award,
  Sparkles,
  Target,
  ClipboardCheck,
  RotateCcw,
} from "lucide-react";
import {
  COURSE_BY_ID,
  COMPETENCY_BY_ID,
  courseLessons,
  type Lesson,
} from "@/lib/learningData";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { CoachDock } from "@/components/coach/CoachDock";
import { StepQuiz } from "@/components/learning/StepQuiz";
import { AGENTS } from "@/lib/constants";
import type { CoachContext } from "@/lib/coach";

const BASE = import.meta.env.BASE_URL;

const LESSON_ICON = {
  reading: FileText,
  video: PlayCircle,
  activity: PenLine,
} as const;

type ActiveItem = { kind: "pretest" } | { kind: "lesson"; id: string } | { kind: "final" };

function LessonBody({
  lesson,
  done,
  onToggle,
  onNext,
  hasNext,
}: {
  lesson: Lesson;
  done: boolean;
  onToggle: () => void;
  onNext: () => void;
  hasNext: boolean;
}) {
  const Icon = LESSON_ICON[lesson.type];
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="capitalize">{lesson.type}</span>
        <span>·</span>
        <span>{lesson.duration}</span>
      </div>
      <h2 className="mt-2 text-xl md:text-2xl font-bold text-foreground">{lesson.title}</h2>

      {lesson.type === "video" && (
        <div className="mt-5 relative aspect-video rounded-xl bg-[#171310] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(184,146,84,0.28),transparent_65%)]" />
          <div className="relative flex flex-col items-center">
            <span className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <PlayCircle className="h-8 w-8 text-primary-foreground" />
            </span>
            <p className="mt-3 text-sm text-white/70">{lesson.duration} session</p>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {lesson.body.map((para, i) => (
          <p key={i} className="text-sm md:text-[15px] leading-relaxed text-muted-foreground">
            {para}
          </p>
        ))}
      </div>

      {lesson.points && (
        <div className="mt-6 rounded-xl border border-card-border bg-muted/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Key points</p>
          <ul className="mt-3 space-y-2">
            {lesson.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-7 flex flex-wrap gap-2">
        <Button variant={done ? "outline" : "default"} onClick={onToggle} data-testid="button-toggle-lesson">
          {done ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2" /> Mark as not complete
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" /> Mark as complete
            </>
          )}
        </Button>
        {hasNext && (
          <Button variant="ghost" onClick={onNext} data-testid="button-next-lesson">
            Next lesson <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function CoursePlayer() {
  const [, params] = useRoute("/learner/course/:courseId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    result,
    getCourseProgress,
    getCoursePercent,
    toggleLessonComplete,
    setPretestDone,
    setFinalDone,
  } = useLearnerProgress();

  const course = params?.courseId ? COURSE_BY_ID[params.courseId] : undefined;
  const progress = course ? getCourseProgress(course.id) : undefined;

  const lessons = useMemo(() => (course ? courseLessons(course) : []), [course]);

  const initialItem = useCallback((): ActiveItem => {
    if (!course) return { kind: "pretest" };
    const p = getCourseProgress(course.id);
    if (!p.pretestDone) return { kind: "pretest" };
    const next = courseLessons(course).find((l) => !p.completedLessonIds.includes(l.id));
    return next ? { kind: "lesson", id: next.id } : { kind: "final" };
  }, [course, getCourseProgress]);

  const [active, setActive] = useState<ActiveItem>(initialItem);
  const [coachOpen, setCoachOpen] = useState(false);

  // The coach always answers about whatever step is open.
  const coachContext = useMemo<CoachContext>(() => {
    const lesson = active.kind === "lesson" ? lessons.find((l) => l.id === active.id) : undefined;
    const subject =
      active.kind === "pretest"
        ? course?.pretest.title ?? "this knowledge check"
        : active.kind === "final"
          ? course?.finalAssessment.title ?? "this assessment"
          : lesson?.title ?? course?.title ?? "this course";
    return {
      subject,
      competency: course ? COMPETENCY_BY_ID[course.competencyId] : undefined,
      detail: lesson ? `${lesson.type} · ${lesson.duration}` : undefined,
    };
  }, [active, course, lessons]);

  // Reset the open step when the learner navigates to a different course
  // without unmounting this component (e.g. from the report or the mission).
  const shownCourseId = useRef(course?.id);
  useEffect(() => {
    if (shownCourseId.current !== course?.id) {
      shownCourseId.current = course?.id;
      setActive(initialItem());
    }
  }, [course?.id, initialItem]);

  if (!course || !progress) {
    return (
      <Layout role="learner">
        <div className="max-w-md mx-auto text-center py-20">
          <h1 className="text-xl font-bold text-foreground">Course not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This course is not part of your current pathway.
          </p>
          <Button className="mt-6" onClick={() => setLocation("/learner")}>
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  const percent = getCoursePercent(course.id);
  const lessonsDone = progress.completedLessonIds.length;
  const allLessonsDone = lessonsDone === lessons.length;
  const backHref = result ? "/learner/assessment/report" : "/learner";
  const backLabel = result ? "Back to my report" : "Back to Dashboard";

  const goToNextLesson = (currentId: string) => {
    const idx = lessons.findIndex((l) => l.id === currentId);
    const next = lessons[idx + 1];
    if (next) setActive({ kind: "lesson", id: next.id });
    else setActive({ kind: "final" });
  };

  const outlineItem = (
    key: string,
    label: string,
    meta: string,
    icon: React.ReactNode,
    isActive: boolean,
    isDone: boolean,
    onClick: () => void,
    locked = false,
  ) => (
    <button
      key={key}
      type="button"
      onClick={locked ? undefined : onClick}
      disabled={locked}
      data-testid={`outline-${key}`}
      className={`w-full text-left rounded-lg px-3 py-2.5 flex items-start gap-3 transition-colors ${
        isActive ? "bg-primary/10 border border-primary/30" : "border border-transparent hover:bg-muted"
      } ${locked ? "opacity-55 cursor-not-allowed" : ""}`}
    >
      <span
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-full flex items-center justify-center ${
          isDone ? "bg-primary" : "bg-muted border border-border"
        }`}
      >
        {isDone ? (
          <Check className="h-3 w-3 text-primary-foreground" />
        ) : locked ? (
          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
        ) : (
          icon
        )}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm leading-snug ${isActive ? "font-semibold text-foreground" : "text-foreground"}`}>
          {label}
        </span>
        <span className="block text-xs text-muted-foreground mt-0.5">{meta}</span>
      </span>
    </button>
  );

  return (
    <Layout role="learner">
      <div className="w-full max-w-6xl mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          data-testid="link-back"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>

        {/* Course hero */}
        <div className="mt-5 relative overflow-hidden rounded-2xl bg-[#171310]">
          <img
            src={`${BASE}${course.image}`}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#171310] via-[#171310]/90 to-[#171310]/30" />
          <div className="relative p-6 md:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-white text-foreground hover:bg-white">{course.category}</Badge>
              <Badge variant="outline" className="rounded-full border-white/30 text-white/80">
                {COMPETENCY_BY_ID[course.competencyId]?.short}
              </Badge>
            </div>
            <h1 className="mt-4 text-2xl md:text-3xl font-bold text-white max-w-2xl leading-tight">
              {course.title}
            </h1>
            <p className="mt-3 text-sm md:text-base text-white/70 max-w-2xl leading-relaxed">
              {course.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {course.duration} · {course.hours}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> {course.moduleCount} modules
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Counts towards your Learning Pathway
              </span>
            </div>

            {/* Progress lives on the hero so it is the first thing the learner sees */}
            <div className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-4">
              <div className="min-w-[15rem] flex-1 max-w-md">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Your progress</p>
                  <span className="text-sm font-bold tabular-nums text-white">{percent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/60">
                  {lessonsDone} of {lessons.length} lessons complete
                  {progress.finalDone ? " · final assessment passed" : ""}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setCoachOpen(true)}
                data-testid="button-open-coach-hero"
              >
                <Bot className="me-2 h-4 w-4" /> Ask the {AGENTS.learning}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr] items-start">
          {/* Outline */}
          <div className="space-y-5 lg:sticky lg:top-20">
            <Card className="border-card-border">
              <CardContent className="p-4">
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Course outline
                </p>

                <div className="space-y-1">
                  {outlineItem(
                    "pretest",
                    course.pretest.title,
                    "Knowledge check · 4 questions",
                    <ClipboardCheck className="h-2.5 w-2.5 text-muted-foreground" />,
                    active.kind === "pretest",
                    progress.pretestDone,
                    () => setActive({ kind: "pretest" }),
                  )}
                </div>

                {course.groups.map((group) => (
                  <div key={group.id} className="mt-4">
                    <p className="px-3 pb-1.5 text-xs font-semibold text-foreground">{group.title}</p>
                    <p className="px-3 pb-2 text-[11px] text-muted-foreground">{group.caption}</p>
                    <div className="space-y-1">
                      {group.lessons.map((lesson) => {
                        const Icon = LESSON_ICON[lesson.type];
                        return outlineItem(
                          lesson.id,
                          lesson.title,
                          `${lesson.type} · ${lesson.duration}`,
                          <Icon className="h-2.5 w-2.5 text-muted-foreground" />,
                          active.kind === "lesson" && active.id === lesson.id,
                          progress.completedLessonIds.includes(lesson.id),
                          () => setActive({ kind: "lesson", id: lesson.id }),
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="mt-4 pt-3 border-t border-border space-y-1">
                  {outlineItem(
                    "final",
                    course.finalAssessment.title,
                    allLessonsDone ? "3 questions · unlocks certificate" : "Complete all lessons to unlock",
                    <Award className="h-2.5 w-2.5 text-muted-foreground" />,
                    active.kind === "final",
                    progress.finalDone,
                    () => setActive({ kind: "final" }),
                    !allLessonsDone,
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <Card className="border-card-border">
            <CardContent className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.kind === "lesson" ? active.id : active.kind}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  {active.kind === "pretest" && (
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                          Adaptive knowledge check
                        </span>
                      </div>
                      <h2 className="mt-3 text-xl md:text-2xl font-bold text-foreground">
                        {course.pretest.title}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        {course.pretest.intro}
                      </p>
                      <div className="mt-7">
                        <StepQuiz
                          questions={course.pretest.questions}
                          passMark={0}
                          submitLabel="Start the lessons"
                          passNote="Your answers set the depth of each lesson that follows."
                          onPass={(correct) => {
                            setPretestDone(course.id);
                            toast({
                              title: "Course adapted to you",
                              description: `You scored ${correct} of ${course.pretest.questions.length}. Lessons you already know have been shortened.`,
                            });
                            setActive({ kind: "lesson", id: lessons[0].id });
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {active.kind === "lesson" &&
                    (() => {
                      const lesson = lessons.find((l) => l.id === active.id);
                      if (!lesson) return null;
                      const idx = lessons.findIndex((l) => l.id === lesson.id);
                      return (
                        <LessonBody
                          lesson={lesson}
                          done={progress.completedLessonIds.includes(lesson.id)}
                          hasNext={idx < lessons.length - 1}
                          onToggle={() => {
                            const wasDone = progress.completedLessonIds.includes(lesson.id);
                            toggleLessonComplete(course.id, lesson.id);
                            if (!wasDone) goToNextLesson(lesson.id);
                          }}
                          onNext={() => goToNextLesson(lesson.id)}
                        />
                      );
                    })()}

                  {active.kind === "final" && (
                    <div>
                      {!allLessonsDone ? (
                        <div className="text-center py-10">
                          <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
                          <h2 className="mt-4 text-lg font-semibold text-foreground">
                            Final assessment locked
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Complete all {lessons.length} lessons to unlock the final assessment.
                          </p>
                        </div>
                      ) : progress.finalDone ? (
                        <div className="text-center py-8">
                          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Award className="h-8 w-8 text-primary" />
                          </div>
                          <h2 className="mt-5 text-xl md:text-2xl font-bold text-foreground">
                            Course complete
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                            Your verifiable credential for {course.title} has been issued and added to your
                            capability profile.
                          </p>
                          <div className="mt-7 flex flex-wrap justify-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setLocation("/learner/recognition")}
                              data-testid="button-view-credential"
                            >
                              <Award className="h-4 w-4 mr-2" /> View credential
                            </Button>
                            <Button
                              onClick={() => setLocation("/learner/mission")}
                              data-testid="button-continue-mission"
                            >
                              Continue your Learning Pathway <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h2 className="text-xl md:text-2xl font-bold text-foreground">
                            {course.finalAssessment.title}
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                            {course.finalAssessment.intro}
                          </p>
                          <div className="mt-7">
                            <StepQuiz
                              questions={course.finalAssessment.questions}
                              passMark={2}
                              submitLabel="Claim your credential"
                              passNote="Strong result. Your credential is ready to claim."
                              onPass={() => {
                                setFinalDone(course.id);
                                toast({
                                  title: "Credential issued",
                                  description: `${course.title} has been added to your capability profile.`,
                                });
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Outcomes strip */}
        <Card className="mt-6 border-card-border">
          <CardContent className="p-6">
            <p className="text-sm font-semibold text-foreground">What you will be able to do</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {course.outcomes.map((o, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{o}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <CoachDock context={coachContext} open={coachOpen} onOpenChange={setCoachOpen} />
    </Layout>
  );
}
