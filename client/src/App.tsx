import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "./components/Analytics";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardHome from "./pages/DashboardHome";
import Onboarding from "./pages/Onboarding";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import ResumeAnalysis from "./pages/ResumeAnalysis";
import JobFit from "./pages/JobFit";
import Reports from "./pages/Reports";
import Consulting from "./pages/Consulting";
import Admin from "./pages/Admin";
import Trends from "./pages/Trends";
import ChatBot from "./pages/ChatBot";
import DashboardLayout from "./components/DashboardLayout";
import FloatingChatButton from "./components/FloatingChatButton";
import ThemeToggle from "./components/ThemeToggle";
import DailyGoalNudge from "./components/DailyGoalNudge";
import { lazy, Suspense } from "react";
import SavedJobs from "./pages/SavedJobs";
import InterviewPrep from "./pages/InterviewPrep";
import EmailCenter from "./pages/EmailCenter";
import CareerOps from "./pages/CareerOps";
import MarketingRoute from "./pages/MarketingLanding";
import ProposalKimberly from "./pages/ProposalKimberly";
const Checklist = lazy(() => import("./pages/Checklist"));
const Journal = lazy(() => import("./pages/Journal"));
const Level = lazy(() => import("./pages/Level"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));

function DashboardPage({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/career-ops" component={MarketingRoute} />
      <Route path="/companies" component={MarketingRoute} />
      <Route path="/dashboard-preview" component={MarketingRoute} />
      <Route path="/proposal/kimberly" component={ProposalKimberly} />
      <Route path="/proposal/template-v1" component={ProposalKimberly} />
      <Route path="/roles/:slug" component={MarketingRoute} />
      <Route path="/industries/:slug" component={MarketingRoute} />
      <Route path="/dashboard">
        <DashboardPage><DashboardHome /></DashboardPage>
      </Route>
      <Route path="/dashboard/jobs">
        <DashboardPage><Jobs /></DashboardPage>
      </Route>
      <Route path="/dashboard/applications">
        <DashboardPage><Applications /></DashboardPage>
      </Route>
      <Route path="/dashboard/saved">
        <DashboardPage><SavedJobs /></DashboardPage>
      </Route>
      <Route path="/dashboard/career-ops">
        <DashboardPage><CareerOps /></DashboardPage>
      </Route>
      <Route path="/dashboard/resume">
        <DashboardPage><ResumeAnalysis /></DashboardPage>
      </Route>
      <Route path="/dashboard/fit">
        <DashboardPage><JobFit /></DashboardPage>
      </Route>
      <Route path="/dashboard/interview">
        <DashboardPage><InterviewPrep /></DashboardPage>
      </Route>
      <Route path="/dashboard/email">
        <DashboardPage><EmailCenter /></DashboardPage>
      </Route>
      <Route path="/dashboard/reports">
        <DashboardPage><Reports /></DashboardPage>
      </Route>
      <Route path="/dashboard/consulting">
        <DashboardPage><Consulting /></DashboardPage>
      </Route>
      <Route path="/dashboard/trends">
        <DashboardPage><Trends /></DashboardPage>
      </Route>
      <Route path="/dashboard/chat">
        <DashboardPage><ChatBot /></DashboardPage>
      </Route>
      <Route path="/dashboard/checklist">
        <DashboardPage><Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}><Checklist /></Suspense></DashboardPage>
      </Route>
      <Route path="/dashboard/journal">
        <DashboardPage><Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}><Journal /></Suspense></DashboardPage>
      </Route>
      <Route path="/dashboard/level">
        <DashboardPage><Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}><Level /></Suspense></DashboardPage>
      </Route>
      <Route path="/dashboard/profile">
        <DashboardPage><Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}><MyProfile /></Suspense></DashboardPage>
      </Route>
      <Route path="/dashboard/admin">
        <DashboardPage><Admin /></DashboardPage>
      </Route>
      <Route path="/disclaimer">
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}><Disclaimer /></Suspense>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Analytics />
          <Toaster />
          <Router />
          <ThemeToggle />
          <FloatingChatButton />
          <DailyGoalNudge />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
