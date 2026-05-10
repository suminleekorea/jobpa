import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/contexts/i18nContext";
import { Target, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const NUDGE_KEY = "jobpa_goal_nudge_last_shown";

export default function DailyGoalNudge() {
  const { language } = useI18n();
  const isKo = language === "ko";
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [dismissed, setDismissed] = useState(false);

  const { data: goal } = trpc.goal.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const saveGoal = trpc.goal.save.useMutation({
    onSuccess: () => {
      setOpen(false);
      setDismissed(true);
      localStorage.setItem(NUDGE_KEY, new Date().toDateString());
    },
  });

  useEffect(() => {
    if (!isAuthenticated || dismissed) return;

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
  }, [isAuthenticated, goal, dismissed]);

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
    localStorage.setItem(NUDGE_KEY, new Date().toDateString());
  };

  const handleSave = () => {
    if (!targetRole.trim()) return;
    saveGoal.mutate({ targetRole: targetRole.trim() });
  };

  if (!isAuthenticated) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {isKo ? "오늘 목표 설정해볼래요? 🎯" : "Set Today's Goal? 🎯"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            {isKo
              ? "목표 직무를 설정하면 AI가 더 맞춤화된 분석과 리포트를 제공합니다."
              : "Setting a target role helps AI provide more personalized analysis and reports."}
          </p>
          <Input
            placeholder={isKo ? "예: Software Engineer, Product Manager..." : "e.g. Software Engineer, Product Manager..."}
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
              {isKo ? "목표 설정하기" : "Set Goal"}
            </Button>
            <Button variant="ghost" onClick={handleDismiss} className="gap-1">
              <X className="h-4 w-4" />
              {isKo ? "나중에" : "Later"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
