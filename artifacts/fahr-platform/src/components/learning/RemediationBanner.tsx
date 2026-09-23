import { Sparkles, CheckCircle2 } from "lucide-react";
import { AGENTS } from "@/lib/constants";

/**
 * What the Content Agent did about a low post-assessment.
 *
 * Stays on screen after the revision is finished rather than disappearing —
 * the point of the simulation is that someone can see what happened.
 */
export function RemediationBanner({
  competencyShort,
  correct,
  total,
  unitCount,
  complete,
}: {
  competencyShort: string;
  correct: number;
  total: number;
  unitCount: number;
  complete: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        complete ? "border-emerald-600/30 bg-emerald-600/[0.05]" : "border-primary/30 bg-primary/[0.04]"
      }`}
      data-testid="remediation-banner"
    >
      <div className="flex flex-wrap items-start gap-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            complete ? "bg-emerald-600/10" : "bg-primary/10"
          }`}
        >
          {complete ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
        </span>
        <div className="min-w-[16rem] flex-1">
          <p
            className={`text-[11px] font-bold uppercase tracking-wider ${
              complete ? "text-emerald-700" : "text-primary"
            }`}
          >
            {AGENTS.content}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {complete
              ? `Revision complete — the final assessment is open again`
              : `${unitCount} revision units added to this course`}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            You scored {correct} of {total}. {competencyShort} was the weakest area, so {unitCount} units
            covering it have been added below the course content. Complete them and the final assessment
            reopens.
          </p>
        </div>
      </div>
    </div>
  );
}
