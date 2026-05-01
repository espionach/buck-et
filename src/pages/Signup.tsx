import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import PasswordRequirements from "@/components/PasswordRequirements";
import { validatePassword, isLeakedPasswordError } from "@/lib/passwordPolicy";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  // Capture invite ref so we can send a friend request once the new user lands in the app.
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      try {
        localStorage.setItem("invite_ref", ref);
      } catch {
        // ignore storage errors
      }
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(password);
    if (pwError) {
      toast({ title: "Password doesn't meet requirements", description: pwError, variant: "destructive" });
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      const description = isLeakedPasswordError(error.message)
        ? "This password has appeared in a data breach. Please choose another."
        : error.message;
      toast({ title: "Signup failed", description, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a confirmation link to verify your account." });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Create account
          </h1>
          <p className="text-muted-foreground text-sm">Start your sidequest journey</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
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
              minLength={8}
            />
            <PasswordRequirements value={password} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
