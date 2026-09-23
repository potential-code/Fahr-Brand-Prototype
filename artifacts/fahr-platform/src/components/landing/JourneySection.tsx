// Learner journey: the six-stage illustration, revealed behind a moving mask as
// the section comes up the viewport.

import React from "react";
import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, Briefcase, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import { LANDING_MOTION, LightSweep, RevealGroup, RevealItem } from "./motion";
import { SectionHeading, TYPE } from "./typography";

const OUTCOMES = [
  {
    icon: Compass,
    titleKey: "landing.journey.outcomes.baseline.title",
    bodyKey: "landing.journey.outcomes.baseline.body",
  },
  {
    icon: Briefcase,
    titleKey: "landing.journey.outcomes.applied.title",
    bodyKey: "landing.journey.outcomes.applied.body",
  },
  {
    icon: BadgeCheck,
    titleKey: "landing.journey.outcomes.validated.title",
    bodyKey: "landing.journey.outcomes.validated.body",
  },
];

export function JourneySection() {
  const [, setLocation] = useLocation();
  const reduced = useReducedMotion();
  const { t } = useLanguage();

  return (
    <section
      id="journey"
      className={cn("border-t border-border bg-gradient-to-b from-background to-white", TYPE.section)}
    >
      <div className={TYPE.gutter}>
        <SectionHeading
          eyebrow={t("landing.journey.eyebrow")}
          segments={[
            t("landing.journey.headline.line1"),
            { t: t("landing.journey.headline.accent"), accent: true },
            t("landing.journey.headline.line2"),
          ]}
          description={t("landing.journey.description")}
          className="mb-9 md:mb-12"
        />

        <div className="relative mx-auto max-w-5xl">
          {/*
            The mask lives on the inner wrapper, never on the observed element.
            A fully clipped element reports no intersection, so putting
            `clip-path: inset(... 100% ...)` on the `whileInView` target itself
            deadlocks: the reveal never fires and the diagram stays hidden.
          */}
          <motion.figure
            className="relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-lg md:rounded-3xl"
            initial={reduced ? undefined : "hidden"}
            whileInView={reduced ? undefined : "shown"}
            viewport={{ once: true, amount: 0.15 }}
            variants={{ hidden: { y: 26, opacity: 0.4 }, shown: { y: 0, opacity: 1 } }}
            transition={{ duration: 1.1, ease: LANDING_MOTION.ease }}
          >
            <motion.div
              variants={{
                hidden: { clipPath: "inset(0% 0% 100% 0%)" },
                shown: { clipPath: "inset(0% 0% 0% 0%)" },
              }}
              transition={{ duration: 1.1, ease: LANDING_MOTION.ease }}
            >
              <img
                src={`${import.meta.env.BASE_URL}brand/learner-journey.png`}
                alt={t("landing.journey.diagramAlt")}
                className="block h-auto w-full"
                loading="lazy"
                decoding="async"
                data-testid="img-learner-journey"
              />
            </motion.div>
            <LightSweep delay={0.5} />
          </motion.figure>
          <span
            aria-hidden
            className="absolute -bottom-3 start-1/2 h-6 w-[86%] -translate-x-1/2 rounded-[50%] bg-primary/10 blur-xl"
          />
        </div>

        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-3 md:mt-14 md:gap-5">
          {OUTCOMES.map(({ icon: Icon, titleKey, bodyKey }) => (
            <RevealItem
              key={titleKey}
              variant="up"
              className="group rounded-2xl border border-border/70 bg-white/70 p-5 transition-colors duration-300 hover:border-primary/40 hover:bg-white"
            >
              <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <h3 className={TYPE.h3}>{t(titleKey)}</h3>
              <p className={cn(TYPE.body, "mt-1.5")}>{t(bodyKey)}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-9 flex justify-center md:mt-12">
          <Button
            size="lg"
            onClick={() => setLocation("/learner")}
            data-testid="button-explore-journey"
            className="group h-auto rounded-full bg-primary px-7 py-4 text-sm text-primary-foreground shadow-md hover:bg-primary/90 md:text-base"
          >
            {t("landing.journey.cta")}
            <ArrowRight className="ms-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
