import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import type { ParticipationSummary } from "@/lib/profileAnalysis";
import type { CompetencyBadge } from "@/lib/recognitionRecord";
import { ArrowRight, BadgeCheck, CircleDashed, Loader, Medal, Star } from "lucide-react";

type ItemState = "earned" | "in-progress" | "locked";

const STATE_META = {
  earned: { label: "Earned", Icon: BadgeCheck, tone: "text-primary", chip: "border-primary/40 bg-primary/10 text-primary" },
  "in-progress": { label: "In review", Icon: Loader, tone: "text-accent", chip: "border-accent/40 bg-accent/10 text-accent" },
  locked: { label: "Locked", Icon: CircleDashed, tone: "text-muted-foreground", chip: "border-border bg-muted text-muted-foreground" },
} as const;

/** Where the learner's workplace project stands, as far as the certificate cares. */
export type ProjectCertificateStatus =
  | { state: "none" }
  | { state: "in-review"; title: string }
  | { state: "live"; title: string };

/**
 * The same recognition rules as the Recognition page: the ladder level comes
 * from the assessment, the one certificate comes from a workplace project
 * going live, and badges are earned per AI competency. Courses never issue a
 * credential on their own.
 */
export function AchievementsPanel({
  levelLabel,
  levelAwardedOn,
  project,
  badges,
  participation,
}: {
  levelLabel: string;
  levelAwardedOn: string;
  project: ProjectCertificateStatus;
  badges: CompetencyBadge[];
  participation: ParticipationSummary;
}) {
  const badgesEarned = badges.filter((b) => b.earned).length;
  const threshold = badges[0]?.threshold ?? 55;

  const certificateState: ItemState =
    project.state === "live" ? "earned" : project.state === "in-review" ? "in-progress" : "locked";

  const rows: { id: string; title: string; issuer: string; caption: string; state: ItemState }[] = [
    {
      id: "level",
      title: `${levelLabel} — federal AI capability ladder`,
      issuer: "FAHR AI Academy",
      caption: `Awarded on ${levelAwardedOn} from your baseline assessment`,
      state: "earned",
    },
    {
      id: "project-certificate",
      title: "Workplace project certificate",
      issuer: "FAHR & Potential.com",
      caption:
        project.state === "live"
          ? `Issued for "${project.title}", now live`
          : project.state === "in-review"
            ? `"${project.title}" is in review. Issued when it goes live`
            : "Issued when your workplace project goes live",
      state: certificateState,
    },
  ];

  return (
    <Card className="border-card-border" data-testid="card-achievements">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
              <BadgeCheck className="h-4 w-4 text-primary" /> Achievements and credentials
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Your ladder level, your workplace project certificate, and a badge for each AI competency you reach
              Practitioner in.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-muted/50 px-3.5 py-2">
            <Star className="h-4 w-4 shrink-0 fill-current text-accent" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Impact points
              </p>
              <p className="text-base font-bold tabular-nums text-foreground">
                <CountUp to={participation.impactPoints} />
              </p>
            </div>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5">
          {rows.map((row, i) => {
            const meta = STATE_META[row.state];
            return (
              <motion.li
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: 0.06 * i }}
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  row.state === "locked" ? "border-dashed border-border" : "border-border bg-card"
                }`}
                data-testid={`credential-${row.id}`}
              >
                <meta.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${meta.tone}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium leading-snug text-foreground">{row.title}</p>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wider ${meta.chip}`}
                    >
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.issuer} · {row.caption}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>

        <div className="mt-5">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <Medal className="h-4 w-4 text-primary" /> Competency badges
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Earned at Practitioner ({threshold}%) in each competency.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {badges.map((badge) => {
              const meta = STATE_META[badge.earned ? "earned" : "locked"];
              return (
                <li
                  key={badge.competencyId}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${
                    badge.earned ? "border-border bg-card" : "border-dashed border-border"
                  }`}
                  data-testid={`badge-${badge.competencyId}`}
                >
                  <meta.Icon className={`h-4 w-4 shrink-0 ${meta.tone}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{badge.label}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {badge.earned ? "Earned" : `${badge.score}% of ${badge.threshold}%`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {badgesEarned} of {badges.length} badges earned · certificate{" "}
            {certificateState === "earned" ? "issued" : "not issued yet"}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/learner/recognition" data-testid="link-open-recognition">
              Open Recognition <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
