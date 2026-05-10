import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/contexts/i18nContext";
import {
  FileText, Briefcase, MessageCircle, Trophy, TrendingUp,
  ArrowRight, Sparkles, Target, CheckCircle2, Clock, Star,
  ChevronRight, Bot, BarChart3, Zap
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700",
  interview: "bg-yellow-100 text-yellow-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-600",
  bookmarked: "bg-purple-100 text-purple-700",
};

export default function DashboardHome() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { language, t } = useI18n();


  const { data: applications } = trpc.application.list.useQuery();
  const { data: latestAnalysis } = trpc.resumeAnalysis.latest.useQuery();
  const { data: chatSessions } = trpc.chat.sessions.useQuery();
  const { data: xpProfile } = trpc.gamification.profile.useQuery();
  const { data: savedResume } = trpc.resume.get.useQuery();

  const totalApps = applications?.length ?? 0;
  const activeApps = applications?.filter(a => ["applied", "interview"].includes(a.status)).length ?? 0;
  const interviewApps = applications?.filter(a => a.status === "interview").length ?? 0;
  const offerApps = applications?.filter(a => a.status === "offer").length ?? 0;

  const recentApps = applications?.slice(0, 4) ?? [];
  const recentChats = chatSessions?.slice(0, 3) ?? [];

  const resumeScore = latestAnalysis?.overallScore ?? (savedResume?.overallScore ?? null);
  const resumeScoreColor = resumeScore
    ? resumeScore >= 80 ? "text-green-600" : resumeScore >= 60 ? "text-yellow-600" : "text-red-500"
    : "text-gray-400";

  const xpLevel = xpProfile?.level ?? 1;
  const xpTotal = xpProfile?.totalXP ?? 0;
  const xpBadges = (xpProfile?.badges as string[] | undefined) ?? [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.dashboard.goodMorning;
    if (hour < 18) return t.dashboard.goodAfternoon;
    return t.dashboard.goodEvening;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t.dashboard.todayOverview}
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard")}
          className="gap-2 hidden sm:flex"
          size="sm"
        >
          <Briefcase className="w-4 h-4" />
          {t.dashboard.browseJobs}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">{t.dashboard.totalApplied}</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{totalApps}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-600 font-medium">{t.dashboard.inProgress}</span>
            </div>
            <p className="text-2xl font-bold text-yellow-700">{activeApps}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">{t.dashboard.interview}</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{interviewApps}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">{t.dashboard.offer}</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{offerApps}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Resume + XP */}
        <div className="space-y-4">
          {/* Resume Score Card */}
          <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation("/dashboard/resume")}>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  {t.dashboard.resumeAnalysis}
                </CardTitle>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {resumeScore !== null ? (
                <div className="space-y-2">
                  <div className="flex items-end gap-1">
                    <span className={`text-3xl font-bold ${resumeScoreColor}`}>{resumeScore}</span>
                    <span className="text-gray-400 text-sm mb-1">/100</span>
                  </div>
                  <Progress value={resumeScore} className="h-2" />
                  <p className="text-xs text-gray-500">
                    {latestAnalysis?.targetRole
                      ? `${t.dashboard.targetRole}: ${latestAnalysis.targetRole}`
                      : t.dashboard.resumeAnalyzed}
                  </p>
                  {latestAnalysis?.createdAt && (
                    <p className="text-xs text-gray-400">
                      {new Date(latestAnalysis.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-sm text-gray-400 mb-2">
                    {t.dashboard.uploadResume}
                  </p>
                  <Button size="sm" variant="outline" className="text-xs">
                    {t.dashboard.startAnalysis}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* XP / Level Card */}
          <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation("/dashboard/level")}>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  {t.dashboard.levelBadges}
                </CardTitle>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-yellow-600">{xpLevel}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">Level {xpLevel}</p>
                  <p className="text-xs text-gray-500">{xpTotal.toLocaleString()} XP</p>
                  {xpBadges.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {xpBadges.slice(0, 3).map((badge) => (
                        <Badge key={badge} variant="secondary" className="text-xs px-1.5 py-0">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                {t.dashboard.quickActions}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {[
                { icon: Briefcase, label: t.dashboard.browseJobsAction, path: "/dashboard" },
                { icon: Target, label: t.dashboard.jobFitAction, path: "/dashboard/fit" },
                { icon: BarChart3, label: t.dashboard.jobTrendsAction, path: "/dashboard/trends" },
                { icon: Sparkles, label: t.dashboard.careerConsulting, path: "/dashboard/consulting" },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  onClick={() => setLocation(path)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Middle + Right: Applications + Chat */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Applications */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  {t.dashboard.recentApplications}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 h-7 px-2"
                  onClick={() => setLocation("/dashboard/applications")}
                >
                  {t.dashboard.viewAll}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {recentApps.length === 0 ? (
                <div className="text-center py-6">
                  <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    {t.dashboard.noApplications}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs"
                    onClick={() => setLocation("/dashboard")}
                  >
                    {t.dashboard.browseJobs}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setLocation("/dashboard/applications")}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500">
                          {(app.company || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{app.jobTitle}</p>
                        <p className="text-xs text-gray-500 truncate">{app.company}{app.location ? ` · ${app.location}` : ""}</p>
                      </div>
                      <Badge className={`text-xs px-2 py-0.5 ${STATUS_COLORS[app.status] || "bg-gray-100 text-gray-600"}`}>
                        {app.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Chat History */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-gray-500" />
                  {t.dashboard.recentChats}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 h-7 px-2"
                  onClick={() => setLocation("/dashboard/chat")}
                >
                  {t.dashboard.viewAll}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {recentChats.length === 0 ? (
                <div className="text-center py-6">
                  <MessageCircle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    {t.dashboard.noChatHistory}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t.dashboard.startChatHint}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentChats.map((session) => (
                    <div
                      key={session.sessionId}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{session.title || "Chat"}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(session.updatedAt ?? session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resume Analysis History */}
          {latestAnalysis && (
            <Card className="border border-gray-100 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    {t.dashboard.resumeSummary}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 h-7 px-2"
                    onClick={() => setLocation("/dashboard/resume")}
                  >
                    {t.dashboard.details}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {latestAnalysis.summary || t.dashboard.noSummary}
                </p>
                {Array.isArray(latestAnalysis.strengths) && latestAnalysis.strengths.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(latestAnalysis.strengths as string[]).slice(0, 3).map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs bg-green-50 text-green-700 border-0">
                        ✓ {typeof s === "string" ? s.slice(0, 30) : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
