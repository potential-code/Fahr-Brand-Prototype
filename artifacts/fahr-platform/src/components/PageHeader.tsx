import React from "react";

interface PageHeaderProps {
  /** The page title. One size across every dashboard screen. */
  title: React.ReactNode;
  /** Optional supporting line under the title. */
  description?: React.ReactNode;
  /** Optional buttons or badges aligned to the end of the header. */
  actions?: React.ReactNode;
  /** Optional leading icon rendered beside the title block. */
  icon?: React.ReactNode;
  /** Camel-gold title for entity/administrator views, foreground otherwise. */
  tone?: "default" | "primary";
  /** Adds the separating rule some screens use beneath the header. */
  bordered?: boolean;
  className?: string;
}

/**
 * The single page-header for every dashboard screen.
 *
 * Title and description sizes live here and nowhere else so the heading scale
 * cannot drift from one role's screens to another's.
 */
export function PageHeader({
  title,
  description,
  actions,
  icon,
  tone = "default",
  bordered = false,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between ${
        bordered ? "border-b border-border pb-4" : ""
      } ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h1
            className={`text-2xl font-bold tracking-tight ${
              tone === "primary" ? "text-primary" : "text-foreground"
            }`}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
