import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAKEHOLDERS } from "@/lib/constants";
import { Shield, ArrowLeft, Loader2, CheckCircle2, User } from "lucide-react";
import { PERSONA_ICONS, personaKeyNav } from "@/pages/Login";
import { motion, AnimatePresence } from "framer-motion";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        const stakeholder = STAKEHOLDERS.find(s => s.id === role);
        if (stakeholder) {
          setLocation(stakeholder.route);
        }
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Left side - Visuals */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative overflow-hidden bg-background items-end md:sticky md:top-0 md:h-[100dvh]">
        <div className="absolute inset-0">
          <img 
            src={`${import.meta.env.BASE_URL}brand/landing/section-lab.jpg`} 
            alt="Federal Building" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/30"></div>
        </div>
        <div className="relative z-10 p-12 pb-16 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/10 text-white font-medium text-sm mb-6 border border-white/25 backdrop-blur-sm shadow-sm">
              <Shield className="w-4 h-4 mr-2" /> Secure Federal Enclave
            </div>
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Begin your Agentic AI <br /><span className="text-primary">Capability Journey</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-8">
              Join the federal learning ecosystem to develop practical AI skills, test agentic workflows, and track your progress against national competency frameworks.
            </p>
            <div className="space-y-4">
              {["Personalized AI coaching", "Simulated digital twin environments", "Federal certification pathways"].map((item, i) => (
                <div key={i} className="flex items-center text-white font-medium">
                  <CheckCircle2 className="w-5 h-5 text-primary mr-3" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-6 z-20">
          <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
          </Link>
          <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-10 object-contain" />
        </div>
        
        <div className="w-full max-w-md space-y-8 my-auto pt-24 md:pt-20 pb-8">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">Create Profile</h2>
                  <p className="text-muted-foreground mt-2">Provision your learning workspace</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select your entity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mohap">Ministry of Health and Prevention</SelectItem>
                        <SelectItem value="moe">Ministry of Education</SelectItem>
                        <SelectItem value="mof">Ministry of Finance</SelectItem>
                        <SelectItem value="moei">Ministry of Economy</SelectItem>
                        <SelectItem value="fahr">FAHR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border mt-6">
                    <Label htmlFor="role" className="text-primary font-semibold">Platform Persona (Demo)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Select your role to access the corresponding dashboard.</p>
                    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Select platform persona" onKeyDown={(e) => personaKeyNav(e, role, setRole)}>
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

                  <Button type="submit" className="w-full h-12 text-base mt-6" disabled={loading || !role}>
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Provisioning Workspace...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary font-semibold hover:underline">
                    Sign in here
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center space-y-6 py-12"
              >
                <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 relative">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Profile Provisioned</h2>
                <p className="text-muted-foreground text-lg">
                  Your Agentic AI workspace is ready. Redirecting you to your dashboard...
                </p>
                <Loader2 className="w-8 h-8 animate-spin text-primary mt-8" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
