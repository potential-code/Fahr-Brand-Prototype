import * as React from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/motion";

/**
 * Shared recognition styling.
 *
 * Recognition is the one place on the platform that should read as a citation
 * rather than a workspace, so its hero band and its badge / credential cards are
 * dark against otherwise light screens. The learner recognition page set that
 * look; these tokens and shells carry it to the manager, entity, FAHR and
 * leadership equivalents. Tables, charts and analytics on those screens stay on
 * light cards — only the record itself goes dark.
 *
 * All colours come from the `--recognition-*` tokens, never a one-off hex.
 */

/** The deep record surface — the hero band and earned credential cards. */
export const RECOGNITION_SURFACE_CLASS = "bg-recognition text-recognition-foreground";

/** One step lighter — items in flight, so they read as not-yet-issued. */
export const RECOGNITION_RAISED_CLASS = "bg-recognition-raised text-recognition-foreground";

/** An inset panel on a dark surface (progress blocks, stat tiles, pills). */
export const RECOGNITION_PANEL_CLASS = "border border-recognition-border bg-recognition-panel";

/** Marks a dark surface for the print stylesheet, which flattens it to paper. */
export const RECOGNITION_SURFACE_ATTRS = { "data-recognition-surface": "" } as const;

/**
 * The dotted grain and gold bloom that make the dark surface feel embossed
 * rather than flat. Purely decorative.
 */
export function RecognitionTexture({
  dots = true,
  glow = true,
  dotSize = 22,
  className,
  glowClassName,
}: {
  dots?: boolean;
  glow?: boolean;
  dotSize?: number;
  className?: string;
  /** Tighten or soften the bloom — a short band needs a smaller one. */
  glowClassName?: string;
}) {
  return (
    <>
      {dots && (
        <div
          aria-hidden="true"
          className={cn("absolute inset-0 opacity-[0.35]", className)}
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)",
            backgroundSize: `${dotSize}px ${dotSize}px`,
          }}
        />
      )}
      {glow && (
        <div
          aria-hidden="true"
          className={cn("absolute -end-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl", glowClassName)}
        />
      )}
    </>
  );
}

/** One headline figure inside a dark band. */
export interface RecognitionBandStat {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/**
 * The dark hero band for a recognition screen. Replaces the light page header
 * on those screens so every role's record view opens the same way.
 */
export function RecognitionBand({
  eyebrow,
  title,
  description,
  actions,
  stats,
  footnote,
  testId,
  className,
}: {
  /** Small uppercase line above the title, e.g. "Verified federal record". */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons or badges. Style them for a dark surface. */
  actions?: React.ReactNode;
  /** Optional headline figures shown at the end of the band. */
  stats?: RecognitionBandStat[];
  footnote?: React.ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      {...RECOGNITION_SURFACE_ATTRS}
      className={cn("relative overflow-hidden rounded-2xl", RECOGNITION_SURFACE_CLASS, className)}
      data-testid={testId}
    >
      {/* A short band would be swallowed by the full-size bloom, so keep it
          tighter here; the learner hero is tall enough for the default. */}
      <RecognitionTexture glowClassName={stats && stats.length > 0 ? undefined : "-top-28 h-56 w-56 bg-primary/20"} />

      <div className="relative p-6 md:p-8">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</span>
          </div>
        )}

        <div className={cn("grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end", eyebrow && "mt-5")}>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl">{title}</h1>
            {description && (
              <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-white/65">{description}</p>
            )}
            {actions && <div className="mt-5 flex flex-wrap items-center gap-2.5">{actions}</div>}
          </div>

          {stats && stats.length > 0 && (
            <div className="grid grid-cols-2 gap-3 lg:w-[300px]">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                  className={cn("rounded-xl p-3.5", RECOGNITION_PANEL_CLASS)}
                  data-testid={`band-stat-${stat.id}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{stat.label}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-white">
                    <CountUp
                      to={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      decimals={stat.decimals ?? 0}
                    />
                  </p>
                </motion.div>
              ))}
              {footnote && <p className="col-span-2 text-[11px] leading-relaxed text-white/45">{footnote}</p>}
            </div>
          )}
        </div>

        {footnote && (!stats || stats.length === 0) && (
          <p className="mt-5 text-[11px] leading-relaxed text-white/45">{footnote}</p>
        )}
      </div>
    </motion.section>
  );
}

/**
 * A dark card for one issued badge or credential. `state` picks the surface:
 * an issued record is the deep surface, one in flight is a step lighter, and
 * anything not started stays light and dashed so it reads as an outline.
 */
export function RecognitionItemCard({
  state = "earned",
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  state?: "earned" | "in-progress" | "empty";
}) {
  const dark = state !== "empty";
  return (
    <div
      {...(dark ? RECOGNITION_SURFACE_ATTRS : {})}
      className={cn(
        "relative h-full overflow-hidden rounded-xl p-4",
        state === "earned"
          ? RECOGNITION_SURFACE_CLASS
          : state === "in-progress"
            ? RECOGNITION_RAISED_CLASS
            : "border border-dashed border-border bg-muted/20 text-foreground",
        className,
      )}
      {...rest}
    >
      {state === "earned" && <RecognitionTexture glow={false} dotSize={20} className="opacity-[0.3]" />}
      <div className="relative">{children}</div>
    </div>
  );
}
