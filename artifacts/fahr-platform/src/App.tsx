import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/LanguageContext";
import { LearnerProgressProvider } from "@/lib/LearnerProgressContext";
import { FederalDataProvider } from "@/lib/FederalDataContext";
import { FahrConsoleProvider } from "@/lib/FahrConsoleContext";
import { WorkplaceProjectProvider } from "@/lib/WorkplaceProjectContext";
import NotFound from "@/pages/not-found";
import PlaceholderScreen from "@/pages/PlaceholderScreen";

import Welcome from "@/pages/Welcome";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import LearnerOnboarding from "@/pages/LearnerOnboarding";
import Community from "@/pages/Community";
import ManagerDashboard from "@/pages/ManagerDashboard";
import MinistryCohorts from "@/pages/MinistryCohorts";
import LearnerDashboard from "@/pages/LearnerDashboard";
import BaselineAssessment from "@/pages/BaselineAssessment";
import AssessmentReport from "@/pages/AssessmentReport";
import CoursePlayer from "@/pages/CoursePlayer";
import CapabilityProfile from "@/pages/CapabilityProfile";
import PersonalisedLearningPathway from "@/pages/PersonalisedLearningPathway";
import AgenticAILabTwin from "@/pages/AgenticAILabTwin";
import AgenticAILabProject from "@/pages/AgenticAILabProject";
import AgenticAIEvaluation from "@/pages/AgenticAIEvaluation";
import RecognitionAndImpact from "@/pages/RecognitionAndImpact";
import WorkshopsAndEvents from "@/pages/WorkshopsAndEvents";

import MinistryDashboard from "@/pages/MinistryDashboard";
import MinistryPortfolio from "@/pages/MinistryPortfolio";

import FAHRDashboard from "@/pages/FAHRDashboard";
import FAHRGovernance from "@/pages/FAHRGovernance";
import FAHREntities from "@/pages/FAHREntities";
import FAHRUsers from "@/pages/FAHRUsers";
import FAHRFramework from "@/pages/FAHRFramework";
import FAHREscalations from "@/pages/FAHREscalations";
import FAHRCredentials from "@/pages/FAHRCredentials";
import FAHRIntegrations from "@/pages/FAHRIntegrations";
import FAHRCommunications from "@/pages/FAHRCommunications";
import FAHRReports from "@/pages/FAHRReports";

