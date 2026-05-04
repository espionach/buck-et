import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X, Lock, Users as UsersIcon } from "lucide-react";
import { useAppStore } from "@/data/appState";
import GroupSwatch from "@/components/GroupSwatch";
import { supabase } from "@/integrations/supabase/client";
import { Group } from "@/data/mockData";

const GroupInvite = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const nav = useNavigate();
  const {
    groups,
    groupInvitations,
    acceptGroupInvitation,
    declineGroupInvitation,
  } = useAppStore();

  const [previewGroup, setPreviewGroup] = useState<Pick<Group, "id" | "name" | "emoji" | "color" | "iconColor" | "description"> | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const isMember = !!groupId && groups.some((g) => g.id === groupId);
  const pendingInvite = groupInvitations.find(
    (inv) => inv.groupId === groupId && inv.status === "pending"
  );

  // If already a member, jump straight to groups list
  useEffect(() => {
    if (isMember && groupId) {
      nav(`/groups`, { replace: true });
    }
  }, [isMember, groupId, nav]);

  // Try to load a group preview. RLS only lets members and (via invitation join)
  // invited users see the group, so this gracefully fails for strangers.
  useEffect(() => {
    let cancelled = false;
    if (!groupId || isMember) return;
    if (pendingInvite) {
      // Use the data already in the store
      setPreviewGroup(pendingInvite.group);
      setMemberCount(pendingInvite.group.members.length);
      setChecked(true);
      return;
    }
    (async () => {
      const { data: g } = await supabase
        .from("groups")
        .select("id, name, emoji, color, icon_color, description")
        .eq("id", groupId)
        .maybeSingle();
      if (cancelled) return;
      if (g) {
        setPreviewGroup({
          id: g.id,
          name: g.name,
          emoji: g.emoji,
          color: g.color || undefined,
          iconColor: g.icon_color || undefined,
          description: g.description || undefined,
        });
        const { count } = await supabase
          .from("group_members")
          .select("user_id", { count: "exact", head: true })
          .eq("group_id", groupId);
        if (!cancelled) setMemberCount(count ?? null);
      }
      if (!cancelled) setChecked(true);
    })();
    return () => { cancelled = true; };
  }, [groupId, pendingInvite, isMember]);

  if (!groupId) return null;
  if (isMember) return null;
  if (!checked) return null;

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <button
        onClick={() => nav("/")}
        aria-label="Back"
        className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {!previewGroup ? (
        <div className="text-center py-16">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">Private Group</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            You need an invite from a member to join this group. Ask someone who's already in the group to invite you.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <GroupSwatch color={previewGroup.color} size={64} className="rounded-2xl" />
          <h1 className="text-xl font-bold text-foreground mt-3">{previewGroup.name}</h1>
          {previewGroup.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">{previewGroup.description}</p>
          )}
          {memberCount !== null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <UsersIcon className="w-3.5 h-3.5" />
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </div>
          )}

          <div className="mt-6 w-full max-w-xs">
            {pendingInvite ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-semibold text-foreground">{pendingInvite.invitedBy.name}</span> invited you to join.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      acceptGroupInvitation(pendingInvite.id);
                      nav(`/groups`);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      declineGroupInvitation(pendingInvite.id);
                      nav(`/`);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                You need an invite from a member to join. Ask someone who's already in the group to invite you.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupInvite;