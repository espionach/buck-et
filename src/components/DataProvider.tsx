import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/data/appState";
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
} from "@/hooks/useSupabaseData";

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const store = useAppStore();

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
    if (user && profile.data) store.setInitialized(true);
  }, [user, profile.data]);

  return <>{children}</>;
};
