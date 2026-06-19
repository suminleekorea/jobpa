import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const AUTH_ERROR_COPY: Record<string, string> = {
  google_not_configured: "Google sign-in is not configured yet. Add Google OAuth environment variables first.",
  missing_google_code: "Google did not return an authorization code. Start again from the sign-in button.",
  invalid_google_state: "Google sign-in expired or could not be verified. Try again.",
  google_email_unverified: "This Google account email is not verified.",
  google_login_failed: "Google sign-in failed. Check the OAuth callback and environment variables.",
  session_required: "Please sign in before connecting Gmail.",
};

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useUtils();

  const authError = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get("authError");
    return value ? AUTH_ERROR_COPY[value] || `Authentication failed: ${value}` : "";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
        return;
      }
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <BrandLogo size="md" />
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Use email/password or continue with Google.
          </p>

          {(authError || error) && (
            <p className="mb-4 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error || authError}
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => { window.location.href = "/api/auth/google"; }}
          >
            <Mail className="h-4 w-4" />
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => setLocation("/forgot-password")}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="At least 8 characters"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation("/register")}
              className="text-primary hover:underline font-medium"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
