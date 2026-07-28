import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PathwayCourseCard } from "@/components/pathway/PathwayCourseCard";
import { PathwayTimeline, type TimelineEntry } from "@/components/pathway/PathwayTimeline";
import { PathwayActivityDialog } from "@/components/pathway/PathwayActivityDialog";
import { AGENTS } from "@/lib/constants";
import { COURSE_BY_ID, type Course } from "@/lib/learningData";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { buildAdaptiveItem, buildPathway, derivePathwayStatuses, type PathwayItem } from "@/lib/pathway";
import { ArrowRight, ClipboardList, Route, Sparkles, Target } from "lucide-react";

export default function PersonalisedLearningPathway() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const reduceMotion = useReducedMotion();
  const { result, answers, getCoursePercent } = useLearnerProgress();

  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [adaptiveItem, setAdaptiveItem] = useState<PathwayItem | null>(null);
  const [openItem, setOpenItem] = useState<PathwayItem | null>(null);

  const baseItems = useMemo(() => (result ? buildPathway(result, answers) : []), [result, answers]);

  // The adaptive module lands directly after the simulation that triggered it.
  const items = useMemo(() => {
    if (!adaptiveItem) return baseItems;
    const at = baseItems.findIndex((i) => i.format === "simulation");
    if (at === -1) return [...baseItems, adaptiveItem];
    return [...baseItems.slice(0, at + 1), adaptiveItem, ...baseItems.slice(at + 1)];
  }, [baseItems, adaptiveItem]);

  const courses = useMemo(
    () =>
      (result?.recommendedCourseIds ?? [])
        .map((id) => COURSE_BY_ID[id])
        .filter((c): c is Course => Boolean(c)),
    [result],
  );

  const coursePercents = useMemo(() => {
    const percents: Record<string, number> = {};
    for (const item of items) {
      if (item.courseId) percents[item.courseId] = getCoursePercent(item.courseId);
    }
    return percents;
  }, [items, getCoursePercent]);

  const isDone = (item: PathwayItem) =>
    item.courseId ? (coursePercents[item.courseId] ?? 0) === 100 : completedIds.includes(item.id);

  const entries: TimelineEntry[] = useMemo(() => {
    const statuses = derivePathwayStatuses(items, coursePercents, completedIds);
    return items.map((item, i) => ({ item, status: statuses[i] }));
  }, [items, coursePercents, completedIds]);

  const completedCount = entries.filter((e) => e.status === "completed").length;
  const percent = entries.length ? Math.round((completedCount / entries.length) * 100) : 0;

  const openEntry = (item: PathwayItem) => {
    if (item.courseId) {
      setLocation(`/learner/course/${item.courseId}`);
      return;
    }
    setOpenItem(item);
  };

  const completeItem = (item: PathwayItem) => {
    setCompletedIds((ids) => (ids.includes(item.id) ? ids : [...ids, item.id]));

    if (item.format === "simulation" && !adaptiveItem && result) {
      const added = buildAdaptiveItem(result);
      setAdaptiveItem(added);
      toast({
        title: "Your pathway has been adjusted",
        description: `Your ${AGENTS.coach} added “${added.title}” after your role-play.`,
      });
      return;
    }

    toast({
      title: "Activity complete",
      description: `${item.title} is recorded against your ${item.competency.short} capability.`,
    });
  };

  if (!result) {
    return (
      <Layout role="learner">
        <div className="mx-auto w-full max-w-2xl pb-12">
          <PageHeader
            className="mb-8"
            title="Your Personalised Learning Pathway"
            description="One ordered journey, built from your baseline assessment"
          />
          <Card className="border-card-border">
            <CardContent className="p-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Route className="h-7 w-7 text-primary" />
              </span>
              <h2 className="mt-5 text-xl font-bold text-foreground">Your pathway is waiting on one thing</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                The pathway is assembled from your baseline assessment: which courses you are given, which
                microlearning and practical assignments sit between them, which live session is booked, and when you
                are re-tested. Take the assessment and your {AGENTS.advisor} builds it in front of you.
              </p>

              <div className="mx-auto mt-6 grid max-w-md gap-2 text-start">
                {[
                  "Self-paced courses matched to your two weakest capabilities",
                  "Microlearning, practical assignments and a scenario simulation between them",
                  "An instructor-led virtual session, your Workplace Project and a targeted re-check",
                ].map((line) => (
                  <div key={line} className="flex items-start gap-2.5 rounded-lg border border-card-border p-3">
                    <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm leading-relaxed text-muted-foreground">{line}</span>
                  </div>
                ))}
              </div>

              <Button className="mt-7" onClick={() => setLocation("/learner/assessment")} data-testid="button-start-assessment">
                Start my baseline assessment <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-5xl pb-16">
        <PageHeader
          className="mb-6"
          title="Your Personalised Learning Pathway"
          description={`Built for a ${result.levelLabel} in ${result.gaps.length} priority capabilities`}
          actions={
            <Button variant="outline" size="sm" onClick={() => setLocation("/learner/assessment/report")}>
              View full report <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Button>
          }
        />

        {/* Pathway progress */}
        <ScrollReveal className="mb-8">
          <Card className="border-card-border">
            <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
              <div className="min-w-[13rem] flex-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-foreground">Pathway progress</p>
                  <span className="text-sm font-bold tabular-nums text-primary">{percent}%</span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={reduceMotion ? false : { width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {completedCount} of {entries.length} items complete
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Current level
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">{result.levelLabel}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Priority capabilities
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {entries
                      .map((e) => e.item.competency)
                      .filter((c, i, all) => all.findIndex((x) => x.id === c.id) === i)
                      .slice(0, 3)
                      .map((c) => (
                        <Badge key={c.id} variant="outline" className="rounded-full text-[11px]">
                          {c.short}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Adaptive moment */}
        {adaptiveItem && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mb-8"
          >
            <Card className="border-primary/30 bg-primary/[0.04]">
              <CardContent className="flex flex-wrap items-start gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </span>
                <div className="min-w-[16rem] flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Your pathway has been adjusted
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Your {AGENTS.coach} added “{adaptiveItem.title}”
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {adaptiveItem.description}
                  </p>
                </div>
                <Button size="sm" onClick={() => setOpenItem(adaptiveItem)} data-testid="button-open-adaptive">
                  Open the new module <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <ScrollReveal className="mb-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                  <Target className="h-3.5 w-3.5" /> Assigned by your {AGENTS.advisor}
                </p>
                <h2 className="mt-1 text-lg font-bold text-foreground">Courses in your pathway</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Matched to your priority gaps and open at any time.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, i) => (
                <PathwayCourseCard key={course.id} course={course} percent={getCoursePercent(course.id)} index={i} />
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Ordered pathway */}
        <ScrollReveal>
          <div className="mb-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Route className="h-3.5 w-3.5" /> Ordered journey
            </p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Every step, in sequence</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Courses, microlearning, live sessions, practical work and your re-check in one pathway. Activities
              unlock as you complete the one before.
            </p>
          </div>

          <PathwayTimeline entries={entries} onOpen={openEntry} />
        </ScrollReveal>
      </div>

      <PathwayActivityDialog
        item={openItem}
        isComplete={openItem ? isDone(openItem) : false}
        onClose={() => setOpenItem(null)}
        onComplete={completeItem}
      />
    </Layout>
  );
}
