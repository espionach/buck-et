import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Scrolls the window to the top whenever the user navigates to a new route via
 * PUSH or REPLACE. On POP (browser back/forward) we leave the scroll position
 * alone so the browser can restore it naturally — this matches user expectations
 * that pressing "Back" returns you to where you were on the previous page.
 *
 * Uses useLayoutEffect so the scroll reset happens before paint and the new
 * page never flashes mid-scroll.
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP") return;
    window.scrollTo(0, 0);
  }, [pathname, search, navigationType]);

  return null;
};

export default ScrollToTop;
