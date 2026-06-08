import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  SPOTLIGHTS,
  SpotlightDef,
  dismissSpotlight,
  getDismissed,
  isSkippedAll,
  skipAllSpotlights,
} from "@/data/spotlights";

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

/**
 * Per-page contextual spotlight. Renders at most one spotlight at a time,
 * picked from the registry based on the current route. Dismissals persist
 * per user in localStorage. Tap-to-dismiss or "Skip all tips".
 */
const SpotlightHost = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [tick, forceRerender] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(140);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to spotlight state changes (e.g., "Skip all" or "Replay tips").
  useEffect(() => {
    const h = () => forceRerender((n) => n + 1);
    window.addEventListener("spotlight-state-changed", h);
    return () => window.removeEventListener("spotlight-state-changed", h);
  }, []);

  // Pick the first eligible spotlight for this route.
  const current: SpotlightDef | null = useMemo(() => {
    if (!user) return null;
    if (isSkippedAll(user.id)) return null;
    const dismissed = getDismissed(user.id);
    const loc = { pathname: location.pathname, search: location.search };
    return SPOTLIGHTS.find((s) => s.match(loc) && !dismissed.has(s.id)) ?? null;
    // include rerender tick by depending on user id + location only
  }, [user, location.pathname, location.search]);

  // Reset rect when spotlight changes / disappears
  useEffect(() => {
    setRect(null);
  }, [current?.id]);

  // Measure tooltip
  useLayoutEffect(() => {
    if (tooltipRef.current) setTooltipHeight(tooltipRef.current.offsetHeight);
  }, [current?.id, rect]);

  // Poll for the target element until found, then keep it in sync.
  useLayoutEffect(() => {
    if (!current) return;
    let raf = 0;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(current.targetSelector) as HTMLElement | null;
      if (!el) {
        raf = requestAnimationFrame(measure);
        return;
      }
      const r = el.getBoundingClientRect();
      // Skip targets that aren't actually visible (e.g., not yet laid out).
      if (r.width === 0 && r.height === 0) {
        raf = requestAnimationFrame(measure);
        return;
      }
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
  }, [current]);

  if (!current || !user) return null;

  const handleDismiss = () => {
    dismissSpotlight(user.id, current.id);
  };

  const handleSkipAll = () => {
    skipAllSpotlights(user.id);
  };

  // Compute tooltip position
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 400;

  let tooltipTop = 0;
  let tooltipLeft = 0;
  if (rect) {
    const spaceAbove = rect.top - TOOLTIP_GAP - 16;
    const spaceBelow = viewportH - (rect.top + rect.height) - TOOLTIP_GAP - 16;
    const preferred = current.placement;
    const placement: "top" | "bottom" =
      preferred === "top" && spaceAbove >= tooltipHeight
        ? "top"
        : preferred === "bottom" && spaceBelow >= tooltipHeight
        ? "bottom"
        : spaceAbove >= tooltipHeight
        ? "top"
        : "bottom";

    tooltipTop =
      placement === "top"
        ? rect.top - TOOLTIP_GAP - tooltipHeight
        : rect.top + rect.height + TOOLTIP_GAP;
    tooltipLeft = Math.max(
      16,
      Math.min(
        viewportW - TOOLTIP_WIDTH - 16,
        rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2,
      ),
    );
    tooltipTop = Math.max(16, Math.min(viewportH - tooltipHeight - 16, tooltipTop));
  }

  const overlay = (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {rect ? (
        <div
          aria-hidden
          onClick={handleDismiss}
          className="absolute rounded-2xl"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: `0 0 0 9999px hsl(var(--foreground) / ${OVERLAY_OPACITY})`,
            transition: "opacity 0.25s ease",
            animation: "fade-in 0.25s ease-out",
            pointerEvents: "auto",
          }}
        />
      ) : null}

      {rect && (
        <div
          ref={tooltipRef}
          className="absolute bg-card rounded-2xl shadow-xl border border-border p-4 pointer-events-auto"
          style={{
            top: tooltipTop,
            left: tooltipLeft,
            width: TOOLTIP_WIDTH,
            animation: "fade-in 0.25s ease-out",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Tip
            </div>
            <button
              onClick={handleSkipAll}
              className="text-xs font-medium text-muted-foreground active:text-foreground"
            >
              Skip all tips
            </button>
          </div>
          <div className="text-base font-bold text-foreground mb-1">{current.title}</div>
          <div className="text-sm text-muted-foreground mb-4">{current.body}</div>
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Got it
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
};

export default SpotlightHost;
