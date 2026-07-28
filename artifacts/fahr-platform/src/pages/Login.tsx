import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAKEHOLDERS } from "@/lib/constants";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-background items-center justify-center">
        <div className="absolute inset-0">
          <img 
            src={`${import.meta.env.BASE_URL}brand/landing/hero-bg.jpg`} 
            alt="Federal Building" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-white/60 to-white/30"></div>
        </div>
        <div className="relative z-10 p-12 max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-12 object-contain mb-12 drop-shadow-sm" />
            
            <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">
              Welcome back to your <br /><span className="text-primary italic font-serif tracking-normal">Agentic AI workspace</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Continue your development mission, collaborate with your AI agents, and track your capability progress across the federal ecosystem.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative">
        <Link href="/" className="absolute top-8 left-8 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
        </Link>
        
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h2>
            <p className="text-muted-foreground mt-2">Access your government AI learning profile</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Government Email (UAE PASS enabled)</Label>
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
                <Select required value={role} onValueChange={setRole}>
                  <SelectTrigger className="border-primary/30 focus:ring-primary h-12">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAKEHOLDERS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading || !role}>
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Authenticating...
                </>
              ) : (
                "Sign In via UAE PASS"
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
