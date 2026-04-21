import { Home, LayoutGrid, User, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppStore } from "@/data/appState";

const tabs = [
  { path: "/", icon: Home, label: "Home", tourId: "nav-home" },
  { path: "/groups", icon: LayoutGrid, label: "Groups", tourId: "nav-groups" },
  { path: "/profile", icon: User, label: "Profile", tourId: "nav-profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hideGlobalFab = useAppStore((s) => s.hideGlobalFab || s.popupCount > 0);

  return (
    <>
      {/* Floating Action Button — hidden during editing modes */}
      {!hideGlobalFab && (
        <div className="fixed bottom-20 z-50 w-full max-w-md left-1/2 -translate-x-1/2 px-5 pointer-events-none">
          <div className="flex justify-end">
            <button
              data-tour="fab"
              onClick={() => navigate("/create")}
              className="pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              <Plus className="w-7 h-7 text-primary-foreground" />
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === "/groups" && location.pathname === "/boards");
            return (
              <button
                key={tab.path}
                data-tour={tab.tourId}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-0.5 px-4 py-1 relative"
              >
                <tab.icon
                  className={`w-6 h-6 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 w-6 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
