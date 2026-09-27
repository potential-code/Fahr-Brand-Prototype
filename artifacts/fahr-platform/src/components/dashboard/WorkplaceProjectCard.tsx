import React from "react";
import { useLocation } from "wouter";
import { ArrowRight, PencilLine, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectJourney } from "@/components/project/ProjectJourney";
import { useFederalData } from "@/lib/FederalDataContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { projectThread } from "@/lib/federal/journey";

/**
 * The learner's workplace project at a glance: where it is, who has it and the
 * last thing anyone said about it. Only shown once a project is submitted.
 */
export function WorkplaceProjectCard() {
  const [, setLocation] = useLocation();
  const { approvals } = useFederalData();
  const { project, reopen } = useWorkplaceProject();
  if (!project) return null;

  const last = projectThread(project, approvals).at(-1);
  const returned = project.state === "revision_requested";

  return (
    <div
      className={`rounded-xl border bg-card p-5 ${returned ? "border-accent/40" : "border-border"}`}
      data-testid="card-my-project"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rocket className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">My workplace project</p>
            <p className="truncate text-sm font-semibold text-foreground">{project.title}</p>
            {last && (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                Latest: {last.by} — {last.note ? `“${last.note}”` : last.title.toLowerCase()}
              </p>
            )}
          </div>
        </div>
        {returned ? (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              reopen();
              setLocation("/learner/lab/project");
            }}
            data-testid="button-dashboard-revise"
          >
            <PencilLine className="h-3.5 w-3.5" /> Revise now
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setLocation(`/learner/messages?project=${project.id}`)}
          >
            Open messages <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <ProjectJourney submission={project} variant="compact" />
    </div>
  );
}
