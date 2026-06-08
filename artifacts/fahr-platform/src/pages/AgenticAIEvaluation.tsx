import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, CheckCircle2, ShieldAlert, Award } from "lucide-react";

export default function AgenticAIEvaluation() {
  const scores = [
    { label: "Practical Application", value: 88 },
    { label: "Innovation", value: 82 },
    { label: "Feasibility", value: 79 },
    { label: "Governance Compliance", value: 94 },
  ];

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8 border-b border-border pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Outcome Project Evaluation</h1>
            <p className="text-muted-foreground">AI-Assisted Public Health Campaign Brief Generator</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">Pending Human Review</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Bot className="w-5 h-5 text-primary"/> AI Assessment Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scores.map((score) => (
                <div key={score.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{score.label}</span>
                    <span className="font-bold">{score.value}%</span>
                  </div>
                  <Progress value={score.value} className="h-2" />
                </div>
              ))}
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10 text-sm">
                <p className="font-semibold text-primary mb-1">AI Feedback</p>
                <p>This project demonstrates strong applied use of AI in campaign planning and has measurable efficiency potential. Recommended for ministry-level showcase after human review.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Award className="w-5 h-5 text-accent" /> Expected Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-accent mb-2">High</div>
                <p className="text-sm text-muted-foreground">Estimated to save 42 hours/month and improve campaign brief consistency by 35%.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-secondary" /> Governance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center gap-2 text-sm text-green-700">
                   <CheckCircle2 className="w-4 h-4" /> Passed automated compliance check
                 </div>
                 <div className="flex items-center gap-2 text-sm text-green-700">
                   <CheckCircle2 className="w-4 h-4" /> Aligned with Ministry data policies
                 </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Human Reviewer</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex justify-between items-center">
                   <div>
                     <p className="font-medium">Ministry Innovation Lead</p>
                     <p className="text-sm text-muted-foreground">Assigned to review</p>
                   </div>
                   <Badge variant="outline">Pending</Badge>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
