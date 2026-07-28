import React from "react";
import { GraduationCap, UserCog, Building2, Landmark, ChevronRight } from "lucide-react";

const STEPS = [
  { icon: GraduationCap, label: "Learner", note: "submits the project" },
  { icon: UserCog, label: "Line manager", note: "signs off or returns" },
  { icon: Building2, label: "Entity", note: "endorses, returns or escalates", accent: true },
  { icon: Landmark, label: "FAHR", note: "federal decision" },
];

/** A compact legend so a client audience can read the approval chain. */
export function ApprovalsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <span className="mr-1 text-xs font-medium text-muted-foreground">How a project travels</span>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <React.Fragment key={step.label}>
            <div
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${
                step.accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"
              }`}
            >
              <Icon className={`h-4 w-4 ${step.accent ? "text-primary" : "text-muted-foreground"}`} />
              <div className="leading-tight">
                <p className={`text-xs font-semibold ${step.accent ? "text-primary" : "text-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{step.note}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
