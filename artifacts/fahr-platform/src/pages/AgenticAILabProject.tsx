import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Bot, Send, ShieldCheck, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AGENTS } from "@/lib/constants";
import { useLocation } from "wouter";

export default function AgenticAILabProject() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [status, setStatus] = useState<"Draft" | "Submitted">("Draft");
  const [showImproveDialog, setShowImproveDialog] = useState(false);
  const [showGovernanceDialog, setShowGovernanceDialog] = useState(false);

  const [idea, setIdea] = useState("Create an AI-assisted workflow that helps generate campaign briefs, audience segments, content angles, Arabic/English messaging, and reporting templates.");

  const handleSubmit = () => {
    setStatus("Submitted");
    toast({
      title: "Project Submitted 🎉",
      description: "Your outcome project has been submitted for human review and AI evaluation.",
    });
  };

  const handleImprove = () => {
    setShowImproveDialog(false);
    setIdea("Create an AI-assisted workflow that helps generate campaign briefs, audience segments, content angles, Arabic/English messaging, and reporting templates. \n\n*Updated: Included an automated feedback loop for performance metrics tracking to ensure continuous improvement.*");
    toast({
      title: "Idea Improved ✨",
      description: `${AGENTS.content} enhanced your solution idea.`,
    });
  };

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full pb-12">
        
        <div className="mb-8 flex justify-between items-end border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-primary">Stage 2: Build an Outcome Project</h1>
            <p className="text-lg text-muted-foreground">Apply your new AI capability to a real workplace challenge.</p>
          </div>
          <Badge variant="outline" className={`text-sm py-1 px-3 ${status === 'Submitted' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-primary/5 text-primary border-primary/20'}`}>
            {status} Status
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="md:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Project Title</label>
                <Input disabled={status === 'Submitted'} defaultValue="AI-Assisted Public Health Campaign Brief Generator" className="font-medium text-lg border-primary/20 focus-visible:ring-primary disabled:opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  Problem Statement
                </label>
                <Textarea 
                  disabled={status === 'Submitted'}
                  defaultValue="Campaign briefs currently take significant manual coordination between communication, content, and technical teams."
                  className="min-h-[100px] resize-none disabled:opacity-70"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-secondary"></div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2 flex flex-col h-full">
                <label className="text-sm font-semibold flex items-center justify-between text-secondary">
                  <span className="flex items-center gap-2"><Bot className="w-4 h-4" /> AI Solution Idea</span>
                </label>
                <Textarea 
                  disabled={status === 'Submitted'}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-[100px] resize-none focus-visible:ring-secondary mt-2 disabled:opacity-70"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Expected Outcomes</label>
                <div className={`bg-muted p-4 rounded-md space-y-2 text-sm ${status === 'Submitted' ? 'opacity-70' : ''}`}>
                  <p>• Save 42 hours per month</p>
                  <p>• Reduce campaign planning time by 35%</p>
                  <p>• Improve message consistency</p>
                  <p>• Support bilingual campaign creation</p>
                  <p>• Improve reporting quality</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Measurement Plan</label>
                <div className={`bg-muted p-4 rounded-md space-y-2 text-sm ${status === 'Submitted' ? 'opacity-70' : ''}`}>
                  <p>• Time saved per campaign</p>
                  <p>• Number of briefs generated</p>
                  <p>• Approval cycle reduction</p>
                  <p>• Campaign content quality score</p>
                  <p>• Stakeholder satisfaction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {status === "Draft" ? (
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
            <Button variant="outline" className="flex-1 gap-2 border-secondary text-secondary hover:bg-secondary/5" onClick={() => setShowImproveDialog(true)}>
              <Sparkles className="w-4 h-4" /> Ask {AGENTS.content} to improve
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowGovernanceDialog(true)}>
              <ShieldCheck className="w-4 h-4" /> Run governance check
            </Button>
            <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white" onClick={handleSubmit}>
              <Send className="w-4 h-4" /> Submit for review
            </Button>
          </div>
        ) : (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-green-900">Project Submitted Successfully</h3>
                <p className="text-sm text-green-700 mt-1">Your project is now locked and under review by the Ministry Innovation Lead.</p>
              </div>
            </div>
            <Button variant="outline" className="bg-white" onClick={() => setLocation('/learner/evaluation')}>
              View Evaluation Status
            </Button>
          </div>
        )}

      </div>

      {/* Improve Dialog */}
      <Dialog open={showImproveDialog} onOpenChange={setShowImproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Enhancement Suggestion</DialogTitle>
            <DialogDescription>The {AGENTS.content} reviewed your solution idea.</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg text-sm border-l-4 border-secondary space-y-2">
            <p className="font-medium">Original:</p>
            <p className="text-muted-foreground italic">"Create an AI-assisted workflow that helps generate campaign briefs, audience segments, content angles, Arabic/English messaging, and reporting templates."</p>
            <p className="font-medium mt-4">Suggested addition:</p>
            <p className="text-foreground font-medium">Include an automated feedback loop for performance metrics tracking to ensure continuous improvement.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImproveDialog(false)}>Cancel</Button>
            <Button onClick={handleImprove}>Accept Suggestion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Governance Dialog */}
      <Dialog open={showGovernanceDialog} onOpenChange={setShowGovernanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Automated Governance Check</DialogTitle>
            <DialogDescription>Validating your project against FAHR AI policies.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50/50 border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Data Privacy</p>
                <p className="text-xs text-muted-foreground">No PII or sensitive data indicators detected in project scope.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50/50 border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Alignment with Mandate</p>
                <p className="text-xs text-muted-foreground">Project objectives align with Ministry public health communication goals.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50/50 border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Human-in-the-loop</p>
                <p className="text-xs text-muted-foreground">Workflow implies human review of generated briefs before publishing.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowGovernanceDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
