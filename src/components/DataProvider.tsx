import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/data/appState";
import ErrorBanner, { ApiError } from "@/components/ErrorBanner";
import { getUserFriendlyError } from "@/lib/errorMapping";
import {
  useCurrentProfile,
  useQuests,
  useGroups,
  useFriends,
  useFriendRequests,
  useSentFriendRequests,
  useGroupInvitations,
  useNotifications,
  useTransferRequests,
  useSearchableUsers,
  useBlockedUsers,
  useCurrentUserRoles,
} from "@/hooks/useSupabaseData";

let errorIdCounter = 0;

function extractErrorInfo(error: unknown): { message: string; code?: string } {
  if (!error) return { message: "Unknown error" };
  if (typeof error === "object" && error !== null) {
    const e = error as any;
    return {
      message: e.message || e.error_description || String(error),
      code: e.code || e.status || undefined,
    };
  }
  return { message: String(error) };
}

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const store = useAppStore();
  const [apiErrors, setApiErrors] = useState<ApiError[]>([]);

  const logError = useCallback((source: string, error: unknown) => {
    const info = extractErrorInfo(error);

    // Full technical details for developers — always in console
    console.error(`[${source}]`, info.message, info.code ? `(code: ${info.code})` : "");

    // User-friendly message for the banner
    const friendlyMessage = getUserFriendlyError(source, info.message);

    setApiErrors((prev) => {
      // Deduplicate by friendly message
      if (prev.some((e) => e.friendlyMessage === friendlyMessage)) return prev;
      const newErr: ApiError = {
        id: String(++errorIdCounter),
        source,
        message: info.message,
        friendlyMessage,
        code: info.code,
        timestamp: new Date(),
      };
      return [newErr, ...prev].slice(0, 20);
    });
  }, []);

  const dismissError = useCallback((id: string) => {
    setApiErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const dismissAllErrors = useCallback(() => {
    setApiErrors([]);
  }, []);

  const profile = useCurrentProfile();
  const quests = useQuests();
  const groups = useGroups();
  const friends = useFriends();
  const friendRequests = useFriendRequests();
  const sentFriendRequests = useSentFriendRequests();
  const groupInvitations = useGroupInvitations();
  const notifications = useNotifications();
  const transferRequests = useTransferRequests();
  const allUsers = useSearchableUsers();
  const blockedUsers = useBlockedUsers();
  const userRoles = useCurrentUserRoles();

  // Log errors from each query
  useEffect(() => {
    if (profile.error) logError("Profile", profile.error);
  }, [profile.error]);

  useEffect(() => {
    if (quests.error) logError("Quests", quests.error);
  }, [quests.error]);

  useEffect(() => {
    if (groups.error) logError("Groups", groups.error);
  }, [groups.error]);

  useEffect(() => {
    if (friends.error) logError("Friends", friends.error);
  }, [friends.error]);

  useEffect(() => {
    if (friendRequests.error) logError("Friend Requests", friendRequests.error);
  }, [friendRequests.error]);

  useEffect(() => {
    if (groupInvitations.error) logError("Group Invitations", groupInvitations.error);
  }, [groupInvitations.error]);

  useEffect(() => {
    if (notifications.error) logError("Notifications", notifications.error);
  }, [notifications.error]);

  useEffect(() => {
    if (transferRequests.error) logError("Transfer Requests", transferRequests.error);
  }, [transferRequests.error]);

  useEffect(() => {
    if (allUsers.error) logError("User Search", allUsers.error);
  }, [allUsers.error]);

  // Set up invalidation callback
  useEffect(() => {
    store._setInvalidate((keys: string[]) => {
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    });
  }, [queryClient]);

  // Sync data into store
  useEffect(() => {
    if (profile.data) store.setCurrentUser(profile.data);
  }, [profile.data]);

  useEffect(() => {
    if (quests.data) store.setQuests(quests.data);
  }, [quests.data]);

  useEffect(() => {
    if (groups.data) store.setGroups(groups.data);
  }, [groups.data]);

  useEffect(() => {
    if (friends.data) store.setFriends(friends.data);
  }, [friends.data]);

  useEffect(() => {
    if (friendRequests.data) store.setFriendRequests(friendRequests.data);
  }, [friendRequests.data]);

  useEffect(() => {
    if (sentFriendRequests.data) store.setSentFriendRequests(sentFriendRequests.data);
  }, [sentFriendRequests.data]);

  useEffect(() => {
    if (groupInvitations.data) store.setGroupInvitations(groupInvitations.data);
  }, [groupInvitations.data]);

  useEffect(() => {
    if (notifications.data) store.setNotifications(notifications.data);
  }, [notifications.data]);

  useEffect(() => {
    if (transferRequests.data) store.setTransferRequests(transferRequests.data);
  }, [transferRequests.data]);

  useEffect(() => {
    if (allUsers.data) store.setAllUsers(allUsers.data);
  }, [allUsers.data]);

  useEffect(() => {
    if (blockedUsers.data) store.setBlockedUserIds(blockedUsers.data.map((b) => b.userId));
  }, [blockedUsers.data]);

  useEffect(() => {
    if (userRoles.data) store.setCurrentUserRoles(userRoles.data);
  }, [userRoles.data]);

  useEffect(() => {
    if (user && profile.data) store.setInitialized(true);
  }, [user, profile.data]);

  // Sync the user's device timezone to their profile so server-side reminders
  // can fire at 9 AM in their local time (especially for timeless quests).
  useEffect(() => {
    if (!user || !profile.data) return;
    let tz: string | undefined;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!tz) return;
    if ((profile.data as any).timezone === tz) return;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.from("profiles").update({ timezone: tz }).eq("user_id", user.id);
      } catch (err) {
        console.error("Failed to sync timezone", err);
      }
    })();
  }, [user, profile.data]);

  // Process invite ref captured at signup: send a friend request to the inviter once we know the current user.
  useEffect(() => {
    if (!user || !profile.data) return;
    let ref: string | null = null;
    try {
      ref = localStorage.getItem("invite_ref");
    } catch {
      return;
    }
    if (!ref) return;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: target } = await supabase
          .from("profiles")
          .select("user_id, username")
          .ilike("username", ref!)
          .maybeSingle();
        if (target && target.user_id !== user.id) {
          // Avoid dup if friendship/request already exists
          const { data: existingFriend } = await supabase
            .from("friendships")
            .select("id")
            .or(`and(user_id.eq.${user.id},friend_id.eq.${target.user_id}),and(user_id.eq.${target.user_id},friend_id.eq.${user.id})`)
            .maybeSingle();
          const { data: existingReq } = await supabase
            .from("friend_requests")
            .select("id")
            .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${target.user_id}),and(from_user_id.eq.${target.user_id},to_user_id.eq.${user.id})`)
            .maybeSingle();
          if (!existingFriend && !existingReq) {
            await supabase.from("friend_requests").insert({
              from_user_id: user.id,
              to_user_id: target.user_id,
              status: "pending",
            });
          }
        }
      } catch (err) {
        console.error("Invite ref processing failed", err);
      } finally {
        try { localStorage.removeItem("invite_ref"); } catch {}
      }
    })();
  }, [user, profile.data]);

  return (
    <>
      <ErrorBanner
        errors={apiErrors}
        onDismiss={dismissError}
        onDismissAll={dismissAllErrors}
      />
      {children}
    </>
  );
};
