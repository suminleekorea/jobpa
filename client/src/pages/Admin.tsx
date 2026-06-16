import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  BarChart3,
  Bot,
  Briefcase,
  Calendar,
  CalendarCheck,
  CheckSquare,
  FileText,
  Gauge,
  Inbox,
  Loader2,
  MessageCircle,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  bookmarked: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

function formatNumber(value: unknown) {
  if (typeof value === "string" && value.trim().endsWith("%")) return value;
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : "0";
}

function clampPercent(value: unknown) {
  const numeric = Number(value ?? 0);
  return Math.max(0, Math.min(100, Number.isFinite(numeric) ? numeric : 0));
}

export default function Admin() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: users, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: waitlist } = trpc.consulting.getWaitlist.useQuery(undefined, {
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium">Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-1">Admin access only.</p>
        </div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusCounts = stats?.applicationStatusCounts ?? {
    bookmarked: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  };
  const maxStatusCount = Math.max(...Object.values(statusCounts).map(Number), 1);

  const statCards = [
    {
      icon: Users,
      label: "Total users",
      value: stats?.totalUsers ?? 0,
      detail: `${formatNumber(stats?.active30)} active in 30 days`,
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: Bot,
      label: "AI-assisted users",
      value: stats?.aiAssistedUsers ?? 0,
      detail: "Resume, fit, chat, or interview agent",
      color: "text-violet-600 bg-violet-50",
    },
    {
      icon: Gauge,
      label: "Journey score",
      value: `${stats?.journeyManagementScore ?? 0}%`,
      detail: "Average funnel coverage",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: Briefcase,
      label: "Applications",
      value: stats?.totalApplications ?? 0,
      detail: `${formatNumber(statusCounts.interview)} interviews, ${formatNumber(statusCounts.offer)} offers`,
      color: "text-amber-600 bg-amber-50",
    },
    {
      icon: FileText,
      label: "Resume analyses",
      value: stats?.totalResumeAnalyses || stats?.totalResumes || 0,
      detail: `${formatNumber(stats?.resumeManagedUsers)} users covered`,
      color: "text-sky-600 bg-sky-50",
    },
    {
      icon: Target,
      label: "Job fit evaluations",
      value: stats?.totalJobFitEvaluations ?? 0,
      detail: `${formatNumber(stats?.fitUsers)} users received fit guidance`,
      color: "text-rose-600 bg-rose-50",
    },
    {
      icon: CalendarCheck,
      label: "Interview preps",
      value: stats?.totalInterviewPreps ?? 0,
      detail: "Questions, STAR stories, follow-up email",
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      icon: TrendingUp,
      label: "Long-term actions",
      value: (stats?.totalReports ?? 0) + (stats?.totalChecklistItems ?? 0) + (stats?.totalJournalEntries ?? 0),
      detail: "Reports, checklists, journals",
      color: "text-teal-600 bg-teal-50",
    },
  ];

  const aiMetrics = [
    { icon: Sparkles, label: "Agent tasks", value: stats?.totalAgentTasks ?? 0 },
    { icon: MessageCircle, label: "Chat messages", value: stats?.totalChatMessages ?? 0 },
    { icon: BarChart3, label: "Reports", value: stats?.totalReports ?? 0 },
    { icon: CheckSquare, label: "Checklist items", value: stats?.totalChecklistItems ?? 0 },
    { icon: Inbox, label: "Email accounts", value: stats?.totalEmailAccounts ?? 0 },
    { icon: Activity, label: "Synced email signals", value: stats?.totalEmailMessages ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.nav.admin}</h1>
        <p className="text-muted-foreground mt-1">
          Platform users, AI-agent career journey coverage, and operating signals.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
                  <p className="text-xs font-medium text-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{stat.detail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Career Journey Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.journeyFunnel?.length ? stats.journeyFunnel.map((item) => (
              <div key={item.key} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatNumber(item.count)}</p>
                    <p className="text-xs text-muted-foreground">{item.percent}%</p>
                  </div>
                </div>
                <Progress value={clampPercent(item.percent)} />
              </div>
            )) : (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                No journey data yet. Once users complete onboarding, save jobs, analyze resumes, and generate prep, this funnel will populate.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Application Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percent = Math.round((Number(count) / maxStatusCount) * 100);
              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>{statusLabels[status] ?? status}</span>
                    <span className="font-medium">{formatNumber(count)}</span>
                  </div>
                  <Progress value={percent} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Agent Operating Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {aiMetrics.map((metric) => (
                <div key={metric.label} className="rounded-md border p-3">
                  <metric.icon className="h-4 w-4 text-primary mb-2" />
                  <p className="text-xl font-semibold">{formatNumber(metric.value)}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>

            {stats?.agentTaskBreakdown?.length ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Agent task breakdown</p>
                {stats.agentTaskBreakdown.slice(0, 8).map((row, index) => (
                  <div key={`${row.agent}-${row.status}-${index}`} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                    <span>{row.agent || "unknown"} / {row.status || "unknown"}</span>
                    <span className="font-medium">{formatNumber(row.count)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Qualitative Journey Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.qualitativeInsights || []).map((insight, index) => (
              <div key={index} className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed">
                {insight}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              These are operational heuristics for internal review, not employment, legal, visa, or revenue guarantees.
            </p>
          </CardContent>
        </Card>
      </div>

      {stats?.recentSignups && stats.recentSignups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {stats.recentSignups.slice(0, 12).map((day, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="text-sm text-muted-foreground">{String(day.date)}</span>
                  <span className="text-sm font-medium">{String(day.count)} new users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users ({users?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Login</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30">
                      <td className="py-2 px-3">{u.name || "-"}</td>
                      <td className="py-2 px-3 text-muted-foreground">{u.email || "-"}</td>
                      <td className="py-2 px-3 text-muted-foreground">{u.loginMethod || "-"}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-3 text-muted-foreground">{new Date(u.lastSignedIn).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {waitlist && waitlist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Consulting Waitlist ({waitlist.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Message</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlist.map((w) => (
                    <tr key={w.id} className="border-b border-border/50">
                      <td className="py-2 px-3">{w.name || "-"}</td>
                      <td className="py-2 px-3">{w.email}</td>
                      <td className="py-2 px-3 text-muted-foreground max-w-xs truncate">{w.message || "-"}</td>
                      <td className="py-2 px-3 text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
