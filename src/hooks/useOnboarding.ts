import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ONBOARDING_STATUS_EVENT = "onboarding-status-changed";

function emitOnboardingStatus(detail: { onboarded: boolean; step: OnboardingStep | null }) {
  window.dispatchEvent(new CustomEvent(ONBOARDING_STATUS_EVENT, { detail }));
}

export type OnboardingStep =
  | "welcome"
  | "permissions"
  | "friends"
  | "tour"
  | "first_quest";

export const ONBOARDING_ORDER: OnboardingStep[] = [
  "welcome",
  "permissions",
  "friends",
  "tour",
  "first_quest",
];

export const ONBOARDING_PATHS: Record<OnboardingStep, string> = {
  welcome: "/onboarding/welcome",
  permissions: "/onboarding/permissions",
  friends: "/onboarding/friends",
  tour: "/onboarding/tour",
  first_quest: "/create",
};

/**
 * Reads the current user's onboarding status from the `profiles` table.
 * Returns `null` while loading and an object once known.
 */
export function useOnboardingStatus() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<{
    onboarded: boolean;
    step: OnboardingStep | null;
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState({ onboarded: true, step: null }); // not relevant when logged out
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarded_at, onboarding_step")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setState({
        onboarded: !!data?.onboarded_at,
        step: (data?.onboarding_step as OnboardingStep | null) ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ onboarded: boolean; step: OnboardingStep | null }>;
      // Defer to a microtask so we never call setState during another
      // component's render (which can desync hook counts).
      queueMicrotask(() => setState(customEvent.detail));
    };
    window.addEventListener(ONBOARDING_STATUS_EVENT, handler);
    return () => window.removeEventListener(ONBOARDING_STATUS_EVENT, handler);
  }, []);

  return { ...(state ?? { onboarded: false, step: null }), loading: state === null };
}

/** Marks the current step (so we can resume) */
export async function setOnboardingStep(userId: string, step: OnboardingStep) {
  await supabase
    .from("profiles")
    .update({ onboarding_step: step })
    .eq("user_id", userId);
  emitOnboardingStatus({ onboarded: false, step });
}

/** Marks onboarding complete */
export async function completeOnboarding(userId: string) {
  await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString(), onboarding_step: null })
    .eq("user_id", userId);
  emitOnboardingStatus({ onboarded: true, step: null });
}

/** Resets onboarding so the user can replay the tour */
export async function resetOnboarding(userId: string) {
  await supabase
    .from("profiles")
    .update({ onboarded_at: null, onboarding_step: "tour" })
    .eq("user_id", userId);
  emitOnboardingStatus({ onboarded: false, step: "tour" });
}

/** Convenience: handler that completes + navigates to "/" */
export function useCompleteOnboarding() {
  const { user } = useAuth();
  return useCallback(async () => {
    if (!user) return;
    await completeOnboarding(user.id);
  }, [user]);
}
