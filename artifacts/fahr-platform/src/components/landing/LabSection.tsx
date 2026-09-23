// Agentic AI Lab: the practical-application section. Photograph on one side,
// claim and evidence on the other, with programme figures drawn from the
// federal data spine.

import React from "react";
import { useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { CountUp } from "@/components/CountUp";
import { useLanguage } from "@/lib/LanguageContext";
import { AGENTS } from "@/lib/constants";
import { FEDERAL } from "@/lib/federal";
import { cn } from "@/lib/utils";
import { LANDING_MOTION, LightSweep, Reveal, RevealGroup, RevealItem, SandGrid } from "./motion";
import { SectionHeading, TYPE } from "./typography";

const POINTS: { key: string; params?: Record<string, string> }[] = [
  { key: "landing.lab.points.simulate" },
  { key: "landing.lab.points.collaborate", params: { agent: AGENTS.practice } },
  { key: "landing.lab.points.translate" },
  { key: "landing.lab.points.governed" },
];

const LAB_STATS = [
  { value: FEDERAL.twins, key: "landing.lab.stats.twins" },
  { value: FEDERAL.projectsSubmitted, key: "landing.lab.stats.projects" },
  { value: FEDERAL.hoursSavedPerMonth, key: "landing.lab.stats.hours" },
];

export function LabSection() {
  const reduced = useReducedMotion();
  const { t } = useLanguage();

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
                alt={t("landing.lab.imageAlt")}
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
                    {t("landing.lab.sandboxActive")}
                  </span>
                </span>
              </div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="start"
              eyebrow={t("landing.lab.eyebrow")}
              segments={[
                t("landing.lab.headline.line1"),
                { t: t("landing.lab.headline.accent"), accent: true },
              ]}
              description={t("landing.lab.description")}
              className="mb-6"
            />

            <RevealGroup as="ul" className="space-y-2.5" stagger={LANDING_MOTION.stagger.tight}>
              {POINTS.map((point) => (
                <RevealItem as="li" key={point.key} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground/90 md:text-[0.9375rem]">
                    {t(point.key, point.params)}
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>

            <RevealGroup className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-6">
              {LAB_STATS.map((stat) => (
                <RevealItem key={stat.key}>
                  <p className="text-lg font-bold text-foreground md:text-2xl">
                    <CountUp to={stat.value} />
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                    {t(stat.key)}
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
