import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/lib/LanguageContext";
import { Bot, Target, Zap, Clock, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function LearnerDashboard() {
  const { language, t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Quote */}
        <div className="bg-muted p-4 rounded-xl text-center italic text-muted-foreground">
          "AI is not a feature layer. It is the operating system of the learning journey."
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Card */}
          <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-white to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden">
                   <Bot className="w-12 h-12 text-white absolute" />
                   <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    {language === 'ar' ? 'مرحباً عائشة، أنا وكيلك الذكي لتطوير القدرات.' : 'Welcome Aisha. I am your AI Capability Agent.'}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {language === 'ar' ? 'سأساعدك في بناء قدرات الذكاء الاصطناعي اللازمة لدورك وتحويل تعلمك إلى نتائج عمل قابلة للقياس.' : 'I will help you build the AI capabilities needed for your role and turn your learning into measurable workplace outcomes.'}
                  </p>
                  
                  <div className="bg-white/80 p-4 rounded-lg border border-primary/10 shadow-sm">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      Agent Insight
                    </p>
                    <p className="text-sm text-foreground">
                      I noticed your strongest area is content strategy. Your current gap is AI-assisted campaign analytics. I recommend completing the next simulation and applying it to your Outcome Project.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Capability Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Learner</p>
                <p className="font-semibold">Aisha Al Mansoori</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium text-sm">Marketing Specialist</p>
                <p className="text-xs text-muted-foreground">Ministry of Health and Prevention</p>
                <p className="text-xs text-muted-foreground">Communications and Public Awareness</p>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">AI Readiness Score</p>
                  <span className="font-bold text-primary">62%</span>
                </div>
                <Progress value={62} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1 text-right">Level: Emerging Practitioner</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-elevate cursor-pointer transition-all" onClick={() => setLocation('/learner/mission')}>
            <CardContent className="p-4 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">48%</span>
                </div>
                <p className="text-sm text-muted-foreground">Mission Progress</p>
                <p className="font-semibold line-clamp-1">AI-Powered Campaigns</p>
              </div>
              <Button variant="ghost" className="w-full justify-between mt-4 p-0 h-auto hover:bg-transparent text-primary">
                {t('btn.start')} <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate cursor-pointer transition-all" onClick={() => setLocation('/learner/lab/twin')}>
            <CardContent className="p-4 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <Bot className="w-5 h-5 text-secondary" />
                  <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-1 rounded-full">70%</span>
                </div>
                <p className="text-sm text-muted-foreground">AI Digital Twin</p>
                <p className="font-semibold">Configured</p>
              </div>
              <Button variant="ghost" className="w-full justify-between mt-4 p-0 h-auto hover:bg-transparent text-secondary">
                {t('btn.twin')} <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate cursor-pointer transition-all" onClick={() => setLocation('/learner/lab/project')}>
            <CardContent className="p-4 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <Zap className="w-5 h-5 text-accent" />
                  <span className="text-xs font-medium bg-accent/20 text-accent-foreground px-2 py-1 rounded-full">In Progress</span>
                </div>
                <p className="text-sm text-muted-foreground">Outcome Project</p>
                <p className="font-semibold line-clamp-1">Campaign Brief Generator</p>
              </div>
              <Button variant="ghost" className="w-full justify-between mt-4 p-0 h-auto hover:bg-transparent text-accent-foreground">
                {t('btn.submit')} <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <Clock className="w-5 h-5 opacity-80" />
                </div>
                <p className="text-sm opacity-80">Estimated Impact</p>
                <p className="text-2xl font-bold">42 <span className="text-base font-normal">hrs saved/mo</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
