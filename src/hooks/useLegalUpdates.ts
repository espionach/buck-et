import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type LegalType = "terms" | "privacy";

export interface LegalUpdate {
  id: string;
  type: LegalType;
  version: number;
  title: string;
  message: string;
  effective_date: string;
  created_at: string;
}

export interface UnseenUpdate {
  type: LegalType;
  version: number;
  title: string;
  message: string;
}

export const LEGAL_PATHS: Record<LegalType, string> = {
  terms: "/settings/terms",
  privacy: "/settings/privacy-policy",
};

export const LEGAL_LABEL: Record<LegalType, string> = {
  terms: "Terms",
  privacy: "Privacy Policy",
};

export function useLegalUpdates() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<LegalUpdate[]>([]);
  const [acks, setAcks] = useState<Record<LegalType, number>>({ terms: 0, privacy: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: u } = await supabase
      .from("legal_updates")
      .select("*")
      .order("effective_date", { ascending: false });
    setUpdates((u as LegalUpdate[]) || []);
    if (user) {
      const { data: a } = await supabase
        .from("user_legal_acknowledgements")
        .select("type, last_seen_version")
        .eq("user_id", user.id);
      const next: Record<LegalType, number> = { terms: 0, privacy: 0 };
      (a || []).forEach((row: { type: string; last_seen_version: number }) => {
        if (row.type === "terms" || row.type === "privacy") next[row.type] = row.last_seen_version;
      });
      setAcks(next);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("legal_updates_ch")
      .on("postgres_changes", { event: "*", schema: "public", table: "legal_updates" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [refresh]);

  const latestByType: Partial<Record<LegalType, LegalUpdate>> = {};
  for (const u of updates) {
    if (!latestByType[u.type] || latestByType[u.type]!.version < u.version) {
      latestByType[u.type] = u;
    }
  }

  const unseen: UnseenUpdate[] = (["terms", "privacy"] as LegalType[])
    .map((t) => {
      const latest = latestByType[t];
      if (!latest) return null;
      if (latest.version <= acks[t]) return null;
      return { type: t, version: latest.version, title: latest.title, message: latest.message };
    })
    .filter((x): x is UnseenUpdate => x !== null);

  const acknowledge = useCallback(
    async (type: LegalType, version: number) => {
      if (!user) return;
      const current = acks[type] || 0;
      if (version <= current) return;
      await supabase
        .from("user_legal_acknowledgements")
        .upsert(
          { user_id: user.id, type, last_seen_version: version, seen_at: new Date().toISOString() },
          { onConflict: "user_id,type" }
        );
      setAcks((prev) => ({ ...prev, [type]: version }));
    },
    [user, acks]
  );

  const acknowledgeLatest = useCallback(
    async (type: LegalType) => {
      const latest = latestByType[type];
      if (latest) await acknowledge(type, latest.version);
    },
    [latestByType, acknowledge]
  );

  return { updates, latestByType, unseen, loading, acknowledge, acknowledgeLatest, refresh };
}
