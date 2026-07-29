import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthLayout, FormStack, PersonaPicker } from "@/pages/Login";
import { LANDING_MOTION, Reveal } from "@/components/landing/motion";
import { STAKEHOLDERS } from "@/lib/constants";

const ENTITIES = [
  { value: "mohap", label: "Ministry of Health and Prevention" },
  { value: "moe", label: "Ministry of Education" },
  { value: "mof", label: "Ministry of Finance" },
  { value: "moei", label: "Ministry of Economy" },
  { value: "fahr", label: "FAHR" },
];

const BENEFITS = [
  "Personalised AI coaching",
  "Simulated digital twin environments",
  "Federal certification pathways",
];

export default function Signup() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const reduced = useReducedMotion();
  const timers = useRef<number[]>([]);

  // Drop pending provisioning timers if the visitor leaves mid-submission.
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    timers.current.push(
      window.setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        timers.current.push(
          window.setTimeout(() => {
            const stakeholder = STAKEHOLDERS.find(s => s.id === role);
            if (stakeholder) {
              setLocation(stakeholder.route);
            }
          }, 1500),
        );
      }, 1200),
    );
  };

  return (
    <AuthLayout
      image={`${import.meta.env.BASE_URL}brand/landing/section-lab.jpg`}
      eyebrow={
        <Reveal variant="fade">
          <span className="mb-5 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <Shield className="me-2 h-3.5 w-3.5 text-primary" /> Secure federal enclave
          </span>
        </Reveal>
      }
      heading={["Begin your Agentic AI", { t: "capability journey", accent: true }]}
      blurb="Join the federal learning ecosystem to develop practical AI skills, test agentic workflows, and track your progress against national competency frameworks."
      aside={
        <Reveal variant="fade" delay={0.5}>
          <ul className="mt-7 space-y-2.5 border-t border-white/15 pt-5">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-center text-sm font-medium text-white/85">
                <CheckCircle2 className="me-3 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      }
    >
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: LANDING_MOTION.ease }}
            className="space-y-7 pb-8"
          >
            <div className="text-center md:text-start">
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Create profile
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Provision your learning workspace
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <FormStack className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Aisha" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Al Mansoori" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Government Email</Label>
                  <Input id="email" type="email" placeholder="aisha@mohap.gov.ae" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity">Federal Entity</Label>
                  <Select>
                    <SelectTrigger id="entity">
                      <SelectValue placeholder="Select your entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITIES.map((entity) => (
                        <SelectItem key={entity.value} value={entity.value}>
                          {entity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <PersonaPicker
                  role={role}
                  setRole={setRole}
                  label="Platform persona (demo)"
                  hint="Select your role to access the corresponding dashboard."
                  ariaLabel="Select platform persona"
                />
              </FormStack>

              <Button type="submit" className="h-12 w-full text-base" disabled={loading || !role}>
                {loading ? (
                  <>
                    <Loader2 className="me-2 h-5 w-5 animate-spin" /> Provisioning workspace…
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in here
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: LANDING_MOTION.ease }}
            className="flex flex-col items-center justify-center space-y-5 py-12 text-center"
          >
            <div className="relative mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              {!reduced && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border-4 border-primary"
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: 1.25, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                />
              )}
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Profile provisioned
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground md:text-base">
              Your Agentic AI workspace is ready. Redirecting you to your dashboard…
            </p>
            <Loader2 className="mt-4 h-7 w-7 animate-spin text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
