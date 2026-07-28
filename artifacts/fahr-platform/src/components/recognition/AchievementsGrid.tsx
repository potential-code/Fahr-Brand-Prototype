import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { Achievement } from "@/lib/recognitionRecord";
import { Flame, Medal, Shield, Sparkles, Target, Trophy, Users } from "lucide-react";

const ICONS = {
  spark: Sparkles,
  flame: Flame,
  people: Users,
  shield: Shield,
  target: Target,
  trophy: Trophy,
} as const;

/** Badges and achievements, earned first, each stating what it took to earn. */
export function AchievementsGrid({ achievements }: { achievements: Achievement[] }) {
  const earned = achievements.filter((a) => a.earned);
  const pending = achievements.filter((a) => !a.earned);
  const ordered = [...earned, ...pending];
  const badgePoints = earned.reduce((n, a) => n + a.points, 0);

  return (
    <Card className="border-card-border" data-testid="card-achievements-grid">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-foreground">
              <Medal className="h-5 w-5 text-primary" /> Badges and achievements
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {earned.length} of {achievements.length} earned, worth {badgePoints.toLocaleString("en-US")} impact
              points. Each badge states exactly what earns it.
            </p>
          </div>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((achievement, i) => {
            const Icon = ICONS[achievement.icon];
            return (
              <motion.li
                key={achievement.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className={`rounded-xl border p-4 ${
                  achievement.earned ? "border-primary/25 bg-primary/[0.06]" : "border-dashed border-border bg-muted/30"
                }`}
                data-testid={`achievement-${achievement.id}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      achievement.earned
                        ? "border border-primary/40 bg-primary/15 text-primary"
                        : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{achievement.label}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          achievement.earned
                            ? "border border-primary/40 bg-primary/10 text-primary"
                            : "border border-border bg-background text-muted-foreground"
                        }`}
                      >
                        {achievement.earned ? "Earned" : "Locked"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{achievement.description}</p>

                    {achievement.earned ? (
                      <p className="mt-2 text-[11px] font-semibold tabular-nums text-primary">
                        +{achievement.points.toLocaleString("en-US")} impact points
                      </p>
                    ) : (
                      <>
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className="h-full rounded-full bg-accent"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${achievement.percent}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          {achievement.criteria} · {achievement.percent}% there
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
