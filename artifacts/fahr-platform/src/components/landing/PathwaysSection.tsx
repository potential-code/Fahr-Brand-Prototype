// Role pathways: one card per stakeholder portal, opening the registration
// dialog for that role.

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { STAKEHOLDERS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LANDING_MOTION, RevealGroup, RevealItem, SandGrid, TiltCard } from "./motion";
import { SectionHeading, TYPE } from "./typography";

type Stakeholder = (typeof STAKEHOLDERS)[number];

const ROLE_META: Record<string, { image: string; blurb: string; badge: string }> = {
  learner: {
    image: "stakeholder-learner.jpg",
    blurb: "Build practical AI capability inside your own role, with a coach that adapts every week.",
    badge: "Learner",
  },
  manager: {
    image: "stakeholder-manager.jpg",
    blurb: "See your team's gaps, validate real workplace application and recognise progress.",
    badge: "Department manager",
  },
  entity: {
    image: "stakeholder-entity.jpg",
    blurb: "Run adoption across departments — cohorts, content, approvals and governance.",
    badge: "Entity admin",
  },
  "fahr-team": {
    image: "stakeholder-fahr.jpg",
    blurb: "Operate the national programme: entities, credentials, escalations and integrations.",
    badge: "Programme team",
  },
  leadership: {
    image: "stakeholder-leadership.jpg",
    blurb: "Track national readiness, value created and where intervention is needed next.",
    badge: "Leadership",
  },
};

export function PathwaysSection({ onSelect }: { onSelect: (role: Stakeholder) => void }) {
  return (
    <section id="pathways" className={cn("relative z-30 bg-background", TYPE.section)}>
      <SandGrid className="opacity-20" />
      <div className={cn("relative", TYPE.gutter)}>
        <SectionHeading
          eyebrow="Tailored Pathways"
          segments={["Select your", { t: "federal role", accent: true }]}
          description="Every stakeholder gets their own portal — personalised learning for employees, validation tools for managers, and national oversight for FAHR and federal leadership."
          className="mb-10 md:mb-14"
        />

        <RevealGroup
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-5"
          stagger={LANDING_MOTION.stagger.cards}
        >
          {STAKEHOLDERS.map((stakeholder, i) => {
            const meta = ROLE_META[stakeholder.id];
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
                  aria-label={`Register as ${stakeholder.title}`}
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
                      className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100"
                    />

                    <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/85 backdrop-blur-sm">
                      <span className="tabular-nums text-primary">0{i + 1}</span>
                      {meta.badge}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-4 text-start md:p-5">
                      <h3 className="mb-1 text-base font-bold leading-snug text-white">
                        {stakeholder.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-white/70 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:transition-all lg:duration-500 lg:group-hover:max-h-24 lg:group-hover:opacity-100 lg:group-focus-within:max-h-24 lg:group-focus-within:opacity-100">
                        {meta.blurb}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                        Access portal
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
