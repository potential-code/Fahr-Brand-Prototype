// Public footer.

import React from "react";
import { Link } from "wouter";
import { ArrowUp } from "lucide-react";
import { STAKEHOLDERS } from "@/lib/constants";
import { FEDERAL } from "@/lib/federal";
import { cn } from "@/lib/utils";
import { Reveal, RevealGroup, RevealItem } from "./motion";
import { TYPE } from "./typography";

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export function LandingFooter() {
  return (
    <footer className="bg-[#2a2825] pt-14 pb-8 text-white md:pt-16">
      <div className={TYPE.gutter}>
        <RevealGroup className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10 lg:grid-cols-5">
          <RevealItem className="col-span-2">
            <span className="mb-5 inline-block rounded-md bg-white px-2.5 py-1.5">
              <img
                src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`}
                alt="Federal Authority for Government Human Resources"
                className="h-9 object-contain"
                loading="lazy"
              />
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-white/65">
              Empowering federal government employees with the capability required for an AI-enabled
              future — across {FEDERAL.ministriesTotal} entities and{" "}
              {FEDERAL.employees.toLocaleString("en-US")} employees.
            </p>
          </RevealItem>

          <RevealItem>
            <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
              Platform
            </h2>
            <ul className="space-y-2.5 text-sm text-white/65">
              {[
                { id: "pathways", label: "Pathways" },
                { id: "journey", label: "Learner journey" },
                { id: "ecosystem", label: "AI agents" },
                { id: "lab", label: "AI Lab" },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollTo(link.id)}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </RevealItem>

          <RevealItem>
            <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
              Portals
            </h2>
            <ul className="space-y-2.5 text-sm text-white/65">
              {STAKEHOLDERS.map((s) => (
                <li key={s.id}>
                  <Link href={s.route} className="transition-colors hover:text-white">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </RevealItem>

          <RevealItem>
            <h2 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
              Access
            </h2>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li>
                <Link href="/login" className="transition-colors hover:text-white">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/signup" className="transition-colors hover:text-white">
                  Register
                </Link>
              </li>
              <li>
                <button onClick={() => scrollTo("ecosystem")} className="transition-colors hover:text-white">
                  Responsible AI
                </button>
              </li>
            </ul>
          </RevealItem>
        </RevealGroup>

        <Reveal
          variant="fade"
          className={cn(
            "mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6",
            "md:flex-row",
          )}
        >
          <p className="text-xs text-white/45">
            &copy; {new Date().getFullYear()} Federal Authority for Government Human Resources. All
            rights reserved.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-white/35 hover:text-white"
          >
            Back to top
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </Reveal>
      </div>
    </footer>
  );
}
