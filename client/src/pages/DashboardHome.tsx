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
  ChevronRight, Bot, BarChart3, Zap, ArrowUpRight, Send, ClipboardCheck, Radar, Users, Handshake, BadgeCheck
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700",
  interview: "bg-yellow-100 text-yellow-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-600",
  bookmarked: "bg-purple-100 text-purple-700",
};

function tagValues(tags: string[], prefix: string) {
  return tags
    .filter((tag) => tag.startsWith(prefix))
    .map((tag) => tag.slice(prefix.length).replace(/_/g, " "));
}

function CoachDashboardHome({
  userName,
  survey,
  setLocation,
}: {
  userName?: string | null;
  survey: any;
  setLocation: (path: string) => void;
}) {
  const lookingFor = (survey?.lookingFor as string[] | undefined) ?? [];
  const modules = tagValues((survey?.preferredJobTypes as string[] | undefined) ?? [], "module:");
  const supportNeeds = tagValues(lookingFor, "support:");
  const niche = survey?.targetRole || "Resume / LinkedIn positioning";
  const clientSegments = Array.isArray(survey?.interests) && survey.interests.length > 0
    ? survey.interests
    : ["International students", "Career switchers", "Non-tech business professionals"];
  const locations = Array.isArray(survey?.preferredLocations) && survey.preferredLocations.length > 0
    ? survey.preferredLocations
    : ["singapore"];
  const profileItems = [
    ["Expertise", niche],
    ["Client segment", clientSegments.slice(0, 2).join(", ")],
    ["Market", locations.join(", ").replace(/_/g, " ")],
    ["Offer", survey?.salaryExpectation || "US$30 beta support"],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 overflow-hidden px-3 py-4 sm:px-4 md:px-6 md:py-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="secondary" className="mb-2">Consultant dashboard</Badge>
            <h1 className="text-2xl font-bold tracking-tight">
              {userName ? `${userName.split(" ")[0]}'s consulting profile` : "Consulting profile"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Set your expertise, choose who you can mentor, and organize candidate-side support. JobPA does not act as an employment agency or employer representative.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => setLocation("/dashboard/profile")} variant="outline" className="gap-2">
              <BadgeCheck className="h-4 w-4" />
              Edit profile
            </Button>
            <Button onClick={() => setLocation("/dashboard/consulting")} className="gap-2">
              <Handshake className="h-4 w-4" />
              Build offer
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Public coach profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-sm font-semibold">{userName || "Coach name"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{niche}</p>
            </div>
            <div className="space-y-3">
              {profileItems.map(([label, value]) => (
                <div key={label} className="border-b pb-3 last:border-0 last:pb-0">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Candidate support queue</CardTitle>
              <Badge variant="outline">Mentoring beta</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              JobPA should show a short, practical support queue. Each row explains the candidate-side blocker and the next mentoring action.
            </p>
            {[
              [clientSegments[0] || "International student", "Resume positioning + Singapore targeting", "High", "Invite to mentoring call"],
              [clientSegments[1] || "Career switcher", "LinkedIn branding before outreach", "Medium", "Suggest profile review"],
              ["DIY job seeker", "Needs resume-based coffee chat message", "Low", "Recommend free Career Ops tool"],
            ].map(([segment, blocker, fit, action]) => (
              <div key={segment} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_130px_170px] md:items-center">
                <div>
                  <p className="font-semibold">{segment}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{blocker}</p>
                </div>
                <Badge variant={fit === "High" ? "default" : "secondary"} className="w-fit">{fit} fit</Badge>
                <Button variant="outline" size="sm" onClick={() => setLocation("/dashboard/consulting")}>{action}</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simple paid offer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-semibold">Beta Career Support - US$30/month</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Weekly mentoring, application organization, and LinkedIn/resume positioning. No employment-agency service or outcome guarantee.
            </p>
          </div>
          <Button onClick={() => setLocation("/dashboard/consulting")} className="gap-2">
            Prepare proposal
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardHome() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();


  const { data: applications } = trpc.application.list.useQuery();
  const { data: latestAnalysis } = trpc.resumeAnalysis.latest.useQuery();
  const { data: chatSessions } = trpc.chat.sessions.useQuery();
  const { data: xpProfile } = trpc.gamification.profile.useQuery();
  const { data: savedResume } = trpc.resume.get.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: survey } = trpc.survey.get.useQuery();

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
  const savedJobs = applications?.filter(a => a.status === "bookmarked").length ?? 0;
  const surveyLookingFor = (survey?.lookingFor as string[] | undefined) ?? [];
  const isCoach = surveyLookingFor.includes("audience:career_consultant");

  const journeySteps = [
    { label: "Build profile", done: Boolean((profile as any)?.targetRole || (profile as any)?.fullName), path: "/dashboard/profile" },
    { label: "Find target jobs", done: savedJobs > 0 || totalApps > 0, path: "/dashboard/jobs" },
    { label: "Analyze resume", done: resumeScore !== null, path: "/dashboard/resume" },
    { label: "Evaluate fit", done: false, path: "/dashboard/fit" },
    { label: "Prepare interview", done: interviewApps > 0, path: "/dashboard/interview" },
  ];
  const nextJourneyStep = journeySteps.find(step => !step.done) ?? { label: "Generate report", done: false, path: "/dashboard/reports" };
  const pipelineStages = [
    {
      label: "Saved leads",
      count: savedJobs,
      helper: "Jobs to qualify",
      path: "/dashboard/saved",
      bar: "bg-sky-500",
      bg: "bg-sky-50",
      text: "text-sky-700",
    },
    {
      label: "Applied",
      count: applications?.filter(a => a.status === "applied").length ?? 0,
      helper: "Waiting for signal",
      path: "/dashboard/applications",
      bar: "bg-cyan-500",
      bg: "bg-cyan-50",
      text: "text-cyan-700",
    },
    {
      label: "Interview",
      count: interviewApps,
      helper: "Prep required",
      path: "/dashboard/interview",
      bar: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    {
      label: "Offer",
      count: offerApps,
      helper: "Negotiate close",
      path: "/dashboard/applications",
      bar: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
  ];
  const maxPipelineCount = Math.max(1, ...pipelineStages.map(stage => stage.count));
  const nextBestActions = [
    {
      label: `Continue: ${nextJourneyStep.label}`,
      detail: "Your agent picked this as the next bottleneck.",
      icon: ArrowRight,
      path: nextJourneyStep.path,
    },
    {
      label: interviewApps > 0 ? "Prep interview stories" : "Score fit for target roles",
      detail: interviewApps > 0 ? `${interviewApps} interview-stage role${interviewApps === 1 ? "" : "s"} need prep.` : "Prioritize roles before applying.",
      icon: ClipboardCheck,
      path: interviewApps > 0 ? "/dashboard/interview" : "/dashboard/fit",
    },
    {
      label: activeApps > 0 ? "Send follow-up nudges" : "Source 5 qualified leads",
      detail: activeApps > 0 ? "Keep active applications moving." : "Build a pipeline before tailoring.",
      icon: Send,
      path: activeApps > 0 ? "/dashboard/applications" : "/dashboard/jobs",
    },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.dashboard.goodMorning;
    if (hour < 18) return t.dashboard.goodAfternoon;
    return t.dashboard.goodEvening;
  };

  if (isCoach) {
    return <CoachDashboardHome userName={user?.name} survey={survey} setLocation={setLocation} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 overflow-hidden px-3 py-4 sm:px-4 md:px-6 md:py-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-foreground">
            {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.dashboard.todayOverview}
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/jobs")}
          className="gap-2 hidden sm:flex"
          size="sm"
        >
          <Briefcase className="w-4 h-4" />
          {t.dashboard.browseJobs}
        </Button>
      </div>

      {isCoach && (
        <Card className="overflow-hidden border-cyan-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white shadow-lg">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <Badge className="mb-3 bg-cyan-300 text-slate-950 hover:bg-cyan-300">Coach workspace beta</Badge>
                <h2 className="text-xl font-black tracking-tight">Support candidates with JobPA Career Ops</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                  This account is marked as a career coach. Use JobPA to structure intake, resume and LinkedIn reviews,
                  weekly mentoring plans, and future paid service delivery without promising employment outcomes.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
                <Button onClick={() => setLocation("/dashboard/consulting")} className="gap-2 bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                  <Users className="h-4 w-4" />
                  Coach workspace
                </Button>
                <Button onClick={() => setLocation("/dashboard/career-ops")} variant="outline" className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/15">
                  <Radar className="h-4 w-4" />
                  Career Ops flow
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["Candidate intake", "Collect structured context before AI analysis."],
                ["Review workflow", "Package resume, LinkedIn, and weekly check-ins."],
                ["Paid funnel", "Separate free tools from scoped mentoring support."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                  <p className="text-sm font-bold text-cyan-100">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">Agentic AI Career Ops</p>
              <p className="text-sm text-muted-foreground mt-1">
                Next step: <span className="font-medium text-foreground">{nextJourneyStep.label}</span>
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {journeySteps.map(step => (
                <button
                  key={step.label}
                  onClick={() => setLocation(step.path)}
                  className={`max-w-full rounded-full border px-3 py-1 text-left text-xs font-medium ${
                    step.done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : step.label === nextJourneyStep.label
                        ? "border-primary bg-background text-primary"
                        : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {step.done ? "Done" : "Next"} · {step.label}
                </button>
              ))}
            </div>
            <Button onClick={() => setLocation(nextJourneyStep.path)} size="sm" className="w-full gap-2 sm:w-auto">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

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

      <Card className="overflow-hidden border-cyan-200/60 bg-gradient-to-br from-white via-cyan-50/40 to-slate-50 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Radar className="h-4 w-4 text-cyan-600" />
                <p className="text-sm font-bold text-slate-900">Career Pipeline CRM</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage each opportunity like a sales pipeline: source, apply, follow up, interview, close.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setLocation("/dashboard/career-ops")}>
              Open Career Ops
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {pipelineStages.map((stage) => (
              <button
                key={stage.label}
                onClick={() => setLocation(stage.path)}
                className={`group rounded-2xl border border-white/70 ${stage.bg} p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.14em] ${stage.text}`}>{stage.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{stage.helper}</p>
                  </div>
                  <span className={`text-2xl font-black ${stage.text}`}>{stage.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/70">
                  <div
                    className={`h-full rounded-full ${stage.bar} transition-all`}
                    style={{ width: `${Math.max(10, Math.round((stage.count / maxPipelineCount) * 100))}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {nextBestActions.map(({ icon: Icon, label, detail, path }) => (
              <button
                key={label}
                onClick={() => setLocation(path)}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 text-left shadow-sm transition hover:border-cyan-300 hover:bg-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-cyan-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{detail}</span>
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
                { icon: Briefcase, label: t.dashboard.browseJobsAction, path: "/dashboard/jobs" },
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
                    onClick={() => setLocation("/dashboard/jobs")}
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
