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

  const finish = async () => {
    // Mark step first so the gate sees a consistent state, then navigate,
    // and only end the tour after we've safely landed on /create.
    if (user) await setOnboardingStep(user.id, "first_quest");
    navigate("/create?onboarding=1", { replace: true });
    // Defer endTour until after the navigation has flushed so the
    // protected-route gate doesn't briefly redirect us mid-transition.
    requestAnimationFrame(() => endTour());
  };

  return <Coachmarks steps={STEPS} onComplete={finish} onSkip={finish} />;
};

export default GlobalTour;