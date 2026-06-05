import { useEffect, useState } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, RotateCcw } from "lucide-react";

/**
 * Navigation Audit page.
 *
 * Lists every button in the app that triggers a route change (forward nav)
 * and every back button. Each forward entry is clickable so you can verify
 * the destination opens scrolled to the top. The live scroll indicator at
 * the top reflects window.scrollY for the current route; each route change
 * is also logged to the console with the scroll position immediately after
 * mount, so you can confirm `ScrollToTop` did its job.
 */

type ForwardEntry = {
  source: string; // file:line
  label: string; // what the button does
  to: string; // destination route
  note?: string;
};

type BackEntry = {
  source: string;
  label: string;
  behavior: string; // e.g. "navigate(-1)" or "fixed /profile"
};

const FORWARD: ForwardEntry[] = [
  // Bottom nav + global plus
  { source: "components/BottomNav.tsx:27", label: "Global + (Create Sidequest)", to: "/create" },
  { source: "components/BottomNav.tsx:47", label: "Bottom nav tabs", to: "/ (and /calendar, /profile)" },

  // Home / Feed
  { source: "pages/Home.tsx:127", label: "Empty-state Create Group", to: "/create-group" },
  { source: "pages/Home.tsx:161", label: "Pending invite banner", to: "/g/:id/invite" },
  { source: "pages/Home.tsx:213", label: "Invite row", to: "/g/:id/invite" },
  { source: "pages/Home.tsx:394", label: "Empty-state Create Sidequest", to: "/create" },

  // Calendar
  { source: "pages/Calendar.tsx:168", label: "Empty-state Create Sidequest", to: "/create" },
  { source: "pages/Calendar.tsx:187", label: "Quest row on a date", to: "/quest/:id" },

  // Quest card / detail
  { source: "components/QuestCard.tsx:165", label: "Quest card tap", to: "/quest/:id" },
  { source: "pages/QuestDetail.tsx:233", label: "Edit quest", to: "/quest/:id/edit" },
  { source: "pages/QuestDetail.tsx:380", label: "Participant -> own profile", to: "/profile" },
  { source: "pages/QuestDetail.tsx:382", label: "Participant -> other profile", to: "/profile?viewUser=:id" },

  // Profile
  { source: "pages/Profile.tsx:147", label: "Edit quest (deep link)", to: "/quest/:id/edit" },
  { source: "pages/Profile.tsx:283", label: "Edit quest (menu)", to: "/quest/:id/edit" },
  { source: "pages/Profile.tsx:598", label: "Settings gear", to: "/settings" },
  { source: "pages/Profile.tsx:725", label: "Drafts pill", to: "/drafts" },
  { source: "pages/Profile.tsx:752", label: "Empty-state Create Sidequest", to: "/create" },

  // My groups
  { source: "components/MyGroupsTab.tsx:16", label: "Create group", to: "/create-group" },
  { source: "components/MyGroupsTab.tsx:47", label: "Group row", to: "/groups/:id" },
  { source: "components/MyGroupsTab.tsx:52", label: "Group settings icon", to: "/groups/:id/settings" },

  // Group screens
  { source: "pages/GroupMembers.tsx:71", label: "Open group settings", to: "/groups/:id/settings" },
  { source: "pages/GroupSettings.tsx:135", label: "After leaving group", to: "/profile?tab=groups" },
  { source: "pages/CreateGroup.tsx:67", label: "After creating group", to: "/profile?tab=groups" },
  { source: "pages/CreateGroup.tsx:137", label: "Add friends CTA", to: "/onboarding/friends" },

  // Settings rows
  { source: "pages/Settings.tsx:395", label: "Find Friends", to: "/find-friends" },
  { source: "pages/Settings.tsx:396", label: "Blocked Users", to: "/settings/blocked" },
  { source: "pages/Settings.tsx:403", label: "Admin Dashboard", to: "/admin" },
  { source: "pages/Settings.tsx:405", label: "User Reports", to: "/admin/reports" },
  { source: "pages/Settings.tsx:431", label: "Community Guidelines", to: "/settings/community-guidelines" },
  { source: "pages/Settings.tsx:432", label: "Terms of Service", to: "/settings/terms" },
  { source: "pages/Settings.tsx:433", label: "Privacy Policy", to: "/settings/privacy-policy" },
  { source: "pages/Settings.tsx:434", label: "Legal Updates", to: "/settings/legal-updates" },
  { source: "pages/Settings.tsx:356", label: "Replay onboarding", to: "/onboarding/welcome" },

  // Drafts
  { source: "pages/Drafts.tsx:34", label: "Open draft", to: "/create?draftId=…" },
  { source: "pages/Drafts.tsx:70", label: "Empty-state Start Sidequest", to: "/create" },

  // Notifications
  { source: "components/NotificationPanel.tsx:92", label: "Notification -> quest (w/ context)", to: "/quest/:id?…" },
  { source: "components/NotificationPanel.tsx:96", label: "Group notification", to: "/profile?tab=groups" },
  { source: "components/NotificationPanel.tsx:111", label: "Profile notification (self)", to: "/profile" },
  { source: "components/NotificationPanel.tsx:113", label: "Profile notification (other)", to: "/u/:username" },
  { source: "components/NotificationPanel.tsx:115", label: "Current-quest notification", to: "/profile?tab=current" },
  { source: "components/NotificationPanel.tsx:125", label: "Username chip", to: "/u/:username" },
  { source: "components/NotificationPanel.tsx:132", label: "Quest chip", to: "/quest/:id" },

  // Admin
  { source: "pages/AdminDashboard.tsx:756", label: "Quest row (admin)", to: "/quest/:id" },
  { source: "pages/AdminDashboard.tsx:813", label: "Comment -> quest", to: "/quest/:id" },
  { source: "pages/AdminDashboard.tsx:912", label: "Report -> quest", to: "/quest/:id" },
  { source: "pages/AdminDashboard.tsx:1154", label: "User detail -> quest", to: "/quest/:id" },

  // Legal banner / updates
  { source: "components/LegalUpdateBanner.tsx:45", label: "Legal banner", to: "/settings/<legal>" },
  { source: "pages/LegalUpdates.tsx:47", label: "Legal updates row", to: "/settings/<legal>" },

  // Nudge
  { source: "components/NudgeQuestPicker.tsx:20", label: "Pick quest to nudge", to: "/quest/:id" },

  // Onboarding flow
  { source: "pages/onboarding/Welcome.tsx:13", label: "Welcome -> examples", to: "/onboarding/examples" },
  { source: "pages/onboarding/Welcome.tsx:43", label: "Welcome -> guidelines", to: "/settings/community-guidelines" },
  { source: "pages/onboarding/Examples.tsx:28", label: "Examples -> permissions", to: "/onboarding/permissions" },
  { source: "pages/onboarding/Permissions.tsx:33", label: "Permissions -> friends", to: "/onboarding/friends" },
];

