import React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { MOTION } from "./motionTokens";

/** Elements a staggered list can render as — table bodies and rows included. */
type StaggerTag = "div" | "ul" | "tbody" | "section";
type ItemTag = "div" | "li" | "tr";

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  as?: StaggerTag;
  /** Gap between items, in seconds. Defaults to the card gap. */
  gap?: number;
  /** Seconds before the first item appears. */
  delay?: number;
  /** Reveals on scroll instead of immediately on mount. */
  onView?: boolean;
  "data-testid"?: string;
};

/**
 * Staggered reveal for a group of cards or table rows.
 *
 * Wrap the container in `Stagger` and each child in `StaggerItem`. Use `as` for
 * tables (`tbody` / `tr`) so the markup stays valid — a `div` inside a table is
 * dropped by the browser and the rows never animate.
 */
export function Stagger({
  children,
  className,
  as = "div",
  gap = MOTION.stagger.cards,
  delay = 0,
  onView = false,
  ...rest
}: StaggerProps) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as];

  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : gap, delayChildren: delay } },
  };

  return (
    <Tag
      className={className}
      variants={variants}
      initial="hidden"
      {...(onView
        ? { whileInView: "visible", viewport: { once: true, margin: "-40px" } }
        : { animate: "visible" })}
      data-testid={rest["data-testid"]}
    >
      {children}
    </Tag>
  );
}

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
  as?: ItemTag;
  /** Row-sized travel for table rows, card-sized for everything else. */
  variant?: "card" | "row";
  "data-testid"?: string;
};

export function StaggerItem({
  children,
  className,
  as = "div",
  variant = "card",
  ...rest
}: StaggerItemProps) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as];
  const travel = variant === "row" ? MOTION.travel.row : MOTION.travel.card;

  const variants: Variants = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: travel },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION.duration.base, ease: MOTION.ease.out },
    },
  };

  return (
    <Tag className={className} variants={variants} data-testid={rest["data-testid"]}>
      {children}
    </Tag>
  );
}
