import { useNavigate } from "react-router-dom";
import { Coffee, Waves, PartyPopper, BookOpen, Mic, Star, Laugh, Palette, Wine, KeyRound, Utensils, Sunrise, Plane, Ticket } from "lucide-react";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding, setOnboardingStep } from "@/hooks/useOnboarding";

const ExampleCard = ({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) => (
  <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border">
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <div className="text-base font-semibold text-foreground">{title}</div>
  </div>
);

const Examples = () => {
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

  const handleBack = async () => {
    if (user) await setOnboardingStep(user.id, "welcome");
    navigate("/onboarding/welcome", { replace: true });
  };

  return (
    <OnboardingLayout step="examples" onSkip={handleSkipAll} skipLabel="Skip all" onBack={handleBack}>
      <div className="flex-1 flex flex-col min-h-0">
        <h1 className="text-2xl font-bold text-foreground mb-2">What's a sidequest?</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Anything you'd want to do with friends — big or small.
        </p>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6 pb-2">
          <div className="space-y-3">
            <ExampleCard icon={Coffee} title="Cafe hopping" />
            <ExampleCard icon={Waves} title="Going to the beach" />
            <ExampleCard icon={PartyPopper} title="Crashing a party" />
            <ExampleCard icon={BookOpen} title="Bookstore date" />
            <ExampleCard icon={Mic} title="Karaoke night" />
            <ExampleCard icon={Star} title="Stargazing" />
            <ExampleCard icon={Laugh} title="Comedy show" />
            <ExampleCard icon={Palette} title="Pottery class" />
            <ExampleCard icon={Wine} title="Paint and sip" />
            <ExampleCard icon={KeyRound} title="Escape room" />
            <ExampleCard icon={Utensils} title="2 AM food run" />
            <ExampleCard icon={Sunrise} title="Watch the sunrise" />
            <ExampleCard icon={Plane} title="Last minute flight" />
            <ExampleCard icon={Ticket} title="Last minute concert tickets" />
          </div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full mt-4 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform"
      >
        Continue
      </button>
    </OnboardingLayout>
  );
};

export default Examples;
