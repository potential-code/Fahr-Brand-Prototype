// Motion primitives for the public landing surface (landing page, sign in,
// register).
//
// The admin consoles have their own kit in `@/components/motion`; this one is
// deliberately separate because the marketing surface animates differently —
// bigger travel, parallax layers, masked headline reveals and pointer-driven
// micro-interactions.
//
// Layering rule (same as the console kit): GSAP animates section wrappers and
// text splits, framer-motion animates elements inside. Never both on one node.
//
// Every primitive resolves to its finished state when the visitor prefers
// reduced motion — nothing is gated behind an animation that may not run.

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type TargetAndTransition,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** One set of durations and easings so every section moves the same way. */
export const LANDING_MOTION = {
  duration: { fast: 0.2, base: 0.55, slow: 0.9 },
  stagger: { tight: 0.05, cards: 0.09 },
  ease: [0.22, 1, 0.36, 1] as const,
  /** Distance blocks travel into place, in pixels. */
  travel: { text: 22, card: 34 },
  /** How far a viewport-relative parallax layer drifts, in pixels. */
  parallax: { subtle: 40, medium: 70, strong: 110 },
} as const;

export const reducedMotionPreferred = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ Reveal */

type RevealVariant = "up" | "fade" | "blur" | "scale" | "clip";

const REVEAL_VARIANTS: Record<
  RevealVariant,
  { from: TargetAndTransition; to: TargetAndTransition }
> = {
  up: { from: { opacity: 0, y: LANDING_MOTION.travel.card }, to: { opacity: 1, y: 0 } },
  fade: { from: { opacity: 0 }, to: { opacity: 1 } },
  blur: {
    from: { opacity: 0, y: 18, filter: "blur(10px)" },
    to: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  scale: { from: { opacity: 0, scale: 0.94 }, to: { opacity: 1, scale: 1 } },
  clip: {
    from: { opacity: 0, clipPath: "inset(14% 0% 14% 0% round 1.5rem)" },
    to: { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 1.5rem)" },
  },
};

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Which entrance the block uses. */
  variant?: RevealVariant;
  /** Seconds to wait once the block enters the viewport. */
  delay?: number;
  /** Fraction of the block that must be visible before it plays. */
  amount?: number;
  duration?: number;
  style?: React.CSSProperties;
};

/**
 * Scroll-triggered entrance for a single block. Plays once.
 */
export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
  amount = 0.25,
  duration = LANDING_MOTION.duration.base,
  style,
}: RevealProps) {
  const reduced = useReducedMotion();
  const spec = REVEAL_VARIANTS[variant];

  if (reduced) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial={spec.from}
      whileInView={spec.to}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: LANDING_MOTION.ease }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered container. Direct children wrapped in `RevealItem` come in one
 * after another.
 */
export function RevealGroup({
  children,
  className,
  stagger = LANDING_MOTION.stagger.cards,
  delay = 0,
  amount = 0.15,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
  as?: "div" | "ul" | "section";
}) {
  const reduced = useReducedMotion();
  const Component = motion[Tag] as typeof motion.div;

  if (reduced) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </Component>
  );
}

export function RevealItem({
  children,
  className,
  variant = "up",
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  variant?: RevealVariant;
  as?: "div" | "li";
} & Omit<React.ComponentProps<typeof motion.div>, "variants" | "transition">) {
  const reduced = useReducedMotion();
  const spec = REVEAL_VARIANTS[variant];
  const Component = motion[Tag] as typeof motion.div;
  const PlainTag = Tag as "div";

  if (reduced) {
    return (
      <PlainTag className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </PlainTag>
    );
  }

  return (
    <Component
      className={className}
      variants={{ hidden: spec.from, shown: spec.to }}
      transition={{ duration: LANDING_MOTION.duration.base, ease: LANDING_MOTION.ease }}
      {...rest}
    >
      {children}
    </Component>
  );
}

/* ------------------------------------------------------- Masked text reveal */

export type HeadingSegment = string | { t: string; accent: true };

/**
 * Headline whose words rise out of a mask, one after another.
 *
 * Words are individual inline-block spans inside an `overflow-hidden` wrapper,
 * so the type appears to be revealed by a moving edge rather than faded in.
 * Word spacing uses `me-*` (margin-inline-end) so it mirrors correctly in
 * Arabic.
 */
