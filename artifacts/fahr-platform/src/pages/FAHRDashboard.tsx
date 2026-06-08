import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Bot, Zap, Lightbulb, Rocket, Activity } from "lucide-react";

export default function FAHRDashboard() {
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
    { name: "Climate Change", emp: 1800, learners: 1200, readiness: 58, twins: 420, projects: 115, value: "AED 1.8M", gap: "Data Modeling" },
    { name: "Energy and Infrastructure", emp: 4200, learners: 2800, readiness: 62, twins: 980, projects: 245, value: "AED 5.4M", gap: "IoT Integration" },
  ];

  const readinessData = ministries.map(m => ({ name: m.name.split(' ')[0], score: m.readiness }));

  return (
    <Layout role="fahr">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Federal Executive View</h1>
          <p className="text-muted-foreground">Federal Authority For Government Human Resources (FAHR)</p>
        </div>

        {/* Analytics Agent Insights */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg shrink-0 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-primary">Analytics Agent:</span> "The strongest AI adoption is currently in Communications, HR, and Customer Happiness roles."</p>
              <p><span className="font-semibold text-primary">Analytics Agent:</span> "The biggest capability gap across ministries is AI workflow automation."</p>
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
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readinessData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} fontSize={12} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
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
                    <TableRow key={min.name}>
                      <TableCell className="font-medium text-nowrap">{min.name}</TableCell>
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
    </Layout>
  );
}
