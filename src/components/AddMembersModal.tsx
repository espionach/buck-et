import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, UserPlus, UserSearch } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import UserAvatar from "@/components/UserAvatar";
import { useAppStore } from "@/data/appState";
import { Group, User } from "@/data/mockData";
import { usePopup } from "@/hooks/use-popup";

interface AddMembersModalProps {
  group: Group;
  open: boolean;
  onClose: () => void;
}

const AddMembersModal = ({ group, open, onClose }: AddMembersModalProps) => {
  const { friends: friendsList, inviteToGroup } = useAppStore();
  const [memberSearch, setMemberSearch] = useState("");
  usePopup(open);

  const availableToInvite = friendsList.filter(
    (f) => !group.memberRoles.some((mr) => mr.user.id === f.id)
  );

  const handleInvite = (user: User) => {
    inviteToGroup(group.id, user);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-foreground/40 flex items-start sm:items-center justify-center p-4 pt-20 sm:p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-2xl p-5 space-y-4 shadow-lg max-h-[70vh] sm:max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Add Members</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search friends by name"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {(() => {
              const q = memberSearch.trim().toLowerCase();
              const matches = q
                ? availableToInvite.filter((u) => u.name.toLowerCase().includes(q))
                : availableToInvite;
              const sectionLabel = q ? "Results" : "Suggested";
              const visible = q ? matches : matches.slice(0, 5);
              return (
                <div className="flex-1 overflow-y-auto -mx-1 px-1">
                  {availableToInvite.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">
                      All your friends are already in this group.
                    </p>
                  ) : visible.length === 0 ? (
                    <EmptyState
                      icon={UserSearch}
                      title="No matches found"
                      description="Try another name."
                      size="sm"
                    />
                  ) : (
                    <>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        {sectionLabel}
                      </p>
                      <div className="space-y-1">
                        {visible.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleInvite(user)}
                            className="w-full flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/50 text-left active:scale-[0.98] transition-all"
                          >
                            <UserAvatar user={user} size="sm" />
                            <span className="text-sm font-medium text-foreground flex-1 truncate">
                              {user.name}
                            </span>
                            <UserPlus className="w-4 h-4 text-primary" />
                          </button>
                        ))}
                      </div>
                    </>
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

export default AddMembersModal;