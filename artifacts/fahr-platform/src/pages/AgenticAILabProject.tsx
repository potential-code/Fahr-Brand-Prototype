import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Bot, Send } from "lucide-react";

export default function AgenticAILabProject() {
  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full pb-12">
        
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-primary">Stage 2: Build an Outcome Project</h1>
            <p className="text-lg text-muted-foreground">Apply your new AI capability to a real workplace challenge.</p>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-sm py-1 px-3">
            Draft Status
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="md:col-span-2">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Project Title</label>
                <Input defaultValue="AI-Assisted Public Health Campaign Brief Generator" className="font-medium text-lg border-primary/20 focus-visible:ring-primary" />
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
                  defaultValue="Campaign briefs currently take significant manual coordination between communication, content, and technical teams."
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1 h-full bg-secondary"></div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2 text-secondary">
                  <Bot className="w-4 h-4" /> AI Solution Idea
                </label>
                <Textarea 
                  defaultValue="Create an AI-assisted workflow that helps generate campaign briefs, audience segments, content angles, Arabic/English messaging, and reporting templates."
                  className="min-h-[100px] resize-none focus-visible:ring-secondary"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Expected Outcomes</label>
                <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
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
                <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
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

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
          <Button variant="outline" className="flex-1 gap-2 border-secondary text-secondary hover:bg-secondary/5">
            <Bot className="w-4 h-4" /> Ask Agent to improve project
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <CheckCircle2 className="w-4 h-4" /> Run governance check
          </Button>
          <Button className="flex-1 gap-2">
            <Send className="w-4 h-4" /> Submit for review
          </Button>
        </div>

      </div>
    </Layout>
  );
}
