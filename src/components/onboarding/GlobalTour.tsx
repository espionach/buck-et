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
    targetSelector: '[data-tour="nav-calendar"]',
    title: "Calendar",
    body: "Your upcoming sidequests on a calendar.",
    placement: "top",
    route: "/calendar",
  },
  {
    targetSelector: '[data-tour="profile-tab-current"]',
    title: "Active",
    body: "Your active sidequests live here. Tap one and hit 'Finish sidequest' when you're done — it'll move to Completed.",
    placement: "bottom",
    route: "/profile?tab=current",
  },
  {
    targetSelector: '[data-tour="profile-tab-past"]',
    title: "Completed",
    body: "Everything you've wrapped up. A running list of the sidequests you've actually done.",
    placement: "bottom",
    route: "/profile?tab=past",
  },
  {
    targetSelector: '[data-tour="profile-tab-groups"]',
    title: "Groups",
    body: "Friend groups you're part of. Plan sidequests with just the right people.",
    placement: "bottom",
    route: "/profile?tab=groups",
  },
  {
    targetSelector: '[data-tour="fab"]',
    title: "Create a sidequest",
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