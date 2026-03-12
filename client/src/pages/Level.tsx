import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Star, Zap, Target, Award, TrendingUp } from "lucide-react";

const XP_PER_LEVEL = 100;

const BADGE_ICONS: Record<string, string> = {
  first_apply: "🎯", apply_10: "🏹", apply_50: "🚀",
  streak_3: "🔥", streak_7: "⚡", streak_30: "💎",
  journal_5: "📝", checklist_20: "✅",
  level_5: "⭐", level_10: "👑",
};

const ALL_BADGES = [
  "first_apply", "apply_10", "apply_50",
  "streak_3", "streak_7", "streak_30",
  "journal_5", "checklist_20",
  "level_5", "level_10",
];

export default function Level() {
  const { t } = useI18n();
  const { data: profile, isLoading } = trpc.gamification.profile.useQuery();
  const { data: history = [] } = trpc.gamification.history.useQuery();

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">{t.common.loading}</div>;
  }

  if (!profile) return null;

  const xpInCurrentLevel = profile.totalXP % XP_PER_LEVEL;
  const progressPercent = (xpInCurrentLevel / XP_PER_LEVEL) * 100;
  const xpToNext = XP_PER_LEVEL - xpInCurrentLevel;
  const earnedBadges = profile.badges || [];
  const badgeNames = t.gamification.badgeNames as Record<string, string>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Level Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-8 text-white relative">
          <div className="absolute top-4 right-4 opacity-20">
            <Trophy className="h-32 w-32" />
          </div>
          <div className="relative z-10">
            <p className="text-amber-100 text-sm font-medium mb-2">{t.gamification.title}</p>
            <div className="flex items-end gap-4 mb-6">
              <span className="text-7xl font-black">{profile.level}</span>
              <div className="pb-2">
                <p className="text-2xl font-bold">{t.gamification.level}</p>
                <p className="text-amber-100">{profile.totalXP} {t.gamification.xp}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t.gamification.nextLevel}</span>
                <span>{xpToNext} XP</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{profile.currentStreak}</p>
            <p className="text-xs text-muted-foreground">{t.gamification.dayStreak}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{profile.longestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{earnedBadges.length}</p>
            <p className="text-xs text-muted-foreground">{t.gamification.badges}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Zap className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">
              {history.filter((e: any) => e.createdAt && new Date(e.createdAt).toDateString() === new Date().toDateString()).reduce((sum: number, e: any) => sum + (e.xpAmount || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">{t.gamification.todayXP}</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            {t.gamification.badges}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ALL_BADGES.map(badge => {
              const earned = earnedBadges.includes(badge);
              return (
                <div
                  key={badge}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    earned
                      ? "border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700 shadow-sm"
                      : "border-dashed border-muted-foreground/20 opacity-40"
                  }`}
                >
                  <span className="text-3xl">{BADGE_ICONS[badge] || "🏅"}</span>
                  <span className="text-xs font-medium text-center leading-tight">
                    {badgeNames[badge] || badge}
                  </span>
                  {earned && <Badge variant="secondary" className="text-[10px] px-1.5">Earned</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* XP History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            {t.gamification.history}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No XP earned yet. Start completing tasks!</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {history.slice(0, 30).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                      event.action === "apply" ? "bg-blue-100 text-blue-600" :
                      event.action === "checklist" ? "bg-green-100 text-green-600" :
                      event.action === "journal" ? "bg-purple-100 text-purple-600" :
                      event.action === "login" ? "bg-amber-100 text-amber-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {event.action === "apply" ? "📋" :
                       event.action === "checklist" ? "✅" :
                       event.action === "journal" ? "📝" :
                       event.action === "login" ? "👋" : "⭐"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.description || event.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200 font-bold">
                    +{event.xpAmount} XP
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* XP Guide */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">How to Earn XP</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 rounded-lg px-3 py-2">
              <span>📋</span><span>Apply: +20 XP</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 rounded-lg px-3 py-2">
              <span>✅</span><span>Checklist: +10 XP</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950 rounded-lg px-3 py-2">
              <span>📝</span><span>Journal: +15 XP</span>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950 rounded-lg px-3 py-2">
              <span>👋</span><span>Daily Login: +5 XP</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
