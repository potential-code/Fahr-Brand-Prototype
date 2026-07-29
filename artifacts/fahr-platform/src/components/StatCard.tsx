import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * The single treatment for every analytics figure on the platform.
 *
 * Stat and KPI cards sit on a warm camel-gold wash with a gold-tinted border so
 * a number always reads as measured data rather than one more white panel. The
 * colours come from the `--stat-surface*` tokens, which carry their own dark
 * theme values, and the classes live here so a new screen cannot quietly drift
 * back to a plain card.
 *
 * Type sizes and internal layout stay with each screen — this only sets the
 * surface.
 */
export const STAT_SURFACE_CLASS = "bg-stat border-stat-border text-foreground";

/** Marks a stat surface for the print stylesheet, which flattens it to white. */
export const STAT_SURFACE_ATTRS = { "data-stat-surface": "" } as const;

/** A `Card` on the shared stat surface. Children supply the figure and label. */
export const StatCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Card ref={ref} {...STAT_SURFACE_ATTRS} className={cn(STAT_SURFACE_CLASS, className)} {...props} />
  ),
);
StatCard.displayName = "StatCard";
