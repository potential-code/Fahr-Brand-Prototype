import React, { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Distance in pixels the block travels up into place. */
  y?: number;
  /** Seconds to wait before the reveal starts. */
  delay?: number;
  /**
   * When set, each direct child is revealed in turn with this gap in seconds
   * instead of the block moving as one piece.
   */
  stagger?: number;
  /** Rendered element. `section` keeps page landmarks meaningful. */
  as?: "div" | "section";
};

/**
 * GSAP ScrollTrigger reveal for a whole block of the page.
 *
 * Section-level motion only — inner elements (bars, rings, counters) animate
 * with framer-motion. Running both on the same node fights over the transform,
 * so keep the two layers separate.
 */
export function ScrollReveal({
  children,
  className,
  y = 28,
  delay = 0,
  stagger,
  as = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const targets = stagger !== undefined ? Array.from(el.children) : el;
      if (Array.isArray(targets) && targets.length === 0) return;

      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.6,
        delay,
        ease: "power2.out",
        stagger: stagger ?? 0,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    },
    { scope: ref, dependencies: [stagger, y, delay] },
  );

  const Tag = as;
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement & HTMLElement>} className={className}>
      {children}
    </Tag>
  );
}
