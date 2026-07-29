import React, { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useFederalData } from "@/lib/FederalDataContext";
import { FEDERAL, NATIONAL_TARGET } from "@/lib/federal";
import { PageEnter, Stagger, StaggerItem, CountUp, ChartReveal } from "@/components/motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Rocket, Clock, Coins, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function LeadershipOutcomes() {
  const { ministries } = useFederalData();

  const kpis = [
    { label: "Deployed Projects", value: FEDERAL.projectsSubmitted, icon: Rocket },
    { label: "Monthly Hours Saved", value: FEDERAL.hoursSavedPerMonth, icon: Clock },
    { label: "Annual Value Created", value: FEDERAL.valueCreatedAedM, prefix: "AED ", suffix: "M", decimals: 1, icon: Coins },
    { label: "Credentials Issued", value: FEDERAL.credentialsIssued, icon: Award },
  ];

  const topValueEntities = useMemo(() => {
    return [...ministries].sort((a, b) => b.valueCreatedAedM - a.valueCreatedAedM).slice(0, 5);
  }, [ministries]);

  return (
    <Layout role="leadership">
      <PageEnter className="space-y-8 pb-12">
        <PageHeader 
          bordered
          title="National Outcomes" 
          description="Measurable impact driven by the federal AI capability programme."
        />

        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StaggerItem key={i}>
              <Card className="h-full border-border">
                <CardContent className="p-5 flex flex-col items-center text-center justify-center h-full">
                  <kpi.icon className="w-6 h-6 mb-3 text-primary" />
                  <p className="text-3xl font-bold text-foreground">
                    <CountUp to={kpi.value} decimals={kpi.decimals ?? 0} prefix={kpi.prefix} suffix={kpi.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">{kpi.label}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Est. Value Created by Entity</CardTitle>
              <CardDescription>Top 5 contributors to the AED {FEDERAL.valueCreatedAedM}M national total</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ChartReveal className="h-full" direction="wipe">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topValueEntities} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="shortName" type="category" axisLine={false} tickLine={false} width={120} fontSize={12} stroke="hsl(var(--foreground))" />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }} 
                      formatter={(v: number) => [`AED ${v.toFixed(1)}M`, "Value Created"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)'
                      }} 
                    />
                    <Bar dataKey="valueCreatedAedM" radius={[0, 4, 4, 0]} barSize={20}>
                      {topValueEntities.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartReveal>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Capability Lift</CardTitle>
                <CardDescription>Progress toward the {NATIONAL_TARGET.by} target</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Current Federal Readiness</span>
                    <span className="font-bold text-primary">{FEDERAL.readiness}%</span>
                  </div>
                  <Progress value={(FEDERAL.readiness / NATIONAL_TARGET.readiness) * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground text-end">Target: {NATIONAL_TARGET.readiness}%</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      <CountUp to={FEDERAL.ministriesOnTrack} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Entities on track</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      <CountUp to={FEDERAL.ministriesTotal - FEDERAL.ministriesOnTrack} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Entities needing attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-sm space-y-3">
                <p className="font-semibold text-primary text-base">Strategic Outcome Analysis</p>
                <p>The deployed {FEDERAL.projectsSubmitted.toLocaleString()} projects are currently returning an estimated <strong>AED {FEDERAL.valueCreatedAedM}M</strong> in annualised value.</p>
                <p>Process automation alone has recaptured <strong>{FEDERAL.hoursSavedPerMonth.toLocaleString()} hours</strong> of capacity per month across the federal workforce, primarily concentrated in policy analysis and customer service delivery.</p>
              </CardContent>
            </Card>
          </div>
        </div>

      </PageEnter>
    </Layout>
  );
}
