import React from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight } from "lucide-react";

export default function Welcome() {
  const { language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <img src={`${import.meta.env.BASE_URL}brand/fahr-logo.png`} alt="FAHR Logo" className="h-12 object-contain" />
        <Button variant="outline" size="sm" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}>
          <Globe className="h-4 w-4 mr-2" />
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4 border border-primary/20">
            UAE Government Executive Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Federal Agentic AI <br />
            <span className="text-primary">Learning & Skilling Platform</span>
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            An Agentic AI ecosystem that develops federal workforce capability, 
            supports applied AI projects, and measures real transformation outcomes.
          </p>

          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full text-left">
            <div className="flex flex-col h-full bg-white p-6 rounded-2xl border border-border shadow-sm hover-elevate cursor-pointer" onClick={() => setLocation('/learner')}>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-primary font-bold">L</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Enter as Aisha</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">Learner Persona (Marketing Specialist, Ministry of Health and Prevention)</p>
              <div className="flex items-center text-primary font-medium text-sm">
                Enter Demo <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>

            <div className="flex flex-col h-full bg-white p-6 rounded-2xl border border-border shadow-sm hover-elevate cursor-pointer" onClick={() => setLocation('/ministry')}>
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                <span className="text-secondary font-bold">M</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Ministry Admin</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">Ministry of Health and Prevention Department View</p>
              <div className="flex items-center text-secondary font-medium text-sm">
                Enter Demo <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>

            <div className="flex flex-col h-full bg-white p-6 rounded-2xl border border-border shadow-sm hover-elevate cursor-pointer" onClick={() => setLocation('/fahr')}>
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <span className="text-accent-foreground font-bold">F</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">FAHR Admin</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">Federal Executive View & Governance Oversight</p>
              <div className="flex items-center text-accent-foreground font-medium text-sm">
                Enter Demo <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
