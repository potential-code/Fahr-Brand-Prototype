import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Bot, FlaskConical, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useDigitalTwin } from "@/lib/DigitalTwinContext";
import { GUARDRAILS } from "@/lib/digitalTwin";

/**
 * The bridge from Stage 1 to the Workplace Project.
 *
 * The twin and the project were two unconnected screens: the learner built an
 * assistant in the Lab, then described a project from scratch with no mention
 * of it. This panel makes the hand-off literal — the twin's recurring tasks
 * are offered as the thing to automate, and the guardrails it carries are
 * stated up front, because the project inherits them.
 */
export function TwinHandoff({
  onUseTask,
  disabled = false,
}: {
  /** Seeds the challenge with a task the twin already handles. */
  onUseTask: (task: string) => void;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { profile, isLive } = useDigitalTwin();

  // No twin yet: point the learner back to Stage 1 rather than leaving the
  // project looking unrelated to the Lab.
  if (!isLive) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5" data-testid="twin-handoff-empty">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-background">
              <FlaskConical className="h-4.5 w-4.5 text-primary" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {isAr ? "ابنِ توأمك الرقمي أولًا" : "Build your Digital Twin first"}
              </p>
              <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
                {isAr
                  ? "المشروع التطبيقي هو وضع توأمك في العمل الحقيقي. ابدأ بالمرحلة 1 في المختبر."
                  : "This project is your twin put to work on something real. Start with Stage 1 in the Lab."}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/learner/lab/twin" data-testid="link-build-twin">
              {isAr ? "افتح المختبر" : "Open the Lab"}
              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeFederal = GUARDRAILS.filter((guardrail) => profile.guardrails[guardrail.id]);
  const ownRules = profile.customGuardrails;

  return (
    <Card className="border-primary/25 bg-primary/5" data-testid="twin-handoff">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-background">
            <Bot className="h-4.5 w-4.5 text-primary" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">
                {isAr ? "مبني على توأمك الرقمي" : "Built on your Digital Twin"}
              </p>
              <Badge variant="outline" className="bg-background text-[10px]">
                {isAr ? "المرحلة 1 مكتملة" : "Stage 1 complete"}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {profile.role}
            </p>
          </div>
        </div>

        {/* The twin's recurring tasks, as the candidate work to automate. */}
        {profile.tasks.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr
                ? "اختر المهمة التي سيتولاها هذا المشروع"
                : "Pick the task this project takes on"}
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.tasks.map((task) => (
                <button
                  key={task}
                  type="button"
                  disabled={disabled}
                  onClick={() => onUseTask(task)}
                  className="rounded-full border border-primary/30 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                  data-testid="twin-task-option"
                >
                  {task}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* The project inherits whatever the twin was left running under. */}
        <div className="border-t border-primary/15 pt-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            {isAr ? "الضوابط المنقولة من توأمك" : "Guardrails carried over from your twin"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeFederal.map((guardrail) => (
              <Badge key={guardrail.id} variant="outline" className="bg-background text-[10px] font-normal">
                {isAr ? guardrail.label.ar : guardrail.label.en}
              </Badge>
            ))}
            {ownRules.map((rule) => (
              <Badge
                key={rule.id}
                variant="outline"
                className="border-primary/30 bg-background text-[10px] font-normal"
              >
                <Sparkles className="me-1 h-2.5 w-2.5 text-primary" />
                {rule.label}
              </Badge>
            ))}
            {activeFederal.length === 0 && ownRules.length === 0 && (
              <span className="text-xs text-destructive">
                {isAr
                  ? "لا توجد ضوابط مفعّلة — سيخضع هذا المشروع للتدقيق."
                  : "No guardrails are in force — this project will be flagged at review."}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
