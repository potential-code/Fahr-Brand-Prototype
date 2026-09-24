import React from "react";
import { ExternalLink, FileText, ListChecks, Package, Paperclip, PlayCircle, Sparkles, FileDown } from "lucide-react";
import type { ContentModule, ContentUnitKind } from "@/lib/federal/model";
import { formatMinutes } from "@/lib/contentLibrary";

const UNIT_ICON: Record<ContentUnitKind, React.ComponentType<{ className?: string }>> = {
  Video: PlayCircle,
  Reading: FileText,
  Document: FileDown,
  Quiz: ListChecks,
  Activity: Sparkles,
  Package: Package,
};

/**
 * A course's modules and the units inside them, the way a learner meets them.
 * Coursera modules carry no units of their own — those are taken on Coursera —
 * so they read as a single line pointing there instead.
 */
export function CourseOutline({
  modules,
  external = false,
  testId,
}: {
  modules: ContentModule[];
  /** The units are taken on another platform (Coursera). */
  external?: boolean;
  testId?: string;
}) {
  if (modules.length === 0) {
    return <p className="text-sm text-muted-foreground">No modules yet.</p>;
  }

  return (
    <ol className="space-y-3" data-testid={testId}>
      {modules.map((module, mi) => {
        const mins = module.units.reduce((t, u) => t + u.mins, 0);
        return (
          <li key={module.id} className="rounded-lg border border-border" data-testid={`outline-module-${module.id}`}>
            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-2.5">
              <p className="text-sm font-semibold text-foreground">
                <span className="me-2 text-muted-foreground">Module {mi + 1}</span>
                {module.title}
              </p>
              {!external && module.units.length > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {module.units.length} unit{module.units.length === 1 ? "" : "s"} · {formatMinutes(mins)}
                </span>
              )}
            </div>
            {external ? (
              <p className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5" /> Units in this module are taken on Coursera.
              </p>
            ) : module.units.length === 0 ? (
              <p className="px-4 py-2.5 text-xs text-muted-foreground">No units in this module yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {module.units.map((unit, ui) => {
                  const Icon = UNIT_ICON[unit.kind];
                  return (
                    <li
                      key={unit.id}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm"
                      data-testid={`outline-unit-${unit.id}`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="text-muted-foreground">
                          {mi + 1}.{ui + 1}
                        </span>{" "}
                        <span className="text-foreground">{unit.title}</span>
                        {unit.fileName && (
                          <span className="ms-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Paperclip className="h-3 w-3" /> {unit.fileName}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {unit.kind} · {unit.mins} min
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
