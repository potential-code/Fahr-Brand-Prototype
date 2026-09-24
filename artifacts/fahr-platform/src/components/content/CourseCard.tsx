import React from "react";
import { Clock, GraduationCap, Pencil, Star, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { COMPETENCY_BY_ID } from "@/lib/learningData";
import type { ContentItem } from "@/lib/federal/model";
import { coverSrc } from "@/lib/contentLibrary";

const STATUS_PILL: Record<ContentItem["status"], string> = {
  Published: "bg-green-600 text-white",
  Draft: "bg-amber-500 text-white",
  Imported: "bg-primary text-primary-foreground",
};

/**
 * One course in the library grid: cover, competency, status, the numbers a
 * programme lead cares about, and Edit · Delete · Open.
 *
 * A published course cannot be deleted from here — learners may be part-way
 * through it — so Delete is disabled until it is unpublished.
 */
export function CourseCard({
  item,
  onEdit,
  onDelete,
  onOpen,
}: {
  item: ContentItem;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const published = item.status === "Published";
  const competency = COMPETENCY_BY_ID[item.competencyId];

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      data-testid={`card-course-${item.id}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img src={coverSrc(item.cover)} alt="" className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute start-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
          {competency?.short ?? item.competencyId}
        </span>
        <span
          className={`absolute end-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm ${STATUS_PILL[item.status]}`}
          data-testid={`status-${item.id}`}
        >
          {item.status}
        </span>
        {item.source === "Coursera" && (
          <span className="absolute bottom-3 start-3 rounded-full bg-[#0056D2] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            Coursera
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug text-foreground">{item.title}</h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" /> {(item.learners ?? 0).toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4" /> {item.rating ? item.rating.toFixed(1) : "—"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {published ? item.updatedOn : "Not published"}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4 mt-4">
          <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {item.level ?? item.type}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onEdit}
              aria-label={`Edit ${item.title}`}
              data-testid={`button-edit-${item.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={published}
                    onClick={onDelete}
                    aria-label={`Delete ${item.title}`}
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              {published && <TooltipContent>Unpublish it before deleting</TooltipContent>}
            </Tooltip>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              onClick={onOpen}
              data-testid={`button-open-${item.id}`}
            >
              <GraduationCap className="h-4 w-4" /> Open
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
