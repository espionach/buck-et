import { useRef, useCallback } from "react";

interface Options {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // px
  /**
   * If the touch starts inside an element matching this selector, the swipe
   * is ignored. Use this to avoid conflicting with horizontal swipes that
   * children handle themselves (e.g. swipe-to-complete on quest cards).
   */
  ignoreSelector?: string;
}

/**
 * Lightweight horizontal swipe detection for switching tabs.
 * Returns props to spread on the swipeable container.
 */
export function useSwipeNav({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  ignoreSelector,
}: Options) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const ignored = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
      ignored.current = false;
      if (ignoreSelector) {
        const target = e.target as HTMLElement | null;
        if (target && target.closest(ignoreSelector)) ignored.current = true;
      }
    },
    [ignoreSelector],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (ignored.current || startX.current === null || startY.current === null) {
        startX.current = null;
        startY.current = null;
        return;
      }
      const t = e.changedTouches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      startX.current = null;
      startY.current = null;
      // Must be mostly horizontal and exceed threshold
      if (Math.abs(dx) < threshold) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    },
    [onSwipeLeft, onSwipeRight, threshold],
  );

  return { onTouchStart, onTouchEnd };
}
