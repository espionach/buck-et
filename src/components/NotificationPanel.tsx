import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, MessageCircle, UserPlus, ArrowRightLeft, Check, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "@/hooks/use-popup";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const NotificationPanel = ({ open, onClose }: NotificationPanelProps) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, friendRequests, acceptFriendRequest, declineFriendRequest, groupInvitations, acceptGroupInvitation, declineGroupInvitation, clearNotification } = useAppStore();
  const navigate = useNavigate();
  usePopup(open);

  const getIcon = (type: string) => {
    switch (type) {
      case "transfer_quest":
      case "transfer_group":
      case "transfer_declined":
        return <ArrowRightLeft className="w-4 h-4 text-primary" />;
      case "new_comment":
        return <MessageCircle className="w-4 h-4 text-secondary" />;
      case "new_participant":
        return <UserPlus className="w-4 h-4 text-secondary" />;
      case "board_invitation":
        return <Users className="w-4 h-4 text-primary" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markNotificationRead(notification.id);

    if (notification.type === "new_comment" && notification.groupId) {
      const params = new URLSearchParams({ open: notification.groupId, highlightQuest: notification.entityId || "" });
      if (notification.commentId) params.set("commentId", notification.commentId);
      navigate(`/boards?${params.toString()}`);
    } else if (notification.type === "transfer_quest" && notification.groupId) {
      navigate(`/boards?open=${notification.groupId}`);
    } else if (notification.type === "transfer_group") {
      navigate("/boards");
    } else if (notification.type === "new_participant" && notification.groupId) {
      navigate(`/boards?open=${notification.groupId}`);
    } else {
      navigate("/profile?tab=current");
    }

    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-foreground/40 flex items-start justify-center pt-16 px-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-card rounded-xl shadow-xl border border-border overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="font-bold text-foreground text-lg">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[10px] font-semibold text-primary"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={onClose}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="border-b border-border/50">
                  {friendRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-4 border-b border-border/30 last:border-b-0 bg-primary/5"
                    >
                      <div className="shrink-0">
                        <UserAvatar user={req.from} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed">
                          <span className="font-semibold">{req.from.name}</span> sent you a friend request
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => acceptFriendRequest(req.id)}
                          className="p-1.5 rounded-lg bg-secondary text-secondary-foreground"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => declineFriendRequest(req.id)}
                          className="p-1.5 rounded-lg bg-muted text-muted-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Regular Notifications */}
              {notifications.length === 0 && friendRequests.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  // Board invitation with pending invite - show accept/decline
                  const pendingInvite = n.type === "board_invitation" && n.entityId
                    ? groupInvitations.find((gi) => gi.id === n.entityId)
                    : null;

                  if (pendingInvite) {
                    return (
                      <div
                        key={n.id}
                        className={`flex items-center gap-3 p-4 border-b border-border/30 ${
                          n.read ? "opacity-60" : "bg-primary/5"
                        }`}
                      >
                        <div className="shrink-0">
                          <UserAvatar user={n.fromUser} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{n.createdAt}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              acceptGroupInvitation(pendingInvite.id);
                              clearNotification(n.id);
                              onClose();
                              navigate("/boards");
                            }}
                            className="p-1.5 rounded-lg bg-secondary text-secondary-foreground"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              declineGroupInvitation(pendingInvite.id);
                              clearNotification(n.id);
                            }}
                            className="p-1.5 rounded-lg bg-muted text-muted-foreground"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left flex items-start gap-3 p-4 border-b border-border/30 transition-colors active:scale-[0.99] ${
                        n.read ? "opacity-60" : "bg-primary/5"
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        <UserAvatar user={n.fromUser} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.createdAt}</p>
                      </div>
                      <div className="shrink-0 mt-1">{getIcon(n.type)}</div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;