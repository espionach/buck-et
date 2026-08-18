import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDrafts, migrateLocalDrafts, type QuestDraft } from "@/lib/drafts";

export const draftsQueryKey = (userId?: string) => ["quest_drafts", userId];

/** Server-side drafts for the current user, with a one-time localStorage migration. */
export function useDrafts(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const migrated = await migrateLocalDrafts(userId);
      if (migrated > 0) {
        queryClient.invalidateQueries({ queryKey: draftsQueryKey(userId) });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return useQuery<QuestDraft[]>({
    queryKey: draftsQueryKey(userId),
    queryFn: () => listDrafts(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
