import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  Lock,
  PenTool,
  PlayCircle,
  Rocket,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COURSE_BY_ID, courseImage } from "@/lib/learningData";
import { FORMAT_LABEL, type ItemStatus, type PathwayFormat, type PathwayItem } from "@/lib/pathway";

export type TimelineEntry = { item: PathwayItem; status: ItemStatus };

const BASE = import.meta.env.BASE_URL;

/** The course art for a step, or null for microlearning, sessions and re-checks. */
function stepImage(courseId: string | undefined): string | null {
  if (!courseId) return null;
  const course = COURSE_BY_ID[courseId];
  return course ? `${BASE}${courseImage(course)}` : null;
}

const FORMAT_ICON: Record<PathwayFormat, typeof BookOpen> = {
  course: BookOpen,
  microlearning: Zap,
  "virtual-session": Users,
  "practical-assignment": PenTool,
  simulation: FlaskConical,
  lab: FlaskConical,
  "workplace-project": Rocket,
  assessment: ClipboardCheck,
};

const STATUS_BADGE: Record<ItemStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "border-primary/30 bg-primary/10 text-primary" },
  "in-progress": { label: "In progress", className: "border-transparent bg-primary text-primary-foreground" },
  recommended: { label: "Recommended next", className: "border-accent/30 bg-accent/10 text-accent" },
  available: { label: "Open any time", className: "border-card-border bg-card text-muted-foreground" },
  locked: { label: "Locked", className: "border-card-border bg-muted text-muted-foreground" },
};

function actionLabel(item: PathwayItem, status: ItemStatus): string {
  if (status === "completed") return "Review";
  if (item.format === "course") return status === "in-progress" ? "Continue" : "Open";
  if (item.href) return item.hrefLabel ?? "Open";
  return status === "in-progress" ? "Start" : "Open";
}

type PathwayTimelineProps = {
  entries: TimelineEntry[];
  onOpen: (item: PathwayItem) => void;
};

/**
 * The pathway itself: one ordered journey of mixed formats, each item tagged
 * with the capability it builds and gated by what comes before it.
 *
 * Each row is a rail node plus a single card. Course art lives *inside* that
 * card as a leading media panel rather than floating beside it, so a step with
 * artwork and a step without read as the same object at different fills.
 */
export function PathwayTimeline({ entries, onOpen }: PathwayTimelineProps) {
  const reduceMotion = useReducedMotion();

  return (
    <ol className="relative space-y-4">
      {entries.map(({ item, status }, i) => {
        const Icon = FORMAT_ICON[item.format];
        const locked = status === "locked";
        const badge = STATUS_BADGE[status];
        const isLast = i === entries.length - 1;
        const image = stepImage(item.courseId);
        const done = status === "completed";
        const nodeClasses = done
          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
          : locked
            ? "border-border bg-muted text-muted-foreground"
            : "border-primary/25 bg-card text-primary shadow-sm shadow-black/[0.03]";

        return (
          <motion.li
            key={item.id}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: "easeOut", delay: Math.min(i, 6) * 0.05 }}
            className="relative"
            data-testid={`row-pathway-${item.id}`}
          >
            {/*
              Connector rail. It runs behind the node and past the bottom of the
              row into the `space-y-4` gap, so the line reads as one continuous
              journey rather than one dash per step.
            */}
            {!isLast && (
              <span
                className={`absolute -bottom-4 top-0 start-7 -z-0 w-px -translate-x-1/2 ${
                  done ? "bg-primary/35" : "bg-border"
                }`}
                aria-hidden="true"
              />
            )}

            <div className="flex items-start gap-4 sm:gap-5">
              <span
                className={`relative z-10 mt-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${nodeClasses}`}
              >
                {done ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : locked ? (
                  <Lock className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
                <span
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-card-border bg-background px-1.5 text-[10px] font-bold tabular-nums leading-[1.35] text-muted-foreground"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </span>

              <article
                className={`group relative min-w-0 flex-1 overflow-hidden rounded-2xl border transition-all duration-300 ${
                  locked
                    ? "border-card-border bg-muted/30"
                    : item.adaptive
                      ? "border-primary/40 bg-primary/[0.04] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
                      : "border-card-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5"
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  {image && (
                    <div className="relative h-28 w-full shrink-0 overflow-hidden bg-muted sm:h-auto sm:w-40 md:w-48">
                      <img
                        src={image}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                          locked ? "opacity-45 grayscale" : ""
                        }`}
                      />
                      {/* Seam between art and copy: dark at the outer edge on
                          mobile, fading into the card body on wider screens. */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent sm:bg-none"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 end-0 hidden w-px bg-card-border sm:block"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          item.adaptive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {item.adaptive && <Sparkles className="me-1 inline h-3 w-3" />}
                        {FORMAT_LABEL[item.format]}
                      </span>
                      <Badge variant="outline" className="rounded-full text-[11px] font-medium">
                        {item.competency.short}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{item.duration}</span>
                      <span
                        className={`ms-auto shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <h3
                      className={`mt-2 text-base font-bold leading-snug ${
                        locked ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-card-border/70 pt-3.5">
                      <p className="text-[11px] text-muted-foreground">
                        {item.meta ? `${item.meta} · ` : ""}Assigned by your {item.agent}
                      </p>
                      {locked ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" /> Complete the previous activity to unlock
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant={done || status === "available" ? "outline" : "default"}
                          onClick={() => onOpen(item)}
                          data-testid={`button-open-${item.id}`}
                        >
                          {done ? <Award className="me-2 h-4 w-4" /> : <PlayCircle className="me-2 h-4 w-4" />}
                          {actionLabel(item, status)}
                          <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
