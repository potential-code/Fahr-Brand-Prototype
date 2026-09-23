// The capability ecosystem — the six specialised agents.
//
// Layout is the familiar photograph-plus-list, but the list is now the control
// for a detail panel: what the agent does, which journey stages it is present
// in, and a representative line of its output. The list advances on a timer
// that the visitor can take over, and hovering anywhere in the section pauses
// it so nothing moves out from under a reader.

import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import { JOURNEY_STAGES, SPECIALISED_AGENTS } from "./agents";
import { LANDING_MOTION, Parallax, useAutoRotate } from "./motion";
import { SectionHeading, TYPE } from "./typography";

const ROTATE_MS = 6200;

export function EcosystemSection() {
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const { t } = useLanguage();
  const { index, select, progress } = useAutoRotate({
    count: SPECIALISED_AGENTS.length,
    intervalMs: ROTATE_MS,
    paused,
  });
  const agent = SPECIALISED_AGENTS[index];
  const ActiveIcon = agent.icon;

  return (
    <section id="ecosystem" className={cn("border-y border-border bg-white", TYPE.section)}>
      <div className={TYPE.gutter}>
        <SectionHeading
          eyebrow={t("landing.ecosystem.eyebrow")}
          segments={[
            t("landing.ecosystem.headline.line1"),
            { t: t("landing.ecosystem.headline.accent"), accent: true },
          ]}
          description={t("landing.ecosystem.description")}
          className="mb-9 md:mb-12"
        />

        <div
          className="grid items-start gap-6 lg:grid-cols-[1.02fr_1fr] lg:gap-10"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          data-testid="ecosystem-agents"
        >
          {/* Photograph, keyed to the active agent */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 shadow-xl md:rounded-3xl">
            <AnimatePresence initial={false}>
              <motion.div
                key={agent.key}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.8, ease: "easeOut" }}
              >
                <Parallax className="absolute inset-0 h-[112%]" distance={36} scaleTo={1.05}>
                  <img
                    src={`${import.meta.env.BASE_URL}${agent.image}`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </Parallax>
              </motion.div>
            </AnimatePresence>
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
            />

            <span className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
              {t("landing.ecosystem.agentLabel")}
              <span className="tabular-nums text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-white/50">
                / {String(SPECIALISED_AGENTS.length).padStart(2, "0")}
              </span>
            </span>

            <div className="absolute inset-x-4 bottom-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={agent.key}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: reduced ? 0 : 0.36, ease: LANDING_MOTION.ease }}
                  className="inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/25 bg-white/12 px-3 py-2.5 backdrop-blur-md"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <ActiveIcon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {agent.name}
                    </span>
                    <span className="block truncate text-[11px] text-white/70">{agent.tagline}</span>
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Agent selector */}
          <ul className="flex flex-col gap-1" role="list">
            {SPECIALISED_AGENTS.map((item, i) => {
              const Icon = item.icon;
              const isActive = i === index;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => select(i)}
                    aria-pressed={isActive}
                    data-testid={`button-agent-${item.key}`}
                    className={cn(
                      "relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-start transition-colors duration-300 md:px-5",
                      isActive
                        ? "border-primary/40 bg-background shadow-sm"
                        : "border-transparent hover:border-border hover:bg-background/70",
                    )}
                  >
                    <span className="flex items-center gap-3.5">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-sm font-bold transition-colors duration-300 md:text-[0.9375rem]",
                            isActive ? "text-foreground" : "text-foreground/70",
                          )}
                        >
                          {item.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">{item.tagline}</span>
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 transition-all duration-300",
                          isActive
                            ? "text-primary rtl:-scale-x-100"
                            : "text-muted-foreground/40 rtl:-scale-x-100",
                        )}
                      />
                    </span>
                    {/* Countdown for the active row — a MotionValue, so the
                        timer never re-renders the section. */}
                    {isActive && !reduced && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary/60"
                        style={{ scaleX: progress }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detail panel for the active agent */}
        <div
          className="relative mt-5 overflow-hidden rounded-2xl border border-border/70 bg-background md:mt-7 md:rounded-3xl"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={agent.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0 : 0.34, ease: LANDING_MOTION.ease }}
              className="grid gap-6 p-5 md:grid-cols-[1fr_1.05fr] md:gap-8 md:p-7"
              data-testid="panel-agent-detail"
            >
              <div>
                <h3 className={cn(TYPE.h3, "text-lg md:text-xl")}>{agent.name}</h3>
                <p className={cn(TYPE.body, "mt-2 max-w-md")}>{agent.description}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {agent.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="inline-flex items-center rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary"
                    >
                      {capability}
                    </span>
                  ))}
                </div>

                <div className="mt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("landing.ecosystem.presentIn")}
                  </span>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {JOURNEY_STAGES.map((stage) => {
                      const on = agent.stages.includes(stage);
                      return (
                        <li
                          key={stage}
                          className={cn(
                            "rounded-md border px-2 py-1 text-[11px] transition-colors duration-300",
                            on
                              ? "border-border bg-white font-semibold text-foreground"
                              : "border-transparent bg-muted/60 text-muted-foreground/60",
                          )}
                        >
                          {stage}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Representative output */}
              <figure className="relative flex flex-col justify-between rounded-2xl border border-border bg-white p-4 shadow-sm md:p-5">
                <figcaption className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  {t("landing.ecosystem.sampleOutput")}
                </figcaption>
                <blockquote className="text-sm leading-relaxed text-foreground/90 md:text-[0.9375rem]">
                  {reduced ? (
                    agent.sample
                  ) : (
                    <motion.span
                      initial="hidden"
                      animate="shown"
                      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.014, delayChildren: 0.1 } } }}
                    >
                      {agent.sample.split(" ").map((word, wi) => (
                        <motion.span
                          key={`${agent.key}-${wi}`}
                          className="inline-block"
                          variants={{
                            hidden: { opacity: 0, y: 6 },
                            shown: { opacity: 1, y: 0 },
                          }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                        >
                          {word}
                          <span className="inline-block w-[0.28em]" />
                        </motion.span>
                      ))}
                    </motion.span>
                  )}
                </blockquote>
                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    {!reduced && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                    )}
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {t("landing.ecosystem.generatedNote")}
                </div>
              </figure>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("landing.ecosystem.footnote")}
        </p>
      </div>
    </section>
  );
}