const BACK: BackEntry[] = [
  { source: "pages/QuestDetail.tsx:97", label: "Quest detail back", behavior: "navigate(-1) ✅" },
  { source: "pages/QuestDetail.tsx:170", label: "Quest detail (loading) back", behavior: "navigate(-1) ✅" },
  { source: "pages/GroupSettings.tsx:27", label: "Group settings back", behavior: "navigate(-1) ✅" },
  { source: "pages/GroupSettings.tsx:61", label: "Group settings (loading) back", behavior: "navigate(-1) ✅" },
  { source: "pages/GroupMembers.tsx:41", label: "Group members back", behavior: "navigate(-1) ✅" },
  { source: "pages/GroupMembers.tsx:64", label: "Group members (loading) back", behavior: "navigate(-1) ✅" },
  { source: "pages/CreateGroup.tsx:74", label: "Create group back", behavior: "fromPath || navigate(-1)" },
  { source: "pages/CreateQuest.tsx:307-312", label: "Create quest back", behavior: "context-aware -> navigate(-1)" },
  { source: "pages/EditQuest.tsx:107", label: "Edit quest 'Go back'", behavior: "navigate(-1) ✅" },
  { source: "pages/EditQuest.tsx:194", label: "Edit quest header back", behavior: "navigate(-1) ✅" },
  { source: "pages/Settings.tsx:364", label: "Settings back", behavior: "nav(-1) ✅" },
  { source: "pages/Drafts.tsx:48", label: "Drafts back", behavior: "nav(-1) ✅" },
  { source: "pages/PublicProfile.tsx", label: "Public profile back", behavior: "nav(-1) ✅" },
  { source: "pages/LegalUpdates.tsx:19", label: "Legal updates back", behavior: "nav(-1) ✅" },
  { source: "pages/BlockedUsers.tsx:55", label: "Blocked users back", behavior: "nav(-1) ✅" },
  { source: "pages/CommunityGuidelines.tsx:32", label: "Community guidelines back", behavior: "nav(-1) ✅" },
  { source: "pages/PrivacyPolicy.tsx:37", label: "Privacy policy back", behavior: "nav(-1) ✅" },
  { source: "pages/FindFriends.tsx:168", label: "Find friends back", behavior: "nav(-1) ✅" },
  { source: "pages/AdminReports.tsx:82", label: "Admin reports back", behavior: "nav(-1) ✅" },
  { source: "pages/AdminDashboard.tsx:596", label: "Admin dashboard back", behavior: "nav(-1) ✅" },
];

