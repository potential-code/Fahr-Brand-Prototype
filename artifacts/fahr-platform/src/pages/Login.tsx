import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Landmark,
  Loader2,
  Lock,
  Settings2,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LANDING_MOTION, Reveal, RevealHeading, SandGrid } from "@/components/landing/motion";
import { STAKEHOLDERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const PERSONA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  learner: User,
  manager: Users,
  entity: Building2,
  "fahr-team": Settings2,
  leadership: Landmark,
};

// Roving-focus arrow-key handler for the persona radiogroup cards.
// Horizontal keys follow the reading direction, so they stay intuitive in Arabic.
export function personaKeyNav(e: React.KeyboardEvent<HTMLDivElement>, role: string, setRole: (id: string) => void) {
  const ids = STAKEHOLDERS.map((s) => s.id as string);
  let next: number | null = null;
  const current = Math.max(0, ids.indexOf(role));
  const rtl =
    typeof document !== "undefined" &&
    getComputedStyle(e.currentTarget).direction === "rtl";
  const forward = rtl ? "ArrowLeft" : "ArrowRight";
  const back = rtl ? "ArrowRight" : "ArrowLeft";
  if (e.key === forward || e.key === "ArrowDown") next = (current + 1) % ids.length;
  else if (e.key === back || e.key === "ArrowUp") next = (current - 1 + ids.length) % ids.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = ids.length - 1;
  if (next !== null) {
    e.preventDefault();
    setRole(ids[next]);
    const target = e.currentTarget.querySelector<HTMLButtonElement>(`[data-persona-id="${ids[next]}"]`);
    target?.focus();
  }
}

/** Shared shell for the two public auth screens. */
export function AuthLayout({
  image,
  eyebrow,
  heading,
  blurb,
  aside,
  children,
}: {
  image: string;
  eyebrow?: React.ReactNode;
  heading: React.ComponentProps<typeof RevealHeading>["segments"];
  blurb: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background md:flex-row">
      {/* Visual side */}
      <div className="relative hidden overflow-hidden bg-background md:sticky md:top-0 md:flex md:h-[100dvh] md:w-1/2 md:items-end">
        {/* Slow push-in on the photograph; still on request. */}
        <motion.img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.04 }}
          animate={reduced ? { scale: 1.04 } : { scale: 1.12 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 26, ease: "linear", repeat: Infinity, repeatType: "reverse" }
          }
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/20"
        />
        <SandGrid className="opacity-[0.18]" />

        <div className="relative z-10 max-w-lg p-10 pb-14 lg:p-12">
          {eyebrow}
          <RevealHeading
            as="h1"
            onMount
            delay={0.1}
            segments={heading}
            className="text-[1.75rem] font-bold leading-[1.14] tracking-tight text-white md:text-4xl"
          />
          <Reveal variant="up" delay={0.35}>
            <p className="mt-4 text-sm leading-relaxed text-white/75 md:text-base">{blurb}</p>
          </Reveal>
          {aside}
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex w-full items-center justify-center p-6 sm:p-12 md:w-1/2 lg:p-16">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 pt-6 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="me-2 h-4 w-4 rtl:-scale-x-100" /> Back to portal
          </Link>
          <img
            src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`}
            alt="FAHR"
            className="h-9 object-contain"
          />
        </div>

        <div className="w-full max-w-md pt-20 md:pt-0">{children}</div>
      </div>
    </div>
  );
}

/** Staggered entrance for a stack of form rows. */
export function FormStack({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="shown"
      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } }}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{ hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.45, ease: LANDING_MOTION.ease }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/** Demo-persona radiogroup shared by sign in and register. */
export function PersonaPicker({
  role,
  setRole,
  label,
  hint,
  ariaLabel,
}: {
  role: string;
  setRole: (id: string) => void;
  label: string;
  hint: string;
  ariaLabel: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <Label htmlFor="role" className="font-semibold text-primary">
        {label}
      </Label>
      <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
      <div
        className="grid grid-cols-2 gap-2.5"
        role="radiogroup"
        aria-label={ariaLabel}
        onKeyDown={(e) => personaKeyNav(e, role, setRole)}
      >
        {STAKEHOLDERS.map((s, i) => {
          const Icon = PERSONA_ICONS[s.id] ?? User;
          const selected = role === s.id;
          return (
            <motion.button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-persona-id={s.id}
              tabIndex={selected || (!role && i === 0) ? 0 : -1}
              onClick={() => setRole(s.id)}
              whileHover={reduced ? undefined : { y: -2 }}
              whileTap={reduced ? undefined : { scale: 0.985 }}
              transition={{ duration: 0.2, ease: LANDING_MOTION.ease }}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                selected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={cn(
                  "text-[0.8125rem] font-medium leading-tight",
                  selected ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.title}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setTimeout(() => {
      const stakeholder = STAKEHOLDERS.find(s => s.id === role);
      if (stakeholder) {
        setLocation(stakeholder.route);
      }
    }, 1000);
  };

  return (
    <AuthLayout
      image={`${import.meta.env.BASE_URL}brand/landing/hero-bg.jpg`}
      heading={["Welcome back to your", { t: "Agentic AI workspace", accent: true }]}
      blurb="Continue your personalised learning pathway, collaborate with your AI agents, and track your capability progress across the federal ecosystem."
      aside={
        <Reveal variant="fade" delay={0.5}>
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-5">
            {[
              { icon: ShieldCheck, label: "Federal single sign-on" },
              { icon: Lock, label: "UAE data residency" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 text-xs text-white/70">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </Reveal>
      }
    >
      <div className="space-y-7">
        <div className="text-center md:text-start">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Sign in</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Access your government AI learning profile
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <FormStack className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Government Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" placeholder="name@entity.gov.ae" required defaultValue="demo@mohap.gov.ae" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>
              </div>
              <Input id="password" name="password" type="password" autoComplete="current-password" required defaultValue="password123" />
            </div>

            <PersonaPicker
              role={role}
              setRole={setRole}
              label="Select demo persona"
              hint="For demonstration purposes, select which view you want to explore."
              ariaLabel="Select demo persona"
            />
          </FormStack>

          <Button type="submit" className="h-12 w-full text-base" disabled={loading || !role}>
            {loading ? (
              <>
                <Loader2 className="me-2 h-5 w-5 animate-spin" /> Authenticating…
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
