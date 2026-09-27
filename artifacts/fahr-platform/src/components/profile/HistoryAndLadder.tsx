import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CAPABILITY_LEVELS } from "@/lib/constants";
import type { CapabilityLevel } from "@/lib/constants";
import { Check, Layers } from "lucide-react";

/** The learner's position on the shared five-step federal capability ladder. */
export function CapabilityLadderTrack({
  level,
  progressToNext,
}: {
  level: CapabilityLevel;
  progressToNext: number;
}) {
  return (
    <Card className="border-card-border" data-testid="card-capability-ladder">
      <CardContent className="p-6">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
          <Layers className="h-4 w-4 text-primary" /> Capability ladder position
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The five-step ladder used across every federal entity.
        </p>

        <ol className="mt-6 space-y-2.5">
          {CAPABILITY_LEVELS.map((step, i) => {
            const reached = step.order < level.order;
            const current = step.order === level.order;
            return (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: 0.06 * i }}
                className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                  current
                    ? "border-primary/45 bg-primary/[0.06]"
                    : reached
                      ? "border-border bg-muted/40"
                      : "border-dashed border-border"
                }`}
                data-testid={`row-ladder-${step.id}`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    current
                      ? "bg-primary text-primary-foreground"
                      : reached
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {reached ? <Check className="h-3.5 w-3.5" /> : step.order}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm font-medium ${
                        current || reached ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {current && (
                      <Badge className="rounded-full text-[10px]">You are here</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>

                  {current && (
                    <div className="mt-2.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${progressToNext}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, ease: "easeOut" }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {progressToNext}% through this band
                      </p>
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
