// Pre-footer call to action.

import React from "react";
import { Link } from "wouter";
import { ArrowRight, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_MOTION, LightSweep, Parallax, Reveal, RevealHeading } from "./motion";
import { TYPE } from "./typography";

const ASSURANCES = [
  { icon: ShieldCheck, label: "Federal governance built in" },
  { icon: Lock, label: "UAE data residency" },
  { icon: Sparkles, label: "Arabic and English" },
];

export function CtaSection({ onRegister }: { onRegister: () => void }) {
  return (
    <section className={cn("relative overflow-hidden border-b border-border", TYPE.section)}>
      <Parallax className="absolute inset-0 h-[120%]" distance={LANDING_MOTION.parallax.medium} scaleTo={1.06}>
        <img
          src={`${import.meta.env.BASE_URL}brand/landing/cta-band.jpg`}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </Parallax>
      <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/40" />
      <LightSweep delay={0.3} />

      <div className={cn("relative z-10 text-center", TYPE.gutter)}>
        <RevealHeading
          as="h2"
          segments={["Ready to accelerate", { t: "your AI journey?", accent: true }]}
          className={cn(TYPE.h2, "mx-auto max-w-2xl text-balance text-white")}
        />
        <Reveal variant="up" delay={0.1}>
          <p className="mx-auto mt-3.5 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            Join the UAE's unified platform for artificial intelligence capability building across the
            federal government.
          </p>
        </Reveal>

        <Reveal variant="up" delay={0.18} className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={onRegister}
            data-testid="button-cta-register"
            className="group h-auto rounded-full bg-primary px-7 py-4 text-sm text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 md:text-base"
          >
            Register for access
            <ArrowRight className="ms-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-auto rounded-full border-white/40 bg-white/5 px-7 py-4 text-sm text-white backdrop-blur-sm hover:bg-white/15 hover:text-white md:text-base"
          >
            <Link href="/login">I already have an account</Link>
          </Button>
        </Reveal>

        <Reveal variant="fade" delay={0.3}>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
            {ASSURANCES.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 text-[11px] font-medium text-white/70 md:text-xs">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
