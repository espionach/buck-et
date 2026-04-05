import { useEffect } from "react";
import { useAppStore } from "@/data/appState";

/**
 * Call usePopup(isOpen) in any component that shows a modal/popup.
 * It will hide the global FAB and lock body scroll while open.
 */
export const usePopup = (isOpen: boolean) => {
  const pushPopup = useAppStore((s) => s.pushPopup);
  const popPopup = useAppStore((s) => s.popPopup);

  useEffect(() => {
    if (isOpen) {
      pushPopup();
      document.body.style.overflow = "hidden";
      return () => {
        popPopup();
        // Only restore if no other popups remain
        const count = useAppStore.getState().popupCount;
        if (count <= 0) {
          document.body.style.overflow = "";
        }
      };
    }
  }, [isOpen]);
};
