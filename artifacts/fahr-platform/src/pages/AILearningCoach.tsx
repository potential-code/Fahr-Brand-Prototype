import React from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, MessageSquare, Mic, User } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { AGENTS } from "@/lib/constants";

export default function AILearningCoach() {
  const { language } = useLanguage();

  return (
    <Layout role="learner">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
        
        <PageHeader
          bordered
          title={AGENTS.coach}
          description="Interact with your personal guide"
          actions={
            <div className="text-right" dir="rtl">
              <p className="text-sm font-arabic text-primary">يمكنني مساعدتك في تحويل التعلم إلى مشروع عملي قابل للقياس.</p>
            </div>
          }
        />

        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2"/> Text Chat</TabsTrigger>
            <TabsTrigger value="voice"><Mic className="w-4 h-4 mr-2"/> Voice</TabsTrigger>
            <TabsTrigger value="avatar"><User className="w-4 h-4 mr-2"/> Embodied</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 flex min-h-[400px]">
            <TabsContent value="chat" className="flex-1 m-0">
              <Card className="h-full flex flex-col">
                <CardContent className="flex-1 p-6 flex flex-col gap-4 overflow-auto">
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                      Help me apply what I learned to my public health campaign work.
                    </div>
                  </div>
                  <div className="flex justify-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="bg-muted p-3 rounded-2xl rounded-tl-sm max-w-[80%]">
                      I can help you turn this into a Workplace Project. Let's identify a campaign process that can be improved using AI.
                    </div>
                  </div>
                </CardContent>
                <div className="p-4 border-t border-border mt-auto">
                  <div className="relative">
                    <input type="text" placeholder="Type a message... (simulated)" className="w-full pl-4 pr-10 py-3 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" disabled />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="voice" className="flex-1 m-0">
              <Card className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/30">
                <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center relative mb-8">
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping"></div>
                  <div className="absolute inset-4 rounded-full border border-primary/40 animate-ping" style={{ animationDelay: '200ms' }}></div>
                  <Mic className="w-12 h-12 text-primary" />
                </div>
                
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6">Voice mode active – simulated</p>
                
                <div className="text-center max-w-lg">
                  <p className="text-xl font-medium leading-relaxed">
                    "Aisha, based on your role, I suggest building an AI assistant for campaign brief generation."
                  </p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="avatar" className="flex-1 m-0">
              <Card className="h-full flex flex-col items-center justify-center p-8 overflow-hidden relative bg-foreground border-none">
                 <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-foreground to-foreground"></div>
                 
                 {/* Simulated 3D Avatar Placeholder */}
                 <div className="w-64 h-64 relative z-10 mb-8">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-[40%] animate-[spin_10s_linear_infinite] opacity-50 blur-xl"></div>
                    <div className="absolute inset-2 bg-gradient-to-tr from-white/20 to-transparent rounded-[30%] backdrop-blur-sm border border-white/30 flex items-center justify-center">
                       <Bot className="w-24 h-24 text-white drop-shadow-lg" />
                    </div>
                 </div>

                 <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl max-w-md text-center text-white">
                    <p className="text-lg">"I will guide you step by step from learning to applied impact."</p>
                 </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}
