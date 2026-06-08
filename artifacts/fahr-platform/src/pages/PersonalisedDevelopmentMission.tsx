import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";

export default function PersonalisedDevelopmentMission() {
  const steps = [
    { type: "Learn", title: "Responsible AI for Government Communications", status: "completed" },
    { type: "Watch", title: "AI Campaign Planning in Public Sector Context", status: "completed" },
    { type: "Practice", title: "Generate a campaign brief with AI", status: "in-progress" },
    { type: "Simulate", title: "Respond to misinformation in a public health campaign", status: "recommended" },
    { type: "Build", title: "Configure your AI Digital Twin", status: "locked" },
    { type: "Apply", title: "Create an Outcome Project for your department", status: "locked" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case "in-progress": return <PlayCircle className="w-6 h-6 text-primary" />;
      case "recommended": return <Circle className="w-6 h-6 text-secondary" />;
      case "locked": return <Lock className="w-6 h-6 text-muted-foreground" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "in-progress": return <Badge className="bg-primary hover:bg-primary">In Progress</Badge>;
      case "recommended": return <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">Recommended Next</Badge>;
      case "locked": return <Badge variant="outline" className="text-muted-foreground">Locked until readiness</Badge>;
      default: return null;
    }
  };

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Your Development Mission</h1>
          <h2 className="text-xl text-muted-foreground">AI-Powered Public Health Campaigns</h2>
        </div>

        <Card className="bg-primary/5 border-primary/20 mb-8">
          <CardContent className="p-4 flex items-start gap-4">
            <Bot className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <p className="text-sm font-medium">Adaptive AI Note</p>
              <p className="text-sm text-muted-foreground">Your pathway was adjusted because you performed strongly in content generation but need more practice in campaign measurement.</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {steps.map((step, index) => (
            <Card key={index} className={`relative z-10 transition-colors ${step.status === 'locked' ? 'bg-muted/50 opacity-70' : 'hover-elevate bg-white'}`}>
              <CardContent className="p-6 flex items-center gap-6">
                <div className="shrink-0 bg-background rounded-full p-1">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                    <div>
                      <p className="text-sm font-bold text-muted-foreground tracking-wider uppercase mb-1">{step.type}</p>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                    </div>
                    {getStatusBadge(step.status)}
                  </div>
                </div>
                {step.status === 'in-progress' && (
                  <Button size="sm" className="hidden md:flex">Continue</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </Layout>
  );
}
