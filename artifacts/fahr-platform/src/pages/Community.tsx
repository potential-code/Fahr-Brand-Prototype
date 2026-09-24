import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/PageHeader";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AnnouncementsPanel } from "@/components/community/AnnouncementsPanel";
import { DiscussionBoard } from "@/components/community/DiscussionBoard";
import { PollsAndFeedback } from "@/components/community/PollsAndFeedback";
import { LeaderboardPanel } from "@/components/community/LeaderboardPanel";
import { MyStanding, NotificationsPanel } from "@/components/community/StandingAndAlerts";
import { UpcomingEventsBlock } from "@/components/community/UpcomingEventsBlock";
import { useToast } from "@/hooks/use-toast";
import { useLearnerProgress } from "@/lib/LearnerProgressContext";
import { useWorkplaceProject } from "@/lib/WorkplaceProjectContext";
import { summariseParticipation } from "@/lib/profileAnalysis";
import { buildRecognitionRecord, competencyBadges } from "@/lib/recognitionRecord";
import { ANNOUNCEMENTS, POLLS, THREADS, type Reply, type Thread } from "@/lib/engagement";
import { SEEDED_REGISTRATIONS, matchesAudience, recommendedFirst, seatState, type Session } from "@/lib/events";
import { useFahrConsole } from "@/lib/FahrConsoleContext";
import { LEARNER_PROFILE } from "@/lib/constants";
import { Users } from "lucide-react";

let replyCounter = 0;
const nextReplyId = () => {
  replyCounter += 1;
  return `reply-local-${replyCounter}`;
};

/**
 * Federal AI Community (proposal §4.6).
 *
 * Announcements, forums, polls, feedback, notifications, gamification and
 * leaderboards. Every interaction here is real for the session: votes, likes,
 * replies and read flags all update state the learner can see change.
 */
export default function Community() {
  const { toast } = useToast();
  const { result, courseProgress, getCoursePercent } = useLearnerProgress();
  const { submission } = useWorkplaceProject();

  const participation = useMemo(
    () => summariseParticipation(courseProgress, getCoursePercent),
    [courseProgress, getCoursePercent],
  );

  // Points, rank and badges come from the same record the recognition screen
  // uses, so the two screens can never disagree about the learner's standing.
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

  const [threads, setThreads] = useState<Thread[]>(THREADS);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [registeredIds, setRegisteredIds] = useState<string[]>(SEEDED_REGISTRATIONS);
  const [waitlistedIds, setWaitlistedIds] = useState<string[]>([]);

  // Sessions closing the learner's weakest competencies surface first, and
  // only the ones this learner's audience includes.
  const { learningSessions } = useFahrConsole();
  const gaps = result?.gaps ?? [];
  const sessions = useMemo(
    () =>
      recommendedFirst(
        learningSessions.filter((session) =>
          matchesAudience(session.audience, { gapCompetencyIds: gaps }),
        ),
        gaps,
      ),
    [learningSessions, gaps],
  );

  const toggleLike = (threadId: string) => {
    setLikedIds((current) =>
      current.includes(threadId) ? current.filter((id) => id !== threadId) : [...current, threadId],
    );
  };

  const addReply = (threadId: string, body: string) => {
    const reply: Reply = {
      id: nextReplyId(),
      author: LEARNER_PROFILE.name,
      initials: "AM",
      role: `${LEARNER_PROFILE.role}, ${LEARNER_PROFILE.entity}`,
      when: "Just now",
      body,
      mine: true,
    };
    setThreads((current) =>
      current.map((thread) => (thread.id === threadId ? { ...thread, replies: [...thread.replies, reply] } : thread)),
    );
    toast({
      title: "Reply posted",
      description: "Colleagues following this thread are notified. Helpful answers earn 150 impact points.",
    });
  };

  const startThread = (title: string) => {
    const thread: Thread = {
      id: `thr-local-${threads.length + 1}`,
      title,
      body: "Posted from the community. Colleagues across federal entities can reply.",
      author: LEARNER_PROFILE.name,
      initials: "AM",
      role: LEARNER_PROFILE.role,
      entity: LEARNER_PROFILE.entity,
      when: "Just now",
      scope: "federal",
      competencyId: result?.gaps[0] ?? "prompting",
      likes: 0,
      replies: [],
    };
    setThreads((current) => [thread, ...current]);
    toast({ title: "Discussion published", description: "Your thread is now at the top of the forum." });
  };

  const registerForSession = (session: Session) => {
    // A full session takes a waiting-list place, not a confirmed seat.
    if (seatState(session, false) === "full") {
      setWaitlistedIds((current) => (current.includes(session.id) ? current : [...current, session.id]));
      toast({
        title: "Added to the waiting list",
        description: `${session.title} is full. You will be offered the first seat that opens.`,
      });
      return;
    }

    setRegisteredIds((current) => (current.includes(session.id) ? current : [...current, session.id]));
    toast({
      title: "Seat confirmed",
      description: `${session.title} — a calendar invitation and reminder are on their way.`,
    });
  };

  return (
    <Layout role="learner">
      <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
        <PageHeader
          icon={<Users className="mt-1 h-6 w-6 text-primary" />}
          title="Federal AI Community"
          description="Announcements, open questions across every federal entity, polls that shape the programme, and where you stand against your colleagues."
        />

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <ScrollReveal>
              <AnnouncementsPanel announcements={ANNOUNCEMENTS} />
            </ScrollReveal>

            <ScrollReveal>
              <UpcomingEventsBlock
                sessions={sessions}
                registeredIds={registeredIds}
                waitlistedIds={waitlistedIds}
                onRegister={registerForSession}
              />
            </ScrollReveal>

            <ScrollReveal>
              <DiscussionBoard
                threads={threads}
                likedIds={likedIds}
                onToggleLike={toggleLike}
                onReply={addReply}
                onStartThread={startThread}
              />
            </ScrollReveal>

            <ScrollReveal>
              <PollsAndFeedback polls={POLLS} />
            </ScrollReveal>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <ScrollReveal>
              <MyStanding
                points={record.points}
                rankEntity={record.rank.entity}
                badges={competencyBadges(result)}
              />
            </ScrollReveal>
            <ScrollReveal>
              <LeaderboardPanel />
            </ScrollReveal>
            <ScrollReveal>
              <NotificationsPanel />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </Layout>
  );
}
