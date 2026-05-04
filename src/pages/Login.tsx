import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [restrictedUserId, setRestrictedUserId] = useState<string | null>(null);
  const [restrictionLabel, setRestrictionLabel] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Block banned users
    if (data.user) {
      const { data: flag } = await supabase
        .from("user_flags")
        .select("is_banned, is_suspended, suspended_until")
        .eq("user_id", data.user.id).maybeSingle();
      const stillSuspended = flag?.is_suspended && (!flag.suspended_until || new Date(flag.suspended_until) > new Date());
      if (flag?.is_banned || stillSuspended) {
        setRestrictedUserId(data.user.id);
        setRestrictionLabel(flag?.is_banned ? "banned" : "suspended");
        setAppealOpen(true);
        setLoading(false);
        return;
      }
    }
    navigate(redirectTo, { replace: true });
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">Sign in to continue your sidequests</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
      <Dialog open={appealOpen} onOpenChange={async (o) => {
        if (!o) {
          setAppealOpen(false);
          await supabase.auth.signOut();
          setRestrictedUserId(null);
          setAppealReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account {restrictionLabel}</DialogTitle>
            <DialogDescription>
              Your account is {restrictionLabel}. You can submit a request for review and an admin will respond.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={appealReason} onChange={(e) => setAppealReason(e.target.value)}
            placeholder="Explain why this should be reviewed…" rows={4}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={async () => {
              setAppealOpen(false);
              await supabase.auth.signOut();
            }}>Close</Button>
            <Button
              disabled={!appealReason.trim() || !restrictedUserId}
              onClick={async () => {
                if (!restrictedUserId) return;
                const { error } = await supabase.from("appeals").insert({ user_id: restrictedUserId, reason: appealReason.trim() });
                if (error) {
                  toast({ title: "Could not submit", description: error.message, variant: "destructive" });
                  return;
                }
                toast({ title: "Appeal submitted", description: "An admin will review your request." });
                setAppealOpen(false);
                setAppealReason("");
                await supabase.auth.signOut();
              }}
            >Submit appeal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
