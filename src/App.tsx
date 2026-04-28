import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/components/DataProvider";
import Boards from "./pages/Home";
import Home from "./pages/Feed";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import BlockedUsers from "./pages/BlockedUsers";
import AdminReports from "./pages/AdminReports";
import AdminDashboard from "./pages/AdminDashboard";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import CreateQuest from "./pages/CreateQuest";
import CreateGroup from "./pages/CreateGroup";
import QuestDetail from "./pages/QuestDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BottomNav from "./components/BottomNav";
import Welcome from "./pages/onboarding/Welcome";
import OnboardingPermissions from "./pages/onboarding/Permissions";
import OnboardingFriends from "./pages/onboarding/Friends";
import OnboardingTour from "./pages/onboarding/Tour";
import { useOnboardingStatus, ONBOARDING_PATHS } from "@/hooks/useOnboarding";
import GlobalTour from "./components/onboarding/GlobalTour";
import { useAppStore } from "@/data/appState";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { onboarded, step, loading: onboardingLoading } = useOnboardingStatus();
  const location = useLocation();
  const tourActive = useAppStore((s) => s.tourActive);
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (onboardingLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  // If user hasn't finished onboarding, redirect them into the flow
  // (but allow them to be on any /onboarding/* route or /create when resuming first_quest)
  const onOnboardingRoute = location.pathname.startsWith("/onboarding/");
  const onFirstQuestRoute = location.pathname === "/create";
  // While the tour is running, allow navigation to any in-app route — Coachmarks
  // hops between Home/Groups/Profile and would otherwise fight the gate.
  if (!onboarded && !onOnboardingRoute && !onFirstQuestRoute && !tourActive) {
    const target = step ? ONBOARDING_PATHS[step] : "/onboarding/welcome";
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppLayout = () => {
  const location = useLocation();
  const hideNav = ["/create", "/create-group", "/login", "/signup", "/forgot-password", "/reset-password", "/settings", "/settings/blocked", "/settings/community-guidelines", "/admin", "/admin/reports"].includes(location.pathname) || location.pathname.startsWith("/quest/") || location.pathname.startsWith("/onboarding/");

  return (
    <div className="max-w-md mx-auto min-h-screen relative">
      <Routes>
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
        <Route path="/onboarding/permissions" element={<ProtectedRoute><OnboardingPermissions /></ProtectedRoute>} />
        <Route path="/onboarding/friends" element={<ProtectedRoute><OnboardingFriends /></ProtectedRoute>} />
        <Route path="/onboarding/tour" element={<ProtectedRoute><OnboardingTour /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/boards" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/blocked" element={<ProtectedRoute><BlockedUsers /></ProtectedRoute>} />
        <Route path="/settings/community-guidelines" element={<ProtectedRoute><CommunityGuidelines /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateQuest /></ProtectedRoute>} />
        <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/quest/:questId" element={<ProtectedRoute><QuestDetail /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideNav && <BottomNav />}
      <GlobalTour />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <AppLayout />
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
