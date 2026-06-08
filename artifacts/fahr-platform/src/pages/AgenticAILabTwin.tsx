import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, Shield } from "lucide-react";

export default function AgenticAILabTwin() {
  const setupSteps = [
    { title: "Define role and responsibilities", status: "completed" },
    { title: "Add recurring tasks", status: "completed" },
    { title: "Upload sample campaign briefs", status: "completed" },
    { title: "Define tone and communication guidelines", status: "in-progress" },
    { title: "Connect knowledge sources", status: "simulated" },
    { title: "Test the Digital Twin", status: "next" },
  ];

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-primary">Stage 1: Build Your AI Digital Twin</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Aisha's AI Digital Twin understands her day-to-day work, captures context, learns her workflows, and supports her as a trusted AI assistant.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Setup Steps */}
          <div className="xl:col-span-1 space-y-4">
            <h3 className="font-semibold text-lg mb-4">Configuration Progress</h3>
            <div className="space-y-3">
              {setupSteps.map((step, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${step.status === 'in-progress' ? 'border-primary bg-primary/5' : 'border-border bg-white'}`}>
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : step.status === 'in-progress' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm ${step.status === 'completed' ? 'font-medium' : step.status === 'in-progress' ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{step.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Twin Profile */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-primary/20 shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Shield className="w-48 h-48" />
              </div>
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      Aisha Twin <Badge variant="secondary" className="ml-2">Active Config</Badge>
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Purpose: Support public health campaign planning, content drafting, reporting, and stakeholder communication.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">Knowledge Areas</h4>
                <div className="flex flex-wrap gap-2 mb-8">
                  {['Health awareness campaigns', 'Citizen engagement', 'Social media planning', 'Campaign reporting', 'Responsible AI communication'].map(area => (
                    <Badge key={area} variant="outline" className="bg-background">{area}</Badge>
                  ))}
                </div>

                <div className="space-y-3 pt-6 border-t border-border">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Active Governance Guardrails</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-600" /> Human review required
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-600" /> No sensitive personal data
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-600" /> Approved ministry knowledge only
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-600" /> Full audit trail enabled
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button size="lg" className="flex-1">Train my Digital Twin <ArrowRight className="ml-2 w-4 h-4"/></Button>
              <Button size="lg" variant="outline" className="flex-1">Test response</Button>
              <Button size="lg" variant="ghost">View governance settings</Button>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
