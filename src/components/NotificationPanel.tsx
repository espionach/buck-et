import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, MessageCircle, UserPlus, ArrowRightLeft, Check, Users, Camera, HandMetal, UserMinus, CalendarClock, Ban, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "@/hooks/use-popup";
import { SECTION_ORDER, SECTION_LABEL, TYPE_TO_SECTION, NotificationType, NotifSection } from "@/data/notificationCategories";
import EmptyState from "@/components/EmptyState";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const NotificationPanel = ({ open, onClose }: NotificationPanelProps) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, friendRequests, acceptFriendRequest, declineFriendRequest, clearNotification } = useAppStore();
  const navigate = useNavigate();
  usePopup(open);

  const getIcon = (type: string) => {
    switch (type) {
      case "transfer_quest":
      case "transfer_group":
      case "transfer_declined":
        return <ArrowRightLeft className="w-4 h-4 text-primary" />;
      case "new_comment":
      case "comment_reply":
        return <MessageCircle className="w-4 h-4 text-secondary" />;
      case "new_participant":
        return <UserPlus className="w-4 h-4 text-secondary" />;
      case "new_contribution":
        return <HandMetal className="w-4 h-4 text-primary" />;
      case "photo_added":
        return <Camera className="w-4 h-4 text-primary" />;
      case "board_invitation":
        return <Users className="w-4 h-4 text-primary" />;
      case "removed_from_group":
      case "removed_from_quest":
        return <UserMinus className="w-4 h-4 text-destructive" />;
      case "friend_accepted":
      case "friend_request":
        return <UserPlus className="w-4 h-4 text-primary" />;
      case "friend_new_quest":
        return <Sparkles className="w-4 h-4 text-primary" />;
      case "new_quest_in_group":
        return <Sparkles className="w-4 h-4 text-secondary" />;
      case "quest_updated":
        return <CalendarClock className="w-4 h-4 text-primary" />;
      case "quest_canceled":
        return <Ban className="w-4 h-4 text-destructive" />;
      case "quest_reminder":
        return <Clock className="w-4 h-4 text-primary" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markNotificationRead(notification.id);

    if ((notification.type === "new_comment" || notification.type === "comment_reply") && notification.entityId) {
      const params = new URLSearchParams();
      if (notification.commentId) params.set("commentId", notification.commentId);
      const qs = params.toString();
      navigate(`/quest/${notification.entityId}${qs ? `?${qs}` : ""}`);
    } else if (notification.type === "transfer_quest" && notification.entityId) {
      navigate(`/quest/${notification.entityId}`);
    } else if (notification.type === "transfer_group") {
      navigate("/profile?tab=groups");
    } else if (
      (notification.type === "new_participant" ||
        notification.type === "new_contribution" ||
        notification.type === "photo_added" ||
        notification.type === "quest_updated" ||
        notification.type === "quest_canceled" ||
        notification.type === "quest_reminder" ||
        notification.type === "friend_new_quest" ||
        notification.type === "new_quest_in_group") &&
      notification.entityId
    ) {
      navigate(`/quest/${notification.entityId}`);
    } else if (notification.type === "removed_from_group") {
      navigate("/profile");
    } else if (notification.type === "friend_accepted" && notification.fromUser?.username) {
      navigate(`/u/${notification.fromUser.username}`);
    } else {
      navigate("/profile?tab=current");
    }

    onClose();
  };


  const goToUser = (e: React.MouseEvent, username?: string) => {
    e.stopPropagation();
    if (!username) return;
    navigate(`/u/${username}`);
    onClose();
  };

  const goToQuest = (e: React.MouseEvent, questId?: string) => {
    e.stopPropagation();
    if (!questId) return;
    navigate(`/quest/${questId}`);
    onClose();
  };

  /** Render notification message with bold/clickable fromUser name and quest name */
  const renderMessage = (n: typeof notifications[0]) => {
    // Quest-linked types: replace '<title>' in the message with a bold clickable span.
    const questLinkedTypes = new Set([
      "new_participant",
      "new_contribution",
      "photo_added",
      "quest_updated",
      "quest_canceled",
      "quest_reminder",
      "friend_new_quest",
      "new_comment",
      "comment_reply",
      "removed_from_quest",
      "transfer_quest",
      "transfer_declined",
    ]);
    const isQuestLinked = questLinkedTypes.has(n.type) && !!n.entityId;

    let messageNodes: React.ReactNode = n.message;
    if (isQuestLinked) {
      const match = n.message.match(/^(.*?)'([^']+)'(.*)$/);
      if (match) {
        const [, before, title, after] = match;
        messageNodes = (
          <>
            {before}
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => goToQuest(e, n.entityId)}
              className="font-bold underline-offset-2 hover:underline cursor-pointer"
            >
              {title}
            </span>
            {after}
          </>
        );
      }
    }

    return (
      <p className="text-xs text-foreground leading-relaxed">
        <span
          role="link"
          tabIndex={0}
          onClick={(e) => goToUser(e, n.fromUser?.id)}
          className="font-bold underline-offset-2 hover:underline cursor-pointer"
        >
          {n.fromUser.name}
        </span>{" "}
        {messageNodes}
        {n.groupName && <span className="font-bold">{n.groupName}</span>}
        {n.type === "transfer_group" && n.groupName && " group to you"}
      </p>
    );
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

            {(() => {
              // Group notifications by section. Friend requests are pseudo-items
              // that live in "social".
              const grouped: Record<NotifSection, React.ReactNode[]> = {
                social: [],
                your_quests: [],
                activity: [],
                updates: [],
              };

              // 1. Friend requests → social
              friendRequests.forEach((req) => {
                grouped.social.push(
                  <div
                    key={`fr-${req.id}`}
                    className="flex items-center gap-3 p-4 border-b border-border/30 last:border-b-0 bg-primary/5"
                  >
                    <div className="shrink-0">
                      <UserAvatar user={req.from} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">
                        <span className="font-bold">{req.from.name}</span> sent you a friend request
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => acceptFriendRequest(req.id)}
                        className="p-1.5 rounded-lg bg-secondary text-secondary-foreground"
                        aria-label="Accept friend request"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => declineFriendRequest(req.id)}
                        className="p-1.5 rounded-lg bg-muted text-muted-foreground"
                        aria-label="Decline friend request"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              });

              // 2. Real notifications → routed to their section
              notifications.forEach((n) => {
                const section = TYPE_TO_SECTION[n.type as NotificationType] || "social";
                // Group-related notifications are intentionally suppressed —
                // users should not learn which private launch lists they're on.
                if (
                  n.type === "board_invitation" ||
                  n.type === "removed_from_group" ||
                  n.type === "transfer_group" ||
                  n.type === "new_quest_in_group"
                ) {
                  return;
                }


                grouped[section].push(
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex items-start gap-3 p-4 border-b border-border/30 transition-colors active:scale-[0.99] cursor-pointer ${
                      n.read ? "opacity-60" : "bg-primary/5"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      <UserAvatar user={n.fromUser} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {renderMessage(n)}
                      <p className="text-[10px] text-muted-foreground mt-1">{n.createdAt}</p>
                    </div>
                    <div className="shrink-0 mt-1">{getIcon(n.type)}</div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              });

              const isEmpty = SECTION_ORDER.every((s) => grouped[s].length === 0);

              return (
                <div className="max-h-[60vh] overflow-y-auto">
                  {isEmpty ? (
                    <EmptyState
                      icon={Bell}
                      title="Nothing new yet"
                      description="Friend requests, comments, and updates will appear here."
                    />
                  ) : (
                    SECTION_ORDER.filter((s) => grouped[s].length > 0).map((s) => (
                      <div key={s}>
                        <div className="px-4 pt-3 pb-1.5 bg-muted/30 border-b border-border/30">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {SECTION_LABEL[s]}
                          </h4>
                        </div>
                        {grouped[s]}
                      </div>
                    ))
                  )}
                </div>
              );
            })()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;
