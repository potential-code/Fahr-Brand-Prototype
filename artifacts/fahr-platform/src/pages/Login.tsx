import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAKEHOLDERS } from "@/lib/constants";
import { ArrowLeft, Loader2, User, Users, Building2, Settings2, Landmark } from "lucide-react";
import { motion } from "framer-motion";

export const PERSONA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  learner: User,
  manager: Users,
  entity: Building2,
  "fahr-team": Settings2,
  leadership: Landmark,
};

// Roving-focus arrow-key handler for the persona radiogroup cards
export function personaKeyNav(e: React.KeyboardEvent<HTMLDivElement>, role: string, setRole: (id: string) => void) {
  const ids = STAKEHOLDERS.map((s) => s.id as string);
  let next: number | null = null;
  const current = Math.max(0, ids.indexOf(role));
  if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (current + 1) % ids.length;
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (current - 1 + ids.length) % ids.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = ids.length - 1;
  if (next !== null) {
    e.preventDefault();
    setRole(ids[next]);
    const target = e.currentTarget.querySelector<HTMLButtonElement>(`[data-persona-id="${ids[next]}"]`);
    target?.focus();
  }
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
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Left side - Visuals */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-background items-end md:sticky md:top-0 md:h-[100dvh]">
        <div className="absolute inset-0">
          <img 
            src={`${import.meta.env.BASE_URL}brand/landing/hero-bg.jpg`} 
            alt="Federal Building" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/30"></div>
        </div>
        <div className="relative z-10 p-12 pb-16 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Welcome back to your <br /><span className="text-primary">Agentic AI workspace</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Continue your development mission, collaborate with your AI agents, and track your capability progress across the federal ecosystem.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative">
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-6">
          <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
          </Link>
          <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-10 object-contain" />
        </div>
        
        <div className="w-full max-w-md space-y-8 pt-20 md:pt-0">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h2>
            <p className="text-muted-foreground mt-2">Access your government AI learning profile</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Government Email</Label>
                <Input id="email" type="email" placeholder="name@entity.gov.ae" required defaultValue="demo@mohap.gov.ae" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>
                </div>
                <Input id="password" type="password" required defaultValue="password123" />
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <Label htmlFor="role" className="text-primary font-semibold">Select Demo Persona</Label>
                <p className="text-xs text-muted-foreground mb-2">For demonstration purposes, select which view you want to explore.</p>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Select demo persona" onKeyDown={(e) => personaKeyNav(e, role, setRole)}>
                  {STAKEHOLDERS.map((s, i) => {
                    const Icon = PERSONA_ICONS[s.id] ?? User;
                    const selected = role === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        data-persona-id={s.id}
                        tabIndex={selected || (!role && i === 0) ? 0 : -1}
                        onClick={() => setRole(s.id)}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          selected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className={`text-sm font-medium leading-tight ${selected ? "text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading || !role}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
