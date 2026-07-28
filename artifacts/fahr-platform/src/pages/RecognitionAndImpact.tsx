import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Trophy, Download, Share2, Shield, CheckCircle2, FileCheck, Hexagon, Star, Target, ArrowUpRight, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

const MOCK_CERTIFICATES = [
  {
    id: "cert-001",
    title: "AI Fundamentals for Government",
    issueDate: "12 May 2026",
    issuer: "FAHR AI Academy",
    skills: ["AI Ethics", "Data Privacy", "Prompt Engineering"],
    level: "Aware",
    verifyId: "FAHR-2026-88912"
  },
  {
    id: "cert-002",
    title: "Agentic AI Operations",
    issueDate: "28 July 2026",
    issuer: "FAHR & Potential.com",
    skills: ["Workflow Automation", "AI Agents", "Process Design"],
    level: "Emerging Practitioner",
    verifyId: "FAHR-2026-99341"
  }
];

export default function RecognitionAndImpact() {
  const { toast } = useToast();
  const [selectedCert, setSelectedCert] = useState<typeof MOCK_CERTIFICATES[0] | null>(null);

  const simulateAction = (action: string) => {
    toast({
      title: `${action} Successful`,
      description: `Your credential has been processed for ${action.toLowerCase()}.`,
    });
  };

  const currentLevelIndex = 2; // Practitioner

  return (
    <Layout role="learner">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto w-full pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Recognition & Impact</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Your verified credentials, capabilities, and the tangible value you've created across the federal government.
            </p>
          </div>
          <div className="flex gap-4 items-center bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/15 text-accent">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Impact Points</p>
              <p className="text-2xl font-bold text-foreground">13,200</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Credentials Wallet */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Digital Credentials Wallet
              </h2>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => simulateAction("Sync")}>
                <ArrowUpRight className="w-4 h-4" />
                Sync with UAE Pass
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_CERTIFICATES.map(cert => (
                <Dialog key={cert.id} onOpenChange={(open) => !open && setSelectedCert(null)}>
                  <DialogTrigger asChild>
                    <Card 
                      className="relative overflow-hidden border-border bg-card hover-elevate group cursor-pointer"
                      onClick={() => setSelectedCert(cert)}
                    >
                      <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12">
                        <Shield className="w-40 h-40 text-primary" />
                      </div>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <CardDescription className="text-primary font-bold tracking-widest uppercase text-[10px] mb-2">
                              {cert.issuer}
                            </CardDescription>
                            <CardTitle className="text-xl leading-tight">{cert.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4 relative z-10">
                          <div className="flex flex-wrap gap-1.5">
                            {cert.skills.slice(0, 2).map(skill => (
                              <Badge key={skill} variant="secondary" className="bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 font-normal text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {cert.skills.length > 2 && (
                              <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal text-xs">
                                +{cert.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t border-border/50 bg-muted/30 pt-3 pb-3 flex justify-between items-center mt-2">
                         <div className="flex items-center gap-2 text-xs font-medium">
                           <Award className="w-4 h-4 text-accent" />
                           {cert.level}
                         </div>
                         <div className="text-xs text-muted-foreground font-mono">
                           {cert.issueDate}
                         </div>
                      </CardFooter>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">{cert.title}</DialogTitle>
                      <DialogDescription>Verified Credential • {cert.issuer}</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                      <div className="flex justify-center">
                         <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-8 border-background shadow-xl">
                            <Shield className="w-16 h-16 text-primary" />
                         </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Demonstrated Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {cert.skills.map(skill => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Issue Date</p>
                          <p className="text-sm font-medium">{cert.issueDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Verification ID</p>
                          <p className="text-sm font-mono font-medium">{cert.verifyId}</p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="flex gap-2 sm:justify-start border-t pt-4">
                      <Button variant="default" className="gap-2" onClick={() => simulateAction("Download")}>
                        <Download className="w-4 h-4" /> Download PDF
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => simulateAction("Share to LinkedIn")}>
                        <Share2 className="w-4 h-4" /> Share
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ))}

              {/* Placeholder for next cert */}
              <Card className="border-dashed border-2 border-border/60 bg-transparent flex flex-col items-center justify-center text-center p-6 h-full min-h-[220px]">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Next: Advanced Workflow</h3>
                <p className="text-sm text-muted-foreground mb-4">Complete 2 more lab projects to unlock</p>
                <Progress value={65} className="w-full h-2 mb-2" />
                <span className="text-xs text-muted-foreground font-medium">65% Progress</span>
              </Card>
            </div>

            {/* Impact Highlights */}
            <Card className="mt-8 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-none overflow-hidden relative">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 transform origin-top-right"></div>
              <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between h-full gap-8 relative z-10">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                      <Zap className="w-8 h-8 text-accent" />
                   </div>
                   <div>
                     <h3 className="font-bold text-2xl mb-2">Measurable Workplace Impact</h3>
                     <p className="text-primary-foreground/80 max-w-md leading-relaxed">
                       Your automated workflows have saved an estimated <strong className="text-white">42 hours</strong> this month across the department.
                     </p>
                   </div>
                </div>
                <Button className="bg-white text-primary hover:bg-white/90 shadow-md shrink-0 font-bold" size="lg" onClick={() => simulateAction("Generate Impact Report")}>
                  View Impact Report
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Unified Capability Ladder */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-accent" />
              Capability Level
            </h2>
            <Card className="border-border">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-lg">Unified Progression Ladder</CardTitle>
                <CardDescription>Your federal AI capability standing</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-2">
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-[27px] top-4 bottom-8 w-0.5 bg-border z-0"></div>
                  
                  <div className="space-y-8 relative z-10">
                    {CAPABILITY_LEVELS.map((level, i) => {
                      const isAchieved = i <= currentLevelIndex;
                      const isCurrent = i === currentLevelIndex;
                      
                      return (
                        <div key={level.id} className={`flex gap-5 items-start ${isAchieved ? "opacity-100" : "opacity-40 grayscale"}`}>
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-4 border-card shadow-sm ${
                            isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 
                            isAchieved ? 'bg-secondary text-secondary-foreground' : 
                            'bg-muted text-muted-foreground'
                          }`}>
                            {isAchieved ? <CheckCircle2 className="w-6 h-6" /> : <Hexagon className="w-5 h-5" />}
                          </div>
                          <div className="pt-2 flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-base font-bold ${isCurrent ? 'text-primary' : ''}`}>
                                {level.label}
                              </h4>
                              {isCurrent && (
                                <Badge variant="outline" className="border-primary text-primary bg-primary/5 text-[10px] uppercase">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground leading-snug">{level.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
