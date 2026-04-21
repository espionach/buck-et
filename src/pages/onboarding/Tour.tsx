import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding, setOnboardingStep } from "@/hooks/useOnboarding";
import { useAppStore } from "@/data/appState";

const Tour = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const startTour = useAppStore((s) => s.startTour);

  const handleStartTour = async () => {
    if (user) await setOnboardingStep(user.id, "tour");
    // Navigate to Home FIRST so the BottomNav is mounted and the spotlight
    // targets exist. Then activate the tour on the next frame.
    navigate("/", { replace: true });
    requestAnimationFrame(() => startTour());
  };

  const handleSkipAll = async () => {
    if (user) await completeOnboarding(user.id);
    navigate("/", { replace: true });
  };

  return (
    <OnboardingLayout step="tour" onSkip={handleSkipAll} skipLabel="Skip all">
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
        onClick={handleStartTour}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform"
      >
        Start tour
      </button>
    </OnboardingLayout>
  );
};

export default Tour;
