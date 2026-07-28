import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { CAPABILITY_LEVELS, AGENTS } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, TrendingUp, AlertCircle, Send, CheckCircle2, BrainCircuit, Target, Activity, Shield, ChevronRight, UserCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Mock Data
const MOCK_TEAM = [
  { id: "e1", name: "Aisha Al Mansoori", role: "Policy Analyst", level: "Practitioner", progress: 85, lastActive: "2 hours ago", status: "on-track" },
  { id: "e2", name: "Khalid Al Hashimi", role: "Operations Specialist", level: "Aware", progress: 20, lastActive: "14 days ago", status: "at-risk" },
  { id: "e3", name: "Fatima Al Qasimi", role: "Service Designer", level: "Emerging Practitioner", progress: 60, lastActive: "1 day ago", status: "on-track" },
  { id: "e4", name: "Omar Tariq", role: "Data Engineer", level: "Advanced", progress: 95, lastActive: "5 mins ago", status: "excelling" },
  { id: "e5", name: "Zayed Al Marri", role: "HR Coordinator", level: "Emerging Practitioner", progress: 45, lastActive: "3 days ago", status: "needs-attention" },
];

const CAPABILITY_DISTRIBUTION = [
  { name: "Aware", count: 1, fill: "hsl(var(--muted-foreground))" },
  { name: "Emerging", count: 2, fill: "hsl(var(--secondary))" },
  { name: "Practitioner", count: 1, fill: "hsl(var(--primary))" },
  { name: "Advanced", count: 1, fill: "hsl(var(--accent))" },
  { name: "Champion", count: 0, fill: "hsl(var(--chart-4))" },
];

const AI_INSIGHTS = [
  { 
    id: 1, 
    employeeId: "e2",
    employeeName: "Khalid Al Hashimi",
    message: "High risk of disengagement", 
    context: "Has not logged in for 14 days and is falling behind on the 'Agentic AI Operations' mandatory pathway.", 
    urgency: "high",
    actionLabel: "Send Nudge"
  },
  { 
    id: 2, 
    employeeId: "e4",
    employeeName: "Omar Tariq",
    message: "Ready for Mentorship Role", 
    context: "Consistently scoring 95%+ in lab simulations. Recommend assigning as a peer mentor.", 
    urgency: "low",
    actionLabel: "Assign Role"
  }
];

