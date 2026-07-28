import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/LanguageContext";
import { LearnerProgressProvider } from "@/lib/LearnerProgressContext";
import NotFound from "@/pages/not-found";

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
import AILearningCoach from "@/pages/AILearningCoach";
import AgenticAILabTwin from "@/pages/AgenticAILabTwin";
import AgenticAILabProject from "@/pages/AgenticAILabProject";
import AgenticAIEvaluation from "@/pages/AgenticAIEvaluation";
import RecognitionAndImpact from "@/pages/RecognitionAndImpact";

import MinistryDashboard from "@/pages/MinistryDashboard";
import MinistryPortfolio from "@/pages/MinistryPortfolio";

import FAHRDashboard from "@/pages/FAHRDashboard";
import FAHRGovernance from "@/pages/FAHRGovernance";

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
      <Route path="/learner/agent" component={AILearningCoach} />
      <Route path="/learner/lab/twin" component={AgenticAILabTwin} />
      <Route path="/learner/lab/project" component={AgenticAILabProject} />
      <Route path="/learner/evaluation" component={AgenticAIEvaluation} />
      <Route path="/learner/recognition" component={RecognitionAndImpact} />

      {/* Manager Routes */}
      <Route path="/manager" component={ManagerDashboard} />

      {/* Ministry Routes */}
      <Route path="/ministry" component={MinistryDashboard} />
      <Route path="/ministry/cohorts" component={MinistryCohorts} />
      <Route path="/ministry/portfolio" component={MinistryPortfolio} />

      {/* FAHR Routes */}
      <Route path="/fahr" component={FAHRDashboard} />
      <Route path="/fahr/governance" component={FAHRGovernance} />

      {/* Federal Leadership Routes */}
      <Route path="/leadership" component={LeadershipDashboard} />

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
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </LearnerProgressProvider>
        </LanguageProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
