import React from "react";
import { MessageSquare, User } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProjectJourney } from "@/components/project/ProjectJourney";
import { ProjectConversation } from "@/components/project/ProjectConversation";
import { ProjectBriefView } from "@/components/project/ProjectBrief";
import { SubmissionStateBadge } from "@/components/project/SubmissionStateBadge";
import { useFederalData } from "@/lib/FederalDataContext";
import { DEPARTMENT_BY_ID } from "@/lib/federal/selectors";
import type { Submission } from "@/lib/federal/model";

/**
 * One project, read in full: who submitted it, where it is in the chain, the
 * learner's brief stage by stage, and every decision so far. The same sheet
 * opens from the entity, FAHR and leadership screens; `actions` carries the
 * decision buttons of whichever role opened it.
 */
export function ProjectDetailSheet({
  submission,
  onOpenChange,
  actions,
}: {
  submission: Submission | null;
  onOpenChange: (open: boolean) => void;
  actions?: React.ReactNode;
}) {
  const { getPerson, approvalsFor } = useFederalData();
  const owner = submission ? getPerson(submission.personId) : undefined;
  const department = submission ? DEPARTMENT_BY_ID[submission.departmentId] : undefined;
  const hasDecisions = submission ? approvalsFor(submission.id).length > 0 : false;

  return (
    <Sheet open={submission !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl" data-testid="sheet-project-detail">
        {submission && (
          <div className="space-y-6 pb-6">
            <SheetHeader className="space-y-2 text-start">
              <div className="flex flex-wrap items-center gap-2">
                <SubmissionStateBadge submission={submission} />
              </div>
              <SheetTitle className="text-xl leading-snug">{submission.title}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> {owner?.name ?? "Federal employee"}
                </span>
                {department && <span>· {department.name}</span>}
                <span>· Submitted {submission.submittedOn}</span>
              </SheetDescription>
            </SheetHeader>

            <ProjectJourney submission={submission} />

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Learner's brief</p>
              <ProjectBriefView submission={submission} />
            </div>

            {hasDecisions && (
              <div>
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" /> Review conversation
                </p>
                <ProjectConversation submission={submission} />
              </div>
            )}

            {actions && <div className="sticky bottom-0 -mx-6 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">{actions}</div>}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