export function RevealHeading({
  segments,
  as: Tag = "h2",
  className,
  delay = 0,
  /** Play on mount instead of on scroll — for above-the-fold headlines. */
  onMount = false,
}: {
  segments: HeadingSegment[];
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  onMount?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const words = useMemo(
    () =>
      segments.flatMap((segment, si) => {
        const text = typeof segment === "string" ? segment : segment.t;
        const accent = typeof segment === "string" ? false : segment.accent;
        return text
          .split(/\s+/)
          .filter(Boolean)
          .map((word, wi) => ({ word, accent, key: `${si}-${wi}` }));
      }),
    [segments],
  );

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reducedMotionPreferred()) return;
      const inner = el.querySelectorAll<HTMLElement>("[data-word]");
      if (!inner.length) return;

      gsap.from(inner, {
        yPercent: 116,
        opacity: 0,
        duration: 0.72,
        delay,
        ease: "power3.out",
        stagger: 0.055,
        ...(onMount
          ? {}
          : { scrollTrigger: { trigger: el, start: "top 88%", once: true } }),
      });
    },
    { scope: ref, dependencies: [words.length, delay, onMount] },
  );

  return (
    <Tag className={className}>
      <span ref={ref as React.Ref<HTMLDivElement>} className="inline">
        {words.map(({ word, accent, key }) => (
          <span key={key} className="inline-block overflow-hidden align-bottom pb-[0.06em]">
            <span
              data-word
              className={cn("inline-block me-[0.26em]", accent && "text-primary")}
            >
              {word}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
}

/* --------------------------------------------------------------- Parallax */

/**
 * Moves its children against the scroll while the section passes the viewport.
 * Never pins or otherwise holds the scroll.
 */
export function Parallax({
  children,
  className,
  distance = LANDING_MOTION.parallax.medium,
  scaleTo,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  /** Optional end scale, e.g. 1.08 for a slow push-in on a photo. */
  scaleTo?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const y = useTransform(smooth, [0, 1], [-distance / 2, distance / 2]);
  const scale = useTransform(smooth, [0, 1], [1, scaleTo ?? 1]);

  if (reduced) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, y, ...(scaleTo ? { scale } : {}) }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------- Pointer micro-interaction */

/*
 * There is deliberately no pointer-following ("magnetic") wrapper for buttons.
 * A CTA that drifts under the cursor reads as a glitch rather than as polish —
 * buttons here respond with colour, shadow and the arrow nudge only.
 */

/**
 * Card that tilts a few degrees towards the pointer and lifts on hover.
 * Falls back to a plain wrapper under reduced motion.
 */
export function TiltCard({
  children,
  className,
  max = 5,
  lift = -8,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  lift?: number;
} & Omit<React.ComponentProps<typeof motion.div>, "style" | "whileHover" | "transition">) {
  const reduced = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20 });

  if (reduced) {
    return (
      <div className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      whileHover={{ y: lift }}
      transition={{ duration: LANDING_MOTION.duration.fast, ease: LANDING_MOTION.ease }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const py = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        ry.set(px * max);
        rx.set(-py * max);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------- Direction */

/**
 * `1` while the page reads left-to-right, `-1` while it reads right-to-left.
 *
 * Transforms are physical: `x: 40` moves right in both directions. Anything
 * whose motion carries meaning along the reading axis multiplies by this so the
 * gesture mirrors with the language instead of running backwards in Arabic.
 */
export function useInlineDirection(): 1 | -1 {
  const { language } = useLanguage();
  return language === "ar" ? -1 : 1;
}

/* ------------------------------------------------------------- Decorations */

/**
 * A single diagonal light pass over a photo or band, played once in view.
 *
 * The travel is an inline-axis move, so it runs right-to-left in Arabic. It has
 * to be computed rather than declared with an `rtl:` class: framer-motion writes
 * the whole `transform` inline, which beats any Tailwind transform utility on
 * the same element — the skew is part of the animated target for that reason.
 */
export function LightSweep({ className, delay = 0.2 }: { className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  const sign = useInlineDirection();
  if (reduced) return null;
  return (
    <motion.span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 -inset-x-1/3 z-20 w-1/3",
        "bg-gradient-to-r from-transparent via-white/25 to-transparent",
        className,
      )}
      initial={{ x: `${-40 * sign}%`, skewX: 12 * sign, opacity: 0 }}
      whileInView={{ x: `${420 * sign}%`, skewX: 12 * sign, opacity: [0, 1, 0] }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 1.5, delay, ease: "easeInOut" }}
    />
  );
}

/** Warm sand-grid texture used to give flat cream sections some structure. */
export function SandGrid({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        "[background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)]",
        "[background-size:56px_56px] opacity-[0.35]",
        "[mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]",
        className,
      )}
    />
  );
}

/* -------------------------------------------------------------- Scroll aids */

/** Reading-progress rail for the sticky landing header. */
export function ScrollProgressBar({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.span
      aria-hidden
      className={cn("absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary/80 rtl:origin-right", className)}
      style={{ scaleX }}
    />
  );
}

/** Which of the given section ids is currently in view. */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.2, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [ids.join(",")]);

  return active;
}

/** Has the page scrolled past `offset` — used to condense the header. */
export function useScrolledPast(offset = 24): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > offset);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset]);
  return past;
}

/**
 * Timed rotation through `count` items that a visitor can take over.
 *
 * `progress` is a MotionValue rather than state so the countdown ring can be
 * animated at frame rate without re-rendering the section on every tick.
 */
export function useAutoRotate({
  count,
  intervalMs = 5200,
  paused = false,
}: {
  count: number;
  intervalMs?: number;
  paused?: boolean;
}): { index: number; select: (i: number) => void; progress: MotionValue<number> } {
  const [index, setIndex] = useState(0);
  const progress = useMotionValue(0);
  const startedAt = useRef<number>(0);
  const holdRef = useRef(0);

  useEffect(() => {
    if (paused || count < 2 || reducedMotionPreferred()) {
      progress.set(paused ? progress.get() : 0);
      return;
    }
    let frame = 0;
    startedAt.current = performance.now() - holdRef.current;

    const tick = (now: number) => {
      const elapsed = now - startedAt.current;
      const ratio = Math.min(1, elapsed / intervalMs);
      progress.set(ratio);
      holdRef.current = elapsed;
      if (ratio >= 1) {
        holdRef.current = 0;
        progress.set(0);
        setIndex((prev) => (prev + 1) % count);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [count, intervalMs, paused, index, progress]);

  const select = (i: number) => {
    holdRef.current = 0;
    progress.set(0);
    setIndex(i);
  };

  return { index, select, progress };
}
