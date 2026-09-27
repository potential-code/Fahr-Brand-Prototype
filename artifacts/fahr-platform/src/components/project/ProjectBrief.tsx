import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Gauge,
  ShieldCheck,
  Tag,
  Target,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { workingDaysPerYear } from "@/lib/federal/selectors";
import type { ProjectBrief, Submission } from "@/lib/federal/model";

const SENSITIVITY_LABEL: Record<ProjectBrief["sensitivity"], string> = {
  public: "Published / open data",
  internal: "Internal government data",
  personal: "Contains personal data",
};

/** Long answers open at a readable length; the rest is one click away. */
function ExpandableText({ text, lines = 4 }: { text: string; lines?: 3 | 4 | 6 }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 320;
  const clamp = lines === 3 ? "line-clamp-3" : lines === 6 ? "line-clamp-6" : "line-clamp-4";
  return (
    <div>
      <p className={`whitespace-pre-line text-sm leading-relaxed text-foreground/90 ${long && !open ? clamp : ""}`}>{text}</p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          {open ? "Show less" : "Show more"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

function Section({
  step,
  title,
  question,
  children,
}: {
  step: number;
  title: string;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative ps-10" data-testid={`brief-section-${step}`}>
      <span className="absolute start-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {step}
      </span>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mb-2.5 text-xs text-muted-foreground">{question}</p>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </p>
      <p className="mt-1 text-base font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

/** Headline numbers of the brief, read the same way on every dashboard. */
export function ProjectImpactStrip({ submission }: { submission: Submission }) {
  const brief = submission.brief;
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" data-testid="brief-impact">
      <Stat icon={Clock} label="Hours / month" value={`${submission.hoursSavedPerMonth}`} />
      <Stat icon={Target} label="Working days / yr" value={`${workingDaysPerYear(submission.hoursSavedPerMonth)}`} />
      {brief ? (
        <>
          <Stat icon={Users} label="People on this task" value={`${brief.peopleAffected}`} />
          <Stat icon={Gauge} label="AI carries" value={`${brief.automationPct}%`} />
        </>
      ) : (
        <>
          <Stat icon={ShieldCheck} label="Governance" value={submission.governanceStatus} />
          <Stat icon={Gauge} label="Impact" value={submission.impact} />
        </>
      )}
    </div>
  );
}

/**
 * The learner's workplace project, as they submitted it: every stage of the
 * brief in the order they wrote it, so a reviewer reads the answers rather
 * than a paragraph the platform stitched together.
 */
export function ProjectBriefView({
  submission,
  showImpact = true,
  className = "",
}: {
  submission: Submission;
  /** Off where the screen already shows the headline numbers alongside. */
  showImpact?: boolean;
  className?: string;
}) {
  const brief = submission.brief;

  if (!brief) {
    // Seeded history predates the staged brief: summary and measures only.
    return (
      <div className={`space-y-6 ${className}`} data-testid={`brief-${submission.id}`}>
        {showImpact && <ProjectImpactStrip submission={submission} />}
        <Section step={1} title="The challenge and solution" question="What the project changes">
          <ExpandableText text={submission.description} />
        </Section>
        <Section step={2} title="How it is measured" question="The evidence the entity reports">
          <p className="text-sm leading-relaxed text-foreground/90">{submission.metrics}</p>
        </Section>
      </div>
    );
  }

  const warnings = brief.policies.filter((p) => p.status === "warn").length;

  return (
    <div className={`space-y-6 ${className}`} data-testid={`brief-${submission.id}`}>
      {showImpact && <ProjectImpactStrip submission={submission} />}

      <Section step={1} title="The challenge" question="Which real piece of work this project fixes">
        <ExpandableText text={brief.challenge || "Not provided."} />
        <p className="mt-2 text-xs text-muted-foreground">
          Today: about {brief.hoursPerWeek} hours a week, done by {brief.peopleAffected}{" "}
          {brief.peopleAffected === 1 ? "person" : "people"}.
        </p>
      </Section>

      <Section step={2} title="The AI solution" question="How AI carries the work, and where a human stays in charge">
        <ExpandableText text={brief.solution || "Not provided."} />
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/[0.04] px-3.5 py-2.5">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Human checkpoint</p>
            <p className="text-sm font-medium text-foreground">{brief.humanCheckpoint || "Not named"}</p>
          </div>
        </div>
      </Section>

      <Section step={3} title="Expected outcomes" question="What will be true in three months">
        {brief.outcomes.length ? (
          <ul className="space-y-2">
            {brief.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {outcome}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">None recorded.</p>
        )}
      </Section>

      <Section step={4} title="How it will be measured" question="Each measure with its baseline">
        {brief.measures.length ? (
          <ul className="space-y-2">
            {brief.measures.map((measure) => (
              <li key={measure} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {measure}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">None recorded.</p>
        )}
      </Section>

      <Section step={5} title="Governance" question="The federal AI guardrails, checked at submission">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
            <Tag className="h-3 w-3 text-primary" /> {SENSITIVITY_LABEL[brief.sensitivity]}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground">
            <ShieldCheck className="h-3 w-3 text-primary" />
            {brief.disclosure ? "AI-assisted outputs labelled" : "AI outputs not labelled"}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              warnings === 0 ? "border-green-200 bg-green-50 text-green-700" : "border-accent/40 bg-accent/10 text-accent"
            }`}
          >
            {warnings === 0 ? `All ${brief.policies.length} checks passed` : `${warnings} of ${brief.policies.length} flagged`}
          </span>
        </div>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {brief.policies.map((policy) => (
            <li key={policy.policy} className="flex items-start gap-2.5 px-3.5 py-2.5">
              {policy.status === "pass" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{policy.policy}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{policy.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/**
 * A project on a queue card: two lines of the challenge and the headline
 * numbers, with the full brief one click away rather than filling the page.
 */
export function ProjectSummary({
  submission,
  onOpen,
  className = "",
}: {
  submission: Submission;
  onOpen?: () => void;
  className?: string;
}) {
  return (
    <div className={className} data-testid={`summary-${submission.id}`}>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{submission.description}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="font-semibold text-foreground">{submission.hoursSavedPerMonth}</span> h / month
        </span>
        {submission.brief?.humanCheckpoint && (
          <span className="inline-flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5 text-primary" /> {submission.brief.humanCheckpoint}
          </span>
        )}
        {onOpen && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            data-testid={`button-open-brief-${submission.id}`}
          >
            Read full brief <ArrowRight className="ms-1 h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
