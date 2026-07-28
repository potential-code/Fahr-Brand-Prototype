import React, { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { AGENTS } from "@/lib/constants";
import { Bot, CheckCircle2, Circle, Lock, PlayCircle, Play, BookOpen, Video, PenTool, FlaskConical, Target, Rocket, ArrowRight, Check, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { COURSE_BY_ID, COMPETENCY_BY_ID } from "@/lib/learningData";

/** Two-question check that gates completion of a reading module. */
const KNOWLEDGE_CHECK = [
  {
    id: "kc1",
    question: "What must happen before an AI-generated fact is used in a public communication?",
    options: [
      "Nothing, if the tone is right",
      "It is verified against official Ministry data",
      "It is shortened",
      "It is translated first",
    ],
    correctIndex: 1,
  },
  {
    id: "kc2",
    question: "Which of these must never be entered into a general-purpose AI tool?",
    options: [
      "A published press release",
      "An approved key message",
      "Identifiable personal data about a resident",
      "A public campaign hashtag",
    ],
    correctIndex: 2,
  },
];

type StepStatus = "completed" | "in-progress" | "recommended" | "locked";
type StepType = "Learn" | "Watch" | "Practice" | "Simulate" | "Build" | "Apply" | "Adaptive";

interface MissionStep {
  id: string;
  type: StepType;
  title: string;
  status: StepStatus;
  description?: string;
}

const INITIAL_STEPS: MissionStep[] = [
  { id: "s1", type: "Watch", title: "AI Campaign Planning in Public Sector Context", status: "completed" },
  { id: "s2", type: "Learn", title: "Responsible AI for Government Communications", status: "completed" },
  { id: "s3", type: "Practice", title: "Generate a campaign brief with AI", status: "in-progress" },
  { id: "s4", type: "Simulate", title: "Respond to misinformation in a public health campaign", status: "recommended", description: "Role-play assessment" },
  { id: "s5", type: "Build", title: "Configure your AI Digital Twin", status: "locked" },
  { id: "s6", type: "Apply", title: "Create an Outcome Project for your department", status: "locked" },
];

export default function PersonalisedDevelopmentMission() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { result, getCoursePercent } = useLearnerProgress();
  const [steps, setSteps] = useState<MissionStep[]>(INITIAL_STEPS);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [hasAdapted, setHasAdapted] = useState(false);

  // Knowledge-check state for the reading modules
  const [checkAnswers, setCheckAnswers] = useState<Record<string, number>>({});
  const [checkSubmitted, setCheckSubmitted] = useState(false);

  const checkCorrect = KNOWLEDGE_CHECK.filter((q) => checkAnswers[q.id] === q.correctIndex).length;
  const checkPassed = checkSubmitted && checkCorrect === KNOWLEDGE_CHECK.length;

  const resetCheck = () => {
    setCheckAnswers({});
    setCheckSubmitted(false);
  };

  const recommendedCourses = (result?.recommendedCourseIds ?? [])
    .map((id) => COURSE_BY_ID[id])
    .filter(Boolean);

  // Simulated Chat State for Role-Play
  const [chatMessages, setChatMessages] = useState<{ role: "ai" | "user", text: string }[]>([
    { role: "ai", text: "Hello Aisha. I am your " + AGENTS.practice + ". A rumor is spreading on social media about the new vaccine program. We need a rapid response statement. How do you instruct me to draft it?" }
  ]);

  const handleAction = (stepId: string) => {
    setActiveStep(stepId);
  };

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id === stepId) return { ...s, status: "completed" };
      // If we complete s3, unlock s4
      if (stepId === "s3" && s.id === "s4") return { ...s, status: "in-progress" };
      // Completing the Build step unlocks the Apply step
      if (stepId === "s5" && s.id === "s6") return { ...s, status: "recommended" };
      // If we complete s4 (roleplay), trigger adaptation
      return s;
    }));

    if (stepId === "s4" && !hasAdapted) {
      setHasAdapted(true);
      toast({
        title: "Mission Adapted",
        description: "Your AI Practice Partner noted a gap in stakeholder communication. A new module has been added to your pathway.",
      });
      // Add adaptive step before build step
      setSteps(prev => {
        const newSteps = [...prev];
        const buildIdx = newSteps.findIndex(s => s.id === "s5");
        if (buildIdx !== -1) {
          newSteps.splice(buildIdx, 0, {
            id: "s4.5",
            type: "Adaptive",
            title: "Stakeholder Alignment with AI",
            status: "in-progress",
            description: "Added based on your role-play performance"
          });
        }
        // Also unlock s5
        const updated = newSteps.map(s => s.id === "s5" ? { ...s, status: "recommended" as StepStatus } : s);
        return updated;
      });
    }

    setActiveStep(null);
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "in-progress": return <PlayCircle className="w-6 h-6 text-primary" />;
      case "recommended": return <Circle className="w-6 h-6 text-secondary" />;
      case "locked": return <Lock className="w-6 h-6 text-muted-foreground" />;
      default: return null;
    }
  };

  const getTypeIcon = (type: StepType) => {
    switch(type) {
      case "Watch": return <Video className="w-4 h-4" />;
      case "Learn": return <BookOpen className="w-4 h-4" />;
      case "Practice": return <PenTool className="w-4 h-4" />;
      case "Simulate": return <FlaskConical className="w-4 h-4" />;
      case "Adaptive": return <Target className="w-4 h-4" />;
      case "Build": return <FlaskConical className="w-4 h-4" />;
      case "Apply": return <Rocket className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: StepStatus) => {
    switch (status) {
      case "completed": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "in-progress": return <Badge className="bg-primary hover:bg-primary">In Progress</Badge>;
      case "recommended": return <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">Recommended Next</Badge>;
      case "locked": return <Badge variant="outline" className="text-muted-foreground">Locked</Badge>;
      default: return null;
    }
  };

  // Render correct modal based on active step type
  const renderActiveModal = () => {
    const step = steps.find(s => s.id === activeStep);
    if (!step) return null;

    if (step.type === "Watch") {
      return (
        <Dialog open={!!activeStep} onOpenChange={(open) => !open && setActiveStep(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{step.title}</DialogTitle>
              <DialogDescription>Video Module</DialogDescription>
            </DialogHeader>
            <div className="aspect-video bg-black rounded-md flex flex-col items-center justify-center text-white relative">
              <Play className="w-16 h-16 opacity-50 absolute" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                 <p className="text-sm font-medium">Video Player Mockup</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => completeStep(step.id)}>Mark as Watched</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (step.type === "Learn" || step.type === "Adaptive") {
      return (
        <Sheet open={!!activeStep} onOpenChange={(open) => !open && setActiveStep(null)}>
          <SheetContent className="sm:max-w-xl">
            <SheetHeader className="mb-6">
              <SheetTitle>{step.title}</SheetTitle>
              <SheetDescription>Reading Material</SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-4 text-sm leading-relaxed text-foreground">
                <p>Generative AI holds enormous potential for public sector communications, but requires specific guardrails to ensure accuracy, tone consistency, and public trust.</p>
                <h3 className="font-bold text-lg pt-4">Key Principles</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Human-in-the-loop:</strong> Always verify AI-generated facts against official Ministry data.</li>
                  <li><strong>Privacy first:</strong> Never prompt with sensitive citizen information.</li>
                  <li><strong>Tone matters:</strong> Ensure outputs match the authoritative, reassuring tone of the FAHR brand.</li>
                </ul>
                <div className="p-4 bg-muted rounded-md mt-6">
                  <p className="font-medium mb-2">Did you know?</p>
                  <p className="text-muted-foreground">Properly structured prompts can reduce revision cycles by up to 40%.</p>
                </div>

                {/* Knowledge check — gates completion of the reading module */}
                <div className="pt-6 mt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="font-bold">Knowledge check</p>
                  </div>
                  <p className="text-muted-foreground mb-5">
                    Answer both questions correctly to complete this module.
                  </p>

                  <div className="space-y-6">
                    {KNOWLEDGE_CHECK.map((q, qi) => (
                      <div key={q.id}>
                        <p className="font-medium mb-3">{qi + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => {
                            const picked = checkAnswers[q.id] === oi;
                            const isRight = oi === q.correctIndex;
                            let tone = "border-border bg-card hover:bg-muted/50";
                            if (checkSubmitted && isRight) tone = "border-primary bg-primary/5";
                            else if (checkSubmitted && picked) tone = "border-destructive/50 bg-destructive/5";
                            else if (picked) tone = "border-primary bg-primary/5";
                            return (
                              <button
                                key={oi}
                                type="button"
                                disabled={checkSubmitted}
                                onClick={() => setCheckAnswers((p) => ({ ...p, [q.id]: oi }))}
                                data-testid={`mission-check-${q.id}-${oi}`}
                                className={`w-full text-left rounded-lg border px-3 py-2.5 flex items-start gap-3 transition-colors ${tone}`}
                              >
                                <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                                  (checkSubmitted && isRight) || picked ? "border-primary bg-primary" : "border-border"
                                }`}>
                                  {((checkSubmitted && isRight) || picked) && (
                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                  )}
                                </span>
                                <span className={picked || (checkSubmitted && isRight) ? "text-foreground" : "text-muted-foreground"}>
                                  {opt}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {checkSubmitted && (
                    <p className={`mt-4 text-sm font-medium ${checkPassed ? "text-primary" : "text-destructive"}`}>
                      {checkCorrect} of {KNOWLEDGE_CHECK.length} correct
                      {checkPassed ? " — module complete." : " — review the highlighted answers and try again."}
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
            <div className="pt-4 border-t border-border mt-4 flex gap-2">
              {!checkSubmitted ? (
                <Button
                  className="w-full"
                  disabled={Object.keys(checkAnswers).length < KNOWLEDGE_CHECK.length}
                  onClick={() => setCheckSubmitted(true)}
                  data-testid="button-submit-check"
                >
                  Submit knowledge check
                </Button>
              ) : checkPassed ? (
                <Button className="w-full" onClick={() => { completeStep(step.id); resetCheck(); }}>
                  Complete Reading
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={resetCheck}>
                  Try again
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      );
    }

    if (step.type === "Practice") {
      return (
        <Dialog open={!!activeStep} onOpenChange={(open) => !open && setActiveStep(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{step.title}</DialogTitle>
              <DialogDescription>Interactive Exercise</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm">Write a prompt to generate a campaign brief about the new Seasonal Flu initiative.</p>
              <div className="p-3 border rounded-md min-h-[100px] text-sm bg-muted/30">
                "Draft a public health campaign brief for the UAE's seasonal flu drive. Target audience is families. Tone should be reassuring and urgent. Include key messages and recommended channels."
              </div>
              <div className="bg-green-50 text-green-800 p-3 rounded-md text-sm flex items-start gap-2 border border-green-200">
                <CheckCircle2 className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-bold">AI Feedback:</p>
                  <p>Great prompt! You clearly defined the context, audience, and tone.</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => completeStep(step.id)}>Complete Exercise</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (step.type === "Simulate") {
      return (
        <Dialog open={!!activeStep} onOpenChange={(open) => !open && setActiveStep(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{step.title}</DialogTitle>
              <DialogDescription>Role-Play Assessment</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col h-[400px]">
              <ScrollArea className="flex-1 p-4 border rounded-md bg-muted/10 mb-4">
                <div className="space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                      {msg.role === 'ai' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatMessages.length === 1 && (
                    <div className="pt-4 space-y-2">
                      <Button variant="outline" className="w-full justify-start text-left h-auto py-3 whitespace-normal" 
                        onClick={() => {
                          setChatMessages([
                            ...chatMessages, 
                            { role: "user", text: "Write a tweet denying the rumor immediately." },
                            { role: "ai", text: "I can do that, but without official approved talking points, we risk spreading inaccuracies. I suggest we draft an internal holding statement first and escalate to the policy team. How should we proceed?" }
                          ]);
                        }}>
                        Option A: "Write a tweet denying the rumor immediately."
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-left h-auto py-3 whitespace-normal"
                        onClick={() => {
                          setChatMessages([
                            ...chatMessages, 
                            { role: "user", text: "Draft a holding statement based on approved FAHR policy and flag it for human review." },
                            { role: "ai", text: "Excellent choice. That aligns with our responsible AI guidelines. Draft generated and flagged for review. Assessment passed!" }
                          ]);
                        }}>
                        Option B: "Draft a holding statement based on approved FAHR policy and flag it for human review."
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
              {chatMessages.length > 1 && (
                <Button className="w-full" onClick={() => completeStep(step.id)}>Finish Role-Play</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    if (step.type === "Build" || step.type === "Apply") {
      const isBuild = step.type === "Build";
      return (
        <Dialog open={!!activeStep} onOpenChange={(open) => !open && setActiveStep(null)}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{step.title}</DialogTitle>
              <DialogDescription>{isBuild ? "Agentic AI Lab" : "Outcome Project"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                {isBuild ? (
                  <FlaskConical className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Rocket className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  {isBuild
                    ? "This step happens in the Agentic AI Lab. You will configure your Digital Twin with your role knowledge, tone and governance guardrails, then test its responses."
                    : "This step is your Outcome Project: a real deliverable for your department, evaluated by AI and confirmed by your line manager."}
                </p>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {(isBuild
                  ? ["Define your twin's knowledge sources", "Set its tone and guardrails", "Run a test response"]
                  : ["Describe the problem and your AI solution", "State the expected time or quality gain", "Submit for evaluation"]
                ).map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => completeStep(step.id)}>
                Mark as complete
              </Button>
              <Button
                onClick={() => setLocation(isBuild ? "/learner/lab/twin" : "/learner/lab/project")}
                data-testid={`button-open-${isBuild ? "twin" : "project"}`}
              >
                {isBuild ? "Open the Agentic AI Lab" : "Open my Outcome Project"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return null;
  };

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full pb-12">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Your Development Mission</h1>
          <h2 className="text-xl text-muted-foreground">AI-Powered Public Health Campaigns</h2>
        </div>

        {/* Courses carried in from the baseline assessment */}
        {recommendedCourses.length > 0 && result && (
          <Card className="border-primary/20 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> From your baseline assessment
                  </p>
                  <h2 className="text-lg font-bold">Courses feeding this mission</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Matched to your priority gap: {COMPETENCY_BY_ID[result.gaps[0]].label}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setLocation("/learner/assessment/report")}>
                  View full report <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {recommendedCourses.map((course) => {
                  const percent = getCoursePercent(course.id);
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => setLocation(`/learner/course/${course.id}`)}
                      data-testid={`mission-course-${course.id}`}
                      className="text-left rounded-xl border border-card-border p-4 hover:border-primary/40 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug line-clamp-2">{course.title}</p>
                          <div className="mt-2.5 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">{percent}% complete</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {hasAdapted && (
          <Card className="bg-primary/5 border-primary/20 mb-8 animate-in slide-in-from-top-4 duration-500">
            <CardContent className="p-4 flex items-start gap-4">
              <Bot className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium">Adaptive AI Note from your {AGENTS.coach}</p>
                <p className="text-sm text-muted-foreground">Based on your role-play performance, I noticed a slight gap in stakeholder alignment. I've added a quick adaptive module to your pathway to ensure you're fully prepared.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {steps.map((step, index) => (
            <Card 
              key={step.id} 
              className={`relative z-10 transition-colors ${step.status === 'locked' ? 'bg-muted/50 opacity-70' : 'hover-elevate bg-card cursor-pointer'} ${step.type === 'Adaptive' ? 'border-primary shadow-sm' : ''}`}
              onClick={() => step.status !== 'locked' && handleAction(step.id)}
            >
              <CardContent className="p-6 flex items-center gap-6">
                <div className="shrink-0 bg-background rounded-full p-1 z-10">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                    <div>
                      <p className={`text-xs font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5 ${step.type === 'Adaptive' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {getTypeIcon(step.type)} {step.type}
                      </p>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      {step.description && <p className="text-sm text-muted-foreground mt-1">{step.description}</p>}
                    </div>
                    {getStatusBadge(step.status)}
                  </div>
                </div>
                {(step.status === 'in-progress' || step.status === 'recommended') && (
                  <Button size="sm" className="hidden md:flex">Continue</Button>
                )}
                {step.status === 'completed' && (
                  <Button size="sm" variant="ghost" className="hidden md:flex">Review</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
      {renderActiveModal()}
    </Layout>
  );
}
