import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/contexts/i18nContext";
import { Target, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

const NUDGE_KEY = "jobpa_goal_nudge_last_shown";

export default function DailyGoalNudge() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const suppressNudge =
    location === "/onboarding" ||
    location === "/login" ||
    location === "/register" ||
    location.startsWith("/proposal");

  const { data: goal } = trpc.goal.get.useQuery(undefined, {
    enabled: isAuthenticated && !suppressNudge,
  });

  const saveGoal = trpc.goal.save.useMutation({
    onSuccess: () => {
      setOpen(false);
      setDismissed(true);
      localStorage.setItem(NUDGE_KEY, new Date().toDateString());
    },
  });

  useEffect(() => {
    if (!isAuthenticated || dismissed || suppressNudge) return;

    // Check if we already showed today
    const lastShown = localStorage.getItem(NUDGE_KEY);
    if (lastShown === new Date().toDateString()) return;

    // Show nudge after 3 seconds if no goal is set
    const timer = setTimeout(() => {
      if (!goal?.targetRole) {
        setOpen(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, goal, dismissed, suppressNudge]);

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
    localStorage.setItem(NUDGE_KEY, new Date().toDateString());
  };

  const handleSave = () => {
    if (!targetRole.trim()) return;
    saveGoal.mutate({ targetRole: targetRole.trim() });
  };

  if (!isAuthenticated || suppressNudge) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t.goalsPage.nudgeTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {t.goalsPage.nudgeDesc}
          </p>
          <Input
            placeholder={t.goalsPage.nudgePlaceholder}
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!targetRole.trim() || saveGoal.isPending}
              className="flex-1"
            >
              {t.goalsPage.nudgeSet}
            </Button>
            <Button variant="ghost" onClick={handleDismiss} className="gap-1">
              <X className="h-4 w-4" />
              {t.goalsPage.nudgeLater}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
