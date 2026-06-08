import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, FileText, Database, Server, Lock } from "lucide-react";

export default function FAHRGovernance() {
  const policies = [
    { label: "Human-in-the-loop review enabled", icon: ShieldCheck, active: true },
    { label: "Full audit trail enabled", icon: FileText, active: true },
    { label: "No government data used to train public models", icon: Lock, active: true },
    { label: "UAE data residency", icon: Database, active: true },
    { label: "Role-based access control", icon: Server, active: true },
    { label: "Explainability available for AI recommendations", icon: ShieldAlert, active: true },
  ];

  const auditLogs = [
    { time: "10 mins ago", user: "Aisha Al Mansoori", agent: "Capability Agent", action: "Recommended Outcome Project", risk: "Low", status: "Approved" },
    { time: "1 hour ago", user: "Saeed M. (Admin)", agent: "Assessment Agent", action: "Reviewed Project", risk: "Medium", status: "Pending Human Review" },
    { time: "2 hours ago", user: "Fatima A. (Admin)", agent: "Analytics Agent", action: "Generated Federal Report", risk: "Low", status: "Approved" },
    { time: "Yesterday", user: "System", agent: "Governance Agent", action: "Flagged Data Policy Warning", risk: "High", status: "Blocked" },
    { time: "Yesterday", user: "Khalid R.", agent: "Digital Twin", action: "Connected Knowledge Source", risk: "Low", status: "Approved" },
  ];

  return (
    <Layout role="fahr">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Governance and Audit View</h1>
          <p className="text-muted-foreground">Federal Authority For Government Human Resources</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {policies.map((p, i) => (
            <Card key={i} className="border-green-200 bg-green-50/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="bg-white p-2 rounded-full border border-green-200">
                  <p.icon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-900">{p.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Real-time Audit Logs</CardTitle>
            <Badge variant="outline" className="bg-primary/5">Live Monitoring</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Agent System</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{log.time}</TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.agent}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          log.risk === 'High' ? 'text-destructive border-destructive/30 bg-destructive/10' : 
                          log.risk === 'Medium' ? 'text-secondary border-secondary/30 bg-secondary/10' : 
                          'text-green-600 border-green-200 bg-green-50'
                        }>
                          {log.risk}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          log.status === 'Blocked' ? 'bg-destructive' : 
                          log.status === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 
                          'bg-primary/20 text-primary hover:bg-primary/30'
                        } variant={log.status === 'Blocked' || log.status === 'Approved' ? 'default' : 'secondary'}>
                          {log.status}
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