const NavAudit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Log scroll position right after route mount so you can verify
    // ScrollToTop fired correctly when arriving here.
    // eslint-disable-next-line no-console
    console.info(
      `[NavAudit] arrived at ${location.pathname}${location.search} via ${navType} — window.scrollY=${window.scrollY}`,
    );
  }, [location.pathname, location.search, navType]);

  const go = (to: string) => {
    if (to.includes(":") || to.includes("…") || to.includes("<")) return; // template, can't navigate
    // eslint-disable-next-line no-console
    console.info(`[NavAudit] navigating to ${to}`);
    navigate(to, { state: { from: location.pathname + location.search } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold truncate">Navigation Audit</h1>
            <p className="text-xs text-muted-foreground truncate">
              scrollY: <span className="font-mono">{scrollY}</span> · nav: {navType}
            </p>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 800, behavior: "instant" as ScrollBehavior })}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Scroll down to test"
            title="Scroll down to test"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </header>

      <section className="px-4 pt-4 space-y-2">
        <p className="text-xs text-muted-foreground">
          Click any forward-nav entry to open its destination. Each entry should arrive at
          scrollY=0. Console logs the scroll position on every route change.
        </p>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-semibold mb-2">
          Forward navigation ({FORWARD.length})
        </h2>
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {FORWARD.map((e, i) => {
            const isTemplate = e.to.includes(":") || e.to.includes("…") || e.to.includes("<");
            return (
              <li
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{e.label}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">
                    {e.source} → {e.to}
                  </div>
                </div>
                <button
                  onClick={() => go(e.to)}
                  disabled={isTemplate}
                  className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Open <ArrowUpRight className="size-3" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-semibold mb-2">Back buttons ({BACK.length})</h2>
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {BACK.map((e, i) => (
            <li key={i} className="px-3 py-2.5 bg-card">
              <div className="text-sm font-medium">{e.label}</div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {e.source} — {e.behavior}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted-foreground mt-3">
          ✅ = uses <span className="font-mono">navigate(-1)</span>, so it returns to the previous
          page in history.
        </p>
      </section>
    </div>
  );
};

export default NavAudit;
