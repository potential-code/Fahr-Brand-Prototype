import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { CompetencyBadge } from "@/lib/recognitionRecord";
import { BarChart3, BookOpen, Bot, Medal, MessageSquareText, ShieldCheck, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  literacy: BookOpen,
  prompting: MessageSquareText,
  analytics: BarChart3,
  agentic: Bot,
  governance: ShieldCheck,
};

/**
 * One badge per AI competency, earned at the Practitioner threshold. Replaces
 * the old generic achievements grid with something that maps directly to what
 * the platform actually assesses.
 */
export function CompetencyBadges({ badges }: { badges: CompetencyBadge[] }) {
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <Card className="border-card-border" data-testid="card-competency-badges">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
              <Medal className="h-5 w-5 text-primary" /> Competency badges
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {earnedCount} of {badges.length} earned, at Practitioner level ({badges[0]?.threshold ?? 55}%) in each
              of the five AI competencies FAHR assesses.
            </p>
          </div>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {badges.map((badge, i) => {
            const Icon = ICONS[badge.competencyId] ?? Medal;
            const toGo = Math.max(0, badge.threshold - badge.score);
            return (
              <motion.li
                key={badge.competencyId}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className={`flex flex-col items-center rounded-xl border p-4 text-center ${
                  badge.earned ? "border-primary/25 bg-primary/[0.06]" : "border-dashed border-border bg-muted/30"
                }`}
                data-testid={`competency-badge-${badge.competencyId}`}
              >
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                    badge.earned
                      ? "border-2 border-primary/40 bg-primary/15 text-primary"
                      : "border border-dashed border-border bg-background text-muted-foreground"
                  }`}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>

                <p className="mt-3 text-sm font-semibold text-foreground">{badge.short}</p>
                <span
                  className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    badge.earned
                      ? "border border-primary/40 bg-primary/10 text-primary"
                      : "border border-border bg-background text-muted-foreground"
                  }`}
                >
                  {badge.earned ? "Earned" : "Locked"}
                </span>

                {badge.earned ? (
                  <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">{badge.score}% scored</p>
                ) : (
                  <>
                    <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(100, Math.round((badge.score / badge.threshold) * 100))}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{toGo}% to go</p>
                  </>
                )}
              </motion.li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
