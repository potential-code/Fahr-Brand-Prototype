import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/LanguageContext";
import NotFound from "@/pages/not-found";

import Welcome from "@/pages/Welcome";
import LearnerDashboard from "@/pages/LearnerDashboard";
import DynamicCapabilityProfile from "@/pages/DynamicCapabilityProfile";
import PersonalisedDevelopmentMission from "@/pages/PersonalisedDevelopmentMission";
import MultiInterfaceAgentExperience from "@/pages/MultiInterfaceAgentExperience";
import AgenticAILabTwin from "@/pages/AgenticAILabTwin";
import AgenticAILabProject from "@/pages/AgenticAILabProject";
import AgenticAIEvaluation from "@/pages/AgenticAIEvaluation";
import RecognitionAndImpact from "@/pages/RecognitionAndImpact";

import MinistryDashboard from "@/pages/MinistryDashboard";
import MinistryPortfolio from "@/pages/MinistryPortfolio";

import FAHRDashboard from "@/pages/FAHRDashboard";
import FAHRGovernance from "@/pages/FAHRGovernance";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      
      {/* Learner Routes */}
      <Route path="/learner" component={LearnerDashboard} />
      <Route path="/learner/profile" component={DynamicCapabilityProfile} />
      <Route path="/learner/mission" component={PersonalisedDevelopmentMission} />
      <Route path="/learner/agent" component={MultiInterfaceAgentExperience} />
      <Route path="/learner/lab/twin" component={AgenticAILabTwin} />
      <Route path="/learner/lab/project" component={AgenticAILabProject} />
      <Route path="/learner/evaluation" component={AgenticAIEvaluation} />
      <Route path="/learner/recognition" component={RecognitionAndImpact} />

      {/* Ministry Routes */}
      <Route path="/ministry" component={MinistryDashboard} />
      <Route path="/ministry/portfolio" component={MinistryPortfolio} />

      {/* FAHR Routes */}
      <Route path="/fahr" component={FAHRDashboard} />
      <Route path="/fahr/governance" component={FAHRGovernance} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </LanguageProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
