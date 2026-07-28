import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/lib/LanguageContext";
import { AGENTS, CAPABILITY_LEVELS } from "@/lib/constants";
import { Bot, Lightbulb, Target } from "lucide-react";

export default function DynamicCapabilityProfile() {
  const { language } = useLanguage();

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
