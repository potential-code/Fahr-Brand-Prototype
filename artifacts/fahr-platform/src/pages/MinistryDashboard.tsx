import React, { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, Bot, Zap, Clock, Rocket, Search, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AGENTS } from "@/lib/constants";

export default function MinistryDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([]);

  const kpis = [
    { label: "Total Employees", value: "4,820", icon: Users, color: "text-blue-500" },
    { label: "Active Learners", value: "3,940", icon: Search, color: "text-indigo-500" },
    { label: "AI Readiness Index", value: "68%", icon: Zap, color: "text-yellow-500" },
    { label: "AI Digital Twins", value: "1,245", icon: Bot, color: "text-purple-500" },
    { label: "Projects Submitted", value: "318", icon: Rocket, color: "text-green-500" },
    { label: "Est. Hours Saved/Mo", value: "9,850", icon: Clock, color: "text-orange-500" },
  ];

  const departmentData = [
    { name: "Comms & Public Awareness", employees: 120, readiness: 82, twins: 95, projects: 45, hours: 1200, risk: "Low" },
    { name: "Customer Happiness", employees: 340, readiness: 75, twins: 210, projects: 88, hours: 2400, risk: "Low" },
    { name: "HR & Training", employees: 85, readiness: 71, twins: 50, projects: 22, hours: 850, risk: "Low" },
    { name: "Digital Health", employees: 150, readiness: 88, twins: 130, projects: 60, hours: 1800, risk: "Low" },
    { name: "Preventive Medicine", employees: 620, readiness: 54, twins: 120, projects: 35, hours: 900, risk: "Medium" },
    { name: "Hospitals & Clinics", employees: 3505, readiness: 42, twins: 640, projects: 68, hours: 2700, risk: "High" },
  ];

  const readinessChartData = departmentData.map(d => ({ name: d.name.split(' ')[0], score: d.readiness }));

  const twinAdoptionData = [
    { month: "Jan", twins: 120 }, { month: "Feb", twins: 340 }, { month: "Mar", twins: 680 },
    { month: "Apr", twins: 950 }, { month: "May", twins: 1245 }
  ];

  const handleApplyRecommendation = (id: string, action: string) => {
    setAppliedRecommendations(prev => [...prev, id]);
    toast({
      title: "Action Applied",
      description: `Successfully executed: ${action}`,
    });
  };

  return (
    <Layout role="ministry">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Ministry of Health and Prevention</h1>
            <p className="text-muted-foreground">Ministry Admin Dashboard</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast({ title: "Report Generating", description: "Capability gap report is being generated." })}>
              View Capability Gaps
            </Button>
            <Button onClick={() => setLocation('/ministry/portfolio')}>
              Review Projects (12)
            </Button>
          </div>
        </div>

        {/* AI Analytics Assistant Panel */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3 flex flex-row items-start gap-4 space-y-0">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {AGENTS.analytics} Insights
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Live Analysis</Badge>
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Continuous monitoring of workforce adoption and performance.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background rounded-md p-4 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-semibold text-sm">At-Risk Learners</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    42 staff members in Hospitals & Clinics have not logged in for 14 days and are falling behind the "Aware" baseline.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={appliedRecommendations.includes("rec-1")}
                  onClick={() => handleApplyRecommendation("rec-1", "Send automated check-in via AI Learning Coach")}
                >
                  {appliedRecommendations.includes("rec-1") ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Triggered</> : "Send Coach Check-in"}
                </Button>
              </div>

              <div className="bg-background rounded-md p-4 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold text-sm">Cohort Comparison</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cohort C (Customer Happiness) is adopting digital twins 3x faster than Cohort B. Recommend sharing their templates.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={appliedRecommendations.includes("rec-2")}
                  onClick={() => handleApplyRecommendation("rec-2", "Publish Cohort C templates to internal marketplace")}
                >
                  {appliedRecommendations.includes("rec-2") ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Published</> : "Publish Templates"}
                </Button>
              </div>

              <div className="bg-background rounded-md p-4 border border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-green-600">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold text-sm">Action Recommended</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    12 Outcome Projects from Digital Health are pending review. They have High impact potential for Patient Services.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={appliedRecommendations.includes("rec-3")}
                  onClick={() => handleApplyRecommendation("rec-3", `Assign fast-track review to ${AGENTS.analytics}`)}
                >
                  {appliedRecommendations.includes("rec-3") ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Fast-Tracked</> : "Fast-Track Review"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpis.map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex flex-col items-center text-center">
                <kpi.icon className={`w-6 h-6 mb-2 ${kpi.color}`} />
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Readiness by Department</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readinessChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Digital Twin Adoption Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={twinAdoptionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="twins" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Department Capability Overview</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => toast({ title: "Export Started", description: "Your CSV is downloading." })}>
              Export Report
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Employees</TableHead>
                    <TableHead className="text-right">Readiness Score</TableHead>
                    <TableHead className="text-right">Digital Twins</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Est. Hours Saved</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentData.map((dept) => (
                    <TableRow key={dept.name}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-right">{dept.employees}</TableCell>
                      <TableCell className="text-right">{dept.readiness}%</TableCell>
                      <TableCell className="text-right">{dept.twins}</TableCell>
                      <TableCell className="text-right">{dept.projects}</TableCell>
                      <TableCell className="text-right">{dept.hours}</TableCell>
                      <TableCell>
                        <Badge variant={dept.risk === 'High' ? 'destructive' : dept.risk === 'Medium' ? 'secondary' : 'outline'} className={dept.risk === 'Low' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                          {dept.risk} Gap
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
