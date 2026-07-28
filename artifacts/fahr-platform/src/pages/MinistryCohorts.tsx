import React, { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Send, BookOpen, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFederalData } from "@/lib/FederalDataContext";
import { cohortsOf } from "@/lib/federal";

export default function MinistryCohorts() {
  const { toast } = useToast();
  const [composerOpen, setComposerOpen] = useState(false);
  const [pathwayOpen, setPathwayOpen] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const { focus } = useFederalData();

  const cohorts = useMemo(() => cohortsOf(focus.ministryId), [focus.ministryId]);
  const enrolledLearners = cohorts.reduce((a, c) => a + c.learners, 0);
  const pathwaysAssigned = new Set(
    cohorts.filter((c) => c.pathway !== "Unassigned").map((c) => c.pathway),
  ).size;

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    setComposerOpen(false);
    toast({
      title: "Announcement Sent",
      description: "Your message has been distributed to the selected cohorts via the AI Content Assistant.",
    });
  };

  const handleAssignPathway = (e: React.FormEvent) => {
    e.preventDefault();
    setPathwayOpen(false);
    toast({
      title: "Pathway Assigned",
      description: "The AI Learning Coach has been notified to adjust learning paths for the cohort.",
    });
  };

  return (
    <Layout role="ministry">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <PageHeader
          tone="primary"
          className="mb-2"
          title="Cohorts & Programmes"
          description="Manage learning batches and strategic pathways"
          actions={
            <>
            <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Compose Announcement</DialogTitle>
                  <DialogDescription>
                    Send a direct message or assignment to your cohorts. The AI Content Assistant will automatically translate and format it for the target audience.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSendAnnouncement} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Cohorts</label>
                    <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option>All Active Cohorts</option>
                      {cohorts.filter(c => c.status === 'Active' || c.status === 'Onboarding').map(c => (
                        <option key={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <textarea 
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      placeholder="Enter your message here..."
                      required
                    ></textarea>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setComposerOpen(false)}>Cancel</Button>
                    <Button type="submit" className="gap-2"><Send className="w-4 h-4"/> Send via AI Assistant</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button onClick={() => toast({ title: "New Cohort", description: "Navigating to cohort builder..." })}>
              Create Cohort
            </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cohorts</p>
                <p className="text-2xl font-bold" data-testid="text-total-cohorts">{cohorts.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-secondary/10 p-4 rounded-full">
                <BookOpen className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Learners Enrolled</p>
                <p className="text-2xl font-bold" data-testid="text-cohort-learners">{enrolledLearners.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-accent/10 p-4 rounded-full">
                <Send className="w-8 h-8 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pathways Assigned</p>
                <p className="text-2xl font-bold">{pathwaysAssigned}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cohort Management</CardTitle>
            <CardDescription>Monitor progress and manage learning pathways for your ministry's cohorts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Learners</TableHead>
                    <TableHead className="w-[200px]">Progress</TableHead>
                    <TableHead>Assigned Pathway</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohorts.map((cohort) => (
                    <TableRow key={cohort.id} data-testid={`row-cohort-${cohort.id}`}>
                      <TableCell className="font-medium">{cohort.name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          cohort.status === 'Completed' ? 'secondary' : 
                          cohort.status === 'Active' ? 'default' : 'outline'
                        } className={cohort.status === 'Active' ? 'bg-green-600 hover:bg-green-700' : ''}>
                          {cohort.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{cohort.learners}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={cohort.progress} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8 text-right">{cohort.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${cohort.pathway === 'Unassigned' ? 'text-muted-foreground' : ''}`}>
                          {cohort.pathway}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={pathwayOpen && selectedCohort === cohort.id} onOpenChange={(open) => {
                          setPathwayOpen(open);
                          if(open) setSelectedCohort(cohort.id);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {cohort.pathway === 'Unassigned' ? 'Assign Pathway' : 'Edit'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Learning Pathway</DialogTitle>
                              <DialogDescription>
                                Set the primary focus for {cohort.name}. The AI Learning Coach will adjust individual paths to align with this strategic goal.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAssignPathway} className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Strategic Pathway</label>
                                <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                  <option>Strategic AI Leadership</option>
                                  <option>AI-Enhanced Service Delivery</option>
                                  <option>Predictive Analytics Mastery</option>
                                  <option>Workforce AI Workflows</option>
                                  <option>Content Generation & Comms</option>
                                </select>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setPathwayOpen(false)}>Cancel</Button>
                                <Button type="submit">Save Assignment</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
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
