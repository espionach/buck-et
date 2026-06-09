/**
 * Contextual spotlights for new users. Each entry shows once per user (per
 * device) the first time they land on the relevant screen, until they tap
 * "Got it" or "Skip all tips". State lives in localStorage.
 */

export interface SpotlightDef {
  id: string;
  /** Returns true if this spotlight applies on the current route. */
  match: (loc: { pathname: string; search: string }) => boolean;
  /** CSS selector to spotlight. Polled until mounted. */
  targetSelector: string;
  title: string;
  body: string;
  placement?: "top" | "bottom";
}

const hasTab = (search: string, tab: string) =>
  new URLSearchParams(search).get("tab") === tab;

export const SPOTLIGHTS: SpotlightDef[] = [
  {
    id: "quest-detail-join",
    match: (l) => l.pathname.startsWith("/quest/") && !l.pathname.endsWith("/edit"),
    targetSelector: '[data-spotlight="quest-join"]',
    title: "Your sidequest is live",
    body: "Friends can join right here. You can edit details, add roles, or share the link any time.",
    placement: "bottom",
  },
  {
    id: "quest-detail-share",
    match: (l) => l.pathname.startsWith("/quest/") && !l.pathname.endsWith("/edit"),
    targetSelector: '[data-spotlight="quest-share"]',
    title: "Share this sidequest",
    body: "Send the link to friends so they can join — works anywhere you can paste a link.",
    placement: "bottom",
  },
  {
    id: "quest-detail-nudge",
    match: (l) => l.pathname.startsWith("/quest/") && !l.pathname.endsWith("/edit"),
    targetSelector: '[data-spotlight="quest-nudge"]',
    title: "Nudge your friends",
    body: "A nudge is a gentle poke — it pings friends to join or remember this sidequest without spamming them.",
    placement: "top",
  },
  {
    id: "home-fab",
    match: (l) => l.pathname === "/",
    targetSelector: '[data-tour="fab"]',
    title: "Start a sidequest anytime",
    body: "Tap + whenever an idea hits. The feed below shows what your friends and groups are up to.",
    placement: "top",
  },
  {
    id: "home-notifications",
    match: (l) => l.pathname === "/",
    targetSelector: 'button[aria-label="Notifications"]',
    title: "Activity lives here",
    body: "Friend requests, joins, nudges and group invites all land in this bell.",
    placement: "bottom",
  },
  {
    id: "calendar-grid",
    match: (l) => l.pathname === "/calendar",
    targetSelector: '[data-spotlight="calendar-grid"]',
    title: "Everything on one calendar",
    body: "Every sidequest you've joined or created shows up on a date here.",
    placement: "bottom",
  },
  {
    id: "profile-current",
    match: (l) => l.pathname === "/profile" && (hasTab(l.search, "current") || !l.search),
    targetSelector: '[data-tour="profile-tab-current"]',
    title: "Active sidequests",
    body: "Your in-progress sidequests. Finish one and it slides over to Completed.",
    placement: "bottom",
  },
  {
    id: "profile-completed",
    match: (l) => l.pathname === "/profile" && hasTab(l.search, "past"),
    targetSelector: '[data-tour="profile-tab-past"]',
    title: "Completed sidequests",
    body: "A running log of every sidequest you've finished. Hit the + on any one to add photos after the fact.",
    placement: "bottom",
  },
  {
    id: "profile-groups",
    match: (l) => l.pathname === "/profile" && hasTab(l.search, "groups"),
    targetSelector: '[data-tour="profile-tab-groups"]',
    title: "Friend groups",
    body: "Make groups for the people you actually plan things with. Sidequests can be shared to just one group.",
    placement: "bottom",
  },
];

const DISMISSED_KEY = (uid: string) => `bucket:spotlights:dismissed:${uid}`;
const SKIP_ALL_KEY = (uid: string) => `bucket:spotlights:skipAll:${uid}`;

export function getDismissed(uid: string): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY(uid));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function dismissSpotlight(uid: string, id: string) {
  const set = getDismissed(uid);
  set.add(id);
  try {
    localStorage.setItem(DISMISSED_KEY(uid), JSON.stringify([...set]));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("spotlight-state-changed"));
}

export function isSkippedAll(uid: string): boolean {
  try {
    return localStorage.getItem(SKIP_ALL_KEY(uid)) === "1";
  } catch {
    return false;
  }
}

export function skipAllSpotlights(uid: string) {
  try {
    localStorage.setItem(SKIP_ALL_KEY(uid), "1");
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("spotlight-state-changed"));
}

export function replayAllSpotlights(uid: string) {
  try {
    localStorage.removeItem(DISMISSED_KEY(uid));
    localStorage.removeItem(SKIP_ALL_KEY(uid));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("spotlight-state-changed"));
}
