import { useState } from "react";
import { Bell } from "lucide-react";
import { useAppStore } from "@/data/appState";
import NotificationPanel from "@/components/NotificationPanel";

interface NotificationBellProps {
  className?: string;
}

const NotificationBell = ({ className }: NotificationBellProps) => {
  const { notifications, friendRequests } = useAppStore();
  const [open, setOpen] = useState(false);

  const unreadCount =
    notifications.filter((n) => !n.read).length + friendRequests.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Notifications"
        className={
          className ??
          "relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        }
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default NotificationBell;
