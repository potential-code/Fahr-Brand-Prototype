// Agentic AI Lab: the practical-application section. Photograph on one side,
// claim and evidence on the other, with programme figures drawn from the
// federal data spine.

import React from "react";
import { useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { FEDERAL } from "@/lib/federal";
import { cn } from "@/lib/utils";
import { LANDING_MOTION, LightSweep, Reveal, RevealGroup, RevealItem, SandGrid } from "./motion";
import { SectionHeading, TYPE } from "./typography";

const POINTS = [
  "Safely simulate entity-specific scenarios",
  "Collaborate with the AI Practice Partner",
  "Translate capability into real efficiency gains",
  "Governed by UAE data privacy standards",
];

const LAB_STATS = [
  { value: FEDERAL.twins, label: "AI digital twins built" },
  { value: FEDERAL.projectsSubmitted, label: "Workplace projects submitted" },
  { value: FEDERAL.hoursSavedPerMonth, label: "Hours saved each month" },
];

export function LabSection() {
  const reduced = useReducedMotion();

  return (
    <section
      id="lab"
      className={cn("relative overflow-hidden border-b border-border bg-background", TYPE.section)}
    >
      <SandGrid className="opacity-25" />
      <span
        aria-hidden
        className="absolute -end-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />

      <div className={cn("relative", TYPE.gutter)}>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <Reveal variant="clip" className="order-2 lg:order-1" amount={0.2}>
            <div className="relative overflow-hidden rounded-2xl border border-border shadow-xl md:rounded-3xl">
              <img
                src={`${import.meta.env.BASE_URL}brand/landing/section-lab.jpg`}
                alt="Federal employees working in the Agentic AI Lab"
                loading="lazy"
                decoding="async"
                className="h-auto w-full"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent"
              />
              <LightSweep delay={0.4} />
              <div className="absolute inset-x-5 bottom-5 flex items-center gap-3">
                <span className="inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/15 px-3.5 py-2 backdrop-blur-md">
                  <span className="relative flex h-2.5 w-2.5">
                    {!reduced && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    )}
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                  <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-white">
                    SECURE SANDBOX ACTIVE
                  </span>
                </span>
              </div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="start"
              eyebrow="Practical Application"
              segments={["The Agentic AI Lab", { t: "& Digital Twin", accent: true }]}
              description="Learning becomes measurable outcomes. The Lab is a secure, sandboxed environment where federal employees build, test and refine real agentic workflows — without touching production data."
              className="mb-6"
            />

            <RevealGroup as="ul" className="space-y-2.5" stagger={LANDING_MOTION.stagger.tight}>
              {POINTS.map((point) => (
                <RevealItem as="li" key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground/90 md:text-[0.9375rem]">
                    {point}
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>

            <RevealGroup className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-6">
              {LAB_STATS.map((stat) => (
                <RevealItem key={stat.label}>
                  <p className="text-lg font-bold text-foreground md:text-2xl">
                    <CountUp to={stat.value} />
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                    {stat.label}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </div>
    </section>
  );
}
