import React, { useMemo, useState } from "react";
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
import { useFederalData } from "@/lib/FederalDataContext";
import {
  DEPARTMENT_BY_ID,
  FEDERAL,
  LEVEL_BY_ID,
  MINISTRY_BY_ID,
  competencyLabel,
  departmentsOf,
  nationalGaps,
  peopleOf,
  type Person,
} from "@/lib/federal";

/** Entities shown in the federal comparison chart and value breakdown. */
const TOP_ENTITY_COUNT = 4;

export default function FAHRDashboard() {
  const { toast } = useToast();
  const { ministries, submissions } = useFederalData();
  const [drillLevel, setDrillLevel] = useState<'federal' | 'ministry' | 'department' | 'individual'>('federal');
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [selectedIndividual, setSelectedIndividual] = useState<Person | null>(null);

  const kpis = [
    { label: "Fed Employees Targeted", value: FEDERAL.employees.toLocaleString(), icon: Users },
    { label: "Active Learners", value: FEDERAL.activeLearners.toLocaleString(), icon: Activity },
    { label: "Federal Readiness", value: `${FEDERAL.readiness}%`, icon: Zap },
    { label: "AI Digital Twins", value: FEDERAL.twins.toLocaleString(), icon: Bot },
    { label: "Projects Submitted", value: FEDERAL.projectsSubmitted.toLocaleString(), icon: Rocket },
    { label: "Est. Value Created", value: `AED ${FEDERAL.valueCreatedAedM}M`, icon: Lightbulb },
  ];

  /** The entities the federal view leads with, largest workforce first. */
  const leadEntities = useMemo(
    () => [...ministries].sort((a, b) => b.employees - a.employees).slice(0, TOP_ENTITY_COUNT),
    [ministries],
  );

  const selectedMinistry = selectedMinistryId ? MINISTRY_BY_ID[selectedMinistryId] : null;
  const selectedDepartment = selectedDepartmentId ? DEPARTMENT_BY_ID[selectedDepartmentId] : null;

  const departments = useMemo(
    () => (selectedMinistryId ? departmentsOf(selectedMinistryId) : []),
    [selectedMinistryId],
  );
  const individuals = useMemo(
    () => (selectedDepartmentId ? peopleOf(selectedDepartmentId) : []),
    [selectedDepartmentId],
  );

  const federalChartData = leadEntities.map((m) => ({ id: m.id, name: m.shortName, score: m.readiness }));
  const ministryChartData = departments.map((d) => ({ id: d.id, name: d.name.split(' ')[0], score: d.readiness }));

  /** Value contribution, so the bars reconcile with the federal headline. */
  const valueBreakdown = useMemo(() => {
    const top = [...ministries].sort((a, b) => b.valueCreatedAedM - a.valueCreatedAedM).slice(0, 3);
    const other = Math.round((FEDERAL.valueCreatedAedM - top.reduce((a, m) => a + m.valueCreatedAedM, 0)) * 10) / 10;
    const bars = [
      ...top.map((m) => ({ label: m.shortName, value: m.valueCreatedAedM })),
      { label: "All other entities", value: other },
    ];
    const max = Math.max(...bars.map((b) => b.value), 1);
    const palette = ["bg-primary/80", "bg-secondary/80", "bg-accent/80", "bg-muted-foreground/50"];
    return bars.map((bar, i) => ({ ...bar, height: `${Math.max(Math.round((bar.value / max) * 100), 8)}%`, fill: palette[i] }));
  }, [ministries]);

  const gaps = useMemo(() => nationalGaps(), []);
  const strongest = [...ministries].sort((a, b) => b.readiness - a.readiness).slice(0, 3);

  const projectsOf = (personId: string) => submissions.filter((s) => s.personId === personId).length;

  const handleMinistryClick = (ministryId: string) => {
    setSelectedMinistryId(ministryId);
    setDrillLevel('ministry');
  };

  const handleDeptClick = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setDrillLevel('department');
  };

  const handleIndividualClick = (person: Person) => {
    setSelectedIndividual(person);
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
              {selectedMinistry?.name}
            </button>
          </>
        )}
        {(drillLevel === 'department' || drillLevel === 'individual') && (
          <>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <button className={`hover:text-primary transition-colors ${drillLevel === 'department' ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => setDrillLevel('department')}>
              {selectedDepartment?.name}
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
                  <p><span className="font-semibold text-primary">{AGENTS.analytics}:</span> "Adoption is strongest in {strongest.map((m) => m.shortName).join(", ")}, all at or above {strongest[strongest.length - 1]?.readiness}% readiness."</p>
                  <p><span className="font-semibold text-primary">{AGENTS.analytics}:</span> "The biggest capability gap across entities is {gaps[0] ? competencyLabel(gaps[0].competency.id) : "—"}, reported by {gaps[0]?.ministries ?? 0} of {FEDERAL.ministriesTotal}."</p>
                  <p><span className="font-semibold text-primary">Recommendation:</span> "Run a federal challenge on {gaps[0] ? competencyLabel(gaps[0].competency.id) : "capability transfer"} next quarter."</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {kpis.map((kpi, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <kpi.icon className="w-6 h-6 mb-2 text-primary" />
                    <p className="text-2xl font-bold" data-testid={`kpi-fahr-${i}`}>{kpi.value}</p>
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
                        onClick={(data: { payload?: { id?: string } }) => {
                          const id = data?.payload?.id;
                          if (id) handleMinistryClick(id);
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Est. Value Created by Entity (AED Millions)</CardTitle>
                  <CardDescription>Contributions to the AED {FEDERAL.valueCreatedAedM}M federal total</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-end justify-center pb-4">
                  <div className="w-full flex items-end justify-around h-[200px] px-4 gap-2">
                    {valueBreakdown.map((bar) => (
                      <div key={bar.label} className={`w-1/4 ${bar.fill} rounded-t-md relative flex justify-center`} style={{ height: bar.height }}>
                        <span className="absolute -top-6 text-sm font-bold">{bar.value}M</span>
                        <span className="absolute -bottom-8 text-xs text-center whitespace-nowrap">{bar.label}</span>
                      </div>
                    ))}
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
                        <TableRow
                          key={min.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleMinistryClick(min.id)}
                          data-testid={`row-ministry-${min.id}`}
                        >
                          <TableCell className="font-medium text-nowrap text-primary">{min.name}</TableCell>
                          <TableCell className="text-right font-bold">{min.readiness}%</TableCell>
                          <TableCell className="text-right">{min.activeLearners.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{min.twins.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{min.projectsSubmitted.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-primary font-medium">AED {min.valueCreatedAedM}M</TableCell>
                          <TableCell>
                            <Badge variant="outline">{competencyLabel(min.topGapCompetencyId)}</Badge>
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

        {drillLevel === 'ministry' && selectedMinistry && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>{selectedMinistry.name}</CardTitle>
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
                        onClick={(data: { payload?: { id?: string } }) => {
                          const id = data?.payload?.id;
                          if (id) handleDeptClick(id);
                        }}
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
                        <TableRow
                          key={dept.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleDeptClick(dept.id)}
                          data-testid={`row-fahr-department-${dept.id}`}
                        >
                          <TableCell className="font-medium text-primary">{dept.name}</TableCell>
                          <TableCell className="text-right">{dept.employees.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{dept.activeLearners.toLocaleString()}</TableCell>
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

        {drillLevel === 'department' && selectedDepartment && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <Card>
                <CardHeader>
                  <CardTitle>{selectedDepartment.name}</CardTitle>
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
                        <TableHead className="text-right">Workplace Projects</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {individuals.map((ind) => (
                        <TableRow
                          key={ind.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleIndividualClick(ind)}
                          data-testid={`row-individual-${ind.id}`}
                        >
                          <TableCell className="font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground"/> {ind.name}
                          </TableCell>
                          <TableCell>{ind.role}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                              {LEVEL_BY_ID[ind.levelId]?.label ?? ind.levelId}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">{ind.assessmentScore}%</TableCell>
                          <TableCell className="text-right">{projectsOf(ind.id)}</TableCell>
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
                    <p className="text-sm mt-1">{selectedDepartment?.name} | {selectedMinistry?.name}</p>
                  </div>
                  <Badge variant="default" className="text-sm px-4 py-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    {LEVEL_BY_ID[selectedIndividual.levelId]?.label ?? selectedIndividual.levelId}
                  </Badge>
                  <div className="w-full pt-4 space-y-2 border-t border-border mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Assessment Score</span>
                      <span className="font-bold">{selectedIndividual.assessmentScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pathway Progress</span>
                      <span className="font-bold">{selectedIndividual.pathwayProgress}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Workplace Projects</span>
                      <span className="font-bold">{projectsOf(selectedIndividual.id)}</span>
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
                    {CAPABILITY_LEVELS.map((level) => {
                      const current = LEVEL_BY_ID[selectedIndividual.levelId];
                      const isCurrent = level.id === current?.id;
                      const isAchieved = level.order <= (current?.order ?? 0);
                      
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

                  {selectedIndividual.gapCompetencyIds && selectedIndividual.gapCompetencyIds.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border text-sm text-muted-foreground">
                      Development priorities: {selectedIndividual.gapCompetencyIds.map(competencyLabel).join(", ")}
                    </div>
                  )}
                  
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
