import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding, setOnboardingStep } from "@/hooks/useOnboarding";

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContinue = async () => {
    if (user) await setOnboardingStep(user.id, "examples");
    navigate("/onboarding/examples");
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
        <h1 className="text-3xl font-bold text-foreground mb-3">Welcome to Buck-et</h1>
        <p className="text-base text-muted-foreground max-w-xs">
          The social app for spontaneous sidequesting with friends. Turn "we should do that someday" into actually getting you out of the house. Let's get you set up.
        </p>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform"
      >
        Continue
      </button>
      <p className="text-center text-xs text-muted-foreground mt-3">
        By continuing, you agree to follow our{" "}
        <button
          type="button"
          onClick={() => navigate("/settings/community-guidelines")}
          className="text-primary font-semibold underline-offset-2 hover:underline"
        >
          Community Guidelines
        </button>
        .
      </p>
    </OnboardingLayout>
  );
};

export default Welcome;
