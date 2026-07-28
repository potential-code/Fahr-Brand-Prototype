import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Calendar, Trophy, Megaphone, ThumbsUp, Send, Users, ArrowUpRight, Award, ChevronRight, BarChart3, CheckCircle2 } from "lucide-react";

const POLL_QUESTION = "Which AI capability would help you most in the next quarter?";

const POLL_OPTIONS = [
  { id: "prompting", label: "Prompt engineering for official writing", votes: 3120 },
  { id: "analytics", label: "AI-assisted analysis of service data", votes: 2480 },
  { id: "agentic", label: "Building an agent for a recurring process", votes: 1960 },
  { id: "governance", label: "Applying governance and data ethics", votes: 1240 },
];

// Mock Data
const MOCK_LEADERBOARD_ENTITY = [
  { rank: 1, name: "Saeed Al Dhaheri", points: 14500, role: "Innovation Lead", initials: "SD" },
  { rank: 2, name: "Aisha Al Mansoori", points: 13200, role: "Policy Analyst", initials: "AM", isCurrentUser: true },
  { rank: 3, name: "Mariam Al Suwaidi", points: 12850, role: "Project Manager", initials: "MS" },
  { rank: 4, name: "Majed Al Futtaim", points: 11400, role: "Data Scientist", initials: "MF" },
  { rank: 5, name: "Hind Bint Maktoum", points: 10900, role: "Strategic Planner", initials: "HB" },
];

const MOCK_LEADERBOARD_FEDERAL = [
  { rank: 1, name: "Mohammed Alabbar", points: 28500, entity: "Ministry of Finance", initials: "MA" },
  { rank: 2, name: "Fatima Al Jaber", points: 27200, entity: "Ministry of Economy", initials: "FJ" },
  { rank: 3, name: "Khalaf Al Habtoor", points: 26850, entity: "FAHR", initials: "KH" },
  { rank: 142, name: "Aisha Al Mansoori", points: 13200, entity: "FAHR", initials: "AM", isCurrentUser: true },
];

const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: "Federal Agentic AI Hackathon 2026", date: "15 Aug 2026", type: "Event", urgent: true },
  { id: 2, title: "New Module: Prompting for Policy Design", date: "10 Aug 2026", type: "Content", urgent: false },
  { id: 3, title: "Platform Maintenance Window", date: "08 Aug 2026", type: "System", urgent: false },
];

const MOCK_DISCUSSIONS = [
  { id: "d1", author: "Saeed Al Dhaheri", avatar: "SD", role: "Innovation Lead", time: "2 hours ago", title: "Best practices for automating document summarisation?", replies: 14, likes: 32 },
  { id: "d2", author: "Mariam Al Suwaidi", avatar: "MS", role: "Project Manager", time: "5 hours ago", title: "Seeking feedback on my Agentic AI Lab workflow", replies: 8, likes: 15 },
  { id: "d3", author: "Omar Tariq", avatar: "OT", role: "Data Engineer", time: "1 day ago", title: "Integrating external APIs securely with custom agents", replies: 22, likes: 45 },
];

