import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, User, ArrowRight, Activity, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

export default function MinistryPortfolio() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const projects = [
    {
      id: "p1",
      title: "AI-Assisted Public Health Campaign Brief Generator",
      learner: "Aisha Al Mansoori",
      dept: "Comms & Public Awareness",
      impact: "High",
      status: "In Review",
      govStatus: "Compliant",
      reviewer: "Pending",
      description: "Generates tailored health campaign briefs using historical public health data and demographic models to accelerate campaign launches.",
      timeline: [
        { date: "Oct 12, 2026", event: "Project Drafted via AI Practice Partner" },
        { date: "Oct 15, 2026", event: "Submitted for Review" },
      ],
      metrics: "Expected to save 40 hours per campaign. Projected cost reduction: AED 15,000/month."
    },
    {
      id: "p2",
      title: "Clinic FAQ AI Assistant",
      learner: "Customer Happiness Team",
      dept: "Customer Happiness",
      impact: "Medium",
      status: "Approved",
      govStatus: "Compliant",
      reviewer: "Saeed M.",
      description: "An internal digital twin trained on clinical standard operating procedures to answer front-desk queries instantly.",
      timeline: [
        { date: "Sep 20, 2026", event: "Prototype Completed" },
        { date: "Oct 01, 2026", event: "Governance Check Passed" },
        { date: "Oct 05, 2026", event: "Approved for Pilot" },
      ],
      metrics: "Reduced average handling time by 35%. 98% accuracy in pilot."
    },
    {
      id: "p3",
      title: "Vaccination Campaign Content Automation",
      learner: "Communications Team",
      dept: "Comms & Public Awareness",
      impact: "High",
      status: "Deployed",
      govStatus: "Compliant",
      reviewer: "Fatima A.",
      description: "Automated generation of bilingual social media posts and press releases for national vaccination drives.",
      timeline: [
        { date: "Aug 15, 2026", event: "Project Initiated" },
        { date: "Sep 10, 2026", event: "Approved and Deployed" },
      ],
      metrics: "Content production time reduced from 3 days to 4 hours."
    },
    {
      id: "p4",
      title: "Patient Feedback Summarization Agent",
      learner: "Service Quality Team",
      dept: "Digital Health",
      impact: "High",
      status: "Deployed",
      govStatus: "Compliant",
      reviewer: "Saeed M.",
      description: "Aggregates and categorizes unstructured patient feedback from multiple channels into actionable weekly reports.",
      timeline: [
        { date: "Jul 22, 2026", event: "Prototype Deployed" },
        { date: "Aug 30, 2026", event: "Scale-up Approved" },
      ],
      metrics: "Processing 5,000+ feedback entries weekly. Insights delivered 5 days faster."
    },
    {
      id: "p5",
      title: "Internal HR Policy Assistant",
      learner: "HR Team",
      dept: "HR & Training",
      impact: "Medium",
      status: "Draft",
      govStatus: "Pending Check",
      reviewer: "Unassigned",
      description: "A conversational agent for employees to query HR policies, leave balances, and benefits.",
      timeline: [
        { date: "Oct 18, 2026", event: "Initial Concept Created" },
      ],
      metrics: "Target: 50% reduction in tier-1 HR support tickets."
    }
  ];

  return (
    <Layout role="ministry">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Outcome Project Portfolio</h1>
            <p className="text-muted-foreground">Ministry of Health and Prevention</p>
          </div>
          <Button onClick={() => toast({ title: "Challenge Wizard", description: "Opening AI Challenge creation tool..." })}>
            Launch Ministry Challenge
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {projects.map((proj) => (
            <Card 
              key={proj.id} 
              className="hover-elevate transition-all cursor-pointer border-border hover:border-primary/50"
              onClick={() => setSelectedProject(proj)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-primary">{proj.title}</h3>
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
                      <p className="font-medium flex items-center gap-1">
                        {proj.status === 'Deployed' && <CheckCircle2 className="w-4 h-4 text-green-600"/>}
                        {proj.status}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Governance</p>
                      <p className="font-medium">{proj.govStatus}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Reviewer</p>
                      <p className="font-medium">{proj.reviewer}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground hidden lg:block" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Sheet open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedProject && (
              <div className="space-y-8 py-6">
                <SheetHeader className="space-y-4 text-left">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedProject.impact === 'High' ? 'default' : 'secondary'} className={selectedProject.impact === 'High' ? 'bg-accent text-accent-foreground' : ''}>
                      {selectedProject.impact} Impact
                    </Badge>
                    <Badge variant="outline" className={selectedProject.status === 'Deployed' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                      {selectedProject.status}
                    </Badge>
                  </div>
                  <SheetTitle className="text-2xl">{selectedProject.title}</SheetTitle>
                  <SheetDescription className="text-base">
                    {selectedProject.description}
                  </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Owner</span>
                    <p className="font-medium flex items-center gap-2"><User className="w-4 h-4"/> {selectedProject.learner}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Department</span>
                    <p className="font-medium">{selectedProject.dept}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Governance Status</span>
                    <p className="font-medium flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${selectedProject.govStatus === 'Compliant' ? 'text-green-600' : 'text-amber-500'}`}/> 
                      {selectedProject.govStatus}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Assigned Reviewer</span>
                    <p className="font-medium">{selectedProject.reviewer}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Impact Evidence</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm border border-border">
                    {selectedProject.metrics}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary"/> Project Timeline</h4>
                  <div className="space-y-4 pl-2 border-l-2 border-primary/20 ml-2">
                    {selectedProject.timeline.map((event: any, idx: number) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute -left-[33px] top-1 w-3 h-3 rounded-full bg-background border-2 border-primary"></div>
                        <p className="text-xs text-muted-foreground mb-1">{event.date}</p>
                        <p className="text-sm font-medium">{event.event}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex gap-3">
                  {selectedProject.status === 'In Review' && (
                    <>
                      <Button className="flex-1" onClick={() => {
                        toast({ title: "Approved", description: "Project has been approved and moved to next stage." });
                        setSelectedProject(null);
                      }}>Approve Project</Button>
                      <Button variant="outline" className="flex-1" onClick={() => {
                        toast({ title: "Feedback Requested", description: "Revision request sent to the learner." });
                        setSelectedProject(null);
                      }}>Request Revision</Button>
                    </>
                  )}
                  {selectedProject.status !== 'In Review' && (
                    <Button variant="outline" className="w-full gap-2" onClick={() => {
                      toast({ title: "Opening Lab", description: "Loading the Agentic AI Lab Twin..." });
                    }}>
                      <FileText className="w-4 h-4"/> View in Agentic Lab
                    </Button>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

      </div>
    </Layout>
  );
}
