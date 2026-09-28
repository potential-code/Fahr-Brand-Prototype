import { useMemo } from "react";
import { useLocation } from "wouter";
import { Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFederalData } from "@/lib/FederalDataContext";
import { isLive, ROLE_LABEL } from "@/lib/federal/journey";
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
  const { result, courseProgress, getCoursePercent } = useLearnerProgress();
  const [, setLocation] = useLocation();
  const { submission, project } = useWorkplaceProject();
  const { approvalsFor } = useFederalData();
  const { profile: twin } = useDigitalTwin();

  const participation = useMemo(
    () => summariseParticipation(courseProgress, getCoursePercent),
    [courseProgress, getCoursePercent],
  );


  // Evaluates what the learner submitted this session; falls back to the same
  // worked example Project Evaluation shows when nothing was submitted (or
  // the draft was reopened and the submission cleared), so the two screens
  // can never disagree about whether a certificate exists.
  const own = project ? submission : null;
  const evaluated = useMemo(() => own ?? demoSubmission(), [own]);
  // A submitted project earns nothing until the human chain has approved it.
  const inReview = project !== undefined && !isLive(project.state);
  const approver = project
    ? approvalsFor(project.id).filter((a) => a.decision === "approved_live" || a.decision === "endorsed").at(-1)
    : undefined;

  const record = useMemo(
    () =>
      buildRecognitionRecord({
        result,
        participation,
        courseProgress,
        percentFor: getCoursePercent,
        submission: inReview ? null : evaluated,
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
        {inReview && project && (
          <div
            className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/[0.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            data-testid="certificate-provisional"
          >
            <p className="flex items-center gap-2 text-sm text-foreground">
              <Clock className="h-4 w-4 shrink-0 text-accent" />
              Provisional certificate. It becomes final once your department manager and entity approve &ldquo;{project.title}&rdquo;.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => setLocation(`/learner/messages?project=${project.id}`)}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Follow approval
            </Button>
          </div>
        )}

        <ProjectCertificate
          learnerName={LEARNER_PROFILE.name}
          projectTitle={project?.title ?? evaluated.draft.title}
          dimensions={evaluation.dimensions.map((d) => d.label)}
          score={evaluation.overall}
          issuedOn={approver?.on ?? record.verifiedOn}
          verifyId={certificateVerifyId}
          provisional={inReview}
          reviewer={
            approver ? `${approver.by}, ${ROLE_LABEL[approver.role]}` : "Fatima Al Suwaidi, Ministry Innovation Lead"
          }
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