export default function Community() {
  const { toast } = useToast();
  const [activeThread, setActiveThread] = useState<typeof MOCK_DISCUSSIONS[0] | null>(null);
  const [replyText, setReplyText] = useState("");
  const [pollVote, setPollVote] = useState<string | null>(null);

  const totalVotes = POLL_OPTIONS.reduce((n, o) => n + o.votes, 0) + (pollVote ? 1 : 0);

  const handlePostReply = () => {
    if (!replyText.trim()) return;
    toast({
      title: "Reply Posted",
      description: "Your response has been added to the discussion.",
    });
    setReplyText("");
    setActiveThread(null);
  };

  const handleRegisterEvent = (title: string) => {
    toast({
      title: "Registered",
      description: `You are now registered for: ${title}`,
    });
  };

  return (
    <Layout role="learner">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Federal AI Community</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Connect with peers, share Agentic workflows, and track your ranking across the UAE government.
            </p>
          </div>
          <Button size="lg" className="gap-2 shrink-0">
            <MessageSquare className="w-5 h-5" />
            Start a Discussion
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Announcements & Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {MOCK_ANNOUNCEMENTS.map(ann => (
                      <div key={ann.id} className="p-4 hover:bg-muted/30 transition-colors flex gap-4 items-start cursor-pointer">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${ann.urgent ? 'bg-destructive' : 'bg-primary'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{ann.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{ann.date}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{ann.type}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm bg-primary text-primary-foreground border-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-accent" />
                    Upcoming Event
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Agentic AI in Public Policy</h3>
                      <p className="text-primary-foreground/80 text-sm">Virtual Masterclass • 20 Aug 2026</p>
                    </div>
                    <Button variant="secondary" className="w-full font-bold shadow-sm" onClick={() => handleRegisterEvent("Agentic AI in Public Policy")}>
                      Register Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Community poll */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Community Poll
                </CardTitle>
                <CardDescription>{POLL_QUESTION}</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3">
                  {POLL_OPTIONS.map((opt) => {
                    const votes = opt.votes + (pollVote === opt.id ? 1 : 0);
                    const share = Math.round((votes / totalVotes) * 100);
                    const chosen = pollVote === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={pollVote !== null}
                        onClick={() => {
                          setPollVote(opt.id);
                          toast({
                            title: "Vote recorded",
                            description: "Results are shared with the FAHR programme team in aggregate.",
                          });
                        }}
                        data-testid={`poll-option-${opt.id}`}
                        className={`relative w-full overflow-hidden rounded-lg border px-4 py-3 text-left transition-colors ${
                          chosen ? "border-primary" : "border-border"
                        } ${pollVote === null ? "hover:border-primary/50 hover:bg-muted/40" : "cursor-default"}`}
                      >
                        {pollVote !== null && (
                          <span
                            className="absolute inset-y-0 left-0 bg-primary/10"
                            style={{ width: `${share}%` }}
                            aria-hidden="true"
                          />
                        )}
                        <span className="relative flex items-center justify-between gap-4">
                          <span className="flex items-center gap-2.5 text-sm font-medium">
                            {chosen && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                            {opt.label}
                          </span>
                          {pollVote !== null && (
                            <span className="text-sm font-bold text-primary tabular-nums shrink-0">{share}%</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {pollVote !== null
                    ? `${totalVotes.toLocaleString()} federal employees have voted. Closes 12 August 2026.`
                    : "Select an option to see how your peers across the federal government responded."}
                </p>
              </CardContent>
            </Card>

            {/* Discussions */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="w-5 h-5 text-secondary" />
                    Active Discussions
                  </CardTitle>
                  <CardDescription>Trending topics in your entity</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {MOCK_DISCUSSIONS.map(thread => (
                    <div 
                      key={thread.id} 
                      className="p-5 hover:bg-muted/20 transition-colors cursor-pointer group"
                      onClick={() => setActiveThread(thread)}
                    >
                      <div className="flex gap-4">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{thread.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{thread.author}</span>
                            <span className="text-xs text-muted-foreground hidden sm:inline-block">• {thread.role}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{thread.time}</span>
                          </div>
                          <h4 className="text-base font-medium text-foreground group-hover:text-primary transition-colors mb-3">
                            {thread.title}
                          </h4>
                          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {thread.replies} Replies</span>
                            <span className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4" /> {thread.likes} Likes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Leaderboard */}
          <div className="lg:col-span-4">
            <Card className="border-border shadow-sm h-full flex flex-col sticky top-24">
              <CardHeader className="pb-4 bg-gradient-to-r from-muted/50 to-transparent">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  Impact Leaderboard
                </CardTitle>
                <CardDescription>Ranked by verified capability & outcomes</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col">
                <Tabs defaultValue="entity" className="flex-1 flex flex-col">
                  <div className="px-4 pt-2">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="entity">My Entity</TabsTrigger>
                      <TabsTrigger value="federal">Federal</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="entity" className="flex-1 p-0 m-0 mt-2">
                    <div className="divide-y divide-border">
                      {MOCK_LEADERBOARD_ENTITY.map((user) => (
                        <div key={user.rank} className={`flex items-center gap-3 p-4 ${user.isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/20'}`}>
                          <div className="w-6 text-center font-bold text-muted-foreground text-sm">
                            {user.rank}
                          </div>
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className={user.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary/10 text-secondary'}>
                              {user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${user.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                              {user.name} {user.isCurrentUser && "(You)"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{user.points.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="federal" className="flex-1 p-0 m-0 mt-2">
                    <div className="divide-y divide-border">
                      {MOCK_LEADERBOARD_FEDERAL.map((user, idx) => (
                        <div key={user.rank} className={`flex items-center gap-3 p-4 ${user.isCurrentUser ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/20'}`}>
                          <div className="w-6 text-center font-bold text-muted-foreground text-sm flex flex-col items-center">
                            {idx === 3 && <div className="h-4 border-l-2 border-dotted border-border mb-2" />}
                            {user.rank}
                          </div>
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className={user.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                              {user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${user.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                              {user.name} {user.isCurrentUser && "(You)"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.entity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{user.points.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">Pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="p-4 border-t bg-muted/20 mt-auto">
                   <Button variant="outline" className="w-full gap-2">
                     <Award className="w-4 h-4" /> Learn how points work
                   </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Discussion Dialog */}
      <Dialog open={!!activeThread} onOpenChange={(open) => !open && setActiveThread(null)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
          {activeThread && (
            <>
              <DialogHeader className="p-6 pb-4 border-b bg-muted/20 flex-shrink-0">
                <div className="flex gap-4 items-start">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{activeThread.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl leading-snug mb-2">{activeThread.title}</DialogTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{activeThread.author}</span>
                      <span>• {activeThread.role}</span>
                      <span>• {activeThread.time}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
                <div className="text-sm text-foreground/90 leading-relaxed space-y-4">
                  <p>Hi team, I'm working on a workflow in the Agentic Lab to automate the summarisation of long policy documents. I'm currently using a sequential agent pattern but finding it slow.</p>
                  <p>Has anyone successfully implemented a parallel processing pattern for this? What prompts worked best for maintaining accuracy?</p>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ThumbsUp className="w-4 h-4" /> Helpful ({activeThread.likes})
                  </Button>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h4 className="font-semibold text-sm mb-4">{activeThread.replies} Replies</h4>
                  <div className="space-y-6">
                    {/* Mock Reply 1 */}
                    <div className="flex gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary/10 text-secondary">FJ</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">Fatima Al Jaber</span>
                          <span className="text-xs text-muted-foreground">1 hour ago</span>
                        </div>
                        <p className="text-sm text-foreground/80">I encountered the same issue. Switching to a Map-Reduce agent pattern solved the speed issue for me. The AI Skills Advisor has a great pathway on this.</p>
                      </div>
                    </div>
                    {/* Mock Reply 2 */}
                    <div className="flex gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-muted-foreground">OT</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">Omar Tariq</span>
                          <span className="text-xs text-muted-foreground">30 mins ago</span>
                        </div>
                        <p className="text-sm text-foreground/80">Agreed. I can share my workspace template with you if you'd like. It uses a parallel routing approach.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-card flex gap-3 items-center flex-shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">AM</AvatarFallback>
                </Avatar>
                <Input 
                  placeholder="Write a reply..." 
                  className="flex-1 bg-muted/50 focus-visible:bg-background"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostReply()}
                />
                <Button onClick={handlePostReply} disabled={!replyText.trim()} className="gap-2 shrink-0">
                  <Send className="w-4 h-4" /> Reply
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
