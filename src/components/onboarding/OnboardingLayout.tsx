import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { ONBOARDING_ORDER, OnboardingStep } from "@/hooks/useOnboarding";

interface Props {
  step: OnboardingStep;
  onSkip?: () => void;
  skipLabel?: string;
  onBack?: () => void;
  children: React.ReactNode;
}

const OnboardingLayout = ({ step, onSkip, skipLabel = "Skip", onBack, children }: Props) => {
  const stepIndex = ONBOARDING_ORDER.indexOf(step);
  const totalDots = ONBOARDING_ORDER.length;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-14 pb-8">
      {/* Top bar: back + progress dots + skip */}
      <div className="flex items-center justify-between mb-10 gap-3">
        <button
          onClick={onBack}
          disabled={!onBack}
          aria-label="Back"
          className="p-2 -ml-2 flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
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
