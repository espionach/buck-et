import { useNavigate } from "react-router-dom";
import Coachmarks, { CoachmarkStep } from "./Coachmarks";
import { useAppStore } from "@/data/appState";
import { useAuth } from "@/contexts/AuthContext";
import { setOnboardingStep } from "@/hooks/useOnboarding";

const STEPS: CoachmarkStep[] = [
  {
    targetSelector: '[data-tour="nav-home"]',
    title: "Home",
    body: "Your feed of sidequests from friends and groups. See what's going on and find something to join.",
    placement: "top",
    route: "/",
  },
  {
    targetSelector: '[data-tour="nav-groups"]',
    title: "Groups",
    body: "Your friend groups. Where plans happen. Tap + to start one.",
    placement: "top",
    route: "/groups",
  },
  {
    targetSelector: '[data-tour="nav-profile"]',
    title: "Profile",
    body: "Your sidequests in one place. What's coming up and what you've finished.",
    placement: "top",
    route: "/profile",
  },
  {
    targetSelector: '[data-tour="fab"]',
    title: "Create anything",
    body: "The + is always here. Start a sidequest whenever you want.",
    placement: "top",
    route: "/",
  },
];

/**
 * Globally rendered tour overlay. Lives inside <AppLayout/> so it survives
 * route changes that the Coachmarks component triggers between steps.
 */
const GlobalTour = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tourActive = useAppStore((s) => s.tourActive);
  const endTour = useAppStore((s) => s.endTour);

  if (!tourActive) return null;

  const finish = () => {
    // End tour FIRST so Coachmarks unmounts and its route-sync effect
    // can't yank us back to the last step's route (stripping ?onboarding=1).
    endTour();
    // Navigate to the "Last step" sidequest screen — same destination as
    // the Tour page's Skip button.
    navigate("/create?onboarding=1", { replace: true });
    // Persist progress in the background; the gate already allows /create
    // because tourActive was true when we navigated and CreateQuest is an
    // allowed onboarding route.
    if (user) void setOnboardingStep(user.id, "first_quest");
  };

  const backToTourIntro = () => {
    // Bail out of the tour overlay and return to the Tour intro screen.
    endTour();
    navigate("/onboarding/tour", { replace: true });
  };

  return (
    <Coachmarks
      steps={STEPS}
      onComplete={finish}
      onSkip={finish}
      onBackFromFirst={backToTourIntro}
    />
  );
};

export default GlobalTour;