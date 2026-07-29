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

import Welcome from "@/pages/Welcome";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import LearnerOnboarding from "@/pages/LearnerOnboarding";
import Community from "@/pages/Community";
import ManagerDashboard from "@/pages/ManagerDashboard";
import TeamMembers from "@/pages/TeamMembers";
import TeamMemberDetail from "@/pages/TeamMemberDetail";
import ManagerValidations from "@/pages/ManagerValidations";
import ManagerReports from "@/pages/ManagerReports";
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
import LeadershipMinistries from "@/pages/LeadershipMinistries";
import LeadershipOutcomes from "@/pages/LeadershipOutcomes";
import LeadershipBriefings from "@/pages/LeadershipBriefings";
import { EntityAdminProvider } from "@/lib/EntityAdminContext";
import MinistryCohortDetail from "@/pages/MinistryCohortDetail";
import MinistryUsers from "@/pages/MinistryUsers";
import MinistryApprovals from "@/pages/MinistryApprovals";
import MinistryContent from "@/pages/MinistryContent";
import MinistryEvents from "@/pages/MinistryEvents";
import MinistryCommunications from "@/pages/MinistryCommunications";
import MinistryReports from "@/pages/MinistryReports";
import MinistryDepartment from "@/pages/MinistryDepartment";
import MinistryPerson from "@/pages/MinistryPerson";

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
      <Route path="/manager/team" component={TeamMembers} />
      <Route path="/manager/team/:memberId" component={TeamMemberDetail} />
      <Route path="/manager/validations" component={ManagerValidations} />
      <Route path="/manager/reports" component={ManagerReports} />

      {/* Ministry Routes */}
      <Route path="/ministry" component={MinistryDashboard} />
      <Route path="/ministry/cohorts" component={MinistryCohorts} />
      <Route path="/ministry/cohorts/:cohortId" component={MinistryCohortDetail} />
      <Route path="/ministry/users" component={MinistryUsers} />
      <Route path="/ministry/approvals" component={MinistryApprovals} />
      <Route path="/ministry/portfolio" component={MinistryPortfolio} />
      <Route path="/ministry/content" component={MinistryContent} />
      <Route path="/ministry/events" component={MinistryEvents} />
      <Route path="/ministry/communications" component={MinistryCommunications} />
      <Route path="/ministry/reports" component={MinistryReports} />
      <Route path="/ministry/departments/:departmentId" component={MinistryDepartment} />
      <Route path="/ministry/people/:personId" component={MinistryPerson} />

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
      <Route path="/leadership/ministries" component={LeadershipMinistries} />
      <Route path="/leadership/outcomes" component={LeadershipOutcomes} />
      <Route path="/leadership/briefings" component={LeadershipBriefings} />

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
                <EntityAdminProvider>
                  <WorkplaceProjectProvider>
                    <WouterRouter
                      base={import.meta.env.BASE_URL.replace(/\/$/, "")}
                    >
                      <Router />
                    </WouterRouter>
                  </WorkplaceProjectProvider>
                </EntityAdminProvider>
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
