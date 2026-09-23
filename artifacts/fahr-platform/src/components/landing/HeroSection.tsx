// Landing hero: parallax photograph, masked headline and a programme-scale
// stat strip drawn from the federal data spine.

import React from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { useLanguage } from "@/lib/LanguageContext";
import { STAKEHOLDERS } from "@/lib/constants";
import { FEDERAL } from "@/lib/federal";
import { SPECIALISED_AGENTS } from "./agents";
import { LANDING_MOTION, LightSweep, Parallax, RevealHeading } from "./motion";
import { TYPE } from "./typography";

const HERO_STATS: { value: number; suffix?: string; key: string }[] = [
  { value: FEDERAL.employees, key: "landing.hero.stats.employees" },
  { value: FEDERAL.ministriesTotal, key: "landing.hero.stats.entities" },
  { value: SPECIALISED_AGENTS.length, key: "landing.hero.stats.agents" },
  { value: STAKEHOLDERS.length, key: "landing.hero.stats.portals" },
];

export function HeroSection({ onPrimary }: { onPrimary: () => void }) {
  const reduced = useReducedMotion();
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative flex min-h-[86vh] w-full items-center overflow-hidden md:min-h-[calc(100dvh-72px)]"
    >
      <Parallax
        className="absolute inset-0 h-[118%] w-full"
        distance={LANDING_MOTION.parallax.strong}
        scaleTo={1.08}
      >
        <img
          src={`${import.meta.env.BASE_URL}brand/landing/hero-bg.jpg`}
          alt=""
          className="h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
      </Parallax>
      <div aria-hidden className="absolute inset-0 z-10 bg-gradient-to-r from-black/88 via-black/60 to-black/25" />
      <div aria-hidden className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
      <LightSweep className="z-20" delay={0.9} />

      <div className={`relative z-30 ${TYPE.gutter} py-20 md:py-24`}>
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: LANDING_MOTION.ease }}
            className="mb-5 inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm"
          >
            <Shield className="me-2 h-3.5 w-3.5 text-primary" />
            {t("landing.hero.badge")}
          </motion.div>

          <RevealHeading
            as="h1"
            onMount
            delay={0.15}
            segments={[
              t("landing.hero.headline.line1"),
              { t: t("landing.hero.headline.accent"), accent: true },
              t("landing.hero.headline.line2"),
            ]}
            className={`${TYPE.hero} mb-4 text-white`}
          />

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: LANDING_MOTION.ease }}
            className="mb-7 max-w-xl text-sm leading-relaxed text-white/80 md:text-base"
          >
            {t("landing.hero.sub", { count: FEDERAL.employees.toLocaleString("en-US") })}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42, ease: LANDING_MOTION.ease }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={onPrimary}
              data-testid="button-hero-start"
              className="group h-auto w-full rounded-full bg-primary px-7 py-4 text-sm text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 sm:w-auto md:text-base"
            >
              {t("landing.hero.ctaPrimary")}
              <ArrowRight className="ms-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-auto w-full rounded-full border-white/40 bg-white/5 px-7 py-4 text-sm text-white backdrop-blur-sm hover:bg-white/15 hover:text-white sm:w-auto md:text-base"
            >
              <Link href="/login" data-testid="link-hero-login">
                {t("landing.hero.ctaLogin")}
              </Link>
            </Button>
          </motion.div>

          <motion.dl
            initial="hidden"
            animate="shown"
            variants={{ hidden: {}, shown: { transition: { delayChildren: 0.52, staggerChildren: 0.07 } } }}
            className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-6 sm:grid-cols-4 sm:gap-x-4"
          >
            {HERO_STATS.map((stat) => (
              <motion.div
                key={stat.key}
                variants={{ hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: LANDING_MOTION.ease }}
              >
                <dt className="text-lg font-bold text-white md:text-xl">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </dt>
                <dd className="mt-0.5 text-[11px] leading-tight text-white/60 md:text-xs">
                  {t(stat.key)}
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </div>

      {!reduced && (
        <motion.button
          type="button"
          onClick={() => document.getElementById("pathways")?.scrollIntoView({ behavior: "smooth" })}
          aria-label={t("landing.hero.scrollAria")}
          className="absolute bottom-6 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/70 hover:text-white md:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{
            opacity: { delay: 1, duration: 0.6 },
            y: { repeat: Infinity, duration: 2.4, ease: "easeInOut" },
          }}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
            {t("landing.hero.explore")}
          </span>
          <ChevronDown className="h-4 w-4" />
        </motion.button>
      )}
    </section>
  );
}
