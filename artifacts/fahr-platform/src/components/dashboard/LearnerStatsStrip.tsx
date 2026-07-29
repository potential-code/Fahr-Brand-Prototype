import { motion, useReducedMotion } from "framer-motion";
import { CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { CountUp } from "@/components/CountUp";
import { Clock, ListChecks, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import { CAPABILITY_LEVELS } from "@/lib/constants";
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
};

/**
 * Headline learning analytics for the signed-in learner. Activity counts come
 * from real course progress; the hours and points are demo programme figures.
 */
export function LearnerStatsStrip() {
  const { result, courseProgress } = useLearnerProgress();
  const reduceMotion = useReducedMotion();

  const activities = COURSES.reduce((sum, course) => {
    const progress = courseProgress[course.id];
    if (!progress) return sum;
    return (
      sum + progress.completedLessonIds.length + (progress.pretestDone ? 1 : 0) + (progress.finalDone ? 1 : 0)
    );
  }, 0);

  const levelOrder = result
    ? (CAPABILITY_LEVELS.find((l) => l.id === result.levelId)?.order ?? 1)
    : 0;

  const stats: Stat[] = [
    {
      id: "hours",
      icon: Clock,
      label: "Learning hours",
      value: 18.5,
      decimals: 1,
      caption: "Logged this quarter",
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
      value: 13200,
      caption: "Rank 2 in your entity",
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
                <p className="mt-2 text-sm font-medium text-foreground">{stat.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.caption}</p>
              </CardContent>
            </StatCard>
          </motion.div>
        );
      })}
    </div>
  );
}
