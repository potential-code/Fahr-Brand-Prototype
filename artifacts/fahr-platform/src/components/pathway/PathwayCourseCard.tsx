import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { COMPETENCY_BY_ID, courseImage, type Course } from "@/lib/learningData";

const BASE = import.meta.env.BASE_URL;

type PathwayCourseCardProps = {
  course: Course;
  /** Completion percentage, 0-100. */
  percent: number;
  index?: number;
};

/**
 * Full course card for the Learning Pathway: artwork, category, duration,
 * description, module count, progress and a call to action into the course.
 */
export function PathwayCourseCard({ course, percent, index = 0 }: PathwayCourseCardProps) {
  const reduceMotion = useReducedMotion();
  const competency = COMPETENCY_BY_ID[course.competencyId];
  const state = percent === 0 ? "Start course" : percent === 100 ? "Review course" : "Continue course";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.1 }}
      className="h-full"
    >
      <Link
        href={`/learner/course/${course.id}`}
        data-testid={`card-course-${course.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-card-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/5"
      >
        <div className="relative h-36 shrink-0 overflow-hidden bg-muted">
          <img
            src={`${BASE}${courseImage(course)}`}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5">
            <Badge className="rounded-full bg-white text-foreground hover:bg-white">{course.category}</Badge>
            {competency && competency.short !== course.category && (
              <Badge variant="outline" className="rounded-full border-white/40 bg-black/25 text-white backdrop-blur-sm">
                {competency.short}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {course.duration} · {course.hours}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> {course.moduleCount} modules
            </span>
          </div>

          <h3 className="mt-2.5 text-base font-bold leading-snug text-foreground">{course.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{course.summary}</p>

          <div className="mt-auto pt-5">
            <div className="mb-1.5 flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">
                {percent === 0 ? "Not started" : percent === 100 ? "Complete" : "In progress"}
              </span>
              <span className="font-bold tabular-nums text-primary">{percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={reduceMotion ? false : { width: 0 }}
                whileInView={{ width: `${percent}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 + index * 0.1 }}
                style={reduceMotion ? { width: `${percent}%` } : undefined}
              />
            </div>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {state}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
