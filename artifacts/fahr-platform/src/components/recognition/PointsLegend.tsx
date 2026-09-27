import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { POINT_RULES } from "@/lib/engagement";
import { Info } from "lucide-react";

/**
 * A small "How points are earned" button that sits beside every impact-points
 * figure. The table comes straight from `POINT_RULES`, so the explanation can
 * never drift from the numbers the ledger and leaderboards are built on.
 */
export function PointsLegend({
  tone = "light",
  className = "",
}: {
  /** "dark" for the recognition hero and other dark surfaces. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const trigger =
    tone === "dark"
      ? "text-white/55 hover:bg-white/10 hover:text-white focus-visible:ring-white/40"
      : "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="How points are earned"
          title="How points are earned"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full align-middle transition-colors focus-visible:outline-none focus-visible:ring-2 ${trigger} ${className}`}
          data-testid="button-points-legend"
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4" data-testid="popover-points-legend">
        <p className="text-sm font-semibold text-foreground">How points are earned</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Impact points come from learning, contribution and evaluated work. Nothing is awarded for logging in.
        </p>
        <ul className="mt-3 space-y-1.5">
          {POINT_RULES.map((rule) => (
            <li key={rule.id} className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-foreground">{rule.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-primary">
                +{rule.points.toLocaleString("en-US")}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
