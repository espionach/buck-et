import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import Coachmarks, { CoachmarkStep } from "@/components/onboarding/Coachmarks";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding, setOnboardingStep } from "@/hooks/useOnboarding";

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

const Tour = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCoachmarks, setShowCoachmarks] = useState(false);

  const startTour = () => setShowCoachmarks(true);

  const handleSkipAll = async () => {
    if (user) await completeOnboarding(user.id);
    navigate("/", { replace: true });
  };

  const handleFinishTour = async () => {
    if (user) await setOnboardingStep(user.id, "first_quest");
    // Send them straight into the first sidequest creation moment
    navigate("/create?onboarding=1", { replace: true });
  };

  if (showCoachmarks) {
    return (
      <Coachmarks
        steps={STEPS}
        onComplete={handleFinishTour}
        onSkip={handleFinishTour}
      />
    );
  }

  return (
    <OnboardingLayout step="tour" onSkip={handleFinishTour} skipLabel="Skip">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Compass className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Quick tour</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Four taps to learn the layout. We'll point at things — you tap to keep going.
        </p>
      </div>

      <button
        onClick={startTour}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform"
      >
        Start tour
      </button>
      <button
        onClick={handleSkipAll}
        className="w-full py-3 mt-2 text-sm font-medium text-muted-foreground active:text-foreground"
      >
        Skip onboarding
      </button>
    </OnboardingLayout>
  );
};

export default Tour;
