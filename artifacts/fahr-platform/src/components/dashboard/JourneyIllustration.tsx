import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/LanguageContext";

const BASE = import.meta.env.BASE_URL;

/**
 * The six-stage learner journey, shown as the same illustration used on the
 * public landing page so learners recognise where the platform is taking them.
 */
export function JourneyIllustration() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const reduceMotion = useReducedMotion();

  return (
    <Card className="overflow-hidden border-card-border">
      <CardContent className="p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold leading-tight text-primary">
            {isAr ? "رحلتك التعليمية" : "Your Learning Journey"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "ست مراحل مدعومة بالذكاء الاصطناعي من التهيئة إلى الأثر القابل للقياس"
              : "Six AI-powered stages from onboarding to measurable impact"}
          </p>
        </div>

        <motion.figure
          className="mx-auto m-0 max-w-xl"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-white">
            <img
              src={`${BASE}brand/learner-journey.png`}
              alt="Diagram of the six-stage FAHR learner journey, running from onboarding and profiling through to recognition and measurable impact."
              className="block h-auto w-full"
              loading="lazy"
              data-testid="img-learner-journey"
            />
          </div>
          <figcaption className="mt-3 text-center text-xs text-muted-foreground">
            {isAr
              ? "التهيئة ← المسار الشخصي ← التعلم التطبيقي ← التوأم الرقمي ← تقييم المشروع ← التقدير والأثر"
              : "Onboarding → Personalised pathway → Experiential learning → Digital twin → Project evaluation → Recognition & impact"}
          </figcaption>
        </motion.figure>
      </CardContent>
    </Card>
  );
}
