import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Clock, Trophy, Zap, Star } from "lucide-react";

export default function RecognitionAndImpact() {
  return (
    <Layout role="learner">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto w-full">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Recognition and Impact</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto italic">
            "Success is measured not only by learning completed, but by capability demonstrated, projects delivered, and outcomes achieved."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-white to-accent/10 border-accent/20">
            <CardContent className="p-8 flex flex-col items-center text-center h-full justify-center">
              <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mb-4">
                <Award className="w-10 h-10 text-accent-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-1">Digital Badge</h3>
              <p className="text-muted-foreground mb-4">AI Campaign Practitioner</p>
              <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">Earned</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 flex flex-col items-center text-center h-full justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-1">Capability Level</h3>
              <p className="text-muted-foreground mb-4">Practitioner</p>
              <Badge variant="outline" className="text-primary border-primary/20">Active</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 flex flex-col items-center text-center h-full justify-center">
              <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="font-bold text-lg mb-1">Estimated Impact</h3>
              <p className="text-muted-foreground mb-4">42 Monthly Hours Saved</p>
              <Badge variant="outline" className="text-secondary border-secondary/20">Verified</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 flex flex-col items-center text-center h-full justify-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-10 h-10 text-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-1">Ministry Ranking</h3>
              <p className="text-muted-foreground mb-4">Top 15%</p>
              <Badge variant="secondary">Outstanding</Badge>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-primary text-primary-foreground">
            <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between h-full gap-6">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Star className="w-8 h-8 text-accent" />
                 </div>
                 <div>
                   <h3 className="font-bold text-xl mb-1">AI Impact Challenge</h3>
                   <p className="text-primary-foreground/80">Your Outcome Project is eligible for the federal AI challenge.</p>
                 </div>
              </div>
              <Badge className="bg-white text-primary hover:bg-gray-100 px-4 py-2 text-sm shrink-0 cursor-pointer">
                Nominate Project
              </Badge>
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
