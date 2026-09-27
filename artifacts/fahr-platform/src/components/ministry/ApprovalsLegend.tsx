import React from "react";
import { GraduationCap, UserCog, Building2, Landmark, Rocket, ChevronRight } from "lucide-react";

const STEPS = [
  { icon: GraduationCap, label: "Learner", note: "submits the project" },
  { icon: UserCog, label: "Line manager", note: "signs off or returns" },
  { icon: Building2, label: "Entity", note: "endorses, returns or escalates", accent: true },
  { icon: Landmark, label: "FAHR", note: "approves or returns escalations" },
  { icon: Rocket, label: "Live", note: "in service, credential issued" },
];

/**
 * A compact legend so a client audience can read the approval chain. Always
 * one row: steps share the width and their notes wrap inside them, and on a
 * narrow screen the row scrolls sideways rather than breaking in two.
 */
export function ApprovalsLegend() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-muted/30 p-3" data-testid="approvals-legend">
      <span className="shrink-0 whitespace-nowrap pe-1 text-xs font-medium text-muted-foreground">How a project travels</span>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <React.Fragment key={step.label}>
            <div
              className={`flex min-w-[9.5rem] flex-1 items-center gap-2 self-stretch rounded-md border px-2.5 py-1.5 ${
                step.accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${step.accent ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0 leading-tight">
                <p className={`text-xs font-semibold ${step.accent ? "text-primary" : "text-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{step.note}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:rotate-180" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
