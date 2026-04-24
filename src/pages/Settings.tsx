import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Bell, LifeBuoy, Bug, FileText, ShieldCheck, LogOut, Trash2, ChevronRight, Flag, ShieldOff, Compass, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePopup } from "@/hooks/use-popup";
import { useAppStore } from "@/data/appState";
import { resetOnboarding } from "@/hooks/useOnboarding";
import {
  DB_PREF_KEYS,
  DbPrefKey,
  SETTINGS_TOGGLES,
  SECTION_ORDER,
  SECTION_LABEL,
} from "@/data/notificationCategories";

type NotifPrefs = Record<DbPrefKey, boolean>;

const DEFAULT_PREFS: NotifPrefs = DB_PREF_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: true }),
  {} as NotifPrefs
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
      {title}
    </h2>
    <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
      {children}
    </div>
  </div>
);

const Row = ({
  icon: Icon,
  label,
  onClick,
  destructive,
  trailing,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
  trailing?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    type="button"
    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-muted/60 transition-colors ${
      destructive ? "text-destructive" : "text-foreground"
    }`}
  >
    <Icon className={`w-4 h-4 ${destructive ? "text-destructive" : "text-muted-foreground"}`} />
    <span className="flex-1 text-sm font-medium">{label}</span>
    {trailing ?? <ChevronRight className="w-4 h-4 text-muted-foreground" />}
  </button>
);

const Settings = () => {
  const nav = useNavigate();
  const { user, signOut } = useAuth();
  const currentUserRoles = useAppStore((s) => s.currentUserRoles);
  const isMod = currentUserRoles.includes("admin") || currentUserRoles.includes("moderator");
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [showNotif, setShowNotif] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  usePopup(showNotif || showEmail || showPassword || showDelete);

  // Load notif prefs
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const next = { ...DEFAULT_PREFS };
        for (const k of DB_PREF_KEYS) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const v = (data as any)[k];
          if (typeof v === "boolean") next[k] = v;
        }
        setPrefs(next);
      }
    })();
  }, [user]);

  const togglePref = async (key: DbPrefKey) => {
    if (!user) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    if (error) {
      setPrefs(prefs); // rollback
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't update email", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Check your inbox", description: "Confirm the change from the link we sent." });
    setShowEmail(false);
    setNewEmail("");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated" });
    setShowPassword(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = async () => {
    // Account deletion typically needs a server function with service-role.
    // For now: sign out and inform the user.
    toast({
      title: "Request received",
      description: "Account deletion isn't fully wired yet — we've signed you out for now.",
    });
    setShowDelete(false);
    await signOut();
  };

  const handleContactSupport = () => {
    window.location.href = "mailto:support@buck-et.app?subject=Support%20request";
  };

  const handleReportBug = () => {
    window.location.href = "mailto:support@buck-et.app?subject=Bug%20report";
  };

  const handleReplayTour = async () => {
    if (!user) return;
    await resetOnboarding(user.id);
    nav("/onboarding/tour");
  };

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
          className="p-2 -ml-2 text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <Section title="Account">
        <Row icon={Mail} label="Change Email" onClick={() => setShowEmail(true)} />
        <Row icon={Lock} label="Change Password" onClick={() => setShowPassword(true)} />
      </Section>

      <Section title="Preferences">
        <Row icon={Bell} label="Notification Settings" onClick={() => setShowNotif(true)} />
        <Row icon={ShieldOff} label="Blocked Users" onClick={() => nav("/settings/blocked")} />
        <Row icon={Compass} label="Replay App Tour" onClick={handleReplayTour} />
      </Section>

      {isMod && (
        <Section title="Moderation">
          <Row icon={Flag} label="User Reports" onClick={() => nav("/admin/reports")} />
        </Section>
      )}

      <Section title="Support">
        <Row icon={LifeBuoy} label="Contact Support" onClick={handleContactSupport} />
        <Row icon={Bug} label="Report a Bug" onClick={handleReportBug} />
      </Section>

      <Section title="Contact Us">
        <div className="px-4 py-3.5">
          <p className="text-xs text-muted-foreground mb-1">Reach our support team at:</p>
          <a
            href="mailto:support@buck-et.app"
            className="text-sm font-semibold text-primary break-all"
          >
            support@buck-et.app
          </a>
          <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
            We typically reply within a couple of business days.
          </p>
        </div>
      </Section>

      <Section title="Legal">
        <Row icon={BookOpen} label="Community Guidelines" onClick={() => nav("/settings/community-guidelines")} />
        <Row icon={FileText} label="Terms of Service" onClick={() => window.open("/terms", "_blank")} />
        <Row icon={ShieldCheck} label="Privacy Policy" onClick={() => window.open("/privacy", "_blank")} />
      </Section>

      <Section title="Danger Zone">
        <Row icon={LogOut} label="Sign Out" onClick={() => signOut()} destructive />
        <Row icon={Trash2} label="Delete Account" onClick={() => setShowDelete(true)} destructive />
      </Section>

      {/* Notification Settings Modal */}
      <AnimatePresence>
        {showNotif && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center p-5"
            onClick={() => setShowNotif(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-lg"
            >
              <h3 className="font-bold text-foreground text-base mb-1">Notification Settings</h3>
              <p className="text-xs text-muted-foreground mb-4">Choose what we should ping you about.</p>
              <div className="max-h-[60vh] overflow-y-auto -mx-1 px-1 space-y-5">
                {SECTION_ORDER.map((section) => (
                  <div key={section}>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      {SECTION_LABEL[section]}
                    </h4>
                    <div className="space-y-3">
                      {SETTINGS_TOGGLES[section].map((row) => (
                        <div key={row.key} className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground">{row.label}</div>
                            {row.hint && (
                              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                {row.hint}
                              </div>
                            )}
                          </div>
                          <Switch
                            checked={prefs[row.key]}
                            onCheckedChange={() => togglePref(row.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-5">
                <button
                  onClick={() => setShowNotif(false)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Email Modal */}
      <AnimatePresence>
        {showEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowEmail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-lg"
            >
              <h3 className="font-bold text-foreground text-base mb-1">Change Email</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Current: <span className="text-foreground">{user?.email}</span>
              </p>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@email.com"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground outline-none mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowEmail(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeEmail}
                  disabled={submitting || !newEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                  Send Confirmation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-lg"
            >
              <h3 className="font-bold text-foreground text-base mb-3">Change Password</h3>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground outline-none mb-2"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground outline-none mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowPassword(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-lg"
            >
              <h3 className="font-bold text-foreground text-base mb-2">Delete Account?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will permanently remove your account and all your sidequests. This can't be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDelete(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;