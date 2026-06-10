import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

interface Props {
  /**
   * Selector for the element whose visibility gates the button. Once it
   * scrolls above the viewport, the button appears.
   */
  watchSelector: string;
}

const BackToTopButton = ({ watchSelector }: Props) => {
  const [show, setShow] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const attach = () => {
      const el = document.querySelector(watchSelector);
      if (!el) return false;
      observerRef.current?.disconnect();
      const io = new IntersectionObserver(
        ([entry]) => {
          // Show when the watched element is entirely above the viewport.
          const aboveViewport =
            !entry.isIntersecting && entry.boundingClientRect.top < 0;
          setShow(aboveViewport);
        },
        { threshold: 0 }
      );
      io.observe(el);
      observerRef.current = io;
      return true;
    };

    if (!attach()) {
      // Element may not be mounted yet (e.g. behind a loading state).
      const t = window.setInterval(() => {
        if (attach()) window.clearInterval(t);
      }, 200);
      return () => {
        window.clearInterval(t);
        observerRef.current?.disconnect();
      };
    }

    return () => observerRef.current?.disconnect();
  }, [watchSelector]);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-20 left-4 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-card/90 backdrop-blur-xl border border-border text-foreground text-xs font-semibold shadow-lg shadow-black/5 active:scale-95 transition-transform"
    >
      <ArrowUp className="w-3.5 h-3.5" />
      Back to top
    </button>
  );
};

export default BackToTopButton;
