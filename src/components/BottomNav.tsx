import { Home, Compass, Plus, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/feed", icon: Compass, label: "Feed" },
  { path: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {tabs.map((tab, i) => {
          const isActive = location.pathname === tab.path;
          // Insert the "+" button in the middle
          const items = [];
          if (i === 1) {
            items.push(
              <button
                key="create"
                onClick={() => navigate("/create")}
                className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 active:scale-95 transition-transform"
              >
                <Plus className="w-7 h-7 text-primary-foreground" />
              </button>
            );
          }
          items.push(
            <button
              key={tab.path}
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
          return items;
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
