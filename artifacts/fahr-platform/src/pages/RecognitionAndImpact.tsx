import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { RecognitionHero } from "@/components/recognition/RecognitionHero";
import { CompetencyBadges } from "@/components/recognition/CompetencyBadges";
import { LadderPanel, PointsAndRank } from "@/components/recognition/StandingPanels";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { summariseParticipation } from "@/lib/profileAnalysis";
import { buildRecognitionRecord, competencyBadges } from "@/lib/recognitionRecord";

/**
 * Recognition & Impact — the visible end of the learner journey.
 *
 * Everything is derived in `recognitionRecord.ts` from the learner's real
 * assessment result, course progress and submitted workplace project, so the
 * screen can never claim credit for something that did not happen.
 */
export default function RecognitionAndImpact() {
  const { result, courseProgress, getCoursePercent } = useLearnerProgress();
  const { submission } = useWorkplaceProject();

  const participation = useMemo(
    () => summariseParticipation(courseProgress, getCoursePercent),
    [courseProgress, getCoursePercent],
  );

  const record = useMemo(
    () =>
      buildRecognitionRecord({
        result,
        participation,
        courseProgress,
        percentFor: getCoursePercent,
        submission,
      }),
    [result, participation, courseProgress, getCoursePercent, submission],
  );

  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
        <RecognitionHero record={record} />

        <ScrollReveal>
          <CompetencyBadges badges={competencyBadges(result)} />
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-2">
          <ScrollReveal>
            <PointsAndRank record={record} />
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <LadderPanel record={record} />
          </ScrollReveal>
        </div>
      </div>
    </Layout>
  );
}
