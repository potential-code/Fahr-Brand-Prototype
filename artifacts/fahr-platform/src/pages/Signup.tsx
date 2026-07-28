import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAKEHOLDERS } from "@/lib/constants";
import { Shield, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
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
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 relative overflow-hidden bg-primary items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src={`${import.meta.env.BASE_URL}brand/landing/section-lab.jpg`} 
            alt="Federal Building" 
            className="w-full h-full object-cover mix-blend-overlay opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/40"></div>
        </div>
        <div className="relative z-10 p-12 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-block bg-white rounded-lg px-4 py-3 shadow-md mb-12">
              <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-12 object-contain" />
            </div>
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-accent/20 text-accent font-medium text-sm mb-6 border border-accent/30 backdrop-blur-sm">
              <Shield className="w-4 h-4 mr-2" /> Secure Federal Enclave
            </div>
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Begin your Agentic AI <br /><span className="text-accent italic">Capability Journey</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed mb-8">
              Join the federal learning ecosystem to develop practical AI skills, test agentic workflows, and track your progress against national competency frameworks.
            </p>
            <div className="space-y-4">
              {["Personalized AI coaching", "Simulated digital twin environments", "Federal certification pathways"].map((item, i) => (
                <div key={i} className="flex items-center text-primary-foreground/90">
                  <CheckCircle2 className="w-5 h-5 text-accent mr-3" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full md:w-7/12 lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <Link href="/" className="absolute top-8 left-8 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors z-20">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
        </Link>
        
        <div className="w-full max-w-md space-y-8 my-auto pt-12 md:pt-0">
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
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="border-primary/30 focus:ring-primary h-12">
                        <SelectValue placeholder="Select your persona" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAKEHOLDERS.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
