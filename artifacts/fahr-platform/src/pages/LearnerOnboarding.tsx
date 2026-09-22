import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  User,
  Sparkles,
  Building2,
  Briefcase,
  Target,
  ShieldCheck,
  Check,
} from "lucide-react";

const SENIORITY = ["0-2 years", "3-5 years", "6-10 years", "10+ years"];

const OBJECTIVES = [
  "Save time on repetitive work",
  "Improve the quality of my written outputs",
  "Make better use of my service data",
  "Automate a recurring process",
  "Support my team's AI adoption",
  "Meet a mandated capability target",
];

type Step = 0 | 1 | 2 | 3;

const TOTAL_STEPS = 3;

export default function LearnerOnboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>(0);

  const [name, setName] = useState("Aisha Al Mansoori");
  const [entity, setEntity] = useState("Ministry of Health and Prevention");
  const [department, setDepartment] = useState("Communications and Public Awareness");
  const [role, setRole] = useState("Marketing Specialist");
  const [seniority, setSeniority] = useState("3-5 years");
  const [objectives, setObjectives] = useState<string[]>([
    "Save time on repetitive work",
    "Improve the quality of my written outputs",
  ]);
  const [consent, setConsent] = useState(false);

  const toggleObjective = (o: string) =>
    setObjectives((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));

  const step1Valid = name.trim() && entity.trim() && department.trim() && role.trim();
  const step2Valid = objectives.length > 0 && consent;

  return (
    <Layout role="learner">
      <div className="max-w-2xl mx-auto w-full py-4">
        {step > 0 && step < TOTAL_STEPS && (
          <div className="mb-8">
            <Progress value={(step / (TOTAL_STEPS - 1)) * 100} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground text-right">
              Step {step} of {TOTAL_STEPS - 1}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 0 — Welcome */}
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Welcome, {name.split(" ")[0]}
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Let us capture your role context first. It takes two minutes and it is what allows the AI Skills
                Advisor to make its recommendations specific to your work — not generic AI training.
              </p>
              <div className="pt-4">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 text-base"
                  onClick={() => setStep(1)}
                  data-testid="button-begin-profile"
                >
                  Set up my profile <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 1 — Role context */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <Card>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Your role context</h2>
                      <p className="text-sm text-muted-foreground">
                        Your entity and role determine which AI workflows are relevant to you.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" /> Full name
                      </Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-name" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" /> Federal entity
                      </Label>
                      <Input value={entity} onChange={(e) => setEntity(e.target.value)} data-testid="input-entity" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" /> Department or function
                      </Label>
                      <Input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        data-testid="input-department"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" /> Job role
                      </Label>
                      <Input value={role} onChange={(e) => setRole(e.target.value)} data-testid="input-role" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" /> Seniority
                      </Label>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {SENIORITY.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSeniority(s)}
                            data-testid={`seniority-${s}`}
                            className={`rounded-lg border px-4 py-3 text-sm text-left transition-colors ${
                              seniority === s
                                ? "border-primary bg-primary/5 font-medium text-foreground"
                                : "border-card-border bg-card text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(0)}>
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => setStep(2)} disabled={!step1Valid} data-testid="button-continue-1">
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2 — Objectives + consent */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <Card>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">What do you want AI to do for you?</h2>
                      <p className="text-sm text-muted-foreground">
                        Choose as many as apply. Your learning pathway will be weighted towards these outcomes.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {OBJECTIVES.map((o) => {
                      const selected = objectives.includes(o);
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => toggleObjective(o)}
                          data-testid={`objective-${o}`}
                          className={`rounded-lg border p-4 text-left text-sm flex items-start gap-3 transition-colors ${
                            selected
                              ? "border-primary bg-primary/5 text-foreground font-medium"
                              : "border-card-border bg-card text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          <span
                            className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${
                              selected ? "border-primary bg-primary" : "border-border"
                            }`}
                          >
                            {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </span>
                          {o}
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-card-border bg-muted/40 p-5">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consent"
                        checked={consent}
                        onCheckedChange={(v) => setConsent(v === true)}
                        className="mt-0.5"
                        data-testid="checkbox-consent"
                      />
                      <Label htmlFor="consent" className="text-sm font-normal leading-relaxed cursor-pointer">
                        I consent to FAHR processing my assessment responses and learning activity to generate my
                        capability profile. My results are visible to me and my department manager, and are reported to my
                        entity only in aggregate.
                      </Label>
                    </div>
                    <p className="mt-3 pl-7 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Handled under federal data protection policy
                    </p>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(1)}>
                      <ChevronLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button onClick={() => setStep(3)} disabled={!step2Valid} data-testid="button-continue-2">
                      Save profile <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3 — Profile saved, hand off to the baseline assessment */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="mt-5 text-2xl md:text-3xl font-bold text-foreground">Profile saved</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                    Next: an eight-question baseline assessment. That is what turns this profile into a scored
                    capability level and a personalised course pathway.
                  </p>

                  <div className="mt-7 rounded-xl border border-card-border bg-muted/40 p-5 text-left max-w-md mx-auto space-y-3">
                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-muted-foreground">Name</span>
                      <span className="text-sm font-medium text-foreground text-right">{name}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-muted-foreground">Entity</span>
                      <span className="text-sm font-medium text-foreground text-right">{entity}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-muted-foreground">Role</span>
                      <span className="text-sm font-medium text-foreground text-right">
                        {role} · {seniority}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Objectives</p>
                      <div className="flex flex-wrap gap-1.5">
                        {objectives.map((o) => (
                          <Badge key={o} variant="secondary" className="rounded-full font-normal">
                            {o}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button variant="outline" size="lg" className="rounded-full px-8" onClick={() => setLocation("/learner")}>
                  Go to Dashboard
                </Button>
                <Button
                  size="lg"
                  className="rounded-full px-8"
                  onClick={() => setLocation("/learner/assessment")}
                  data-testid="button-start-assessment"
                >
                  Start baseline assessment <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
