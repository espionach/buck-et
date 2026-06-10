import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import EmptyState from "@/components/EmptyState";
import { Activity as ActivityIcon, UserPlus, MessageCircle, CheckCircle2, Image as ImageIcon, Users, Sparkles } from "lucide-react";
import { User } from "@/data/mockData";
import { formatDistanceToNow } from "date-fns";

type ActivityType =
  | "launched_quest"
  | "joined_quest"
  | "completed_quest"
  | "commented_quest"
  | "added_photo"
  | "friendship_created";

interface ActivityRow {
  activity_type: ActivityType;
  actor_id: string;
  sidequest_id: string | null;
  target_user_id: string | null;
  metadata: { quest_title?: string; preview?: string; photo_url?: string } | null;
  created_at: string;
}

const PAGE_SIZE = 10;

const ActivityFeed = () => {
  const navigate = useNavigate();
  const allUsers = useAppStore((s) => s.allUsers);
  const friends = useAppStore((s) => s.friends);
  const currentUser = useAppStore((s) => s.currentUser);

  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sharingOff, setSharingOff] = useState(false);

  const userMap = new Map<string, User>();
  [...allUsers, ...friends, currentUser].forEach((u) => u?.id && userMap.set(u.id, u));

  const findUser = (id: string | null): User | null => {
    if (!id) return null;
    return userMap.get(id) ?? { id, name: "Someone", avatar: "👤", bio: "" };
  };

  const fetchPage = useCallback(async (before: string | null) => {
    const { data, error } = await supabase.rpc("get_friend_activity", {
      _before: before,
      _limit: PAGE_SIZE,
    });
    if (error) {
      console.error("[ActivityFeed]", error);
      return [];
    }
    return (data as ActivityRow[]) ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Check own sharing setting for the empty state
      if (currentUser?.id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("activity_sharing_enabled")
          .eq("user_id", currentUser.id)
          .maybeSingle();
        if (prof && prof.activity_sharing_enabled === false) {
          if (!cancelled) {
            setSharingOff(true);
            setRows([]);
            setHasMore(false);
            setLoading(false);
          }
          return;
        }
      }
      const page = await fetchPage(null);
      if (cancelled) return;
      setRows(page);
      setHasMore(page.length === PAGE_SIZE);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, fetchPage]);

  const loadMore = async () => {
    if (loadingMore || !rows.length) return;
    setLoadingMore(true);
    const page = await fetchPage(rows[rows.length - 1].created_at);
    setRows((r) => [...r, ...page]);
    setHasMore(page.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-3 w-1/4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sharingOff) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="Activity sharing is off"
        description="Turn it on in Settings to see what your friends are up to."
        cta={{ label: "Open Settings", onClick: () => navigate("/settings") }}
      />
    );
  }

  if (rows.length === 0) {
    return friends.length === 0 ? (
      <EmptyState
        icon={Users}
        title="No friends yet"
        description="Add friends to see what they're up to."
        cta={{ label: "Find friends", onClick: () => navigate("/find-friends") }}
      />
    ) : (
      <EmptyState
        icon={ActivityIcon}
        title="No recent activity"
        description="When your friends join, complete, or comment on sidequests, you'll see it here."
      />
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {rows.map((row, i) => (
        <ActivityRowItem
          key={`${row.activity_type}-${row.actor_id}-${row.created_at}-${i}`}
          row={row}
          findUser={findUser}
          onNav={(path) => navigate(path)}
        />
      ))}
      {hasMore && (
        <div className="pt-4 pb-2 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

const iconFor = (t: ActivityType) => {
  switch (t) {
    case "launched_quest":
      return Sparkles;
    case "joined_quest":
      return UserPlus;
    case "completed_quest":
      return CheckCircle2;
    case "commented_quest":
      return MessageCircle;
    case "added_photo":
      return ImageIcon;
    case "friendship_created":
      return Users;
  }
};

const ActivityRowItem = ({
  row,
  findUser,
  onNav,
}: {
  row: ActivityRow;
  findUser: (id: string | null) => User | null;
  onNav: (path: string) => void;
}) => {
  const actor = findUser(row.actor_id);
  const target = findUser(row.target_user_id);
  const Icon = iconFor(row.activity_type);
  const title = row.metadata?.quest_title ?? "a sidequest";

  let verb: React.ReactNode = null;
  switch (row.activity_type) {
    case "joined_quest":
      verb = <>joined <span className="font-semibold">{title}</span></>;
      break;
    case "completed_quest":
      verb = <>completed <span className="font-semibold">{title}</span></>;
      break;
    case "commented_quest":
      verb = <>commented on <span className="font-semibold">{title}</span></>;
      break;
    case "added_photo":
      verb = <>added a photo to <span className="font-semibold">{title}</span></>;
      break;
    case "friendship_created":
      verb = target ? (
        <>and <span className="font-semibold">{target.name}</span> are now friends</>
      ) : (
        <>made a new friend</>
      );
      break;
  }

  const handleClick = () => {
    if (row.sidequest_id) onNav(`/quest/${row.sidequest_id}`);
    else if (row.activity_type === "friendship_created" && target?.username)
      onNav(`/u/${target.username}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-3 py-3 text-left active:bg-muted/40 transition-colors"
    >
      <div className="relative shrink-0">
        {actor && <UserAvatar user={actor} size="md" />}
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
          <Icon className="w-3 h-3 text-primary" strokeWidth={2.25} />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          <span className="font-semibold">{actor?.name ?? "Someone"}</span>{" "}
          {verb}
        </p>
        {row.activity_type === "commented_quest" && row.metadata?.preview && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            “{row.metadata.preview}”
          </p>
        )}
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
        </p>
      </div>
      {row.activity_type === "added_photo" && row.metadata?.photo_url && (
        <img
          src={row.metadata.photo_url}
          alt=""
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      )}
    </button>
  );
};

export default ActivityFeed;
