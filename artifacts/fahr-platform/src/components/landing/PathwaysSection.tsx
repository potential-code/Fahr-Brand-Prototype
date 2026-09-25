// Role pathways: one card per stakeholder portal, opening the registration
// dialog for that role.

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { STAKEHOLDERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LANDING_MOTION, RevealGroup, RevealItem, SandGrid, TiltCard } from "./motion";
import { ROLE_TITLE_KEYS } from "./roles";
import { SectionHeading, TYPE } from "./typography";

type Stakeholder = (typeof STAKEHOLDERS)[number];

const ROLE_META: Record<string, { image: string; blurbKey: string; badgeKey: string }> = {
  learner: {
    image: "stakeholder-learner.jpg",
    blurbKey: "landing.pathways.learner.blurb",
    badgeKey: "landing.pathways.learner.badge",
  },
  manager: {
    image: "stakeholder-manager.jpg",
    blurbKey: "landing.pathways.manager.blurb",
    badgeKey: "landing.pathways.manager.badge",
  },
  entity: {
    image: "stakeholder-entity.jpg",
    blurbKey: "landing.pathways.entity.blurb",
    badgeKey: "landing.pathways.entity.badge",
  },
  "fahr-team": {
    image: "stakeholder-fahr.jpg",
    blurbKey: "landing.pathways.fahrTeam.blurb",
    badgeKey: "landing.pathways.fahrTeam.badge",
  },
  leadership: {
    image: "stakeholder-leadership.jpg",
    blurbKey: "landing.pathways.leadership.blurb",
    badgeKey: "landing.pathways.leadership.badge",
  },
};

export function PathwaysSection({ onSelect }: { onSelect: (role: Stakeholder) => void }) {
  const { t } = useLanguage();
  return (
    <section id="pathways" className={cn("relative z-30 bg-background", TYPE.section)}>
      <SandGrid className="opacity-20" />
      <div className={cn("relative", TYPE.gutter)}>
        <SectionHeading
          eyebrow={t("landing.pathways.eyebrow")}
          segments={[
            t("landing.pathways.headline.line1"),
            { t: t("landing.pathways.headline.accent"), accent: true },
          ]}
          description={t("landing.pathways.description")}
          className="mb-10 md:mb-14"
        />

        <RevealGroup
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-5"
          stagger={LANDING_MOTION.stagger.cards}
        >
          {STAKEHOLDERS.map((stakeholder, i) => {
            const meta = ROLE_META[stakeholder.id];
            const title = t(ROLE_TITLE_KEYS[stakeholder.id]);
            return (
              <RevealItem key={stakeholder.id} variant="up">
                <TiltCard
                  className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-white shadow-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                  onClick={() => onSelect(stakeholder)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(stakeholder);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  data-testid={`card-role-${stakeholder.id}`}
                  aria-label={t("landing.pathways.registerAria", { title })}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[3/4]">
                    <img
                      src={`${import.meta.env.BASE_URL}brand/landing/${meta.image}`}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/45 to-transparent transition-opacity duration-500 group-hover:from-black/95"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right"
                    />

                    <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur-sm">
                      <span className="tabular-nums text-primary">0{i + 1}</span>
                      {t(meta.badgeKey)}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-4 text-start md:p-5">
                      <h3 className="mb-1 text-base font-bold leading-snug text-white">
                        {title}
                      </h3>
                      <p className="text-xs leading-relaxed text-white/70 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:transition-all lg:duration-500 lg:group-hover:max-h-24 lg:group-hover:opacity-100 lg:group-focus-within:max-h-24 lg:group-focus-within:opacity-100">
                        {t(meta.blurbKey)}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                        {t("landing.pathways.accessPortal")}
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </TiltCard>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
