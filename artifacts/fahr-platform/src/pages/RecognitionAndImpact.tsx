import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { RecognitionHero } from "@/components/recognition/RecognitionHero";
import { ProjectCertificate } from "@/components/recognition/ProjectCertificate";
import { CompetencyBadges } from "@/components/recognition/CompetencyBadges";
import { LadderPanel, PointsAndRank } from "@/components/recognition/StandingPanels";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { useDigitalTwin } from "@/lib/DigitalTwinContext";
import { summariseParticipation } from "@/lib/profileAnalysis";
import { buildRecognitionRecord, competencyBadges, verifyId } from "@/lib/recognitionRecord";
import { buildRecommendations } from "@/lib/recommendations";
import { demoSubmission, evaluateSubmission } from "@/lib/workplaceProject";
import { LEARNER_PROFILE } from "@/lib/constants";

/**
 * Recognition & Impact — the visible end of the learner journey.
 *
 * Everything is derived in `recognitionRecord.ts` from the learner's real
 * assessment result, course progress and submitted workplace project, so the
 * screen can never claim credit for something that did not happen.
 */
export default function RecognitionAndImpact() {
  const { result, answers, courseProgress, getCoursePercent } = useLearnerProgress();
  const { submission } = useWorkplaceProject();
  const { profile: twin } = useDigitalTwin();

  const participation = useMemo(
    () => summariseParticipation(courseProgress, getCoursePercent),
    [courseProgress, getCoursePercent],
  );

  const plan = useMemo(() => (result ? buildRecommendations(result, answers) : null), [result, answers]);

  // Evaluates what the learner submitted this session; falls back to the same
  // worked example Project Evaluation shows when nothing was submitted (or
  // the draft was reopened and the submission cleared), so the two screens
  // can never disagree about whether a certificate exists.
  const evaluated = useMemo(() => submission ?? demoSubmission(plan?.project ?? null), [submission, plan]);

  const record = useMemo(
    () =>
      buildRecognitionRecord({
        result,
        participation,
        courseProgress,
        percentFor: getCoursePercent,
        submission: evaluated,
      }),
    [result, participation, courseProgress, getCoursePercent, evaluated],
  );

  // The certificate reads the same evaluation the Project Evaluation screen
  // shows, so the two screens can never disagree about what the project scored.
  const evaluation = useMemo(() => evaluateSubmission(evaluated, twin), [evaluated, twin]);

  // Same verification id the workplace-project credential in the wallet was
  // minted with — one artefact, one id, rather than two independent mintings
  // of the same submission drifting apart.
  const projectCredential = record.credentials.find((c) => c.id === "cred-workplace-project");
  const certificateVerifyId =
    projectCredential?.verifyId ?? verifyId(`project-${evaluated.submittedAt}`, new Date().getFullYear());

  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
        <RecognitionHero record={record} />

        {/* The headline artefact of the screen — present as soon as the project
            is approved, so it is never scrolled to. */}
        <ProjectCertificate
          learnerName={LEARNER_PROFILE.name}
          projectTitle={evaluated.draft.title}
          dimensions={evaluation.dimensions.map((d) => d.label)}
          score={evaluation.overall}
          issuedOn={record.verifiedOn}
          verifyId={certificateVerifyId}
          reviewer="Fatima Al Suwaidi, Ministry Innovation Lead"
        />

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
