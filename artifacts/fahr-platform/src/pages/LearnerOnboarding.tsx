import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/LanguageContext";
import { AGENTS, CAPABILITY_LEVELS } from "@/lib/constants";
import { Bot, ChevronRight, CheckCircle2, User, Sparkles, Building2, Briefcase, Activity } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type Step = 0 | 1 | 2 | 3 | 4;

export default function LearnerOnboarding() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>(0);
  const [analyzing, setAnalyzing] = useState(false);

  // Form states
  const [role, setRole] = useState("Marketing Specialist");
  const [department, setDepartment] = useState("Communications");
  const [experience, setExperience] = useState("3-5 years");

  // Assessment states
  const [q1, setQ1] = useState<string>("");
  const [q2, setQ2] = useState<string>("");

  const handleNext = () => {
    if (step === 2) {
      setStep(3);
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setStep(4);
      }, 3000);
    } else if (step < 4) {
      setStep((s) => (s + 1) as Step);
    }
  };

  const isStep2Valid = q1 !== "" && q2 !== "";

  return (
    <Layout role="learner">
      <div className="max-w-2xl mx-auto w-full py-8">
        
        {step > 0 && step < 4 && (
          <div className="mb-8">
            <Progress value={(step / 3) * 100} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground text-right">Step {step} of 3</p>
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-center py-12">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">Welcome, Aisha</h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Your Agentic AI development pathway starts here. We'll capture your role context and assess your current AI capabilities to generate a personalized mission.
            </p>
            <div className="pt-8">
              <Button size="lg" className="rounded-full px-8 text-lg h-14 shadow-lg hover-elevate" onClick={handleNext}>
                Begin Profiling <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Role Profiling */}
        {step === 1 && (
          <Card className="animate-in slide-in-from-right-8 duration-300">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Role Context</h2>
                  <p className="text-sm text-muted-foreground">
                    I need to understand your daily work to recommend relevant AI workflows.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-muted-foreground"/> Job Title</Label>
                  <Input value={role} onChange={(e) => setRole(e.target.value)} className="bg-background text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground"/> Department / Function</Label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/> Experience Level</Label>
                  <RadioGroup value={experience} onValueChange={setExperience} className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card cursor-pointer hover:border-primary/50">
                      <RadioGroupItem value="0-2 years" id="r1" />
                      <Label htmlFor="r1" className="cursor-pointer">0-2 years</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card cursor-pointer hover:border-primary/50">
                      <RadioGroupItem value="3-5 years" id="r2" />
                      <Label htmlFor="r2" className="cursor-pointer">3-5 years</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card cursor-pointer hover:border-primary/50">
                      <RadioGroupItem value="6-10 years" id="r3" />
                      <Label htmlFor="r3" className="cursor-pointer">6-10 years</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-card cursor-pointer hover:border-primary/50">
                      <RadioGroupItem value="10+ years" id="r4" />
                      <Label htmlFor="r4" className="cursor-pointer">10+ years</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button onClick={handleNext} className="gap-2">Continue <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Baseline Assessment */}
        {step === 2 && (
          <Card className="animate-in slide-in-from-right-8 duration-300">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-start gap-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Diagnostic Assessment</h2>
                  <p className="text-sm text-muted-foreground">
                    Let's establish your baseline capability level.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="font-medium text-base">1. How frequently do you use generative AI (like ChatGPT or Copilot) in your daily work?</p>
                  <RadioGroup value={q1} onValueChange={setQ1} className="space-y-2">
                    {["Rarely or never", "Occasionally for simple tasks (like drafting emails)", "Daily for complex workflows", "I build and train my own AI assistants"].map((opt, i) => (
                      <div key={i} className="flex items-center space-x-3 border p-3 rounded-lg bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                        <RadioGroupItem value={opt} id={`q1-${i}`} />
                        <Label htmlFor={`q1-${i}`} className="cursor-pointer flex-1 font-normal">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <p className="font-medium text-base">2. When an AI generates a report based on Ministry data, what is the required governance step?</p>
                  <RadioGroup value={q2} onValueChange={setQ2} className="space-y-2">
                    {[
                      "Copy and paste it directly to stakeholders", 
                      "Human-in-the-loop review for accuracy and tone before sharing", 
                      "Run it through a plagiarism checker", 
                      "Store it in an external public database"
                    ].map((opt, i) => (
                      <div key={i} className="flex items-center space-x-3 border p-3 rounded-lg bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                        <RadioGroupItem value={opt} id={`q2-${i}`} />
                        <Label htmlFor={`q2-${i}`} className="cursor-pointer flex-1 font-normal">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button onClick={handleNext} disabled={!isStep2Valid} className="gap-2 bg-secondary hover:bg-secondary/90 text-white">
                  Submit & Analyze <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Analyzing State */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <Bot className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Analyzing Profile & Assessment</h2>
            <p className="text-muted-foreground text-center max-w-md animate-pulse">
              The {AGENTS.advisor} is mapping your responses to the FAHR capability framework...
            </p>
          </div>
        )}

        {/* Step 4: Results & Pathway Reveal */}
        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            <Card className="border-green-500/20 bg-green-50/30 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Profiling Complete</h2>
                <p className="text-muted-foreground mb-6">Your baseline capability has been established.</p>
                
                <div className="bg-white rounded-xl p-6 border shadow-sm max-w-md mx-auto mb-6 text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Level</p>
                  <h3 className="text-2xl font-bold text-primary mb-2">{CAPABILITY_LEVELS[1].label}</h3>
                  <p className="text-sm text-muted-foreground">{CAPABILITY_LEVELS[1].description}</p>
                </div>
                
                <p className="text-sm bg-primary/5 text-primary p-4 rounded-lg inline-block font-medium">
                  The {AGENTS.advisor} has generated your personalized pathway targeting the <strong>{CAPABILITY_LEVELS[2].label}</strong> level.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-center pt-4">
              <Button size="lg" className="rounded-full px-10 h-14 shadow-md text-lg" onClick={() => setLocation("/learner/mission")}>
                View Development Mission <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
