import React from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/LanguageContext";
import { AGENTS, CAPABILITY_LEVELS } from "@/lib/constants";
import { Bot, Lightbulb, Target, TrendingUp, History, ArrowRight, Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { COMPETENCY_BY_ID } from "@/lib/learningData";

/** Six months of readiness history, ending at the learner's current baseline. */
const GROWTH_HISTORY = [
  { month: "Feb", readiness: 28 },
  { month: "Mar", readiness: 35 },
  { month: "Apr", readiness: 41 },
  { month: "May", readiness: 49 },
  { month: "Jun", readiness: 56 },
  { month: "Jul", readiness: 62 },
];

const PAST_ASSESSMENTS = [
  { id: "a2", label: "Mid-programme checkpoint", date: "12 May 2026", score: 49, level: "Emerging Practitioner" },
  { id: "a1", label: "First baseline assessment", date: "3 February 2026", score: 28, level: "Aware" },
];

export default function DynamicCapabilityProfile() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { result } = useLearnerProgress();

  // The live assessment result, when present, becomes the most recent history point.
  const growthData = result
    ? [...GROWTH_HISTORY.slice(0, -1), { month: "Now", readiness: result.overall }]
    : GROWTH_HISTORY;

  const skills = [
    { name: "Prompt Engineering for Government Communications", value: 78 },
    { name: "AI Campaign Planning", value: 66 },
    { name: "Data-Driven Audience Segmentation", value: 54 },
    { name: "AI Governance and Responsible Use", value: 71 },
    { name: "Campaign Performance Automation", value: 39 },
  ];

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Dynamic Capability Profile</h1>
              <p className="text-sm text-muted-foreground">Generated and continuously updated by your {AGENTS.advisor}</p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Current Level</p>
            <p className="text-lg font-bold text-primary">{CAPABILITY_LEVELS[1].label}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Capability Map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{skill.name}</span>
                      <span className="text-sm font-bold text-primary">{skill.value}%</span>
                    </div>
                    <Progress value={skill.value} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Growth over time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Capability Growth Over Time
                </CardTitle>
                <CardDescription>
                  AI readiness score across the programme, recalculated after every assessment and validated outcome.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        className="text-xs"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tickLine={false}
                        axisLine={false}
                        className="text-xs"
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "0.5rem",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "0.8rem",
                        }}
                        formatter={(v: number) => [`${v}%`, "AI Readiness"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="readiness"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {result
                    ? `Your latest baseline scored ${result.overall}% — ${result.overall - GROWTH_HISTORY[0].readiness} points above where you started in February.`
                    : "Complete a baseline assessment to add your current score to this trend."}
                </p>
              </CardContent>
            </Card>

            {/* Assessment history */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" /> Assessment History
                  </CardTitle>
                  <CardDescription>Every capability checkpoint on your record.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setLocation(result ? "/learner/assessment/report" : "/learner/assessment")}
                  data-testid="button-assessment-cta"
                >
                  {result ? "View latest report" : "Take assessment"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {result && (
                    <div className="px-6 py-4 flex items-center justify-between gap-4 bg-primary/5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary shrink-0" />
                          <p className="text-sm font-semibold text-foreground">Current baseline assessment</p>
                          <Badge className="rounded-full">Latest</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.completedOn} · Priority focus: {COMPETENCY_BY_ID[result.gaps[0]].label}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary tabular-nums">{result.overall}%</p>
                        <p className="text-xs text-muted-foreground">{result.levelLabel}</p>
                      </div>
                    </div>
                  )}
                  {PAST_ASSESSMENTS.map((a) => (
                    <div key={a.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{a.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{a.date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-muted-foreground tabular-nums">{a.score}%</p>
                        <p className="text-xs text-muted-foreground">{a.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Capabilities & Work Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <Target className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">AI-Assisted Reporting Automation</p>
                      <p className="text-sm text-muted-foreground">Target outcome: Reduce weekly reporting time by 5 hours</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Target className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Advanced Audience Persona Generation</p>
                      <p className="text-sm text-muted-foreground">Target outcome: Improve campaign engagement metrics</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">{AGENTS.advisor} Explanation</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80 mb-4">
                  Based on your role and current mission, I recommend focusing on AI-assisted campaign planning and reporting automation. These are most likely to create measurable value for your department.
                </p>
                <div className="p-4 bg-white rounded-lg border border-primary/10 shadow-sm relative overflow-hidden" dir="rtl">
                  <div className="absolute top-0 right-0 w-1 h-full bg-accent"></div>
                  <p className="text-sm font-medium text-right font-arabic">
                    التركيز المقترح: تحسين تخطيط الحملات باستخدام الذكاء الاصطناعي وقياس أثرها.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Role Context</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-2 text-sm">
                   <p><span className="text-muted-foreground">Primary Focus:</span> Public Health Campaigns</p>
                   <p><span className="text-muted-foreground">Current Challenge:</span> High volume of manual reporting</p>
                   <p><span className="text-muted-foreground">Immediate Goal:</span> Streamline campaign brief creation</p>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
