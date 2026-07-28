import { useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ANNOUNCEMENT_LABEL, type Announcement } from "@/lib/engagement";
import { ArrowRight, ChevronDown, Megaphone, Pin } from "lucide-react";

const KIND_STYLE: Record<Announcement["kind"], string> = {
  programme: "border-primary/30 bg-primary/10 text-primary",
  content: "border-accent/30 bg-accent/10 text-accent",
  event: "border-secondary/30 bg-secondary/10 text-secondary",
  system: "border-border bg-muted text-muted-foreground",
};

function dayLabel(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return `${daysAgo} days ago`;
}

/** Announcements, expandable in place, with unread state the learner can clear. */
export function AnnouncementsPanel({ announcements }: { announcements: Announcement[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [read, setRead] = useState<string[]>([]);

  const unread = announcements.filter((a) => !read.includes(a.id)).length;
  const ordered = [...announcements].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.daysAgo - b.daysAgo);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
    setRead((current) => (current.includes(id) ? current : [...current, id]));
  };

  return (
    <Card className="border-card-border" data-testid="card-announcements">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
              <Megaphone className="h-4.5 w-4.5 text-primary" /> Announcements
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              From FAHR, the Governance Office and the academy.
            </p>
          </div>
          {unread > 0 && (
            <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              {unread} unread
            </span>
          )}
        </div>

        <ul className="divide-y divide-border">
          {ordered.map((announcement, i) => {
            const open = openId === announcement.id;
            const isRead = read.includes(announcement.id);
            return (
              <motion.li
                key={announcement.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                data-testid={`announcement-${announcement.id}`}
              >
                <button
                  type="button"
                  onClick={() => toggle(announcement.id)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-3 p-4 text-start transition-colors hover:bg-muted/40"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isRead ? "bg-border" : "bg-primary"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{announcement.title}</span>
                      {announcement.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_STYLE[announcement.kind]}`}
                      >
                        {ANNOUNCEMENT_LABEL[announcement.kind]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dayLabel(announcement.daysAgo)} · {announcement.from}
                      </span>
                    </span>
                  </span>
                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/60 bg-muted/30 px-4 pb-4 pt-3 ps-9">
                        <p className="text-sm leading-relaxed text-muted-foreground">{announcement.body}</p>
                        {announcement.href && (
                          <Button asChild size="sm" variant="outline" className="mt-3">
                            <Link href={announcement.href} data-testid={`link-announcement-${announcement.id}`}>
                              {announcement.hrefLabel ?? "Open"} <ArrowRight className="ms-2 h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
