import React, { useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Inbox, MessageSquare, PencilLine, Rocket, UserRound } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ProjectJourney } from "@/components/project/ProjectJourney";
import { ProjectConversation } from "@/components/project/ProjectConversation";
import { useFederalData } from "@/lib/FederalDataContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { journeyFor, projectThread } from "@/lib/federal/journey";
import { MANAGER_THREAD_HREF } from "@/lib/federal/notifications";
import type { Person } from "@/lib/federal/model";
import { DirectConversation } from "@/components/messages/DirectConversation";

const CHIP: Record<"action" | "waiting" | "live", { label: string; className: string }> = {
  action: { label: "Action required", className: "border-accent/40 bg-accent/10 text-accent" },
  waiting: { label: "In review", className: "border-primary/25 bg-primary/5 text-primary" },
  live: { label: "Live", className: "border-green-200 bg-green-50 text-green-700" },
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * The learner's inbox. Messages their line manager sends them arrive as one
 * conversation; every decision on their workplace project — the line
 * manager's, the entity's, FAHR's — arrives as another, with the one thing it
 * asks of them made obvious.
 */
export default function LearnerMessages() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const reduceMotion = useReducedMotion();
  const { approvals, submissions, focus, directMessages, getPerson, notificationsFor, isNotificationRead, markNotificationRead } =
    useFederalData();
  const { reopen } = useWorkplaceProject();

  const threads = useMemo(
    () => submissions.filter((s) => s.personId === focus.learnerId),
    [submissions, focus.learnerId],
  );
  // Both sides of the learner's conversation with their line manager.
  const withManager = useMemo(
    () =>
      directMessages.filter(
        (m) =>
          (m.fromId === focus.managerId && m.toId === focus.learnerId) ||
          (m.fromId === focus.learnerId && m.toId === focus.managerId),
      ),
    [directMessages, focus.learnerId, focus.managerId],
  );
  const manager = getPerson(focus.managerId);

  const params = new URLSearchParams(search);
  const requested = params.get("project");
  // The manager conversation opens when chosen or linked to; with no project
  // yet, the page keeps its prompt to build one.
  const showManager = params.get("thread") === "manager";
  const selected = showManager ? undefined : (threads.find((t) => t.id === requested) ?? threads[0]);

  const notifications = notificationsFor("learner");

  // Opening a conversation reads every alert that pointed at it.
  const selectedId = selected?.id;
  useEffect(() => {
    for (const n of notifications) {
      if (isNotificationRead(n.id)) continue;
      const opened = showManager ? n.href === MANAGER_THREAD_HREF : selectedId && n.href.includes(`project=${selectedId}`);
      if (opened) markNotificationRead(n.id);
    }
  }, [showManager, selectedId, notifications, isNotificationRead, markNotificationRead]);

  const managerUnread = notifications.filter((n) => n.href === MANAGER_THREAD_HREF && !isNotificationRead(n.id)).length;
  const lastWithManager = withManager.at(-1);

  const unreadFor = (id: string) =>
    notifications.filter((n) => n.href.includes(`project=${id}`) && !isNotificationRead(n.id)).length;

  const revise = () => {
    reopen();
    setLocation("/learner/lab/project");
  };

  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
        <PageHeader
          bordered
          title="Messages"
          description="Messages from your line manager, and every decision on your workplace project from your entity and FAHR, in one place."
        />

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Conversation list */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card">
              <p className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <UserRound className="h-3.5 w-3.5" /> Your line manager
              </p>
              <button
                type="button"
                onClick={() => setLocation(MANAGER_THREAD_HREF)}
                className={`w-full px-4 py-3 text-start transition-colors ${showManager ? "bg-primary/5" : "hover:bg-muted/50"}`}
                data-testid="thread-manager"
                aria-current={showManager ? "true" : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{manager?.name ?? "Your line manager"}</p>
                  {managerUnread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                      {managerUnread}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {lastWithManager
                    ? `${lastWithManager.fromId === focus.learnerId ? "You: " : ""}${lastWithManager.body}`
                    : "Start a conversation"}
                </p>
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <p className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Inbox className="h-3.5 w-3.5" /> Project conversations
              </p>
              {threads.length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted-foreground">No conversations yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {threads.map((thread) => {
                    const journey = journeyFor(thread, approvals);
                    const last = projectThread(thread, approvals).at(-1);
                    const unread = unreadFor(thread.id);
                    const active = thread.id === selected?.id;
                    return (
                      <li key={thread.id}>
                        <button
                          type="button"
                          onClick={() => setLocation(`/learner/messages?project=${thread.id}`)}
                          className={`w-full px-4 py-3 text-start transition-colors ${active ? "bg-primary/5" : "hover:bg-muted/50"}`}
                          data-testid={`thread-${thread.id}`}
                          aria-current={active ? "true" : undefined}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-semibold text-foreground">{thread.title}</p>
                            {unread > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                                {unread}
                              </span>
                            )}
                          </div>
                          {last && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {last.by}: {last.note ?? last.title}
                            </p>
                          )}
                          <span
                            className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CHIP[journey.tone].className}`}
                          >
                            {CHIP[journey.tone].label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* Selected conversation */}
          {showManager ? (
            <ManagerConversation learnerId={focus.learnerId} managerId={focus.managerId} manager={manager} />
          ) : selected ? (
            <motion.section
              key={selected.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="min-w-0 space-y-4"
              data-testid="messages-thread"
            >
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workplace project</p>
                <h2 className="mt-0.5 text-lg font-bold text-foreground">{selected.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">Submitted {selected.submittedOn}</p>
              </div>

              {selected.state === "revision_requested" && (
                <div
                  className="flex flex-col gap-4 rounded-xl border border-accent/40 bg-accent/5 p-5 sm:flex-row sm:items-center sm:justify-between"
                  data-testid="messages-action-required"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Action required</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">Update your project and resubmit it</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Your line manager's comments are below. Resubmitting sends it straight back to their sign-off queue.
                    </p>
                  </div>
                  <Button className="shrink-0 gap-2" onClick={revise} data-testid="button-messages-revise">
                    <PencilLine className="h-4 w-4" /> Revise now
                  </Button>
                </div>
              )}

              {(selected.state === "deployed" || selected.state === "endorsed") && (
                <div className="flex flex-col gap-4 rounded-xl border border-green-200 bg-green-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Your project is live</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Your certificate and credential are ready.</p>
                  </div>
                  <Button variant="outline" className="shrink-0 gap-2" onClick={() => setLocation("/learner/recognition")}>
                    View certificate <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <ProjectJourney submission={selected} />

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" /> Conversation
                </p>
                <ProjectConversation submission={selected} />
              </div>
            </motion.section>
          ) : (
            <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-foreground">Nothing to review yet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                When you submit your workplace project, every decision and comment from your line manager, your entity and FAHR arrives
                here.
              </p>
              <Button className="mt-5 gap-2" onClick={() => setLocation("/learner/lab/project")}>
                <Rocket className="h-4 w-4" /> Build my workplace project
              </Button>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}

/** The learner's conversation with their line manager, both ways. */
function ManagerConversation({
  learnerId,
  managerId,
  manager,
}: {
  learnerId: string;
  managerId: string;
  manager: Person | undefined;
}) {
  const reduceMotion = useReducedMotion();
  const name = manager?.name ?? "Your line manager";

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-w-0 space-y-4"
      data-testid="manager-thread"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials(name)}
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your line manager</p>
          <h2 className="text-lg font-bold text-foreground">{name}</h2>
          {manager?.role && <p className="text-xs text-muted-foreground">{manager.role}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <DirectConversation
          meId={learnerId}
          otherId={managerId}
          placeholder={`Reply to ${name.split(" ")[0]}…`}
          emptyNote={`No messages yet. Write to ${name.split(" ")[0]} below.`}
        />
      </div>
    </motion.section>
  );
}
