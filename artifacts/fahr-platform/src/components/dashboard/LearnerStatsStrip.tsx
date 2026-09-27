import { motion, useReducedMotion } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { CountUp } from "@/components/CountUp";
import { BookOpen, ListChecks, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import { CAPABILITY_LEVELS, IMPACT_POINTS } from "@/lib/constants";
import { LEARNER_STANDING } from "@/lib/engagement";
import { PointsLegend } from "@/components/recognition/PointsLegend";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { COURSES } from "@/lib/learningData";

type Stat = {
  id: string;
  icon: LucideIcon;
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  total?: string;
  caption: string;
  /** Rendered instead of the counted value, for states with no number yet. */
  display?: string;
  /** Shows the "How points are earned" legend beside the label. */
  pointsLegend?: boolean;
};

/**
 * Headline learning analytics for the signed-in learner. Activity counts come
 * from real course progress; points and rank read the shared programme figures
 * (`IMPACT_POINTS`, `LEARNER_STANDING`) every other screen uses.
 */
export function LearnerStatsStrip() {
  const { result, courseProgress, getCoursePercent } = useLearnerProgress();
  const reduceMotion = useReducedMotion();

  const activities = COURSES.reduce((sum, course) => {
    const progress = courseProgress[course.id];
    if (!progress) return sum;
    return (
      sum + progress.completedLessonIds.length + (progress.pretestDone ? 1 : 0) + (progress.finalDone ? 1 : 0)
    );
  }, 0);

  const coursePercents = COURSES.map((course) => getCoursePercent(course.id));
  const coursesInProgress = coursePercents.filter((p) => p > 0 && p < 100).length;
  const coursesCompleted = coursePercents.filter((p) => p === 100).length;

  const levelOrder = result
    ? (CAPABILITY_LEVELS.find((l) => l.id === result.levelId)?.order ?? 1)
    : 0;

  const stats: Stat[] = [
    {
      id: "courses",
      icon: BookOpen,
      label: "Courses in progress",
      value: coursesInProgress,
      caption: coursesCompleted > 0 ? `${coursesCompleted} completed so far` : "None completed yet",
    },
    {
      id: "activities",
      icon: ListChecks,
      label: "Activities completed",
      value: activities,
      caption: "Lessons, checks and exercises",
    },
    {
      id: "points",
      icon: Sparkles,
      label: "Impact points",
      value: IMPACT_POINTS,
      caption: `Rank ${LEARNER_STANDING.entity} in your entity`,
      pointsLegend: true,
    },
    {
      id: "level",
      icon: TrendingUp,
      label: "Capability level",
      value: levelOrder,
      total: result ? `of ${CAPABILITY_LEVELS.length}` : undefined,
      display: result ? undefined : "—",
      caption: result ? result.levelLabel : "Take the baseline to unlock",
    },
  ];

  return (
    <div
      className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]"
      data-testid="strip-learner-stats"
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.id}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.07 }}
          >
            <StatCard className="h-full" data-testid={`stat-${stat.id}`}>
              <CardContent className="p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="flex items-baseline gap-1.5 text-2xl font-bold leading-none text-foreground">
                  {stat.display ?? (
                    <CountUp to={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                  )}
                  {stat.total && <span className="text-sm font-medium text-muted-foreground">{stat.total}</span>}
                </p>
                <p className="mt-2 flex items-center gap-1 text-sm font-medium text-foreground">
                  {stat.label}
                  {stat.pointsLegend && <PointsLegend />}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.caption}</p>
              </CardContent>
            </StatCard>
          </motion.div>
        );
      })}
    </div>
  );
}
