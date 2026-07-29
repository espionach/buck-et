import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Mail, Check, Search, Loader2, Shield, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/data/appState";
import { toast } from "@/hooks/use-toast";
import UserAvatar from "@/components/UserAvatar";
import CancelRequestDialog from "@/components/CancelRequestDialog";
import type { User } from "@/data/mockData";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Match = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

/** SHA-256(normalized email) → lowercase hex */
async function hashEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const FindFriends = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const sendFriendRequest = useAppStore((s) => s.sendFriendRequest);
  const cancelFriendRequest = useAppStore((s) => s.cancelFriendRequest);
  const friends = useAppStore((s) => s.friends);
  const sent = useAppStore((s) => s.sentFriendRequests);
  const [cancelTarget, setCancelTarget] = useState<Match | null>(null);

  const [consent, setConsent] = useState<boolean | null>(null);
  const [savingConsent, setSavingConsent] = useState(false);

  const [raw, setRaw] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [unmatchedEmails, setUnmatchedEmails] = useState<string[]>([]);

  // Load consent
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("contact_discovery_consents")
        .select("enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      setConsent(!!data?.enabled);
    })();
  }, [user]);

  const enableConsent = async () => {
    if (!user) return;
    setSavingConsent(true);
    const { error } = await supabase
      .from("contact_discovery_consents")
      .upsert(
        { user_id: user.id, enabled: true },
        { onConflict: "user_id" }
      );
    setSavingConsent(false);
    if (error) {
      toast({ title: "Couldn't enable", description: error.message, variant: "destructive" });
      return;
    }
    setConsent(true);
  };

  const disableAndPurge = async () => {
    if (!user) return;
    setSavingConsent(true);
    await supabase
      .from("contact_discovery_consents")
      .upsert({ user_id: user.id, enabled: false }, { onConflict: "user_id" });
    // Note: own email hash stays so others who opted in can still find you.
    // Disable just means YOU can't run discovery anymore.
    setSavingConsent(false);
    setConsent(false);
    setMatches(null);
    setUnmatchedEmails([]);
    toast({ title: "Contact discovery turned off" });
  };

  const parsedEmails = useMemo(() => {
    const out = new Set<string>();
    for (const tok of raw.split(/[\s,;\n]+/)) {
      const t = tok.trim().toLowerCase();
      if (EMAIL_RE.test(t)) out.add(t);
    }
    return Array.from(out);
  }, [raw]);

  const runSearch = async () => {
    if (!user || parsedEmails.length === 0) return;
    setSearching(true);
    try {
      const hashes = await Promise.all(parsedEmails.map(hashEmail));
      const emailToHash = new Map(parsedEmails.map((e, i) => [e, hashes[i]]));

      const { data, error } = await supabase.functions.invoke(
        "contact-discovery-match",
        { body: { hashes } }
      );
      if (error) throw error;

      const result = data as { matches: Match[]; hash_to_user: Record<string, string> };
      setMatches(result.matches ?? []);

      const matchedHashes = new Set(Object.keys(result.hash_to_user ?? {}));
      const unmatched = parsedEmails.filter((e) => {
        const h = emailToHash.get(e);
        return h && !matchedHashes.has(h);
      });
      setUnmatchedEmails(unmatched);

      if ((result.matches ?? []).length === 0 && unmatched.length === 0) {
        toast({ title: "No results" });
      }
    } catch (e) {
      const msg = (e as Error).message ?? "Search failed";
      toast({ title: "Search failed", description: msg, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const addFriend = (m: Match) => {
    if (!m.user_id) return;
    const u: User = {
      id: m.user_id,
      name: m.display_name ?? m.username ?? "User",
      username: m.username ?? undefined,
      avatar: m.avatar_url ?? "",
      bio: "",
      profilePicture: m.avatar_url ?? undefined,
    };
    sendFriendRequest(u);
    toast({ title: "Friend request sent" });
  };

  const inviteEmail = (email: string) => {
    const subject = encodeURIComponent("Join me on SideQuest");
    const body = encodeURIComponent(
      `Hey — I'm using SideQuest to plan things to do with friends. Join me: ${window.location.origin}`
    );
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  };

  // ----- Render -----

  if (consent === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 px-5 pt-14 max-w-xl mx-auto">
      <button
        onClick={() => nav(-1)}
        className="p-2 -ml-2 mb-4 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <h1 className="text-2xl font-bold mb-1">Find Friends</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Discover people you know who already use SideQuest.
      </p>

      {!consent && (
        <div className="bg-card border border-border/50 rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold">Privacy-first matching</h2>
          </div>
          <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5 mb-4 list-disc pl-4">
            <li>We never upload or store your address book.</li>
            <li>Emails are converted to one-way hashes (SHA-256) in your browser before they leave your device.</li>
            <li>We compare those hashes against existing users and return only matches.</li>
            <li>You can turn this off and remove your hash at any time in Settings.</li>
          </ul>
          <button
            onClick={enableConsent}
            disabled={savingConsent}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {savingConsent ? "Enabling…" : "Enable contact matching"}
          </button>
        </div>
      )}

      {consent && (
        <>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Paste or type emails
          </label>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="alice@example.com, bob@example.com…"
            rows={4}
            className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex items-center justify-between mt-2 mb-4">
            <span className="text-xs text-muted-foreground">
              {parsedEmails.length} valid email{parsedEmails.length === 1 ? "" : "s"}
            </span>
            <button
              onClick={runSearch}
              disabled={searching || parsedEmails.length === 0}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </div>

          {matches && matches.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                On SideQuest ({matches.length})
              </h2>
              <div className="bg-card border border-border/50 rounded-2xl shadow-sm divide-y divide-border overflow-hidden">
                {matches.map((m) => {
                  const isFriend = friends.some((f) => f.id === m.user_id);
                  const isSent = sent.includes(m.user_id);
                  return (
                    <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
                      <UserAvatar
                        user={{
                          id: m.user_id,
                          name: m.display_name ?? "",
                          avatar: m.avatar_url ?? "",
                          bio: "",
                        }}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {m.display_name ?? m.username ?? "User"}
                        </p>
                        {m.username && (
                          <p className="text-xs text-muted-foreground truncate">@{m.username}</p>
                        )}
                      </div>
                      {isFriend ? (
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Friends
                        </span>
                      ) : isSent ? (
                        <span className="text-xs font-medium text-muted-foreground">Requested</span>
                      ) : (
                        <button
                          onClick={() => addFriend(m)}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-4"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {unmatchedEmails.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Not on SideQuest yet ({unmatchedEmails.length})
              </h2>
              <div className="bg-card border border-border/50 rounded-2xl shadow-sm divide-y divide-border overflow-hidden">
                {unmatchedEmails.map((email) => (
                  <div key={email} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{email}</p>
                    </div>
                    <button
                      onClick={() => inviteEmail(email)}
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-4"
                    >
                      <Send className="w-3.5 h-3.5" /> Invite
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-8 pt-4 border-t border-border">
            <button
              onClick={disableAndPurge}
              disabled={savingConsent}
              className="text-xs font-medium text-muted-foreground hover:text-destructive underline-offset-4 hover:underline disabled:opacity-50"
            >
              Turn off contact discovery
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FindFriends;
