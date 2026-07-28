import { useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LEADERBOARDS, SCOPE_CAPTION, SCOPE_LABEL, type LeaderboardScope } from "@/lib/engagement";
import { ArrowRight, Award, Minus, Trophy, TrendingDown, TrendingUp } from "lucide-react";

const SCOPES: LeaderboardScope[] = ["entity", "federal", "cohort"];

function Movement({ places }: { places: number }) {
  if (places === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  }
  const up = places > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? "text-primary" : "text-muted-foreground"}`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(places)}
    </span>
  );
}

/** Switchable leaderboards: entity, federal and the learner's own cohort. */
export function LeaderboardPanel() {
  const [scope, setScope] = useState<LeaderboardScope>("entity");
  const rows = LEADERBOARDS[scope];

  return (
    <Card className="border-card-border" data-testid="card-leaderboard">
      <CardContent className="p-0">
        <div className="border-b border-border p-5">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-foreground">
            <Trophy className="h-4.5 w-4.5 text-primary" /> Impact leaderboard
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Ranked by verified capability and evaluated outcomes.</p>

          <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Leaderboard scope">
            {SCOPES.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={scope === s}
                onClick={() => setScope(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  scope === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
                data-testid={`leaderboard-scope-${s}`}
              >
                {SCOPE_LABEL[s]}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">{SCOPE_CAPTION[scope]}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.ul
            key={scope}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="divide-y divide-border"
          >
            {rows.map((row, i) => (
              <motion.li
                key={`${scope}-${row.rank}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className={`flex items-center gap-3 p-4 ${
                  row.isCurrentUser ? "border-s-4 border-s-primary bg-primary/[0.06]" : "hover:bg-muted/30"
                }`}
                data-testid={`leaderboard-row-${scope}-${row.rank}`}
              >
                <span className="w-8 shrink-0 text-center text-sm font-bold tabular-nums text-muted-foreground">
                  {row.rank}
                </span>
                <Avatar className="h-8 w-8 shrink-0 border border-border">
                  <AvatarFallback
                    className={
                      row.isCurrentUser
                        ? "bg-primary text-xs text-primary-foreground"
                        : "bg-primary/10 text-xs text-primary"
                    }
                  >
                    {row.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      row.isCurrentUser ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {row.name}
                    {row.isCurrentUser && " (you)"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{row.detail}</span>
                </span>
                <span className="shrink-0 text-end">
                  <span className="block text-sm font-bold tabular-nums text-foreground">
                    {row.points.toLocaleString("en-US")}
                  </span>
                  <Movement places={row.movement} />
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>

        <div className="border-t border-border bg-muted/30 p-4">
          <Button asChild variant="outline" size="sm" className="w-full gap-2">
            <Link href="/learner/recognition" data-testid="link-how-points-work">
              <Award className="h-4 w-4" /> See how points are earned <ArrowRight className="ms-auto h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
