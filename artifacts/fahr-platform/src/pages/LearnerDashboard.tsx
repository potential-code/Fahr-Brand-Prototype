import { motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { BaselineAssessmentCard } from "@/components/BaselineAssessmentCard";
import { AdvisorPanel } from "@/components/dashboard/AdvisorPanel";
import { JourneyIllustration } from "@/components/dashboard/JourneyIllustration";
import { LearnerStatsStrip } from "@/components/dashboard/LearnerStatsStrip";
import { QuickLinksGrid } from "@/components/dashboard/QuickLinksGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { LEARNER_PROFILE } from "@/lib/constants";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";

const BASE = import.meta.env.BASE_URL;

/** Soft dot pattern replacing the previous externally hosted texture. */
const BANNER_PATTERN =
  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)";

function WelcomeBanner() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { result } = useLearnerProgress();
  const isAr = language === "ar";
  const assessed = result !== null;

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-r from-primary to-secondary text-white">
      <div
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: BANNER_PATTERN, backgroundSize: "22px 22px" }}
        aria-hidden="true"
      />
      <CardContent className="relative z-10 flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <img
              src={`${BASE}${LEARNER_PROFILE.avatar}`}
              alt=""
              aria-hidden="true"
              className="h-11 w-11 rounded-full object-cover ring-2 ring-white/40"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {isAr ? LEARNER_PROFILE.nameAr : LEARNER_PROFILE.name}
              </p>
              <p className="truncate text-xs text-white/75">
                {isAr ? LEARNER_PROFILE.roleAr : LEARNER_PROFILE.role} ·{" "}
                {isAr ? LEARNER_PROFILE.entityAr : LEARNER_PROFILE.entity}
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-tight md:text-3xl">
            {assessed
              ? isAr
                ? "مسار التعلم الشخصي الخاص بك جاهز"
                : "Your Personalised Learning Pathway is ready"
              : isAr
                ? "مرحباً بك في رحلة القدرات الخاصة بك"
                : "Welcome to your Capability Journey"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
            {assessed
              ? isAr
                ? `حدد مستشار المهارات الذكي مستواك عند ${result.levelLabel} بنتيجة ${result.overall}%، وبنى مسار تعلم يركز على أولوياتك التطويرية.`
                : `The Capability Agent placed you at ${result.levelLabel} on ${result.overall}% and built a pathway around your development priorities. Pick up where you left off.`
              : isAr
                ? "يبدأ مسار تطوير الذكاء الاصطناعي الخاص بك بتقييم تشخيصي قصير. سيتعرف مستشار المهارات الذكي على دورك ويبني مسار تعلم شخصياً لك."
                : "Your Agentic AI development pathway starts with a short baseline assessment. The Capability Agent will learn about your role and generate your Personalised Learning Pathway."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {assessed ? (
              <>
                <Button
                  onClick={() => setLocation("/learner/mission")}
                  className="bg-white font-semibold text-primary hover:bg-white/90"
                  data-testid="button-banner-continue"
                >
                  {isAr ? "متابعة مسار التعلم" : "Continue Learning Pathway"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/learner/assessment/report")}
                  className="border-white/30 text-white hover:bg-white/10"
                  data-testid="button-banner-report"
                >
                  {isAr ? "عرض تقرير التقييم" : "View assessment report"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setLocation("/learner/assessment")}
                  className="bg-white font-semibold text-primary hover:bg-white/90"
                  data-testid="button-banner-assessment"
                >
                  {isAr ? "ابدأ التقييم" : "Start Baseline Assessment"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/learner/mission")}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  {isAr ? "استعرض مسار التعلم" : "Preview Learning Pathway"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 md:flex">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm">
            {assessed ? (
              <div className="text-center">
                <p className="text-2xl font-bold leading-none">{result.overall}%</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/70">
                  {isAr ? "الأساس" : "Baseline"}
                </p>
              </div>
            ) : (
              <Target className="h-10 w-10 text-white" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearnerDashboard() {
  const reduceMotion = useReducedMotion();

  const sections = [
    <WelcomeBanner key="banner" />,
    <BaselineAssessmentCard key="assessment" />,
    <JourneyIllustration key="journey" />,
    <AdvisorPanel key="advisor" />,
    <LearnerStatsStrip key="stats" />,
    <QuickLinksGrid key="links" />,
  ];

  return (
    <Layout role="learner">
      <div className="space-y-6">
        {sections.map((section, i) => (
          <motion.section
            key={section.key}
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: Math.min(i, 3) * 0.09 }}
          >
            {section}
          </motion.section>
        ))}
      </div>
    </Layout>
  );
}
