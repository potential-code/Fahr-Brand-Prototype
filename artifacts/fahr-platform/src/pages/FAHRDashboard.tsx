import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Bot, Zap, Lightbulb, Rocket, Activity, ChevronRight, User, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CAPABILITY_LEVELS, AGENTS } from "@/lib/constants";

export default function FAHRDashboard() {
  const { toast } = useToast();
  const [drillLevel, setDrillLevel] = useState<'federal' | 'ministry' | 'department' | 'individual'>('federal');
  const [selectedMinistry, setSelectedMinistry] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedIndividual, setSelectedIndividual] = useState<any>(null);

  const kpis = [
    { label: "Fed Employees Targeted", value: "80,000", icon: Users },
    { label: "Active Learners", value: "41,850", icon: Activity },
    { label: "Federal Readiness", value: "64%", icon: Zap },
    { label: "AI Digital Twins", value: "14,620", icon: Bot },
    { label: "Projects Submitted", value: "3,480", icon: Rocket },
    { label: "Est. Value Created", value: "AED 72M", icon: Lightbulb },
  ];

  const ministries = [
    { name: "Health and Prevention", emp: 4820, learners: 3940, readiness: 68, twins: 1245, projects: 318, value: "AED 4.2M", gap: "AI Workflow" },
    { name: "Education", emp: 12500, learners: 8200, readiness: 71, twins: 3400, projects: 840, value: "AED 12M", gap: "Personalization" },
    { name: "Economy", emp: 2100, learners: 1850, readiness: 82, twins: 1100, projects: 420, value: "AED 8.5M", gap: "Predictive Analytics" },
    { name: "Human Resources", emp: 3400, learners: 2900, readiness: 75, twins: 1650, projects: 380, value: "AED 6.1M", gap: "Automated Support" },
  ];

  const departments = [
    { name: "Comms & Public Awareness", emp: 120, learners: 115, readiness: 82 },
    { name: "Customer Happiness", emp: 340, learners: 290, readiness: 75 },
    { name: "HR & Training", emp: 85, learners: 80, readiness: 71 },
    { name: "Digital Health", emp: 150, learners: 140, readiness: 88 },
  ];

  const individuals = [
    { name: "Aisha Al Mansoori", role: "Content Strategist", level: CAPABILITY_LEVELS[2], score: 85, projects: 2 },
    { name: "Saeed M.", role: "Customer Support Lead", level: CAPABILITY_LEVELS[3], score: 92, projects: 4 },
    { name: "Fatima A.", role: "HR Specialist", level: CAPABILITY_LEVELS[1], score: 65, projects: 1 },
    { name: "Khalid R.", role: "Data Analyst", level: CAPABILITY_LEVELS[4], score: 98, projects: 5 },
  ];

  const federalChartData = ministries.map(m => ({ name: m.name.split(' ')[0], score: m.readiness }));
  const ministryChartData = departments.map(d => ({ name: d.name.split(' ')[0], score: d.readiness }));
  const deptChartData = individuals.map(i => ({ name: i.name.split(' ')[0], score: i.score }));

  const handleMinistryClick = (name: string) => {
    setSelectedMinistry(name);
    setDrillLevel('ministry');
  };

  const handleDeptClick = (name: string) => {
    setSelectedDepartment(name);
    setDrillLevel('department');
  };

  const handleIndividualClick = (ind: any) => {
    setSelectedIndividual(ind);
    setDrillLevel('individual');
  };

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center gap-2 text-sm font-medium mb-6 bg-muted p-3 rounded-md border border-border">
        <button className={`hover:text-primary transition-colors ${drillLevel === 'federal' ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => setDrillLevel('federal')}>
          Federal View
        </button>
        {drillLevel !== 'federal' && (
          <>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <button className={`hover:text-primary transition-colors ${drillLevel === 'ministry' ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => setDrillLevel('ministry')}>
              {selectedMinistry}
            </button>
          </>
        )}
        {(drillLevel === 'department' || drillLevel === 'individual') && (
          <>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <button className={`hover:text-primary transition-colors ${drillLevel === 'department' ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => setDrillLevel('department')}>
              {selectedDepartment}
            </button>
          </>
        )}
        {drillLevel === 'individual' && (
          <>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-primary">{selectedIndividual?.name}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <Layout role="fahr">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <PageHeader
          tone="primary"
          className="mb-2"
          title="Federal Executive View"
          description="Workforce Readiness & Drill-Down"
          actions={
            <Button variant="outline" onClick={() => toast({ title: "Report Exported", description: "Current view data is downloading." })}>
              Export Current View
            </Button>
          }
        />

        {renderBreadcrumbs()}

        {/* Dynamic Content based on Drill Level */}
        {drillLevel === 'federal' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Analytics Agent Insights */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg shrink-0 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold text-primary">{AGENTS.analytics}:</span> "The strongest AI adoption is currently in Communications, HR, and Customer Happiness roles."</p>
                  <p><span className="font-semibold text-primary">{AGENTS.analytics}:</span> "The biggest capability gap across ministries is AI workflow automation."</p>
                  <p><span className="font-semibold text-primary">Recommendation:</span> "Launch a federal AI Workflow Challenge next quarter."</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {kpis.map((kpi, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <kpi.icon className="w-6 h-6 mb-2 text-primary" />
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Federal AI Readiness by Ministry</CardTitle>
                  <CardDescription>Click a bar to drill down into Ministry details.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={federalChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} fontSize={12} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar 
                        dataKey="score" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]} 
                        barSize={20} 
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={(data) => handleMinistryClick(ministries.find(m => m.name.startsWith(data.name))?.name || data.name)}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Impact by Category (AED Millions)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-end justify-center pb-4">
                  <div className="w-full flex items-end justify-around h-[200px] px-4 gap-2">
                     <div className="w-1/4 bg-primary/80 rounded-t-md relative flex justify-center group" style={{height: '100%'}}>
                       <span className="absolute -top-6 text-sm font-bold">32M</span>
                       <span className="absolute -bottom-8 text-xs text-center whitespace-nowrap">Service Imp.</span>
                     </div>
                     <div className="w-1/4 bg-secondary/80 rounded-t-md relative flex justify-center" style={{height: '70%'}}>
                       <span className="absolute -top-6 text-sm font-bold">24M</span>
                       <span className="absolute -bottom-8 text-xs text-center whitespace-nowrap">Reporting</span>
                     </div>
                     <div className="w-1/4 bg-accent/80 rounded-t-md relative flex justify-center" style={{height: '40%'}}>
                       <span className="absolute -top-6 text-sm font-bold">11M</span>
                       <span className="absolute -bottom-8 text-xs text-center whitespace-nowrap">Content Gen.</span>
                     </div>
                     <div className="w-1/4 bg-muted-foreground/50 rounded-t-md relative flex justify-center" style={{height: '15%'}}>
                       <span className="absolute -top-6 text-sm font-bold">5M</span>
                       <span className="absolute -bottom-8 text-xs text-center whitespace-nowrap">Other</span>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ministry Comparison</CardTitle>
                <CardDescription>Click any row to drill down.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ministry</TableHead>
                        <TableHead className="text-right">Readiness</TableHead>
                        <TableHead className="text-right">Learners</TableHead>
                        <TableHead className="text-right">Digital Twins</TableHead>
                        <TableHead className="text-right">Projects</TableHead>
                        <TableHead className="text-right">Est. Value</TableHead>
                        <TableHead>Priority Gap</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ministries.map((min) => (
                        <TableRow key={min.name} className="cursor-pointer hover:bg-muted/50" onClick={() => handleMinistryClick(min.name)}>
                          <TableCell className="font-medium text-nowrap text-primary">{min.name}</TableCell>
                          <TableCell className="text-right font-bold">{min.readiness}%</TableCell>
                          <TableCell className="text-right">{min.learners.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{min.twins.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{min.projects.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-primary font-medium">{min.value}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{min.gap}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {drillLevel === 'ministry' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Ministry of {selectedMinistry}</CardTitle>
                  <CardDescription>Readiness by Department</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ministryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} fontSize={12} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar 
                        dataKey="score" 
                        fill="hsl(var(--secondary))" 
                        radius={[0, 4, 4, 0]} 
                        barSize={20}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={(data) => handleDeptClick(departments.find(d => d.name.startsWith(data.name))?.name || data.name)}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>Click a row to view individuals</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Employees</TableHead>
                        <TableHead className="text-right">Active Learners</TableHead>
                        <TableHead className="text-right">Readiness Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((dept) => (
                        <TableRow key={dept.name} className="cursor-pointer hover:bg-muted/50" onClick={() => handleDeptClick(dept.name)}>
                          <TableCell className="font-medium text-primary">{dept.name}</TableCell>
                          <TableCell className="text-right">{dept.emp}</TableCell>
                          <TableCell className="text-right">{dept.learners}</TableCell>
                          <TableCell className="text-right font-bold">{dept.readiness}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {drillLevel === 'department' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Card>
                <CardHeader>
                  <CardTitle>{selectedDepartment} Department</CardTitle>
                  <CardDescription>Individual Learner Readiness</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Learner Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Capability Level</TableHead>
                        <TableHead className="text-right">Assessment Score</TableHead>
                        <TableHead className="text-right">Deployed Projects</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {individuals.map((ind) => (
                        <TableRow key={ind.name} className="cursor-pointer hover:bg-muted/50" onClick={() => handleIndividualClick(ind)}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground"/> {ind.name}
                          </TableCell>
                          <TableCell>{ind.role}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                              {ind.level.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">{ind.score}%</TableCell>
                          <TableCell className="text-right">{ind.projects}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1">
                              View Profile <ChevronRight className="w-4 h-4"/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
          </div>
        )}

        {drillLevel === 'individual' && selectedIndividual && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedIndividual.name}</h2>
                    <p className="text-muted-foreground">{selectedIndividual.role}</p>
                    <p className="text-sm mt-1">{selectedDepartment} | {selectedMinistry}</p>
                  </div>
                  <Badge variant="default" className="text-sm px-4 py-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    {selectedIndividual.level.label}
                  </Badge>
                  <div className="w-full pt-4 space-y-2 border-t border-border mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Readiness</span>
                      <span className="font-bold">{selectedIndividual.score}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Workplace Projects</span>
                      <span className="font-bold">{selectedIndividual.projects}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Capability Journey</CardTitle>
                  <CardDescription>Progress along the unified Agentic AI capability ladder</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {CAPABILITY_LEVELS.map((level, index) => {
                      const isCurrent = level.id === selectedIndividual.level.id;
                      const isAchieved = level.order <= selectedIndividual.level.order;
                      
                      return (
                        <div key={level.id} className={`flex items-start gap-4 ${isAchieved ? '' : 'opacity-50'}`}>
                          <div className={`mt-1 rounded-full p-1 border-2 ${isCurrent ? 'border-primary bg-primary/20 text-primary' : isAchieved ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground bg-muted text-muted-foreground'}`}>
                            {isAchieved && !isCurrent ? <Award className="w-4 h-4" /> : <div className="w-4 h-4 flex items-center justify-center text-xs font-bold">{level.order}</div>}
                          </div>
                          <div>
                            <h4 className={`font-semibold ${isCurrent ? 'text-primary' : ''}`}>{level.label} {isCurrent && <Badge variant="outline" className="ml-2 bg-primary/10 border-primary/30">Current Level</Badge>}</h4>
                            <p className="text-sm text-muted-foreground">{level.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-border flex justify-end gap-2">
                    <Button variant="outline" onClick={() => toast({ title: "Coach Alerted", description: "AI Learning Coach will follow up." })}>
                      Nudge via AI Coach
                    </Button>
                    <Button onClick={() => toast({ title: "Project View", description: "Loading user portfolio..." })}>
                      View Projects
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
