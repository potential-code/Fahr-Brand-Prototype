import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENTS } from "@/lib/constants";
import { courseImage } from "@/lib/learningData";
import type { NextCapability } from "@/lib/profileAnalysis";
import { ArrowRight, Target } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

/**
 * The capabilities the Advisor wants moved next, each with the route that
 * actually moves it. Derived from the learner's own competency gaps.
 */
export function NextCapabilities({ items }: { items: NextCapability[] }) {
  return (
    <Card className="border-card-border" data-testid="card-next-capabilities">
      <CardContent className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              {AGENTS.advisor}
            </p>
            <h2 className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-foreground">
              <Target className="h-4 w-4 text-primary" /> Recommended next capabilities
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Ranked by how much movement is available. Each one opens the part of the portal that closes it.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/learner/mission" data-testid="link-learning-pathway">
              Open Learning Pathway <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: 0.08 * i }}
              whileHover={{ y: -3 }}
              className="h-full"
            >
              <Link
                href={item.href}
                className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
                data-testid={`next-capability-${item.id}`}
              >
                <div className="relative h-24 shrink-0 overflow-hidden bg-muted">
                  {item.course && (
                    <img
                      src={`${BASE}${courseImage(item.course)}`}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/15" />
                  <p className="absolute bottom-2.5 left-3 right-3 truncate text-sm font-semibold text-white">
                    {item.competency.label}
                  </p>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <Badge
                    variant="outline"
                    className="mb-2 w-fit rounded-full border-primary/40 bg-primary/10 px-2 py-0 text-[10px] font-semibold uppercase tracking-wider text-primary"
                  >
                    Priority {i + 1}
                  </Badge>
                  <p className="text-sm font-medium leading-snug text-foreground">{item.headline}</p>

                  <div className="mt-3">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-muted-foreground">Now {item.score}%</span>
                      <span className="font-semibold text-primary">Target {item.target}%</span>
                    </div>
                    <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
                        style={{ width: `${item.target}%` }}
                      />
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 * i, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <p className="mt-auto pt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    {item.course ? `Start ${item.course.title}` : "Open your pathway"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
