import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

export interface CoachmarkStep {
  targetSelector: string;
  title: string;
  body: string;
  /** Where to place the tooltip relative to the target. */
  placement?: "top" | "bottom";
  /** Optional route to ensure the user is on before showing this step. */
  route?: string;
}

interface Props {
  steps: CoachmarkStep[];
  onComplete: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_GAP = 16;
const TOOLTIP_WIDTH = 280;

function Coachmarks({ steps, onComplete, onSkip }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const step = steps[index];
  const onCorrectRoute = !step?.route || location.pathname === step.route;

  // Reset rect whenever the step changes so we don't flash old position.
  useEffect(() => {
    setRect(null);
  }, [index]);

  // Ensure user is on the right route for this step.
  useEffect(() => {
    if (!step) return;
    if (step.route && location.pathname !== step.route) {
      navigate(step.route, { replace: true });
    }
  }, [step, location.pathname, navigate]);

  // Find target & track its rect (also re-measure on resize / scroll).
  useLayoutEffect(() => {
    if (!step || !onCorrectRoute) return;

    let raf = 0;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(step.targetSelector) as HTMLElement | null;
      if (!el) {
        raf = requestAnimationFrame(measure);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, onCorrectRoute, index]);

  if (!step) return null;

  const handleNext = () => {
    if (index >= steps.length - 1) {
      onComplete();
    } else {
      setIndex((i) => i + 1);
    }
  };

  const handleSkip = () => onSkip();

  // Compute tooltip position
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 400;

  let tooltipTop = 0;
  let tooltipLeft = 0;
  if (rect) {
    const placement =
      step.placement === "bottom"
        ? "bottom"
        : step.placement === "top"
        ? "top"
        : rect.top > viewportH / 2
        ? "top"
        : "bottom";

    if (placement === "top") {
      tooltipTop = rect.top - TOOLTIP_GAP - 140; // estimated tooltip height
    } else {
      tooltipTop = rect.top + rect.height + TOOLTIP_GAP;
    }
    tooltipLeft = Math.max(
      16,
      Math.min(
        viewportW - TOOLTIP_WIDTH - 16,
        rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
      )
    );
    // Clamp vertically
    tooltipTop = Math.max(16, Math.min(viewportH - 160, tooltipTop));
  }

  const overlay = (
    <div className="fixed inset-0 z-[100]">
      {/* Dim layer with a transparent spotlight cutout via box-shadow */}
      {rect ? (
        <div
          aria-hidden
          onClick={handleNext}
          className="absolute rounded-2xl cursor-pointer"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.65)",
            transition: "all 0.25s ease",
          }}
        />
      ) : (
        <div
          aria-hidden
          onClick={handleNext}
          className="absolute inset-0 cursor-pointer"
          style={{ background: "hsl(var(--foreground) / 0.65)" }}
        />
      )}

      {/* Tooltip card */}
      {rect && (
        <div
          className="absolute bg-card rounded-2xl shadow-xl border border-border p-4"
          style={{
            top: tooltipTop,
            left: tooltipLeft,
            width: TOOLTIP_WIDTH,
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {index + 1} of {steps.length}
            </div>
            <button
              onClick={handleSkip}
              className="text-xs font-medium text-muted-foreground active:text-foreground"
            >
              Skip tour
            </button>
          </div>
          <div className="text-base font-bold text-foreground mb-1">{step.title}</div>
          <div className="text-sm text-muted-foreground mb-4">{step.body}</div>
          <button
            onClick={handleNext}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            {index >= steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}

export default Coachmarks;
