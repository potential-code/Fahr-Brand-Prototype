import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert, FileText, Database, Server, Lock, Settings, Activity, Cpu, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function FAHRGovernance() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Guardrail states
  const [guardrails, setGuardrails] = useState({
    humanInLoop: true,
    auditTrail: true,
    dataResidency: true,
    explainability: true,
    preventPII: true,
    restrictPublicModels: true
  });

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const policies = [
    { id: "humanInLoop", label: "Human-in-the-loop required for high-risk actions", icon: ShieldCheck },
    { id: "auditTrail", label: "Full immutable audit trail enabled", icon: FileText },
    { id: "preventPII", label: "Block PII data from LLM prompts", icon: Lock },
    { id: "dataResidency", label: "Enforce UAE data residency for embeddings", icon: Database },
    { id: "restrictPublicModels", label: "Restrict access to unauthorized public models", icon: Server },
    { id: "explainability", label: "Require explainability trace for AI decisions", icon: ShieldAlert },
  ];

  const auditLogs = [
    { time: "10 mins ago", user: "Aisha Al Mansoori", agent: "AI Skills Advisor", action: "Recommended Workplace Project", risk: "Low", status: "Approved" },
    { time: "1 hour ago", user: "Saeed M. (Admin)", agent: "AI Practice Partner", action: "Reviewed Project", risk: "Medium", status: "Pending Human Review" },
    { time: "2 hours ago", user: "Fatima A. (Admin)", agent: "Analytics Agent", action: "Generated Federal Report", risk: "Low", status: "Approved" },
    { time: "Yesterday", user: "System", agent: "AI Analytics Assistant", action: "Flagged Data Policy Warning (PII)", risk: "High", status: "Blocked" },
    { time: "Yesterday", user: "Khalid R.", agent: "Digital Twin", action: "Connected Knowledge Source", risk: "Low", status: "Approved" },
  ];

  const tokenUsage = [
    { entity: "Ministry of Health", used: 4.2, quota: 5.0, status: "Warning" },
    { entity: "Ministry of Education", used: 8.1, quota: 10.0, status: "Normal" },
    { entity: "Ministry of Economy", used: 2.9, quota: 3.0, status: "Critical" },
    { entity: "Ministry of HR", used: 1.5, quota: 4.0, status: "Normal" },
    { entity: "Ministry of Climate Change", used: 2.1, quota: 2.0, status: "Throttled" },
  ];

  const usageChartData = tokenUsage.map(t => ({
    name: t.entity.replace("Ministry of ", ""),
    Used: t.used,
    Remaining: Math.max(0, t.quota - t.used)
  }));

  const handleToggle = (id: keyof typeof guardrails) => {
    setGuardrails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSavePolicies = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Governance Policies Updated",
        description: "AI behaviour guardrails have been successfully applied across the federal platform.",
      });
    }, 1000);
  };

  const SkeletonRow = () => (
    <div className="flex items-center space-x-4 py-3">
      <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
      <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
      <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
      <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
    </div>
  );

  return (
    <Layout role="fahr">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        
        <PageHeader
          tone="primary"
          className="mb-6"
          title="Governance & Infrastructure"
          description="Manage AI guardrails, security policies, and token quotas"
          actions={
            <Button onClick={handleSavePolicies} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? "Applying..." : "Apply Global Policies"}
            </Button>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* AI Behaviour Configuration */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-primary"/> AI Behaviour Guardrails</CardTitle>
                <CardDescription>Federal-level constraints applied to all Agentic AI interactions</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              <div className="space-y-6">
                {policies.map((p) => {
                  const isActive = guardrails[p.id as keyof typeof guardrails];
                  return (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full border ${isActive ? 'bg-green-50 border-green-200' : 'bg-muted border-border'}`}>
                          <p.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{p.label}</p>
                          <p className="text-xs text-muted-foreground">{isActive ? 'Enforced system-wide' : 'Currently disabled'}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={isActive} 
                        onCheckedChange={() => handleToggle(p.id as keyof typeof guardrails)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Token Usage & Monitoring */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2"><Cpu className="w-5 h-5 text-primary"/> Token Consumption (Millions)</CardTitle>
                <CardDescription>Monthly LLM token quota allocation by entity</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/5">Live Monitoring</Badge>
            </CardHeader>
            <CardContent className="pt-6 flex-1 space-y-6">
              
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="Used" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Remaining" stackId="a" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {tokenUsage.map((entity, i) => {
                  const percentage = Math.min(100, (entity.used / entity.quota) * 100);
                  const isWarning = entity.status === 'Warning';
                  const isCritical = entity.status === 'Critical' || entity.status === 'Throttled';
                  
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{entity.entity}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{entity.used}M / {entity.quota}M</span>
                          {entity.status !== 'Normal' && (
                            <Badge variant={isCritical ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 h-4">
                              {entity.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={percentage} 
                        className={`h-2 ${isCritical ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-amber-500' : ''}`}
                      />
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Quotas Adjusted", description: "Request for additional tokens submitted." })}>
                  Request Quota Increase
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Empty State / Audit Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Security Audit Trail</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Export Started", description: "Audit log export (CSV) will be emailed to you when ready." })}>Export Logs</Button>
              <Button variant="secondary" size="sm" onClick={() => toast({ title: "Filter Applied", description: "Showing only high-risk events." })}>Filter</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2 py-4">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <ShieldCheck className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No suspicious activity detected</h3>
                <p className="text-muted-foreground max-w-sm mt-1">All Agentic AI interactions are operating within defined governance parameters. Audit logs are clear.</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
