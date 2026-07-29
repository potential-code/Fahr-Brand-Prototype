// Learner journey: the six-stage illustration, revealed behind a moving mask as
// the section comes up the viewport.

import React from "react";
import { useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, Briefcase, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_MOTION, LightSweep, Magnetic, RevealGroup, RevealItem } from "./motion";
import { SectionHeading, TYPE } from "./typography";

const OUTCOMES = [
  {
    icon: Compass,
    title: "An AI-informed baseline",
    body: "Every employee starts from an assessed position against the federal capability ladder — not a generic course list.",
  },
  {
    icon: Briefcase,
    title: "Applied to real work",
    body: "Capability is practised in a sandbox, then applied to a workplace project their line manager can see.",
  },
  {
    icon: BadgeCheck,
    title: "Validated and recognised",
    body: "Evidence is reviewed, credentials are issued, and the impact rolls up to entity and federal reporting.",
  },
];

export function JourneySection() {
  const [, setLocation] = useLocation();
  const reduced = useReducedMotion();

  return (
    <section
      id="journey"
      className={cn("border-t border-border bg-gradient-to-b from-background to-white", TYPE.section)}
    >
      <div className={TYPE.gutter}>
        <SectionHeading
          eyebrow="The Learner Journey"
          segments={["Six stages,", { t: "one continuous", accent: true }, "experience"]}
          description="Every federal employee follows the same guided arc — from an AI-informed understanding of their role, through personalised learning and real workplace application, to validated capability and measurable impact."
          className="mb-9 md:mb-12"
        />

        <div className="relative mx-auto max-w-5xl">
          <motion.figure
            className="relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-lg md:rounded-3xl"
            initial={
              reduced ? undefined : { clipPath: "inset(0% 0% 100% 0%)", y: 26, opacity: 0.4 }
            }
            whileInView={
              reduced ? undefined : { clipPath: "inset(0% 0% 0% 0%)", y: 0, opacity: 1 }
            }
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.1, ease: LANDING_MOTION.ease }}
          >
            <img
              src={`${import.meta.env.BASE_URL}brand/learner-journey.png`}
              alt="Diagram of the six-stage FAHR learner journey, running from onboarding and profiling through to recognition and measurable impact."
              className="block h-auto w-full"
              loading="lazy"
              decoding="async"
              data-testid="img-learner-journey"
            />
            <LightSweep delay={0.5} />
          </motion.figure>
          <span
            aria-hidden
            className="absolute -bottom-3 start-1/2 h-6 w-[86%] -translate-x-1/2 rounded-[50%] bg-primary/10 blur-xl"
          />
        </div>

        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-3 md:mt-14 md:gap-5">
          {OUTCOMES.map(({ icon: Icon, title, body }) => (
            <RevealItem
              key={title}
              variant="up"
              className="group rounded-2xl border border-border/70 bg-white/70 p-5 transition-colors duration-300 hover:border-primary/40 hover:bg-white"
            >
              <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <h3 className={TYPE.h3}>{title}</h3>
              <p className={cn(TYPE.body, "mt-1.5")}>{body}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-9 flex justify-center md:mt-12">
          <Magnetic strength={5}>
            <Button
              size="lg"
              onClick={() => setLocation("/learner")}
              data-testid="button-explore-journey"
              className="group h-auto rounded-full bg-primary px-7 py-4 text-sm text-primary-foreground shadow-md hover:bg-primary/90 md:text-base"
            >
              Walk through the journey
              <ArrowRight className="ms-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
            </Button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