import LeadershipDashboard from "@/pages/LeadershipDashboard";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Learner Routes */}
      <Route path="/learner" component={LearnerDashboard} />
      <Route path="/learner/onboarding" component={LearnerOnboarding} />
      <Route path="/learner/assessment" component={BaselineAssessment} />
      <Route path="/learner/assessment/report" component={AssessmentReport} />
      <Route path="/learner/course/:courseId" component={CoursePlayer} />
      <Route path="/learner/community" component={Community} />
      <Route path="/learner/profile" component={CapabilityProfile} />
      <Route path="/learner/mission" component={PersonalisedLearningPathway} />
      <Route path="/learner/lab/twin" component={AgenticAILabTwin} />
      <Route path="/learner/lab/project" component={AgenticAILabProject} />
      <Route path="/learner/evaluation" component={AgenticAIEvaluation} />
      <Route path="/learner/recognition" component={RecognitionAndImpact} />
      <Route path="/learner/events" component={WorkshopsAndEvents} />

      {/* Manager Routes */}
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/manager/team">
        <PlaceholderScreen
          role="manager"
          title="Team Members"
          description="Every direct report with their capability level, pathway progress and outstanding actions."
          willInclude={[
            "Sortable roster with capability level, progress and last activity",
            "Filters for at-risk and awaiting-action team members",
            "Opens a full profile for each team member",
          ]}
        />
      </Route>
      <Route path="/manager/team/:memberId">
        <PlaceholderScreen
          role="manager"
          title="Team Member"
          description="A single team member's capability profile, competency gaps, course progress and workplace project history."
          willInclude={[
            "Baseline result and competency breakdown",
            "Pathway and course progress",
            "Workplace project submissions and your decisions on them",
          ]}
          backHref="/manager/team"
          backLabel="Back to team members"
        />
      </Route>
      <Route path="/manager/validations">
        <PlaceholderScreen
          role="manager"
          title="Validations & Sign-off"
          description="Workplace projects from your team waiting on your decision, with the evidence to judge them."
          willInclude={[
            "Queue of submissions awaiting sign-off",
            "Sign off, or request a revision with a note back to the learner",
            "Decisions travel on to the entity admin in the same session",
          ]}
        />
      </Route>
      <Route path="/manager/reports">
        <PlaceholderScreen
          role="manager"
          title="Team Reports"
          description="Capability distribution, progress and applied-AI impact across your team."
          willInclude={[
            "Capability distribution and gap analysis for the team",
            "Progress and engagement trend",
            "Hours saved and value created by signed-off projects",
          ]}
        />
      </Route>

      {/* Ministry Routes */}
      <Route path="/ministry" component={MinistryDashboard} />
      <Route path="/ministry/cohorts" component={MinistryCohorts} />
      <Route path="/ministry/cohorts/:cohortId">
        <PlaceholderScreen
          role="ministry"
          title="Cohort"
          description="A single cohort's roster, pathway, progress and completion outlook."
          willInclude={[
            "Cohort roster with individual progress",
            "Assigned pathway and content",
            "Milestones, completion forecast and at-risk learners",
          ]}
          backHref="/ministry/cohorts"
          backLabel="Back to cohorts"
        />
      </Route>
      <Route path="/ministry/users">
        <PlaceholderScreen
          role="ministry"
          title="Users & Access"
          description="Accounts, roles and access across the entity."
          willInclude={[
            "Entity user directory with role and status",
            "Invite users and assign roles",
            "Department and cohort assignment",
          ]}
        />
      </Route>
      <Route path="/ministry/approvals">
        <PlaceholderScreen
          role="ministry"
          title="Approvals"
          description="Projects that cleared line manager sign-off and need an entity decision, plus anything escalated to FAHR."
          willInclude={[
            "Endorsement queue with the manager's decision attached",
            "Endorse, return, or escalate to FAHR",
            "Escalation status and federal responses",
          ]}
        />
      </Route>
      <Route path="/ministry/portfolio" component={MinistryPortfolio} />
      <Route path="/ministry/content">
        <PlaceholderScreen
          role="ministry"
          title="Content"
          description="Courses, microlearning and simulations available to the entity, with competency mapping and versions."
          willInclude={[
            "Catalogue with competency mapping, language and version",
            "Publish state and review queue",
            "Assignment to cohorts and pathways",
          ]}
        />
      </Route>
      <Route path="/ministry/events">
        <PlaceholderScreen
          role="ministry"
          title="Events"
          description="Workshops and virtual sessions run by the entity, with seats and registrations."
          willInclude={[
            "Scheduled sessions with seats and registrations",
            "Create a session and open registration",
            "Attendance follow-up for cohorts",
          ]}
        />
      </Route>
      <Route path="/ministry/communications">
        <PlaceholderScreen
          role="ministry"
          title="Communications"
          description="Announcements, nudges and reminders sent to learners and managers in the entity."
          willInclude={[
            "Announcements and reminder campaigns",
            "Audience selection by cohort, department or status",
            "Delivery history",
          ]}
        />
      </Route>
      <Route path="/ministry/reports">
        <PlaceholderScreen
          role="ministry"
          title="Reports"
          description="Entity readiness, department comparison, adoption and applied-AI impact."
          willInclude={[
            "Readiness and coverage by department",
            "Adoption, usage and quota consumption",
            "Exportable reporting pack for FAHR",
          ]}
        />
      </Route>

      {/* FAHR Routes */}
      <Route path="/fahr" component={FAHRDashboard} />
      <Route path="/fahr/entities" component={FAHREntities} />
      <Route path="/fahr/users" component={FAHRUsers} />
      <Route path="/fahr/framework" component={FAHRFramework} />
      <Route path="/fahr/governance" component={FAHRGovernance} />
      <Route path="/fahr/escalations" component={FAHREscalations} />
      <Route path="/fahr/credentials" component={FAHRCredentials} />
      <Route path="/fahr/integrations" component={FAHRIntegrations} />
      <Route path="/fahr/communications" component={FAHRCommunications} />
      <Route path="/fahr/reports" component={FAHRReports} />

      {/* Federal Leadership Routes */}
      <Route path="/leadership" component={LeadershipDashboard} />
      <Route path="/leadership/ministries">
        <PlaceholderScreen
          role="leadership"
          title="Ministries"
          description="Every entity ranked on readiness, coverage and delivered impact."
          willInclude={[
            "Entity ranking with readiness, coverage and trend",
            "On-track and at-risk banding",
            "Drill-down into an entity's detail",
          ]}
        />
      </Route>
      <Route path="/leadership/outcomes">
        <PlaceholderScreen
          role="leadership"
          title="Outcomes"
          description="What the programme has delivered: hours saved, value created and capability built."
          willInclude={[
            "Hours saved and value created by entity",
            "Capability growth against the national target",
            "Deployed projects and credentials issued",
          ]}
        />
      </Route>
      <Route path="/leadership/briefings">
        <PlaceholderScreen
          role="leadership"
          title="Briefings"
          description="Quarterly readiness briefings generated from the live programme data."
          willInclude={[
            "Quarterly briefing with the national picture",
            "Entity highlights and risks",
            "Downloadable briefing pack",
          ]}
        />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <LearnerProgressProvider>
            <FederalDataProvider>
              <FahrConsoleProvider>
                <WorkplaceProjectProvider>
                  <WouterRouter
                    base={import.meta.env.BASE_URL.replace(/\/$/, "")}
                  >
                    <Router />
                  </WouterRouter>
                </WorkplaceProjectProvider>
              </FahrConsoleProvider>
            </FederalDataProvider>
          </LearnerProgressProvider>
        </LanguageProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
