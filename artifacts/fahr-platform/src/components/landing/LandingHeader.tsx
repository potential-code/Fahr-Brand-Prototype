// Sticky public header: condenses on scroll, marks the section you are reading,
// and carries a reading-progress rail along its lower edge.

import React, { useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_MOTION, ScrollProgressBar, useActiveSection, useScrolledPast } from "./motion";

const NAV_LINKS = [
  { id: "pathways", label: "Pathways" },
  { id: "journey", label: "Journey" },
  { id: "ecosystem", label: "Ecosystem" },
  { id: "lab", label: "AI Lab" },
];

const scrollToSection = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export function LandingHeader({ onRegister }: { onRegister: () => void }) {
  const condensed = useScrolledPast(32);
  const active = useActiveSection(NAV_LINKS.map((l) => l.id));
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      data-testid="header-landing"
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[padding,background-color,border-color,box-shadow] duration-300",
        "bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65",
        condensed ? "border-border py-2 shadow-sm" : "border-transparent py-3.5",
      )}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <img
              src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`}
              alt="Federal Authority for Government Human Resources"
              className={cn(
                "object-contain transition-[height] duration-300",
                condensed ? "h-7 md:h-8" : "h-8 md:h-10",
              )}
            />
          </button>
        </div>

        <nav className="hidden items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.id;
            return (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                data-testid={`link-nav-${link.id}`}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "text-primary" : "text-foreground/75 hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="landing-nav-active"
                    className="absolute inset-0 rounded-full bg-primary/10"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            className="hidden font-medium text-foreground hover:bg-primary/5 hover:text-primary md:inline-flex"
            asChild
          >
            <Link href="/login" data-testid="link-signin">
              Sign In
            </Link>
          </Button>
          <Button
            onClick={onRegister}
            data-testid="button-register-header"
            className="hidden rounded-full bg-primary px-5 text-primary-foreground shadow-sm hover:bg-primary/90 sm:inline-flex"
          >
            Register
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            data-testid="button-landing-menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
          >
            {menuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="landing-mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: LANDING_MOTION.ease }}
            className="overflow-hidden lg:hidden"
          >
            <div className="mx-auto mt-2 w-full max-w-7xl space-y-1 border-t border-border px-5 pt-3 pb-2 sm:px-6">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    setMenuOpen(false);
                    scrollToSection(link.id);
                  }}
                  className="block w-full rounded-lg px-3 py-2.5 text-start text-sm font-medium text-foreground hover:bg-primary/5"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-full" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  className="flex-1 rounded-full bg-primary text-primary-foreground"
                  onClick={() => {
                    setMenuOpen(false);
                    onRegister();
                  }}
                >
                  Register
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollProgressBar />
    </header>
  );
}
