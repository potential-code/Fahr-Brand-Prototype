// One typographic scale for the public surface.
//
// The landing page previously set heading sizes inline, section by section,
// which drifted (some 48px headlines next to 18px body copy, oversized on
// tablet). These tokens are the single place the public type scale is defined —
// use them instead of re-declaring `text-5xl` on a new section.

import React from "react";
import { cn } from "@/lib/utils";
import { RevealHeading, Reveal, type HeadingSegment } from "./motion";

export const TYPE = {
  /** Small caps label above a section heading. */
  eyebrow:
    "text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.22em] text-primary",
  /** Hero headline — the only place type goes above 40px. */
  hero: "text-[1.75rem] leading-[1.12] sm:text-4xl md:text-[2.6rem] lg:text-5xl font-bold tracking-tight",
  /** Section headline. */
  h2: "text-[1.5rem] leading-[1.18] sm:text-[1.75rem] md:text-[2rem] lg:text-[2.25rem] font-bold tracking-tight text-foreground",
  /** Card and panel headline. */
  h3: "text-base md:text-lg font-bold tracking-tight text-foreground",
  /** Section description. */
  lead: "text-[0.9375rem] md:text-base leading-relaxed text-muted-foreground",
  /** Supporting copy inside cards and panels. */
  body: "text-sm leading-relaxed text-muted-foreground",
  /** Vertical rhythm for a full-width section. */
  section: "py-14 md:py-20 lg:py-24",
  /** Page gutter, matched across every section. */
  gutter: "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8",
} as const;

/**
 * Eyebrow + masked headline + description, animated as one block.
 */
export function SectionHeading({
  eyebrow,
  segments,
  description,
  align = "center",
  className,
  descriptionClassName,
}: {
  eyebrow: string;
  segments: HeadingSegment[];
  description?: React.ReactNode;
  align?: "center" | "start";
  className?: string;
  descriptionClassName?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col",
        centered ? "items-center text-center" : "items-start text-start",
        className,
      )}
    >
      <Reveal variant="fade" duration={0.4} amount={0.4}>
        <span className={cn("flex items-center gap-2.5", TYPE.eyebrow)}>
          <span aria-hidden className="h-px w-6 bg-primary/50" />
          {eyebrow}
        </span>
      </Reveal>
      <RevealHeading
        as="h2"
        segments={segments}
        className={cn(TYPE.h2, "mt-3 max-w-3xl", centered && "text-balance")}
      />
      {description ? (
        <Reveal variant="up" delay={0.12} amount={0.3}>
          <p
            className={cn(
              TYPE.lead,
              "mt-3.5 max-w-2xl",
              centered && "text-pretty",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
