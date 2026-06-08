import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, Bot, Zap, Clock, Rocket, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MinistryDashboard() {
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

  return (
    <Layout role="ministry">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Ministry of Health and Prevention</h1>
            <p className="text-muted-foreground">Ministry Admin Dashboard</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">View Capability Gaps</Button>
            <Button>Review Projects (12)</Button>
          </div>
        </div>

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
            <Button variant="secondary" size="sm">Export Report</Button>
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
