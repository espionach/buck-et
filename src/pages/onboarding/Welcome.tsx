import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding, setOnboardingStep } from "@/hooks/useOnboarding";

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContinue = async () => {
    if (user) await setOnboardingStep(user.id, "permissions");
    navigate("/onboarding/permissions");
  };

  const handleSkipAll = async () => {
    if (user) await completeOnboarding(user.id);
    navigate("/", { replace: true });
  };

  return (
    <OnboardingLayout step="welcome" onSkip={handleSkipAll} skipLabel="Skip all">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Let's set you up</h1>
        <p className="text-base text-muted-foreground max-w-xs">
          A couple of quick steps and you'll be ready to launch your first sidequest.
        </p>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform"
      >
        Continue
      </button>
    </OnboardingLayout>
  );
};

export default Welcome;