export default function ManagerDashboard() {
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<typeof MOCK_TEAM[0] | null>(null);

  const handleAction = (action: string, employeeName: string) => {
    toast({
      title: `Action: ${action}`,
      description: `Successfully executed for ${employeeName}.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on-track': return <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">On Track</Badge>;
      case 'excelling': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Excelling</Badge>;
      case 'needs-attention': return <Badge variant="outline" className="bg-accent/10 text-accent border-accent/25">Needs Attention</Badge>;
      case 'at-risk': return <Badge variant="destructive" className="shadow-none">At Risk</Badge>;
      default: return null;
    }
  };

  return (
    <Layout role="manager">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Team Readiness Dashboard</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Monitor your team's progression through the federal Agentic AI capability ladder.
            </p>
          </div>
          <Button variant="outline" className="gap-2 shrink-0 bg-background" onClick={() => handleAction("Generate Report", "Team")}>
            <TrendingUp className="w-4 h-4" /> Generate Department Report
          </Button>
        </div>

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <Badge variant="secondary" className="font-normal text-xs">Active Cohort</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">5</p>
              <p className="text-sm text-muted-foreground mt-1">Direct Reports enrolled</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <Activity className="w-5 h-5 text-muted-foreground" />
                <Badge variant="outline" className="bg-secondary/10 text-secondary border-none font-normal text-xs">+12% vs last month</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">62%</p>
              <p className="text-sm text-muted-foreground mt-1">Avg. Pathway Completion</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">2</p>
              <p className="text-sm text-muted-foreground mt-1">Practitioners or above</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">14</p>
              <p className="text-sm text-muted-foreground mt-1">Verified Credentials Earned</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Charts and Insights */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* AI Insights Panel */}
            <Card className="border-accent/30 bg-gradient-to-br from-card to-accent/5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <BrainCircuit className="w-32 h-32 text-accent" />
              </div>
              <CardHeader className="pb-3 border-b border-border/50 bg-background/50 backdrop-blur-sm relative z-10">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                   <BrainCircuit className="w-5 h-5 text-accent" />
                   {AGENTS.analytics} Insights
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 relative z-10">
                {AI_INSIGHTS.map(insight => (
                  <div key={insight.id} className="flex flex-col p-4 bg-background border border-border/50 rounded-lg shadow-sm hover-elevate transition-all">
                     <div className="flex items-start gap-3 mb-3">
                       <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${insight.urgency === 'high' ? 'text-destructive' : 'text-primary'}`} />
                       <div>
                         <p className="font-semibold text-sm text-foreground">{insight.employeeName}</p>
                         <p className="font-medium text-xs text-foreground mt-0.5">{insight.message}</p>
                         <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.context}</p>
                       </div>
                     </div>
                     <Button 
                       size="sm" 
                       variant={insight.urgency === 'high' ? 'default' : 'secondary'} 
                       className="w-full gap-2 text-xs h-8"
                       onClick={() => handleAction(insight.actionLabel, insight.employeeName)}
                     >
                        <Send className="w-3 h-3" /> {insight.actionLabel}
                     </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Distribution Chart */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Team Capability Distribution</CardTitle>
                <CardDescription>Spread across the unified ladder</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CAPABILITY_DISTRIBUTION} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <RechartsTooltip 
                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {CAPABILITY_DISTRIBUTION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Direct Reports Table */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-sm h-full flex flex-col">
              <CardHeader className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl">Direct Reports</CardTitle>
                    <CardDescription>Manage individual development journeys</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[250px]">Employee</TableHead>
                      <TableHead>Current Capability</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_TEAM.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-muted/10">
                        <TableCell>
                          <div className="font-semibold text-foreground">{employee.name}</div>
                          <div className="text-xs text-muted-foreground">{employee.role}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{employee.level}</span>
                        </TableCell>
                        <TableCell>
                          <div className="w-[100px] flex flex-col gap-1.5">
                            <Progress value={employee.progress} className="h-1.5" />
                            <span className="text-[10px] text-muted-foreground text-right">{employee.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(employee.status)}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(employee)}>
                             View <ChevronRight className="w-4 h-4 ml-1" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Employee Detail Sheet */}
      <Sheet open={!!selectedEmployee} onOpenChange={(open) => !open && setSelectedEmployee(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedEmployee && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UserCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl">{selectedEmployee.name}</SheetTitle>
                    <SheetDescription className="text-base">{selectedEmployee.role}</SheetDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedEmployee.status)}
                  <Badge variant="secondary" className="font-normal flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {selectedEmployee.level}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="space-y-8">
                
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Current Progress</h4>
                  <div className="p-4 bg-muted/20 rounded-lg border border-border">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-semibold text-sm">Agentic Workflow Pathway</span>
                      <span className="font-bold">{selectedEmployee.progress}%</span>
                    </div>
                    <Progress value={selectedEmployee.progress} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">Last active: {selectedEmployee.lastActive}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manager Actions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => handleAction("Assign New Pathway", selectedEmployee.name)}>
                      <Target className="w-4 h-4 text-primary" /> Assign New Pathway
                    </Button>
                    <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => handleAction("Send Encouragement Message", selectedEmployee.name)}>
                      <Send className="w-4 h-4 text-secondary" /> Send Direct Message
                    </Button>
                    {selectedEmployee.status === 'at-risk' && (
                      <Button variant="default" className="justify-start gap-3 h-12" onClick={() => handleAction("Schedule Intervention Meeting", selectedEmployee.name)}>
                        <AlertCircle className="w-4 h-4" /> Schedule Intervention
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Competency Map</h4>
                  <Card className="border-border">
                    <CardContent className="p-4 space-y-4">
                      {['AI Ethics', 'Prompt Engineering', 'Workflow Automation'].map((skill, i) => (
                        <div key={skill} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{skill}</span>
                            <span className="text-muted-foreground">{[80, 45, 90][i]} / 100</span>
                          </div>
                          <Progress value={[80, 45, 90][i]} className="h-1.5 opacity-70" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </Layout>
  );
}
