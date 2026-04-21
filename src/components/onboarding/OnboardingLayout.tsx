import { motion } from "framer-motion";
import { ONBOARDING_ORDER, OnboardingStep } from "@/hooks/useOnboarding";

interface Props {
  step: OnboardingStep;
  onSkip?: () => void;
  skipLabel?: string;
  children: React.ReactNode;
}

const OnboardingLayout = ({ step, onSkip, skipLabel = "Skip", children }: Props) => {
  const stepIndex = ONBOARDING_ORDER.indexOf(step);
  const totalDots = ONBOARDING_ORDER.length;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-14 pb-8">
      {/* Top bar: progress dots + skip */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalDots }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex
                  ? "w-6 bg-primary"
                  : i < stepIndex
                  ? "w-1.5 bg-primary/60"
                  : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-sm font-medium text-muted-foreground active:text-foreground"
          >
            {skipLabel}
          </button>
        )}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default OnboardingLayout;
