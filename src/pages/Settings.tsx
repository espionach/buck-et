import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Bell, LifeBuoy, FileText, ShieldCheck, LogOut, Trash2, ChevronRight, Flag, ShieldOff, Compass, BookOpen, Shield, Inbox, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePopup } from "@/hooks/use-popup";
import { useAppStore } from "@/data/appState";
import { resetOnboarding } from "@/hooks/useOnboarding";
import PasswordRequirements from "@/components/PasswordRequirements";
import { validatePassword, isLeakedPasswordError } from "@/lib/passwordPolicy";
import {
  DB_PREF_KEYS,
  DbPrefKey,
  SETTINGS_TOGGLES,
  SECTION_ORDER,
  SECTION_LABEL,
} from "@/data/notificationCategories";
import { getUserFriendlyError } from "@/lib/errorMapping";

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
  const isAdmin = currentUserRoles.includes("admin");
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [isMutedAll, setIsMutedAll] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPwErrors, setShowPwErrors] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [restriction, setRestriction] = useState<null | "banned" | "suspended">(null);
  const [hasPendingAppeal, setHasPendingAppeal] = useState(false);
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealReason, setAppealReason] = useState("");

  // Support form state
  const [showSupport, setShowSupport] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportSubject, setSupportSubject] = useState<"general" | "bug" | "privacy">("general");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitting, setSupportSubmitting] = useState(false);

  usePopup(showNotif || showEmail || showPassword || showDelete || showSupport);

  // Load restriction status + pending appeal
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: flag } = await supabase
        .from("user_flags")
        .select("is_banned, is_suspended, suspended_until")
        .eq("user_id", user.id).maybeSingle();
      const stillSuspended = flag?.is_suspended && (!flag.suspended_until || new Date(flag.suspended_until) > new Date());
      if (flag?.is_banned) setRestriction("banned");
      else if (stillSuspended) setRestriction("suspended");
      else setRestriction(null);
      const { data: appeals } = await supabase
        .from("appeals").select("id").eq("user_id", user.id).eq("status", "pending").limit(1);
      setHasPendingAppeal((appeals || []).length > 0);
    })();
  }, [user]);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setIsMutedAll(!!(data as any).is_muted_all);
      }
    })();
  }, [user]);

  const togglePref = async (key: DbPrefKey) => {
    if (!user || isMutedAll) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    if (error) {
      setPrefs(prefs); // rollback
      console.error("[Settings.togglePref]", error);
      toast({ title: "Couldn't save", description: getUserFriendlyError("notification settings", error.message), variant: "destructive" });
    }
  };

  const toggleMuteAll = async (mute: boolean) => {
    if (!user) return;
    const prevMuted = isMutedAll;
    const prevPrefs = prefs;
    setIsMutedAll(mute);
    if (mute) {
      // Save current prefs as snapshot; keep `prefs` so they re-appear on unmute
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            ...prefs,
            is_muted_all: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pre_mute_snapshot: prefs as any,
          },
          { onConflict: "user_id" }
        );
      if (error) {
        setIsMutedAll(prevMuted);
        console.error("[Settings.toggleMuteAll]", error);
        toast({ title: "Couldn't save", description: getUserFriendlyError("notification settings", error.message), variant: "destructive" });
      }
    } else {
      // Unmute: restore from snapshot if present
      const { data } = await supabase
        .from("notification_preferences")
        .select("pre_mute_snapshot")
        .eq("user_id", user.id)
        .maybeSingle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const snap = (data as any)?.pre_mute_snapshot as Partial<NotifPrefs> | null;
      const restored = { ...DEFAULT_PREFS, ...prefs, ...(snap || {}) };
      // Ensure only known keys, booleans
      const clean = { ...DEFAULT_PREFS } as NotifPrefs;
      for (const k of DB_PREF_KEYS) {
        const v = (restored as Record<string, unknown>)[k];
        clean[k] = typeof v === "boolean" ? v : true;
      }
      setPrefs(clean);
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: user.id, ...clean, is_muted_all: false, pre_mute_snapshot: null },
          { onConflict: "user_id" }
        );
      if (error) {
        setIsMutedAll(prevMuted);
        setPrefs(prevPrefs);
        console.error("[Settings.toggleMuteAll]", error);
        toast({ title: "Couldn't save", description: getUserFriendlyError("notification settings", error.message), variant: "destructive" });
      }
    }
  };


  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    setEmailError(null);
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (trimmed === user?.email?.toLowerCase()) {
      setEmailError("That's already your current email.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser(
      { email: trimmed },
      { emailRedirectTo: `${window.location.origin}/settings` }
    );
    setSubmitting(false);
    if (error) {
      setEmailError(error.message);
      return;
    }
    setEmailSent(true);
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (!user?.email) {
      setPwError("You must be signed in.");
      return;
    }
    if (!currentPassword) {
      setPwError("Enter your current password.");
      return;
    }
    const policyError = validatePassword(newPassword);
    if (policyError) {
      setShowPwErrors(true);
      setPwError(policyError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords don't match.");
      return;
    }
    if (newPassword === currentPassword) {
      setPwError("New password must be different from your current one.");
      return;
    }
    setSubmitting(true);
    // Re-authenticate by verifying the current password
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (reauthError) {
      setSubmitting(false);
      setPwError("Current password is incorrect.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setSubmitting(false);
      setPwError(
        isLeakedPasswordError(error.message)
          ? "This password has appeared in a data breach. Please choose another."
          : error.message
      );
      return;
    }
    // Revoke all other active sessions for safety
    try {
      await supabase.auth.signOut({ scope: "others" });
    } catch {
      // non-fatal
    }
    setSubmitting(false);
    toast({
      title: "Password updated",
      description: "For your security, please sign in again.",
    });
    setShowPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPwErrors(false);
    // Sign out the current session and force re-login
    await signOut();
    nav("/login", { replace: true });
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

  const openSupport = () => {
    setSupportEmail(user?.email ?? "");
    setSupportSubject("general");
    setSupportMessage("");
    setShowSupport(true);
  };

  const handleSubmitSupport = async () => {
    const email = supportEmail.trim().toLowerCase();
    const message = supportMessage.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    if (message.length < 1 || message.length > 5000) {
      toast({ title: "Message required", description: "Please write a message (max 5000 characters).", variant: "destructive" });
      return;
    }
    setSupportSubmitting(true);
    const { error } = await supabase.from("support_messages").insert({
      user_id: user?.id ?? null,
      email,
      subject: supportSubject,
      message,
    });
    setSupportSubmitting(false);
    if (error) {
      toast({ title: "Couldn't send", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Message sent", description: "Thanks! We'll get back to you within a few business days." });
    setShowSupport(false);
    setSupportMessage("");
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
          onClick={() => nav("/profile")}
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

      {restriction && (
        <Section title={restriction === "banned" ? "Account banned" : "Account suspended"}>
          <div className="px-4 py-3 text-xs text-muted-foreground">
            {restriction === "banned"
              ? "Your account is banned. You can request a review."
              : "Your account is suspended. You can request a review."}
          </div>
          <Row
            icon={Inbox}
            label={hasPendingAppeal ? "Appeal pending review" : "Request Review"}
            onClick={hasPendingAppeal ? undefined : () => setShowAppeal(true)}
          />
        </Section>
      )}

      <Section title="Preferences">
        <Row icon={Bell} label="Notification Settings" onClick={() => setShowNotif(true)} />
        <Row icon={ShieldOff} label="Blocked Users" onClick={() => nav("/settings/blocked")} />
        <Row icon={Compass} label="Replay App Tour" onClick={handleReplayTour} />
      </Section>

      {isMod && (
        <Section title="Moderation">
          {isAdmin && (
            <Row icon={Shield} label="Admin Dashboard" onClick={() => nav("/admin")} />
          )}
          <Row icon={Flag} label="User Reports" onClick={() => nav("/admin/reports")} />
        </Section>
      )}

      <Section title="Support & Contact">
        <div className="px-4 py-3.5">
          <p className="text-xs text-muted-foreground leading-snug mb-3">
            Need help, want to report a bug, or have a privacy-related request? Reach out to us here and we'll get back to you within a few business days.
          </p>
          <button
            onClick={() => window.open("https://forms.gle/Djrj3z6ynUxfh5FR8", "_blank")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
          >
            <LifeBuoy className="w-4 h-4" />
            Contact Support
          </button>
          <p className="text-[11px] text-muted-foreground mt-3 leading-snug">
            Prefer email? Contact us directly at:{" "}
            <a href="mailto:bucketapp.support@gmail.com" className="text-primary font-medium break-all">
              bucketapp.support@gmail.com
            </a>
          </p>
        </div>
      </Section>

      <Section title="Legal">
        <Row icon={BookOpen} label="Community Guidelines" onClick={() => nav("/settings/community-guidelines")} />
        <Row icon={FileText} label="Terms of Service" onClick={() => nav("/settings/terms")} />
        <Row icon={ShieldCheck} label="Privacy Policy" onClick={() => nav("/settings/privacy-policy")} />
        <Row icon={Sparkles} label="Legal Updates" onClick={() => nav("/settings/legal-updates")} />
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
              <p className="text-xs text-muted-foreground mb-3">Choose what we should ping you about.</p>
              <div className="mb-4 p-4 rounded-2xl border border-border bg-muted/40 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground">Mute all notifications</div>
                  <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    Turns every notification off. You can re-enable any time.
                  </div>
                </div>
                <Switch
                  checked={isMutedAll}
                  onCheckedChange={(v) => toggleMuteAll(v)}
                />
              </div>
              <div className={`max-h-[60vh] overflow-y-auto -mx-1 px-1 space-y-5 transition-opacity ${isMutedAll ? "opacity-50 pointer-events-none" : ""}`}>
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
                            disabled={isMutedAll}
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
            onClick={() => { setShowEmail(false); setEmailSent(false); setNewEmail(""); setEmailError(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-lg"
            >
              {emailSent ? (
                <>
                  <h3 className="font-bold text-foreground text-base mb-2">Check your inbox</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    We sent a confirmation link to{" "}
                    <span className="text-foreground font-medium">{newEmail}</span>.
                    Your email won't change until you click the link.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    For your security, we also notified <span className="text-foreground">{user?.email}</span> about this request.
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setShowEmail(false); setEmailSent(false); setNewEmail(""); setEmailError(null); }}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
                    >
                      Got it
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-bold text-foreground text-base mb-1">Change Email</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Current: <span className="text-foreground">{user?.email}</span>
                  </p>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); setEmailError(null); }}
                    placeholder="new@email.com"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground outline-none mb-2"
                  />
                  {emailError && (
                    <p className="text-xs text-destructive mb-2">{emailError}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mb-4 leading-snug">
                    We'll send a confirmation link to your new email. The change won't take effect until you click it. We'll also notify your current email.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setShowEmail(false); setNewEmail(""); setEmailError(null); }}
                      className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangeEmail}
                      disabled={submitting || !newEmail.trim()}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                    >
                      {submitting ? "Sending..." : "Send Confirmation"}
                    </button>
                  </div>
                </>
              )}
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
            onClick={() => { setShowPassword(false); setPwError(null); }}
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
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPwError(null); }}
                placeholder="Current password"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground outline-none mb-2"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPwError(null);
                  if (showPwErrors && !validatePassword(e.target.value)) setShowPwErrors(false);
                }}
                placeholder="New password"
                autoComplete="new-password"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground outline-none mb-2"
              />
              <div className="mb-2">
                <PasswordRequirements value={newPassword} showErrors={showPwErrors} />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPwError(null); }}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground outline-none mb-2"
              />
              {pwError && (
                <p className="text-xs text-destructive mb-2">{pwError}</p>
              )}
              <div className="flex items-center justify-between mb-4">
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  onClick={() => setShowPassword(false)}
                >
                  Forgot current password?
                </Link>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowPassword(false); setPwError(null); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Update"}
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

      {/* Appeal Modal */}
      <AnimatePresence>
        {showAppeal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowAppeal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-lg"
            >
              <h3 className="font-bold text-foreground text-base mb-2">Request review</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Tell us why your account should be reviewed. An admin will look at your request.
              </p>
              <textarea
                value={appealReason} onChange={(e) => setAppealReason(e.target.value)}
                rows={4} placeholder="Explain your situation…"
                className="w-full p-3 rounded-xl bg-muted text-sm text-foreground outline-none mb-3"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAppeal(false)} className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm">Cancel</button>
                <button
                  disabled={!appealReason.trim()}
                  onClick={async () => {
                    if (!user) return;
                    const { error } = await supabase.from("appeals").insert({ user_id: user.id, reason: appealReason.trim() });
                    if (error) {
                      toast({ title: "Couldn't submit", description: error.message, variant: "destructive" });
                      return;
                    }
                    toast({ title: "Appeal submitted", description: "An admin will review your request." });
                    setShowAppeal(false);
                    setAppealReason("");
                    setHasPendingAppeal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >Submit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support Contact Modal */}
      <AnimatePresence>
        {showSupport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center p-5"
            onClick={() => !supportSubmitting && setShowSupport(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-lg"
            >
              <h3 className="font-bold text-foreground text-base mb-1">Contact Support</h3>
              <p className="text-xs text-muted-foreground mb-4">
                We'll get back to you within a few business days.
              </p>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="you@email.com"
                maxLength={255}
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground outline-none mb-3"
              />
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Subject</label>
              <select
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value as "general" | "bug" | "privacy")}
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm text-foreground outline-none mb-3"
              >
                <option value="general">General Support</option>
                <option value="bug">Report a Bug</option>
                <option value="privacy">Privacy Request</option>
              </select>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Message</label>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="How can we help?"
                rows={5}
                maxLength={5000}
                className="w-full p-3 rounded-xl bg-muted text-sm text-foreground outline-none mb-4 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSupport(false)}
                  disabled={supportSubmitting}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSupport}
                  disabled={supportSubmitting || !supportEmail.trim() || !supportMessage.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
                >
                  {supportSubmitting ? "Sending..." : "Send"}
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