import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import PasswordRequirements from "@/components/PasswordRequirements";
import { validatePassword, isLeakedPasswordError } from "@/lib/passwordPolicy";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when arriving from a recovery link
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Also handle the case where the session is already set when we mount
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pwError = validatePassword(password);
    if (pwError) {
      toast({
        title: "Password doesn't meet requirements",
        description: pwError,
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "Passwords don't match",
        description: "Please re-enter to confirm.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      const description = isLeakedPasswordError(error.message)
        ? "This password has appeared in a data breach. Please choose another."
        : "The reset link may have expired. Request a new one.";
      toast({
        title: "Couldn't update password",
        description,
        variant: "destructive",
      });
    } else {
      toast({ title: "Password updated", description: "You're all set." });
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1
            className="text-3xl font-bold text-foreground"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Set a new password
          </h1>
          <p className="text-muted-foreground text-sm">
            {ready
              ? "Choose a new password for your account."
              : "Verifying your reset link..."}
          </p>
        </div>

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <PasswordRequirements value={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
