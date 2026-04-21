import { useNavigate } from "react-router-dom";
import Coachmarks, { CoachmarkStep } from "./Coachmarks";
import { useAppStore } from "@/data/appState";
import { useAuth } from "@/contexts/AuthContext";
import { setOnboardingStep } from "@/hooks/useOnboarding";

const STEPS: CoachmarkStep[] = [
  {
    targetSelector: '[data-tour="nav-home"]',
    title: "Home",
    body: "Your feed of sidequests from friends and shared groups. The best place to spot what to join next.",
    placement: "top",
    route: "/",
  },
  {
    targetSelector: '[data-tour="nav-groups"]',
    title: "Groups",
    body: "Crews you do things with. Tap the + on this screen to start a new group.",
    placement: "top",
    route: "/groups",
  },
  {
    targetSelector: '[data-tour="nav-profile"]',
    title: "Profile",
    body: "Your upcoming sidequests up top, completed ones below. Tap your avatar to edit.",
    placement: "top",
    route: "/profile",
  },
  {
    targetSelector: '[data-tour="fab"]',
    title: "Create anything",
    body: "This + button is always here. Use it to launch a new sidequest from anywhere.",
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