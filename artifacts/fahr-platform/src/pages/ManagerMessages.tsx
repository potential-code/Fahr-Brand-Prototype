import React, { useEffect, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Inbox, MessageSquare } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { TeamStatusBadge } from "@/components/manager/TeamStatusBadge";
import { DirectConversation } from "@/components/messages/DirectConversation";
import { useFederalData } from "@/lib/FederalDataContext";
import { managerThreadHref } from "@/lib/federal/notifications";
import type { DirectMessage } from "@/lib/federal/model";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * The department manager's inbox: one conversation per member of the team,
 * most recent first. The same conversations appear on each person's page and
 * in the learner's own Messages.
 */
export default function ManagerMessages() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const reduceMotion = useReducedMotion();
  const { focus, teamOf, directMessages, notificationsFor, isNotificationRead, markNotificationRead } = useFederalData();

  const team = teamOf(focus.managerId);

  /** Each person with their conversation, the busiest and most recent first. */
  const conversations = useMemo(() => {
    const between = (personId: string): DirectMessage[] =>
      directMessages.filter(
        (m) =>
          (m.fromId === personId && m.toId === focus.managerId) ||
          (m.fromId === focus.managerId && m.toId === personId),
      );
    return team
      .map((person) => ({ person, messages: between(person.id) }))
      .sort((a, b) => (b.messages.at(-1)?.at ?? "").localeCompare(a.messages.at(-1)?.at ?? ""));
  }, [team, directMessages, focus.managerId]);

  const requested = new URLSearchParams(search).get("member");
  const selected = conversations.find((c) => c.person.id === requested) ?? conversations[0];

  const notifications = notificationsFor("manager");
  const unreadFrom = (personId: string) =>
    notifications.filter(
      (n) => n.id.startsWith("n-mgr-dm-") && n.href === managerThreadHref(personId) && !isNotificationRead(n.id),
    ).length;

  // Opening a conversation reads the messages that person sent.
  const selectedId = selected?.person.id;
  useEffect(() => {
    if (!selectedId) return;
    for (const n of notifications) {
      if (n.id.startsWith("n-mgr-dm-") && n.href === managerThreadHref(selectedId) && !isNotificationRead(n.id)) {
        markNotificationRead(n.id);
      }
    }
  }, [selectedId, notifications, isNotificationRead, markNotificationRead]);

  return (
    <Layout role="manager">
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
        <PageHeader
          bordered
          title="Messages"
          description="Your conversations with each member of your team, in one place."
        />

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Conversation list */}
          <aside className="rounded-xl border border-border bg-card lg:self-start">
            <p className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Inbox className="h-3.5 w-3.5" /> Your team
            </p>
            <ul className="divide-y divide-border">
              {conversations.map(({ person, messages }) => {
                const last = messages.at(-1);
                const unread = unreadFrom(person.id);
                const active = person.id === selected?.person.id;
                return (
                  <li key={person.id}>
                    <button
                      type="button"
                      onClick={() => setLocation(managerThreadHref(person.id))}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-start transition-colors ${
                        active ? "bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      data-testid={`manager-thread-${person.id}`}
                      aria-current={active ? "true" : undefined}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initials(person.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">{person.name}</span>
                          {unread > 0 ? (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                              {unread}
                            </span>
                          ) : (
                            last && <span className="shrink-0 text-[10px] text-muted-foreground">{last.on.replace(/ \d{4}$/, "")}</span>
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {last
                            ? `${last.fromId === focus.managerId ? "You: " : ""}${last.body}`
                            : `${person.role} · no messages yet`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Selected conversation */}
          {selected ? (
            <motion.section
              key={selected.person.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="min-w-0 space-y-4"
              data-testid="manager-conversation"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {initials(selected.person.name)}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{selected.person.name}</h2>
                    <p className="text-xs text-muted-foreground">{selected.person.role}</p>
                  </div>
                  <TeamStatusBadge status={selected.person.status} />
                </div>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/manager/team/${selected.person.id}`}>
                    View profile <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" /> Conversation
                </p>
                <DirectConversation
                  meId={focus.managerId}
                  otherId={selected.person.id}
                  placeholder={`Message ${selected.person.name.split(" ")[0]}…`}
                  emptyNote={`No messages with ${selected.person.name.split(" ")[0]} yet.`}
                />
              </div>
            </motion.section>
          ) : (
            <section className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
              No one reports to you yet.
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
