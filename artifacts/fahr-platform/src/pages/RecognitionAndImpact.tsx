import { useMemo } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { RecognitionHero } from "@/components/recognition/RecognitionHero";
import { CredentialWallet } from "@/components/recognition/CredentialWallet";
import { AchievementsGrid } from "@/components/recognition/AchievementsGrid";
import { ImpactPanel, LadderPanel, PointsAndRank } from "@/components/recognition/StandingPanels";
import { useToast } from "@/hooks/use-toast";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { summariseParticipation } from "@/lib/profileAnalysis";
import { buildRecognitionRecord, type WalletCredential } from "@/lib/recognitionRecord";
import { ArrowRight, CalendarDays, Users } from "lucide-react";

/**
 * Recognition & Impact — the visible end of the learner journey.
 *
 * Everything is derived in `recognitionRecord.ts` from the learner's real
 * assessment result, course progress and submitted workplace project, so the
 * screen can never claim credit for something that did not happen.
 */
export default function RecognitionAndImpact() {
  const { toast } = useToast();
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

  const handleCredentialAction = (action: string, credential: WalletCredential) => {
    toast({
      title: action === "Download" ? "Credential PDF prepared" : "Share link created",
      description:
        action === "Download"
          ? `${credential.title} — verification ID ${credential.verifyId}.`
          : `Anyone with the link can verify ${credential.title} against the federal register.`,
    });
  };

  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
        <RecognitionHero
          record={record}
          onSync={() =>
            toast({
              title: "Wallet synced with UAE Pass",
              description: `${record.earnedCount} verified credentials are now available in your national digital identity.`,
            })
          }
        />

        <ScrollReveal as="section">
          <CredentialWallet credentials={record.credentials} onAction={handleCredentialAction} />
        </ScrollReveal>

        <ScrollReveal>
          <ImpactPanel record={record} />
        </ScrollReveal>

        <ScrollReveal>
          <AchievementsGrid achievements={record.achievements} />
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-2">
          <ScrollReveal>
            <PointsAndRank record={record} />
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <LadderPanel record={record} />
          </ScrollReveal>
        </div>

        {/* Recognition should hand the learner onward, not end the journey. */}
        <ScrollReveal className="grid gap-4 sm:grid-cols-2" stagger={0.08}>
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-card-border bg-card p-5">
            <div>
              <Users className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="mt-2.5 text-base font-semibold text-foreground">Share what earned this</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Post the approach behind your project in the federal AI community. Answers marked helpful earn points
                towards your next badge.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href="/learner/community" data-testid="link-community-from-recognition">
                Open the community <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-card-border bg-card p-5">
            <div>
              <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="mt-2.5 text-base font-semibold text-foreground">Earn the next credential live</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Instructor-led workshops and webinars count towards your record. Attendance adds points and unlocks
                practitioner-level sessions.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link href="/learner/events" data-testid="link-events-from-recognition">
                Browse workshops and events <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </Layout>
  );
}
