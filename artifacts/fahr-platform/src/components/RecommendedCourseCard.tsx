import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { COMPETENCY_BY_ID, courseImage, type Course } from "@/lib/learningData";

const BASE = import.meta.env.BASE_URL;

type RecommendedCourseCardProps = {
  course: Course;
  /** Completion percentage, 0-100. */
  percent: number;
  /** Position in the list, used to stagger the entrance animation. */
  index?: number;
};

/**
 * Compact course card with its own artwork alongside the title, competency tag
 * and progress. Used for the courses recommended after the baseline assessment.
 */
export function RecommendedCourseCard({ course, percent, index = 0 }: RecommendedCourseCardProps) {
  const reduceMotion = useReducedMotion();
  const competency = COMPETENCY_BY_ID[course.competencyId];
  const started = percent > 0;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
    >
      <Link
        href={`/learner/course/${course.id}`}
        data-testid={`chip-course-${course.id}`}
        className="group flex h-full overflow-hidden rounded-xl border border-card-border bg-card transition-colors hover:border-primary/40 hover:bg-muted/40"
      >
        <div className="relative w-24 shrink-0 overflow-hidden bg-muted sm:w-28">
          <img
            src={`${BASE}${courseImage(course)}`}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/25 to-transparent" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {competency ? competency.short : course.category}
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">{course.title}</p>

          <div className="mt-auto pt-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {course.moduleCount} modules · {course.hours}
              </span>
              <span className="font-semibold text-foreground">{percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={reduceMotion ? false : { width: 0 }}
                whileInView={{ width: `${percent}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + index * 0.08 }}
                style={reduceMotion ? { width: `${percent}%` } : undefined}
              />
            </div>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
              {started ? "Continue course" : "Start course"}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
