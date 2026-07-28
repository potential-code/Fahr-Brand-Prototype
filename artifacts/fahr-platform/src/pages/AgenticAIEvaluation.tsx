import React from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, CheckCircle2, ShieldCheck, Award, UserCheck, ArrowUpRight } from "lucide-react";
import { CAPABILITY_LEVELS } from "@/lib/constants";

export default function AgenticAIEvaluation() {
  const [, setLocation] = useLocation();
  const scores = [
    { label: "Practical Application", value: 92 },
    { label: "Innovation", value: 85 },
    { label: "Feasibility", value: 88 },
    { label: "Governance Compliance", value: 100 },
  ];

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full pb-12">
        <PageHeader
          bordered
          className="mb-8"
          title="Workplace Project Evaluation"
          description="AI-Assisted Public Health Campaign Brief Generator"
          actions={
            <Badge className="bg-green-50 text-green-700 border-green-200 text-sm py-1 px-3" variant="outline">
              Evaluation Complete
            </Badge>
          }
        />

        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 mb-8">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 border-2 border-primary/20">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold mb-1">Capability Level Up!</h2>
              <p className="text-muted-foreground mb-3">Based on your project's practical application and human review, you have advanced to the next capability tier.</p>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-sm font-medium">
                <div className="bg-white px-3 py-1.5 rounded-md border text-muted-foreground opacity-60">
                  {CAPABILITY_LEVELS[1].label}
                </div>
                <ArrowUpRight className="w-5 h-5 text-primary hidden sm:block" />
                <div className="bg-primary px-4 py-2 rounded-md text-white shadow-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {CAPABILITY_LEVELS[2].label}
                </div>
              </div>
            </div>
            <div className="shrink-0 pt-4 md:pt-0">
              <Badge className="bg-white border-primary text-primary px-3 py-1.5" variant="outline">
                +450 Impact Points
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2"><Bot className="w-5 h-5 text-primary"/> AI Assessment Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
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
                <p>This project demonstrates strong applied use of AI in campaign planning and has measurable efficiency potential. The inclusion of an automated feedback loop shows a mature understanding of AI improvement cycles.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2"><UserCheck className="w-5 h-5 text-green-600" /> Human Review</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                 <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                     <span className="text-sm font-bold">FA</span>
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <p className="font-medium">Fatima Al Suwaidi</p>
                       <Badge className="bg-green-50 text-green-700 border-green-200" variant="outline">Approved</Badge>
                     </div>
                     <p className="text-xs text-muted-foreground mb-3">Ministry Innovation Lead</p>
                     <div className="text-sm bg-muted/30 p-3 rounded-lg border">
                       "Excellent initiative, Aisha. This directly solves our current bottleneck with brief generation. I have approved this for immediate pilot within the communications team."
                     </div>
                   </div>
                 </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <Award className="w-6 h-6 text-accent mb-2" />
                  <div className="text-xl font-bold text-accent mb-1">High</div>
                  <p className="text-xs text-muted-foreground leading-tight">Expected Impact (Time/Quality)</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <ShieldCheck className="w-6 h-6 text-secondary mb-2" />
                  <div className="text-sm font-bold text-secondary mb-1">Compliant</div>
                  <p className="text-xs text-muted-foreground leading-tight">Automated & Manual Governance Pass</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Hand-off to recognition */}
        <Card className="border-card-border">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Your credential is ready</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                This evaluation has issued a verifiable credential and added your impact to the federal register.
              </p>
            </div>
            <Button onClick={() => setLocation("/learner/recognition")} data-testid="button-view-recognition">
              View Recognition and Impact <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
