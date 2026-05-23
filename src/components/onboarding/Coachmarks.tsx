import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  /** Called when the user taps Back on the very first step. */
  onBackFromFirst?: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 6;
const TOOLTIP_GAP = 14;
const TOOLTIP_WIDTH = 280;
const OVERLAY_OPACITY = 0.45;

function Coachmarks({ steps, onComplete, onSkip, onBackFromFirst }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  // Skip the slide transition only on the very first appearance of the
  // spotlight (so it doesn't fly in from the top-left corner) and when
  // crossing to a different route (so it doesn't slide across blank space
  // while the new screen mounts). Re-enabled after first paint.
  const [animatePosition, setAnimatePosition] = useState(false);
  const prevRouteRef = useRef<string | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(140);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const step = steps[index];
  const stepFullRoute = step?.route ?? null;
  const currentFullRoute = location.pathname + location.search;
  const onCorrectRoute = !stepFullRoute || currentFullRoute === stepFullRoute;

  // Measure the tooltip after each render so we can place it without
  // covering the spotlighted target.
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      setTooltipHeight(tooltipRef.current.offsetHeight);
    }
  }, [index, rect]);

  // Ensure user is on the right route for this step.
  useEffect(() => {
    if (!step) return;
    if (stepFullRoute && currentFullRoute !== stepFullRoute) {
      navigate(stepFullRoute, { replace: true });
    }
  }, [step, stepFullRoute, currentFullRoute, navigate]);

  // Find target & track its rect (also re-measure on resize / scroll).
  useLayoutEffect(() => {
    if (!step || !onCorrectRoute) return;

    let raf = 0;
    let cancelled = false;
    // Only disable transitions when there's no prior position (first paint)
    // or when the route just changed — in both cases sliding from the old
    // position to the new one would look wrong. Same-route step changes
    // keep transitions on so the spotlight glides between targets.
    const routeChanged = prevRouteRef.current !== location.pathname;
    if (routeChanged || !rect) {
      setAnimatePosition(false);
    }
    prevRouteRef.current = location.pathname;

    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(step.targetSelector) as HTMLElement | null;
      if (!el) {
        raf = requestAnimationFrame(measure);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      // After we've placed it, enable smooth transitions for subsequent
      // resize/scroll updates within the same step.
      requestAnimationFrame(() => {
        if (!cancelled) setAnimatePosition(true);
      });
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

  const handleBack = () => {
    if (index === 0) {
      onBackFromFirst?.();
    } else {
      setIndex((i) => i - 1);
    }
  };

  // Compute tooltip position
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 400;

  let tooltipTop = 0;
  let tooltipLeft = 0;
  if (rect) {
    // Auto-pick placement based on which side has more room, so the tooltip
    // never covers the target. Honors explicit `placement` only if it fits.
    const spaceAbove = rect.top - TOOLTIP_GAP - 16;
    const spaceBelow = viewportH - (rect.top + rect.height) - TOOLTIP_GAP - 16;
    const preferred = step.placement;
    let placement: "top" | "bottom" =
      preferred === "top" && spaceAbove >= tooltipHeight
        ? "top"
        : preferred === "bottom" && spaceBelow >= tooltipHeight
        ? "bottom"
        : spaceAbove >= tooltipHeight
        ? "top"
        : "bottom";

    if (placement === "top") {
      tooltipTop = rect.top - TOOLTIP_GAP - tooltipHeight;
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
    // Clamp vertically inside viewport
    tooltipTop = Math.max(16, Math.min(viewportH - tooltipHeight - 16, tooltipTop));
  }

  const overlay = (
    <div className="fixed inset-0 z-[100]">
      {/* Dim layer with a transparent spotlight cutout via box-shadow */}
      {rect ? (
        <div
          aria-hidden
          onClick={handleNext}
          className="absolute rounded-2xl"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: `0 0 0 9999px hsl(var(--foreground) / ${OVERLAY_OPACITY})`,
            transition: animatePosition
              ? "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease, opacity 0.25s ease"
              : "opacity 0.25s ease",
            animation: animatePosition ? undefined : "fade-in 0.25s ease-out",
            // Let clicks pass through to the spotlighted element
            pointerEvents: "none",
          }}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: `hsl(var(--foreground) / ${OVERLAY_OPACITY})` }}
        />
      )}

      {/* Tooltip card */}
      {rect && (
        <div
          ref={tooltipRef}
          className="absolute bg-card rounded-2xl shadow-xl border border-border p-4"
          style={{
            top: tooltipTop,
            left: tooltipLeft,
            width: TOOLTIP_WIDTH,
            transition: animatePosition
              ? "top 0.25s ease, left 0.25s ease, opacity 0.25s ease"
              : "opacity 0.25s ease",
            animation: animatePosition ? undefined : "fade-in 0.25s ease-out",
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
          <div className="flex gap-2">
            {(index > 0 || onBackFromFirst) && (
              <button
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              {index >= steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}

export default Coachmarks;
