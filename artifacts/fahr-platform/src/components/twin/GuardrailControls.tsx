import { useState } from "react";
import { Lock, Plus, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
 * The governance guardrails, shown as enforced facts rather than switches.
 *
 * A federal audience should never be shown a control that switches federal
 * policy off, so these two render read-only and always-on — there is no
 * affordance anywhere in this component that can relax either one.
 */
export function GuardrailControls({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { profile, addCustomGuardrail, removeCustomGuardrail } = useDigitalTwin();
  const [draft, setDraft] = useState("");

  const addRule = (label: string) => {
    addCustomGuardrail(label);
    setDraft("");
  };

  return (
    <div className="space-y-3" data-testid="guardrail-controls">
      {GUARDRAILS.map((guardrail) => (
        <div
          key={guardrail.id}
          className="p-3 rounded-xl border border-border bg-card transition-colors"
          data-testid={`guardrail-${guardrail.id}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium truncate">
                  {isAr ? guardrail.label.ar : guardrail.label.en}
                </p>
              </div>
              <p className="text-xs mt-1.5 leading-relaxed text-muted-foreground">
                {isAr ? guardrail.on.ar : guardrail.on.en}
              </p>
              {!compact && (
                <Badge variant="outline" className="mt-2 text-[10px] font-normal bg-background">
                  {isAr ? guardrail.policy.ar : guardrail.policy.en}
                </Badge>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600/10 px-2.5 py-1">
              <Lock className="h-3 w-3 text-emerald-700" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                {isAr ? "مفعّل دائمًا" : "Always on"}
              </span>
            </span>
          </div>
        </div>
      ))}

      {/* Rules the learner writes themselves. The two above are federal and
          enforced in code; these are the entity's and the individual's own. */}
      <div className="pt-1" data-testid="custom-guardrails">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {isAr ? "قواعدك الخاصة" : "Your own rules"}
        </p>

        {profile.customGuardrails.map((rule) => (
          <div
            key={rule.id}
            className="p-3 rounded-xl border mb-2 border-primary/25 bg-primary/5 transition-colors"
            data-testid={`custom-guardrail-${rule.id}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 shrink-0 text-primary" />
                <p className="text-sm font-medium truncate">{rule.label}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
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
