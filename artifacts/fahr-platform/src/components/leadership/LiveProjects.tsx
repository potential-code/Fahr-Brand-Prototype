import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowRight, CalendarDays, Clock, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProjectJourney } from "@/components/project/ProjectJourney";
import { ProjectConversation } from "@/components/project/ProjectConversation";
import { ProjectBriefView } from "@/components/project/ProjectBrief";
import { SubmissionStateBadge } from "@/components/project/SubmissionStateBadge";
import { useFederalData } from "@/lib/FederalDataContext";
import { isLive } from "@/lib/federal/journey";
import { FEDERAL, workingDaysPerYear } from "@/lib/federal/selectors";
import type { ApprovalRecord, Submission } from "@/lib/federal/model";

/** Seeded live projects shown under the ones that went live this session. */
const SEEDED_SHOWN = 4;

/** Approvals taken in this browser session carry generated ids (`a-…`); seed ids are `a1`, `a2`… */
const isSessionApproval = (a: ApprovalRecord) => a.id.startsWith("a-");
const isGoLive = (a: ApprovalRecord) => a.decision === "approved_live" || a.decision === "endorsed";

export type LiveProject = {
  submission: Submission;
  /** Went live through a decision taken in this session. */
  isNew: boolean;
  /** How it went live. */
  route: "fahr" | "entity";
};

/**
 * Every live project (FAHR-approved or entity-endorsed), newest first: the ones
 * that went live this session lead, then the seeded record.
 */
export function useLiveProjects() {
  const { submissions, approvals } = useFederalData();

  return useMemo(() => {
    // Position of the go-live decision in the session, so the latest leads.
    const sessionOrder = new Map<string, number>();
    approvals.forEach((a, i) => {
      if (isSessionApproval(a) && isGoLive(a)) sessionOrder.set(a.submissionId, i);
    });

    const live: LiveProject[] = submissions
      .filter((s) => isLive(s.state))
      .map((s) => ({
        submission: s,
        isNew: sessionOrder.has(s.id),
        route:
          s.state === "deployed" || approvals.some((a) => a.submissionId === s.id && a.decision === "approved_live")
            ? "fahr"
            : "entity",
      }));

    const fresh = live
      .filter((p) => p.isNew)
      .sort((a, b) => (sessionOrder.get(b.submission.id) ?? 0) - (sessionOrder.get(a.submission.id) ?? 0));
    const seeded = live.filter((p) => !p.isNew);

    const hoursSaved = fresh.reduce((t, p) => t + p.submission.hoursSavedPerMonth, 0);

    return { all: live, fresh, seeded, session: { count: fresh.length, hoursSaved } };
  }, [submissions, approvals]);
}

const ROUTE_LABEL: Record<LiveProject["route"], string> = {
  fahr: "Approved by FAHR",
  entity: "Endorsed by entity",
};

export function NewPill() {
  return (
    <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
      New
    </span>
  );
}

function LiveProjectRow({ project, onOpen }: { project: LiveProject; onOpen: () => void }) {
  const { getPerson, ministries } = useFederalData();
  const s = project.submission;
  const learner = getPerson(s.personId);
  const entity = ministries.find((m) => m.id === s.ministryId);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        data-testid={`live-project-${s.id}`}
        className={`group flex w-full flex-col gap-3 rounded-lg border p-4 text-start transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-row md:items-center ${
          project.isNew ? "border-accent/40 bg-accent/5" : "border-border"
        }`}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {project.isNew && <NewPill />}
            <p className="truncate font-semibold text-foreground">{s.title}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {entity?.shortName ?? s.ministryId} · {learner?.name ?? "Learner"} ·{" "}
            <span className="font-medium text-primary">{ROUTE_LABEL[project.route]}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-5 text-sm">
          <span className="flex items-center gap-1.5 text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-semibold">{s.hoursSavedPerMonth.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">h/month</span>
          </span>
          <span className="flex items-center gap-1.5 text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="font-semibold">{workingDaysPerYear(s.hoursSavedPerMonth).toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">working days a year</span>
          </span>
          <ArrowRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary md:block rtl:rotate-180" />
        </div>
      </button>
    </li>
  );
}

function LiveProjectSheet({ submission, onClose }: { submission?: Submission; onClose: () => void }) {
  const { getPerson, ministries } = useFederalData();
  const learner = submission ? getPerson(submission.personId) : undefined;
  const entity = submission ? ministries.find((m) => m.id === submission.ministryId) : undefined;

  return (
    <Sheet open={!!submission} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl" data-testid="sheet-live-project">
        {submission && (
          <div className="space-y-6">
            <SheetHeader className="space-y-2 text-start">
              <div className="flex flex-wrap items-center gap-2">
                <SubmissionStateBadge submission={submission} />
                <Badge variant="outline">{submission.impact} impact</Badge>
              </div>
              <SheetTitle className="text-xl">{submission.title}</SheetTitle>
              <SheetDescription>
                {learner?.name ?? "Learner"}
                {learner?.role ? `, ${learner.role}` : ""} · {entity?.name ?? submission.ministryId}
              </SheetDescription>
            </SheetHeader>

            <ProjectJourney submission={submission} variant="full" />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Learner's brief</h3>
              <ProjectBriefView submission={submission} />
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Decision chain</h3>
              <p className="text-xs text-muted-foreground">
                Every decision from the learner's submission to go-live, in the reviewers' own words.
              </p>
              <ProjectConversation submission={submission} />
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Leadership's view of projects that are in service, with the full story one click away. */
export function LiveProjectsCard() {
  const { fresh, seeded, all } = useLiveProjects();
  const search = useSearch();
  const [location, setLocation] = useLocation();
  const requested = new URLSearchParams(search).get("project");
  const [openId, setOpenId] = useState<string | null>(requested);

  useEffect(() => {
    if (requested) setOpenId(requested);
  }, [requested]);

  const shown = [...fresh, ...seeded.slice(0, SEEDED_SHOWN)];
  /** National live count: the seeded roll-up plus anything that went live this session. */
  const totalLive = FEDERAL.projectsLive + fresh.length;
  const selected = openId ? all.find((p) => p.submission.id === openId)?.submission : undefined;

  const close = () => {
    setOpenId(null);
    if (requested) setLocation(location, { replace: true });
  };

  return (
    <>
      <Card data-testid="card-live-projects">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Rocket className="h-5 w-5 text-primary" />
              Newly live projects
            </CardTitle>
            <CardDescription>
              Workplace projects now in service — approved by FAHR or endorsed by their entity. Open one to see its
              full journey from learner to go-live.
            </CardDescription>
          </div>
          {fresh.length > 0 && (
            <Badge variant="outline" className="shrink-0 border-accent/40 bg-accent/10 text-accent">
              {fresh.length} new this session
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {shown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects are live yet.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {shown.map((p) => (
                  <LiveProjectRow key={p.submission.id} project={p} onOpen={() => setOpenId(p.submission.id)} />
                ))}
              </ul>
              {shown.length < totalLive && (
                <p className="mt-3 text-xs text-muted-foreground" data-testid="text-live-projects-shown">
                  Showing {shown.length} of {totalLive.toLocaleString()} live
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <LiveProjectSheet submission={selected} onClose={close} />
    </>
  );
}
