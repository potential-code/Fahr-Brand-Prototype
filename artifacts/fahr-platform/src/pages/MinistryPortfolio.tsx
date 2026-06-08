import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, User } from "lucide-react";

export default function MinistryPortfolio() {
  const projects = [
    {
      title: "AI-Assisted Public Health Campaign Brief Generator",
      learner: "Aisha Al Mansoori",
      dept: "Comms & Public Awareness",
      impact: "High",
      status: "In Review",
      govStatus: "Compliant",
      reviewer: "Pending"
    },
    {
      title: "Clinic FAQ AI Assistant",
      learner: "Customer Happiness Team",
      dept: "Customer Happiness",
      impact: "Medium",
      status: "Approved",
      govStatus: "Compliant",
      reviewer: "Saeed M."
    },
    {
      title: "Vaccination Campaign Content Automation",
      learner: "Communications Team",
      dept: "Comms & Public Awareness",
      impact: "High",
      status: "Deployed",
      govStatus: "Compliant",
      reviewer: "Fatima A."
    },
    {
      title: "Patient Feedback Summarization Agent",
      learner: "Service Quality Team",
      dept: "Digital Health",
      impact: "High",
      status: "Deployed",
      govStatus: "Compliant",
      reviewer: "Saeed M."
    },
    {
      title: "Internal HR Policy Assistant",
      learner: "HR Team",
      dept: "HR & Training",
      impact: "Medium",
      status: "Draft",
      govStatus: "Pending Check",
      reviewer: "Unassigned"
    }
  ];

  return (
    <Layout role="ministry">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Outcome Project Portfolio</h1>
            <p className="text-muted-foreground">Ministry of Health and Prevention</p>
          </div>
          <Button>Launch Ministry Challenge</Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {projects.map((proj, i) => (
            <Card key={i} className="hover-elevate transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{proj.title}</h3>
                      <Badge variant={proj.impact === 'High' ? 'default' : 'secondary'} className={proj.impact === 'High' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}>
                        {proj.impact} Impact
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-4 h-4"/> {proj.learner}</span>
                      <span>•</span>
                      <span>{proj.dept}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap lg:flex-nowrap gap-4 lg:gap-8 items-center text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{proj.status}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Governance</p>
                      <p className="font-medium">{proj.govStatus}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Reviewer</p>
                      <p className="font-medium">{proj.reviewer}</p>
                    </div>
                    <Button variant="outline" size="sm">View Canvas</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </Layout>
  );
}
