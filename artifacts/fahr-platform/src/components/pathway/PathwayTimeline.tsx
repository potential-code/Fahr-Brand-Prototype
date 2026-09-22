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
import { COURSE_BY_ID } from "@/lib/learningData";
import { FORMAT_LABEL, type ItemStatus, type PathwayFormat, type PathwayItem } from "@/lib/pathway";

export type TimelineEntry = { item: PathwayItem; status: ItemStatus };

const BASE = import.meta.env.BASE_URL;

/** The course art for a step, or null for microlearning, sessions and re-checks. */
function stepImage(courseId: string | undefined): string | null {
  if (!courseId) return null;
  const course = COURSE_BY_ID[courseId];
  return course ? `${BASE}${course.image}` : null;
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
 */
export function PathwayTimeline({ entries, onOpen }: PathwayTimelineProps) {
  const reduceMotion = useReducedMotion();

  return (
    <ol className="relative space-y-3">
      {entries.map(({ item, status }, i) => {
        const Icon = FORMAT_ICON[item.format];
        const locked = status === "locked";
        const badge = STATUS_BADGE[status];
        const isLast = i === entries.length - 1;
        const image = stepImage(item.courseId);
        const statusClasses =
          status === "completed"
            ? "border border-primary bg-primary text-primary-foreground"
            : locked
              ? "border border-border bg-muted text-muted-foreground"
              : "border border-primary/30 bg-card text-primary";

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
            {/* Connector rail — runs behind the icons, not through them */}
            {!isLast && (
              <span
                className="absolute inset-y-0 start-8 -z-0 w-px -translate-x-1/2 bg-border/60"
                aria-hidden="true"
              />
            )}

            <div className="flex items-center gap-4">
              <span
                className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${statusClasses}`}
              >
                {status === "completed" ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : locked ? (
                  <Lock className="h-7 w-7" />
                ) : (
                  <Icon className="h-7 w-7" />
                )}
              </span>

              <div
                className={`flex-1 rounded-xl border p-5 transition-colors ${
                  item.adaptive
                    ? "border-primary/40 bg-primary/[0.04]"
                    : locked
                      ? "border-card-border bg-muted/30"
                      : "border-card-border bg-card hover:border-primary/30"
                }`}
              >
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
                  <span className={`ms-auto rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <h3 className={`mt-2 text-base font-bold leading-snug ${locked ? "text-muted-foreground" : "text-foreground"}`}>
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
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
                      variant={status === "completed" || status === "available" ? "outline" : "default"}
                      onClick={() => onOpen(item)}
                      data-testid={`button-open-${item.id}`}
                    >
                      {status === "completed" ? (
                        <Award className="me-2 h-4 w-4" />
                      ) : (
                        <PlayCircle className="me-2 h-4 w-4" />
                      )}
                      {actionLabel(item, status)}
                      <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                    </Button>
                  )}
                </div>
              </div>

              {image && (
                <div className="relative hidden h-24 w-40 shrink-0 overflow-hidden rounded-xl sm:block">
                  <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                </div>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
