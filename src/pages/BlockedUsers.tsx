import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldOff } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import { User } from "@/data/mockData";
import { toast } from "sonner";

const BlockedUsers = () => {
  const nav = useNavigate();
  const { blockedUserIds, unblockUser } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (blockedUserIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }
      // Note: profiles RLS hides blocked users from each other, but the blocker
      // can still see them via the is_blocked check (blocker is not blocked-by).
      // Actually our policy hides them from the blocker too — so we fetch by id
      // unfiltered through the blocker_id self-row trick. Use a direct query.
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", blockedUserIds);
      setUsers(
        (data || []).map((p) => ({
          id: p.user_id,
          name: p.display_name || "User",
          username: p.username || undefined,
          avatar: "👤",
          bio: "",
          profilePicture: p.avatar_url || undefined,
        }))
      );
      setLoading(false);
    })();
  }, [blockedUserIds]);

  const handleUnblock = async (id: string) => {
    await unblockUser(id);
    toast.success("User unblocked");
  };

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
          className="p-2 -ml-2 text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Blocked Users</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>
      ) : blockedUserIds.length === 0 ? (
        <EmptyState
          icon={ShieldOff}
          title="No blocked users"
          description="People you block will appear here."
        />
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-3 py-3">
              <UserAvatar user={u} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                {u.username && (
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                )}
              </div>
              <button
                onClick={() => handleUnblock(u.id)}
                className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedUsers;
