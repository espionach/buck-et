import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/components/DataProvider";
import Home from "./pages/Feed";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Settings from "./pages/Settings";

import BlockedUsers from "./pages/BlockedUsers";
import FindFriends from "./pages/FindFriends";
import AdminReports from "./pages/AdminReports";
import AdminDashboard from "./pages/AdminDashboard";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import LegalUpdates from "./pages/LegalUpdates";
import CreateQuest from "./pages/CreateQuest";
import CreateGroup from "./pages/CreateGroup";
import GroupMembers from "./pages/GroupMembers";
import GroupSettings from "./pages/GroupSettings";
import QuestDetail from "./pages/QuestDetail";
import EditQuest from "./pages/EditQuest";
import Drafts from "./pages/Drafts";
import NotFound from "./pages/NotFound";
import NavAudit from "./pages/NavAudit";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BottomNav from "./components/BottomNav";
import LegalUpdateBanner from "./components/LegalUpdateBanner";
import ScrollToTop from "./components/ScrollToTop";
import Welcome from "./pages/onboarding/Welcome";
import OnboardingExamples from "./pages/onboarding/Examples";
import OnboardingPermissions from "./pages/onboarding/Permissions";
import OnboardingFriends from "./pages/onboarding/Friends";
import { useOnboardingStatus, ONBOARDING_PATHS } from "@/hooks/useOnboarding";
import SpotlightHost from "./components/onboarding/SpotlightHost";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { onboarded, step, loading: onboardingLoading } = useOnboardingStatus();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (onboardingLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  // If user hasn't finished onboarding, redirect them into the flow
  // (but allow them to be on any /onboarding/* route or /create when resuming first_quest)
  const onOnboardingRoute = location.pathname.startsWith("/onboarding/");
  const onFirstQuestRoute = location.pathname === "/create";
  if (!onboarded && !onOnboardingRoute && !onFirstQuestRoute) {
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
  const hideNav = ["/create", "/create-group", "/drafts", "/login", "/signup", "/forgot-password", "/reset-password", "/settings", "/settings/blocked", "/settings/community-guidelines", "/settings/privacy-policy", "/settings/terms", "/settings/legal-updates", "/admin", "/admin/reports"].includes(location.pathname) || location.pathname.startsWith("/onboarding/") || location.pathname.startsWith("/groups/") || location.pathname.endsWith("/edit");

  return (
    <div className="max-w-md mx-auto min-h-screen relative">
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
        <Route path="/onboarding/examples" element={<ProtectedRoute><OnboardingExamples /></ProtectedRoute>} />
        <Route path="/onboarding/permissions" element={<ProtectedRoute><OnboardingPermissions /></ProtectedRoute>} />
        <Route path="/onboarding/friends" element={<ProtectedRoute><OnboardingFriends /></ProtectedRoute>} />
        <Route path="/onboarding/community-guidelines" element={<ProtectedRoute><CommunityGuidelines /></ProtectedRoute>} />
        <Route path="/onboarding/tour" element={<Navigate to="/create?onboarding=1" replace />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        {/* Legacy group routes redirect to the new Groups tab on Profile */}
        <Route path="/groups" element={<Navigate to="/profile?tab=groups" replace />} />
        <Route path="/boards" element={<Navigate to="/profile?tab=groups" replace />} />
        <Route path="/g/:groupId/invite" element={<Navigate to="/profile?tab=groups" replace />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/u/:username" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/blocked" element={<ProtectedRoute><BlockedUsers /></ProtectedRoute>} />
        <Route path="/find-friends" element={<ProtectedRoute><FindFriends /></ProtectedRoute>} />
        <Route path="/settings/community-guidelines" element={<ProtectedRoute><CommunityGuidelines /></ProtectedRoute>} />
        <Route path="/settings/privacy-policy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />
        <Route path="/settings/terms" element={<ProtectedRoute><TermsAndConditions /></ProtectedRoute>} />
        <Route path="/settings/legal-updates" element={<ProtectedRoute><LegalUpdates /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateQuest /></ProtectedRoute>} />
        <Route path="/drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />
        <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/groups/:groupId" element={<ProtectedRoute><GroupMembers /></ProtectedRoute>} />
        <Route path="/groups/:groupId/settings" element={<ProtectedRoute><GroupSettings /></ProtectedRoute>} />
        <Route path="/quest/:questId" element={<ProtectedRoute><QuestDetail /></ProtectedRoute>} />
        <Route path="/quest/:questId/edit" element={<ProtectedRoute><EditQuest /></ProtectedRoute>} />
        <Route path="/nav-audit" element={<ProtectedRoute><NavAudit /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideNav && <BottomNav />}
      {!hideNav && <LegalUpdateBanner />}
      <SpotlightHost />
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
