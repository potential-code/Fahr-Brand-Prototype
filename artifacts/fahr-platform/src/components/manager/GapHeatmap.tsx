import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stagger, StaggerItem } from "@/components/motion";
import { COMPETENCIES } from "@/lib/learningData";
import {
  BAND_LABEL,
  bandForScore,
  PRACTITIONER_THRESHOLD,
  type ProficiencyBand,
  type TeamCompetencyColumn,
  type TeamMemberScores,
} from "@/lib/manager/selectors";
import { Grid3x3, Users } from "lucide-react";

/**
 * Cell weight for a proficiency band.
 *
 * A weak competency is a development priority, not a fault: the scale runs from
 * a full primary fill down to a light bronze accent, and never uses a warning
 * colour. Print keeps the border and drops the fill so the matrix stays legible
 * on paper.
 */
const BAND_CELL: Record<ProficiencyBand, string> = {
  leading: "bg-primary text-primary-foreground border-primary print:bg-transparent print:text-foreground",
  proficient: "bg-primary/30 text-primary border-primary/40 print:bg-transparent print:text-foreground",
  building: "bg-primary/10 text-foreground border-primary/20 print:bg-transparent print:text-foreground",
  priority: "bg-accent/15 text-foreground border-accent/45 print:bg-transparent print:text-foreground",
};

const BAND_ORDER: ProficiencyBand[] = ["leading", "proficient", "building", "priority"];

export function HeatmapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="heatmap-legend">
      {BAND_ORDER.map((band) => (
        <span key={band} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={`h-3 w-6 rounded-sm border ${BAND_CELL[band]}`} aria-hidden="true" />
          {BAND_LABEL[band]}
        </span>
      ))}
    </div>
  );
}

/**
 * People × competency matrix for a line manager's direct reports.
 *
 * Rows are direct reports, columns the five framework competencies. Clicking a
 * row opens that person's detail page; the strip beneath the table names the
 * team's largest gap.
 */
export function GapHeatmap({
  rows,
  columns,
  hrefFor,
  title = "Team competency gap heatmap",
  description,
}: {
  rows: TeamMemberScores[];
  columns: TeamCompetencyColumn[];
  hrefFor: (personId: string) => string;
  title?: string;
  description?: string;
}) {
  const [, setLocation] = useLocation();
  const topGap = columns.find((c) => c.isTopGap);

  return (
    <Card data-testid="card-gap-heatmap">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid3x3 className="h-5 w-5 text-primary" /> {title}
            </CardTitle>
            <CardDescription>
              {description ??
                "Every direct report against the five federal competencies. Cell weight follows the capability ladder thresholds, so a light cell is a development priority rather than a failure."}
            </CardDescription>
          </div>
          <HeatmapLegend />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold text-foreground">No direct reports enrolled yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Once your team is enrolled on a Personalised Learning Pathway, their competency scores appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-1 text-sm">
                <thead>
                  <tr>
                    <th className="w-[220px] px-2 pb-2 text-start text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Team member
                    </th>
                    {COMPETENCIES.map((competency) => (
                      <th
                        key={competency.id}
                        scope="col"
                        className="px-1 pb-2 text-center text-xs font-medium text-muted-foreground"
                      >
                        {competency.short}
                      </th>
                    ))}
                    <th className="px-2 pb-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Average
                    </th>
                  </tr>
                </thead>
                <Stagger as="tbody">
                  {rows.map((row) => (
                    <StaggerItem
                      as="tr"
                      variant="row"
                      key={row.person.id}
                      className="cursor-pointer transition-colors hover:bg-muted/40 focus-within:bg-muted/40"
                      onClick={() => setLocation(hrefFor(row.person.id))}
                      data-testid={`heatmap-row-${row.person.id}`}
                    >
                      <th scope="row" className="px-2 py-1 text-start align-middle font-normal">
                        <a
                          href={hrefFor(row.person.id)}
                          onClick={(event) => {
                            event.preventDefault();
                            setLocation(hrefFor(row.person.id));
                          }}
                          className="font-semibold text-foreground hover:underline focus:underline focus:outline-none"
                          data-testid={`heatmap-link-${row.person.id}`}
                        >
                          {row.person.name}
                        </a>
                        <span className="block text-xs text-muted-foreground">{row.level.label}</span>
                      </th>
                      {COMPETENCIES.map((competency) => {
                        const score = row.scores[competency.id];
                        const band = bandForScore(score);
                        return (
                          <td
                            key={competency.id}
                            className={`rounded-md border px-2 py-2 text-center text-sm font-semibold tabular-nums ${BAND_CELL[band]}`}
                            title={`${row.person.name} — ${competency.label}: ${score} (${BAND_LABEL[band]})`}
                            data-testid={`heatmap-cell-${row.person.id}-${competency.id}`}
                          >
                            {score}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center text-sm font-bold tabular-nums text-foreground">
                        {row.average}
                      </td>
                    </StaggerItem>
                  ))}
                  <tr>
                    <th scope="row" className="px-2 pt-2 text-start text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Team average
                    </th>
                    {columns.map((column) => (
                      <td
                        key={column.competency.id}
                        className="px-2 pt-2 text-center text-sm font-bold tabular-nums text-foreground"
                        data-testid={`heatmap-average-${column.competency.id}`}
                      >
                        {column.average}
                      </td>
                    ))}
                    <td />
                  </tr>
                </Stagger>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {columns.map((column) => (
                <div
                  key={column.competency.id}
                  className={`rounded-lg border p-3 ${
                    column.isTopGap ? "border-accent/50 bg-accent/5" : "border-border bg-muted/20"
                  }`}
                  data-testid={`heatmap-summary-${column.competency.id}`}
                >
                  <p className="text-xs font-semibold text-foreground">{column.competency.short}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{column.average}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {column.below} of {rows.length} below Practitioner ({PRACTITIONER_THRESHOLD})
                    <br />
                    {column.vsDepartment >= 0 ? "+" : ""}
                    {column.vsDepartment} vs department
                  </p>
                  {column.isTopGap && (
                    <Badge className="mt-2 bg-foreground text-background hover:bg-foreground" data-testid="badge-top-gap">
                      Biggest team gap
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {topGap && (
              <p className="text-sm text-muted-foreground" data-testid="text-top-gap-summary">
                <span className="font-semibold text-foreground">{topGap.competency.label}</span> is the team's
                largest gap at {topGap.average} — {topGap.below} of {rows.length} people sit below Practitioner and{" "}
                {topGap.flaggedBy} have it named as a development priority on their Capability Profile.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
