import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { competencyFor, type Reply, type Thread } from "@/lib/engagement";
import { LEARNER_PROFILE } from "@/lib/constants";
import { BadgeCheck, MessageSquare, Plus, Search, Send, ThumbsUp, Users } from "lucide-react";

type Filter = "all" | "entity" | "mine";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All entities" },
  { id: "entity", label: "My entity" },
  { id: "mine", label: "I replied" },
];

const MY_INITIALS = "AM";

function ReplyRow({ reply, index }: { reply: Reply; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="flex gap-3"
      data-testid={`reply-${reply.id}`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={reply.mine ? "bg-primary text-primary-foreground text-xs" : "bg-primary/10 text-primary text-xs"}
        >
          {reply.initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-foreground">{reply.author}</span>
          <span className="text-xs text-muted-foreground">{reply.role}</span>
          <span className="text-xs text-muted-foreground">· {reply.when}</span>
          {reply.accepted && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <BadgeCheck className="h-3 w-3" /> Marked helpful
            </span>
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{reply.body}</p>
      </div>
    </motion.li>
  );
}

/**
 * The forum: filterable threads that open, accept replies and record likes.
 * All interaction is real for the session — state lives in the parent page.
 */
export function DiscussionBoard({
  threads,
  likedIds,
  onToggleLike,
  onReply,
  onStartThread,
}: {
  threads: Thread[];
  likedIds: string[];
  onToggleLike: (threadId: string) => void;
  onReply: (threadId: string, body: string) => void;
  onStartThread: (title: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return threads.filter((thread) => {
      if (filter === "entity" && thread.entity !== LEARNER_PROFILE.entity) return false;
      if (filter === "mine" && !thread.replies.some((r) => r.mine)) return false;
      if (!term) return true;
      return (
        thread.title.toLowerCase().includes(term) ||
        thread.body.toLowerCase().includes(term) ||
        thread.author.toLowerCase().includes(term)
      );
    });
  }, [threads, filter, query]);

  const active = threads.find((t) => t.id === openId) ?? null;

  const submitReply = () => {
    if (!active || !replyText.trim()) return;
    onReply(active.id, replyText.trim());
    setReplyText("");
  };

  return (
    <Card className="border-card-border" data-testid="card-discussions">
      <CardContent className="p-0">
        <div className="border-b border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
                <Users className="h-4.5 w-4.5 text-primary" /> Discussion forum
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ask across entities. Answers marked helpful earn the author impact points.
              </p>
            </div>
            <Button size="sm" className="shrink-0 gap-2" onClick={() => setComposeOpen(true)} data-testid="button-start-discussion">
              <Plus className="h-4 w-4" /> Start a discussion
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search threads"
                className="ps-9"
                data-testid="input-search-threads"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={filter === f.id}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === f.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                  data-testid={`filter-${f.id}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ul className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {visible.map((thread, i) => {
              const liked = likedIds.includes(thread.id);
              const competency = competencyFor(thread.competencyId);
              return (
                <motion.li
                  key={thread.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.04 }}
                  className="group"
                  data-testid={`thread-${thread.id}`}
                >
                  <div className="flex gap-3.5 p-5 transition-colors hover:bg-muted/30">
                    <Avatar className="h-10 w-10 shrink-0 border border-border">
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {thread.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold text-foreground">{thread.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {thread.role} · {thread.entity}
                        </span>
                        <span className="text-xs text-muted-foreground">· {thread.when}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setOpenId(thread.id)}
                        className="mt-1.5 block text-start text-base font-medium text-foreground transition-colors hover:text-primary"
                        data-testid={`open-thread-${thread.id}`}
                      >
                        {thread.title}
                      </button>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{thread.body}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {competency && (
                          <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-[11px] font-medium text-secondary">
                            {competency.short}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleLike(thread.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            liked
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                          aria-pressed={liked}
                          data-testid={`like-${thread.id}`}
                        >
                          <motion.span
                            key={liked ? "on" : "off"}
                            initial={{ scale: 0.7 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 14 }}
                            className="flex"
                          >
                            <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
                          </motion.span>
                          <span className="tabular-nums">{thread.likes + (liked ? 1 : 0)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenId(thread.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="tabular-nums">{thread.replies.length}</span> replies
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {visible.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground" data-testid="threads-empty">
            No threads match that filter. Clear the search or switch back to all entities.
          </p>
        )}
      </CardContent>

      {/* Thread view with working replies */}
      <Dialog open={active !== null} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="flex h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {active && (
            <>
              <DialogHeader className="shrink-0 border-b border-border bg-muted/30 p-5 text-start">
                <DialogTitle className="text-lg leading-snug">{active.title}</DialogTitle>
                <DialogDescription>
                  {active.author} · {active.role}, {active.entity} · {active.when}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-sm leading-relaxed text-foreground">{active.body}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <Button
                    variant={likedIds.includes(active.id) ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={() => onToggleLike(active.id)}
                    data-testid="button-thread-like"
                  >
                    <ThumbsUp className="h-4 w-4" /> Helpful ({active.likes + (likedIds.includes(active.id) ? 1 : 0)})
                  </Button>
                  {competencyFor(active.competencyId) && (
                    <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
                      {competencyFor(active.competencyId)?.label}
                    </span>
                  )}
                </div>

                <h3 className="mt-6 border-t border-border pt-5 text-sm font-semibold text-foreground">
                  {active.replies.length} {active.replies.length === 1 ? "reply" : "replies"}
                </h3>
                <ul className="mt-4 space-y-5">
                  {active.replies.map((reply, i) => (
                    <ReplyRow key={reply.id} reply={reply} index={i} />
                  ))}
                </ul>
              </div>

              <div className="shrink-0 border-t border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">{MY_INITIALS}</AvatarFallback>
                  </Avatar>
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitReply();
                    }}
                    placeholder="Write a reply…"
                    className="flex-1"
                    data-testid="input-reply"
                  />
                  <Button
                    onClick={submitReply}
                    disabled={!replyText.trim()}
                    className="shrink-0 gap-2"
                    data-testid="button-post-reply"
                  >
                    <Send className="h-4 w-4" /> Reply
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Posting as {LEARNER_PROFILE.name} · {LEARNER_PROFILE.entity}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New thread */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-start">
            <DialogTitle>Start a discussion</DialogTitle>
            <DialogDescription>
              Visible to every federal entity. Colleagues who answer well earn impact points.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What do you need help with?"
              data-testid="input-new-thread-title"
            />
            <Textarea placeholder="Add the detail that will get you a useful answer" rows={4} />
          </div>
          <Button
            disabled={!newTitle.trim()}
            onClick={() => {
              onStartThread(newTitle.trim());
              setNewTitle("");
              setComposeOpen(false);
            }}
            data-testid="button-publish-thread"
          >
            Post to the community
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
