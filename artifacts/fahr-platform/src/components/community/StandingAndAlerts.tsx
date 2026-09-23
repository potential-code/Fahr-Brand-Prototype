import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { COMMUNITY_NOTIFICATIONS, type CommunityNotification } from "@/lib/engagement";
import type { CompetencyBadge } from "@/lib/recognitionRecord";
import {
  ArrowRight,
  AtSign,
  Award,
  Bell,
  BellRing,
  Check,
  MessageSquare,
  Star,
} from "lucide-react";

const KIND_ICON: Record<CommunityNotification["kind"], typeof Bell> = {
  reply: MessageSquare,
  mention: AtSign,
  reminder: BellRing,
  award: Award,
};

/**
 * The learner's own points and badges, shown beside the leaderboard.
 *
 * `badges` is always `competencyBadges(result)` — the same call Recognition
 * makes — so this panel can never show a badge count, or a badge name, that
 * the learner's own recognition page does not.
 */
export function MyStanding({
  points,
  rankEntity,
  badges,
}: {
  points: number;
  rankEntity: number;
  badges: CompetencyBadge[];
}) {
  const earned = badges.filter((b) => b.earned);
  const next = badges.find((b) => !b.earned) ?? null;

  return (
    <Card className="border-card-border" data-testid="card-my-standing">
      <CardContent className="p-5">
        <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
          <Star className="h-4.5 w-4.5 fill-current text-primary" /> Your standing
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-muted/40 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Impact points</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              <CountUp to={points} />
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rank in entity</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              <CountUp to={rankEntity} prefix="#" />
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Badges earned ({earned.length})
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {earned.map((badge, i) => (
            <motion.li
              key={badge.competencyId}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
              data-testid={`standing-badge-${badge.competencyId}`}
            >
              {badge.short}
            </motion.li>
          ))}
        </ul>

        {next && (
          <div className="mt-4 rounded-xl border border-dashed border-border p-3.5">
            <p className="text-xs font-semibold text-foreground">Next badge: {next.short}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-accent"
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(100, Math.round((next.score / next.threshold) * 100))}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Reach {next.threshold}% in {next.label} · {Math.max(0, next.threshold - next.score)}% to go
            </p>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link href="/learner/recognition" data-testid="link-recognition-from-community">
            Open my recognition record <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Community notifications and reminders, each dismissible. */
export function NotificationsPanel() {
  const [read, setRead] = useState<string[]>(COMMUNITY_NOTIFICATIONS.filter((n) => n.read).map((n) => n.id));
  const unread = COMMUNITY_NOTIFICATIONS.filter((n) => !read.includes(n.id));

  return (
    <Card className="border-card-border" data-testid="card-notifications">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
            <Bell className="h-4.5 w-4.5 text-primary" /> Notifications
          </h2>
          {unread.length > 0 && (
            <button
              type="button"
              onClick={() => setRead(COMMUNITY_NOTIFICATIONS.map((n) => n.id))}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
              data-testid="button-mark-all-read"
            >
              Mark all read
            </button>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {unread.length > 0 ? `${unread.length} unread` : "You are up to date."}
        </p>

        <ul className="mt-4 space-y-2.5">
          {COMMUNITY_NOTIFICATIONS.map((note, i) => {
            const isRead = read.includes(note.id);
            const Icon = KIND_ICON[note.kind];
            return (
              <motion.li
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.28, delay: i * 0.05 }}
                className={`rounded-xl border p-3.5 ${
                  isRead ? "border-border bg-transparent" : "border-primary/25 bg-primary/[0.05]"
                }`}
                data-testid={`notification-${note.id}`}
              >
                <div className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      isRead ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">{note.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{note.body}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">{note.when}</span>
                      {note.href && (
                        <Link
                          href={note.href}
                          className="text-[11px] font-semibold text-primary hover:underline"
                          data-testid={`link-notification-${note.id}`}
                        >
                          Open
                        </Link>
                      )}
                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => setRead((current) => [...current, note.id])}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                          data-testid={`mark-read-${note.id}`}
                        >
                          <Check className="h-3 w-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
