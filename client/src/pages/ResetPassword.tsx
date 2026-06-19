import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => setTokenValid(data.valid))
      .catch(() => setTokenValid(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to reset password");
        return;
      }
      setSuccess(true);
      // Invalidate auth cache and redirect after 2s
      await utils.auth.me.invalidate();
      setTimeout(() => setLocation("/dashboard"), 2000);
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
          {/* Loading token verification */}
          {tokenValid === null && (
            <div className="text-center py-4">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Verifying reset link…</p>
            </div>
          )}

          {/* Invalid token */}
          {tokenValid === false && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
              </div>
              <h1 className="text-xl font-semibold mb-2">Invalid or Expired Link</h1>
              <p className="text-sm text-muted-foreground mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Button
                className="w-full mb-2"
                onClick={() => setLocation("/forgot-password")}
              >
                Request New Link
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/login")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-500" />
                </div>
              </div>
              <h1 className="text-xl font-semibold mb-2">Password Reset!</h1>
              <p className="text-sm text-muted-foreground">
                Your password has been reset successfully. Redirecting to dashboard…
              </p>
            </div>
          )}

          {/* Reset form */}
          {tokenValid === true && !success && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Set New Password</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Choose a strong password for your account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Repeat your password"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting…" : "Reset Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
