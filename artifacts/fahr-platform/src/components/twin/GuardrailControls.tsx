import { useState } from "react";
import { AlertTriangle, Plus, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/LanguageContext";
import { useDigitalTwin } from "@/lib/DigitalTwinContext";
import { GUARDRAILS } from "@/lib/digitalTwin";

/** Rules a federal employee plausibly writes, offered so a demo need not type. */
const SUGGESTED_RULES = [
  { en: "Never quote a figure without a source", ar: "لا تذكر رقمًا دون مصدر" },
  { en: "Always produce an Arabic version", ar: "أنتج دائمًا نسخة عربية" },
  { en: "Never name an individual resident", ar: "لا تذكر اسم أي متعامل" },
  { en: "Escalate anything about an outbreak", ar: "صعّد أي أمر يتعلق بتفشٍ صحي" },
];

/**
 * The governance guardrails, as live switches rather than a list of claims.
 *
 * Every one of these changes what the twin does in the test chat, which is the
 * point: a government client can switch one off, ask the same question again
 * and watch the answer become something they would not accept.
 */
export function GuardrailControls({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const {
    profile,
    setGuardrail,
    addCustomGuardrail,
    setCustomGuardrail,
    removeCustomGuardrail,
  } = useDigitalTwin();
  const [draft, setDraft] = useState("");

  const relaxed =
    GUARDRAILS.filter((g) => !profile.guardrails[g.id]).length +
    profile.customGuardrails.filter((rule) => !rule.enabled).length;

  const addRule = (label: string) => {
    addCustomGuardrail(label);
    setDraft("");
  };

  return (
    <div className="space-y-3" data-testid="guardrail-controls">
      {relaxed > 0 && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-lg border border-destructive/30 bg-destructive/5"
          data-testid="guardrail-warning"
        >
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive leading-relaxed">
            {isAr
              ? `${relaxed} من الضوابط معطّلة. التوأم يعمل خارج السياسة الاتحادية، وسترى الأثر في اختبار الاستجابة.`
              : `${relaxed} ${relaxed === 1 ? "guardrail is" : "guardrails are"} switched off. The twin is operating outside federal policy — you will see the consequence in the test chat.`}
          </p>
        </div>
      )}

      {GUARDRAILS.map((guardrail) => {
        const enabled = profile.guardrails[guardrail.id];
        return (
          <div
            key={guardrail.id}
            className={`p-3 rounded-xl border transition-colors ${
              enabled ? "border-border bg-card" : "border-destructive/30 bg-destructive/5"
            }`}
            data-testid={`guardrail-${guardrail.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {enabled ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                  <p className="text-sm font-medium truncate">
                    {isAr ? guardrail.label.ar : guardrail.label.en}
                  </p>
                </div>
                <p
                  className={`text-xs mt-1.5 leading-relaxed ${
                    enabled ? "text-muted-foreground" : "text-destructive"
                  }`}
                >
                  {isAr
                    ? enabled
                      ? guardrail.on.ar
                      : guardrail.off.ar
                    : enabled
                      ? guardrail.on.en
                      : guardrail.off.en}
                </p>
                {!compact && (
                  <Badge variant="outline" className="mt-2 text-[10px] font-normal bg-background">
                    {isAr ? guardrail.policy.ar : guardrail.policy.en}
                  </Badge>
                )}
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(next) => setGuardrail(guardrail.id, next)}
                aria-label={isAr ? guardrail.label.ar : guardrail.label.en}
                data-testid={`switch-${guardrail.id}`}
              />
            </div>
          </div>
        );
      })}

      {/* Rules the learner writes themselves. The four above are federal and
          enforced in code; these are the entity's and the individual's own. */}
      <div className="pt-1" data-testid="custom-guardrails">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {isAr ? "قواعدك الخاصة" : "Your own rules"}
        </p>

        {profile.customGuardrails.map((rule) => (
          <div
            key={rule.id}
            className={`p-3 rounded-xl border mb-2 transition-colors ${
              rule.enabled ? "border-primary/25 bg-primary/5" : "border-destructive/30 bg-destructive/5"
            }`}
            data-testid={`custom-guardrail-${rule.id}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles
                  className={`w-4 h-4 shrink-0 ${rule.enabled ? "text-primary" : "text-destructive"}`}
                />
                <p className="text-sm font-medium truncate">{rule.label}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(next) => setCustomGuardrail(rule.id, next)}
                  aria-label={rule.label}
                  data-testid={`switch-${rule.id}`}
                />
                <button
                  type="button"
                  onClick={() => removeCustomGuardrail(rule.id)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label={isAr ? `حذف ${rule.label}` : `Remove ${rule.label}`}
                  data-testid={`remove-${rule.id}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2 mt-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              addRule(draft);
            }}
            placeholder={
              isAr ? "أضف قاعدة لتوأمك…" : "Add a rule your twin must follow…"
            }
            data-testid="input-custom-guardrail"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!draft.trim()}
            onClick={() => addRule(draft)}
            data-testid="button-add-guardrail"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {!compact && (
          <div className="flex flex-wrap gap-2 mt-2">
            {SUGGESTED_RULES.map((rule) => {
              const label = isAr ? rule.ar : rule.en;
              if (profile.customGuardrails.some((existing) => existing.label === label)) return null;
              return (
                <button
                  key={rule.en}
                  type="button"
                  onClick={() => addRule(label)}
                  className="text-xs px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-colors"
                  data-testid="suggested-guardrail"
                >
                  + {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
