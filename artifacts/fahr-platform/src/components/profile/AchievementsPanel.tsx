import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import type { ParticipationSummary, ProfileCredential } from "@/lib/profileAnalysis";
import { ArrowRight, BadgeCheck, CircleDashed, Loader, Star } from "lucide-react";

const STATE_META = {
  earned: { label: "Earned", Icon: BadgeCheck, tone: "text-primary", chip: "border-primary/40 bg-primary/10 text-primary" },
  "in-progress": { label: "In progress", Icon: Loader, tone: "text-accent", chip: "border-accent/40 bg-accent/10 text-accent" },
  locked: { label: "Locked", Icon: CircleDashed, tone: "text-muted-foreground", chip: "border-border bg-muted text-muted-foreground" },
} as const;

/** Credentials and impact earned so far, derived from real course progress. */
export function AchievementsPanel({
  credentials,
  participation,
}: {
  credentials: ProfileCredential[];
  participation: ParticipationSummary;
}) {
  const earned = credentials.filter((c) => c.state === "earned").length;

  return (
    <Card className="border-card-border" data-testid="card-achievements">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
              <BadgeCheck className="h-4 w-4 text-primary" /> Achievements and credentials
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Verified credentials on your record, and the ones your current courses will unlock.
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
          {credentials.map((credential, i) => {
            const meta = STATE_META[credential.state];
            return (
              <motion.li
                key={credential.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: 0.06 * i }}
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  credential.state === "locked" ? "border-dashed border-border" : "border-border bg-card"
                }`}
                data-testid={`credential-${credential.id}`}
              >
                <meta.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${meta.tone}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium leading-snug text-foreground">{credential.title}</p>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2 py-0 text-[10px] font-semibold uppercase tracking-wider ${meta.chip}`}
                    >
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {credential.issuer} · {credential.caption}
                  </p>
                  {credential.state === "in-progress" && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${credential.percent}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {earned} of {credentials.length} credentials earned · {participation.lessonsCompleted} lessons
            completed
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
