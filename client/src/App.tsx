import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocalizationProvider } from "@/hooks/useLocalization";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DynamicPage from "@/pages/[slug]";
import AffiliateDashboard from "@/pages/admin/affiliate-dashboard";
import UserInsights from "@/pages/admin/user-insights";
import { ExperimentsDashboard } from "@/pages/ExperimentsDashboard";
import LeadsDashboard from "@/pages/LeadsDashboard";
import CrossDeviceAnalyticsDashboard from "@/pages/admin/CrossDeviceAnalyticsDashboard";
import LocalizationDashboard from "@/components/LocalizationDashboard";
import OrchestratorDashboard from "@/pages/admin/orchestrator-dashboard";
import AnalyticsOverview from "@/pages/admin/analytics-overview";
import AIDashboard from "@/pages/admin/ai-dashboard";
import Configuration from "@/pages/admin/configuration";
import DataManagement from "@/pages/admin/data-management";
import InteractiveModules from "@/pages/admin/interactive-modules";
import NeuronFederationDashboard from "@/pages/admin/neuron-federation";
import EmpireLaunchpad from "@/pages/admin/empire-launchpad";
import AIMLCenter from "@/pages/admin/AIMLCenter";
import SemanticGraphCenter from "@/pages/admin/SemanticGraphCenter";
import NotificationCenter from "@/pages/admin/NotificationCenter";
import SecurityHome from "@/pages/SecurityHome";
import SecurityDashboard from "@/pages/SecurityDashboard";
import SecurityQuiz from "@/components/SecurityQuiz";
import SecurityTools from "@/pages/SecurityTools";
import HealthHome from "@/pages/HealthHome";
import FinanceHome from "@/pages/FinanceHome";
import FinanceQuiz from "@/pages/FinanceQuiz";
import FinanceCalculators from "@/pages/FinanceCalculators";
import { TravelHome } from "@/pages/TravelHome";
import { AIToolsPage } from "@/pages/AIToolsPage";
import OfferEngineDashboard from "@/pages/OfferEngineDashboard";
import AdminOfferFeedDashboard from "@/pages/AdminOfferFeedDashboard";
import AdminComplianceDashboard from "@/pages/AdminComplianceDashboard";
import { PWAAdminDashboard } from "@/components/PWAAdminDashboard";
import PWAMobileDashboard from "@/components/admin/PWAMobileDashboard";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { PWAUpdateNotification, PWAOfflineIndicator } from "@/components/PWAUpdateNotification";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAStatus from "@/components/PWAStatus";
import CodexAuditPage from "@/pages/CodexAuditPage";
import StorefrontDashboard from "@/pages/StorefrontDashboard";
import Storefront from "@/pages/Storefront";
import DeploymentDashboard from "../components/admin/DeploymentDashboard";
import AINativeOS from "@/pages/admin/AINativeOS";
import { KnowledgeMemoryDashboard } from "@/components/KnowledgeMemoryDashboard";
import CulturalEmotionMapDashboard from "@/components/admin/CulturalEmotionMapDashboard";
import CentralConfigDashboard from "@/components/admin/CentralConfigDashboard";
import RevenueSplitDashboard from "@/pages/admin/revenue-split-dashboard";
import SessionDashboard from "@/pages/admin/SessionDashboard";
import AdminRLHFBrain from "@/pages/AdminRLHFBrain";
import VectorSearchDashboard from "@/pages/admin/VectorSearchDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/affiliate-dashboard" component={AffiliateDashboard} />
      <Route path="/admin/user-insights" component={UserInsights} />
      <Route path="/admin/experiments-dashboard" component={() => <ExperimentsDashboard />} />
      <Route path="/admin/leads-dashboard" component={LeadsDashboard} />
      <Route path="/admin/cross-device-analytics" component={CrossDeviceAnalyticsDashboard} />
      <Route path="/admin/localization" component={LocalizationDashboard} />
      <Route path="/admin/orchestrator-dashboard" component={OrchestratorDashboard} />
      <Route path="/admin/analytics" component={AnalyticsOverview} />
      <Route path="/admin/ai-dashboard" component={AIDashboard} />
      <Route path="/admin/configuration" component={Configuration} />
      <Route path="/admin/data-management" component={DataManagement} />
      <Route path="/admin/interactive-modules" component={InteractiveModules} />
      <Route path="/admin/neuron-federation" component={NeuronFederationDashboard} />
      <Route path="/admin/empire-launchpad" component={EmpireLaunchpad} />
      <Route path="/admin/ai-ml-center" component={AIMLCenter} />
      <Route path="/admin/semantic-graph-center" component={SemanticGraphCenter} />
      <Route path="/admin/notification-center" component={NotificationCenter} />
      <Route path="/admin/offer-engine" component={OfferEngineDashboard} />
      <Route path="/admin/offer-feed-dashboard" component={AdminOfferFeedDashboard} />
      <Route path="/admin/compliance-dashboard" component={AdminComplianceDashboard} />
      <Route path="/admin/pwa-center" component={() => <PWAAdminDashboard />} />
      <Route path="/admin/pwa-mobile-dashboard" component={PWAMobileDashboard} />
      <Route path="/admin/funnel-dashboard" component={lazy(() => import("./pages/admin/FunnelDashboard"))} />
      <Route path="/admin/codex-audit" component={CodexAuditPage} />
      <Route path="/admin/storefront-dashboard" component={StorefrontDashboard} />
      <Route path="/admin/deployment-dashboard" component={DeploymentDashboard} />
      <Route path="/admin/ai-native-os" component={AINativeOS} />
      <Route path="/admin/knowledge-memory" component={() => <KnowledgeMemoryDashboard />} />
      <Route path="/admin/culture-map" component={() => <CulturalEmotionMapDashboard />} />
      <Route path="/admin/central-config" component={() => <CentralConfigDashboard />} />
      <Route path="/admin/revenue-split" component={RevenueSplitDashboard} />
      <Route path="/admin/sessions" component={() => <SessionDashboard />} />
      <Route path="/admin/rlhf-brain" component={AdminRLHFBrain} />
      <Route path="/admin/vector-search" component={VectorSearchDashboard} />
      <Route path="/admin/api-diff" component={lazy(() => import("../components/admin/ApiDiffDashboard"))} />
      <Route path="/store" component={Storefront} />
      <Route path="/storefront" component={Storefront} />
      
      {/* Security Neuron Pages */}
      <Route path="/security" component={SecurityHome} />
      <Route path="/security-home" component={SecurityHome} />
      <Route path="/security-quiz" component={SecurityQuiz} />
      <Route path="/security-tools" component={SecurityTools} />
      <Route path="/security-dashboard" component={SecurityDashboard} />
      
      {/* SaaS Neuron Pages - Will be added as they're created */}
      <Route path="/saas" component={() => <div className="p-8 text-center"><h1 className="text-3xl font-bold text-blue-600">SaaS Intelligence Hub</h1><p className="text-slate-600 mt-4">Coming Soon - Your AI-powered SaaS discovery platform</p></div>} />
      <Route path="/saas-home" component={() => <div className="p-8 text-center"><h1 className="text-3xl font-bold text-blue-600">SaaS Intelligence Hub</h1><p className="text-slate-600 mt-4">Coming Soon - Your AI-powered SaaS discovery platform</p></div>} />
      
      {/* Health & Wellness Neuron Pages */}
      <Route path="/health" component={HealthHome} />
      <Route path="/health-home" component={HealthHome} />
      <Route path="/wellness" component={HealthHome} />
      
      {/* Finance Neuron Pages */}
      <Route path="/finance" component={FinanceHome} />
      <Route path="/finance-home" component={FinanceHome} />
      <Route path="/finance/quiz" component={FinanceQuiz} />
      <Route path="/finance/calculator/:calculatorId?" component={FinanceCalculators} />
      <Route path="/personal-finance" component={FinanceHome} />
      <Route path="/money" component={FinanceHome} />
      
      {/* Travel Neuron Pages */}
      <Route path="/travel" component={TravelHome} />
      <Route path="/travel-home" component={TravelHome} />
      <Route path="/destinations" component={TravelHome} />
      <Route path="/wanderlust" component={TravelHome} />
      
      {/* AI Tools Neuron Pages */}
      <Route path="/ai-tools" component={AIToolsPage} />
      <Route path="/ai-tools-home" component={AIToolsPage} />
      <Route path="/tools" component={AIToolsPage} />
      <Route path="/ai" component={AIToolsPage} />
      
      {/* Interactive Module Pages */}
      <Route path="/fitness-transformation-quiz" component={DynamicPage} />
      <Route path="/investment-calculator" component={DynamicPage} />
      <Route path="/meditation-timer" component={DynamicPage} />
      <Route path="/anxiety-relief-toolkit" component={DynamicPage} />
      <Route path="/business-success-strategies" component={DynamicPage} />
      
      <Route path="/page/:slug" component={DynamicPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <TooltipProvider>
          <Toaster />
          <PWAOfflineIndicator />
          <PWAUpdateNotification />
          <PWAInstallPrompt />
          <PWAStatus />
          <Router />
          <PWAInstallBanner />
        </TooltipProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App;
