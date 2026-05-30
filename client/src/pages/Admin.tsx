import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { Users, Briefcase, FileText, Sparkles, Loader2, Shield, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function Admin() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (user?.role !== "admin") {
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

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.admin.users.useQuery();
  const { data: waitlist } = trpc.consulting.getWaitlist.useQuery();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: "Total Users", value: stats?.totalUsers ?? 0, color: "text-blue-600 bg-blue-50" },
    { icon: Briefcase, label: "Total Applications", value: stats?.totalApplications ?? 0, color: "text-emerald-600 bg-emerald-50" },
    { icon: FileText, label: "Resumes Uploaded", value: stats?.totalResumes ?? 0, color: "text-violet-600 bg-violet-50" },
    { icon: Sparkles, label: "Waitlist Signups", value: stats?.totalWaitlist ?? 0, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.nav.admin}</h1>
        <p className="text-muted-foreground mt-1">Platform overview and user management.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{String(stat.value)}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Signup Trend */}
      {stats?.recentSignups && stats.recentSignups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Signups (Last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentSignups.slice(0, 10).map((day, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{String(day.date)}</span>
                  <span className="text-sm font-medium">{String(day.count)} new users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
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

      {/* Consulting Waitlist */}
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
