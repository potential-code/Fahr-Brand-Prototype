import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageEnter, PanelEnter } from "@/components/motion";
import { FileText, Download, Loader2, Calendar, Users, Eye } from "lucide-react";
import { FEDERAL, NATIONAL_TARGET, ON_TRACK_READINESS } from "@/lib/federal";
import { printReport } from "@/lib/exportFile";

export default function LeadershipBriefings() {
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState("q3-2026");
  const [audience, setAudience] = useState("cabinet");
  
  const [activeBrief, setActiveBrief] = useState<{ period: string, audience: string } | null>(null);

  const [pastBriefs, setPastBriefs] = useState([
    { id: 1, title: "Quarterly Readiness Report", period: "Q2 2026", audience: "Cabinet", date: "15 Jul 2026" },
    { id: 2, title: "Federal AI Impact Summary", period: "Q1 2026", audience: "Public", date: "12 Apr 2026" },
  ]);

  const handleGenerate = () => {
    setGenerating(true);
    setActiveBrief(null);
    setTimeout(() => {
      setGenerating(false);
      setActiveBrief({ period, audience });
      setPastBriefs(prev => [
        { 
          id: Date.now(), 
          title: audience === 'cabinet' ? 'Cabinet Status Brief' : 'Federal AI Programme Brief', 
          period: period.toUpperCase().replace('-', ' '), 
          audience: audience.charAt(0).toUpperCase() + audience.slice(1), 
          date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        },
        ...prev
      ]);
    }, 1200);
  };

  const handlePrint = () => {
    if (!activeBrief) return;
    printReport({
      title: `Executive Briefing: ${audience.charAt(0).toUpperCase() + audience.slice(1)}`,
      subtitle: `Federal AI Programme Status — ${activeBrief.period.toUpperCase().replace('-', ' ')}`,
      meta: [`Readiness: ${FEDERAL.readiness}%`, `Entities On Track: ${FEDERAL.ministriesOnTrack}`],
      sections: [
        {
          heading: "Executive Summary",
          paragraphs: [
            `The federal workforce has achieved an aggregate AI readiness of ${FEDERAL.readiness}%, tracking toward the ${NATIONAL_TARGET.readiness}% target for ${NATIONAL_TARGET.by}.`,
            `${FEDERAL.activeLearners.toLocaleString()} employees are actively engaged in learning pathways, representing ${FEDERAL.coverage}% of the targeted workforce.`
          ]
        },
        {
          heading: "Economic Impact",
          facts: [
            { label: "Value Created", value: `AED ${FEDERAL.valueCreatedAedM}M` },
            { label: "Monthly Hours Saved", value: FEDERAL.hoursSavedPerMonth.toLocaleString() },
            { label: "Deployed Projects", value: FEDERAL.projectsSubmitted.toLocaleString() }
          ]
        }
      ]
    });
  };

  return (
    <Layout role="leadership">
      <PageEnter className="space-y-8 pb-12">
        <PageHeader 
          bordered
          title="Executive Briefings" 
          description="Generate and review national AI readiness briefs for different stakeholder audiences."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Brief</CardTitle>
                <CardDescription>Compile live data into a strategic brief.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Period</label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="q3-2026">Q3 2026 (Current)</SelectItem>
                      <SelectItem value="q2-2026">Q2 2026</SelectItem>
                      <SelectItem value="ytd">Year to Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audience</label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cabinet">Cabinet</SelectItem>
                      <SelectItem value="ministry-leadership">Ministry Leadership</SelectItem>
                      <SelectItem value="public">Public Release</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <FileText className="w-4 h-4 me-2" />}
                  {generating ? "Synthesising Data..." : "Generate Brief"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Archive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pastBriefs.map(b => (
                    <div key={b.id} className="flex flex-col gap-1 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer">
                      <span className="text-sm font-semibold">{b.title}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.date}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.audience}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {activeBrief ? (
              <PanelEnter>
                <Card className="border-primary/20 shadow-md">
                  <CardHeader className="border-b border-border bg-muted/20 pb-5">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-start">
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                          Generated Briefing Document
                        </p>
                        <CardTitle className="text-2xl text-foreground">
                          {activeBrief.audience === 'cabinet' ? 'Cabinet Status Brief' : 'Federal AI Programme Brief'}
                        </CardTitle>
                        <CardDescription className="mt-1.5 text-sm">
                          Period: {activeBrief.period.toUpperCase().replace('-', ' ')} • Generated: Just now
                        </CardDescription>
                      </div>
                      <Button variant="outline" onClick={handlePrint} className="shrink-0">
                        <Download className="w-4 h-4 me-2" /> Export PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8 space-y-8 bg-white dark:bg-card text-foreground">
                    <section className="space-y-3">
                      <h3 className="text-lg font-bold border-b border-border pb-2">Executive Summary</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        The federal workforce has achieved an aggregate AI readiness of <strong className="text-foreground">{FEDERAL.readiness}%</strong>, 
                        tracking toward the <strong className="text-foreground">{NATIONAL_TARGET.readiness}%</strong> target for {NATIONAL_TARGET.by}. 
                        Currently, <strong className="text-foreground">{FEDERAL.ministriesOnTrack} of {FEDERAL.ministriesTotal}</strong> entities meet or exceed the on-track threshold.
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-lg font-bold border-b border-border pb-2">Economic Impact</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-2">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Value Created</p>
                          <p className="text-2xl font-bold text-primary">AED {FEDERAL.valueCreatedAedM}M</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Hours Saved</p>
                          <p className="text-2xl font-bold text-foreground">{FEDERAL.hoursSavedPerMonth.toLocaleString()}/mo</p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Projects Deployed</p>
                          <p className="text-2xl font-bold text-foreground">{FEDERAL.projectsSubmitted.toLocaleString()}</p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-lg font-bold border-b border-border pb-2">Strategic Recommendations</h3>
                      <ul className="list-disc list-outside text-sm text-muted-foreground space-y-2.5 ms-4">
                        <li>Direct additional enablement resources to the <strong className="text-foreground">{FEDERAL.ministriesTotal - FEDERAL.ministriesOnTrack}</strong> entities currently below the {ON_TRACK_READINESS}% threshold.</li>
                        <li>Accelerate credential issuance to convert high assessment scores into formal capability recognition.</li>
                        <li>Expand successful workplace projects across complementary functions to multiply estimated value.</li>
                      </ul>
                    </section>
                  </CardContent>
                </Card>
              </PanelEnter>
            ) : (
              <div className="h-full min-h-[400px] rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <Eye className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-foreground">No brief active</p>
                <p className="text-sm mt-1 max-w-sm">Select a period and audience from the panel to generate a live data brief for presentation or export.</p>
              </div>
            )}
          </div>
        </div>
      </PageEnter>
    </Layout>
  );
}
