import { Bell, Image as ImageIcon } from "lucide-react";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding, setOnboardingStep } from "@/hooks/useOnboarding";
import { useNavigate } from "react-router-dom";

const PermissionRow = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border">
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
    </div>
  </div>
);

const Permissions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContinue = async () => {
    if (user) await setOnboardingStep(user.id, "friends");
    navigate("/onboarding/friends");
  };

  const handleSkipAll = async () => {
    if (user) await completeOnboarding(user.id);
    navigate("/", { replace: true });
  };

  return (
    <OnboardingLayout step="permissions" onSkip={handleSkipAll} skipLabel="Skip all">
      <div className="flex-1 flex flex-col">
        <h1 className="text-2xl font-bold text-foreground mb-2">Quick permissions</h1>
        <p className="text-sm text-muted-foreground mb-6">
          We'll ask for these when you need them. No surprises.
        </p>

        <div className="space-y-3">
          <PermissionRow
            icon={Bell}
            title="Notifications"
            description="Get pinged when friends invite you to sidequests or join yours."
          />
          <PermissionRow
            icon={ImageIcon}
            title="Photos"
            description="Add photos to your sidequests and update your profile picture."
          />
        </div>

        <p className="text-[11px] text-muted-foreground/70 mt-4 leading-relaxed">
          The actual system prompts will appear the first time you use each feature.
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

export default Permissions;
