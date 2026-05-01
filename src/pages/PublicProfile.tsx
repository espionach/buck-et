import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/data/appState";
import UserProfileView from "@/components/UserProfileView";
import { User } from "@/data/mockData";
import { ArrowLeft, UserX } from "lucide-react";

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const nav = useNavigate();
  const { currentUser } = useAppStore();
  const [user, setUser] = useState<User | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!username) return;
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, bio")
        .ilike("username", username)
        .maybeSingle();
      if (cancelled) return;
      if (!data) { setNotFound(true); return; }
      // If it's the current user, send them to their own profile
      if (data.user_id === currentUser.id) {
        nav("/profile", { replace: true });
        return;
      }
      setUser({
        id: data.user_id,
        name: data.display_name || data.username,
        username: data.username,
        avatar: "👤",
        bio: data.bio || "",
        profilePicture: data.avatar_url || undefined,
      });
    })();
    return () => { cancelled = true; };
  }, [username, currentUser.id, nav]);

  if (notFound) {
    return (
      <div className="min-h-screen pt-14 px-5">
        <button
          onClick={() => nav("/")}
          aria-label="Back"
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center py-20">
          <UserX className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">User not found</p>
          <p className="text-sm text-muted-foreground">No account exists for @{username}.</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <UserProfileView
      user={user}
      backLabel="Back"
      onBack={() => nav(-1 as any)}
      onViewProfile={(u) => {
        if (u.username) nav(`/u/${u.username}`);
      }}
    />
  );
};

export default PublicProfile;