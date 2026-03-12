import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import {
  Bookmark, Briefcase, Building2, Calendar, ExternalLink, MapPin,
  MoreHorizontal, Trash2, StickyNote, Loader2, ArrowRight
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-800",
  interview: "bg-amber-100 text-amber-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
  bookmarked: "bg-violet-100 text-violet-800",
};

const STATUS_ORDER = ["applied", "interview", "offer", "rejected", "withdrawn", "bookmarked"] as const;

export default function Applications() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notesModal, setNotesModal] = useState<{ id: number; notes: string } | null>(null);

  const { data: apps, isLoading } = trpc.application.list.useQuery();
  const utils = trpc.useUtils();

  const updateStatus = trpc.application.updateStatus.useMutation({
    onSuccess: () => { utils.application.list.invalidate(); toast.success("Status updated"); },
  });
  const removeApp = trpc.application.remove.useMutation({
    onSuccess: () => { utils.application.list.invalidate(); toast.success("Removed"); },
  });
  const saveNotes = trpc.application.updateStatus.useMutation({
    onSuccess: () => { utils.application.list.invalidate(); setNotesModal(null); toast.success("Notes saved"); },
  });

  const filtered = apps?.filter(a => filterStatus === "all" || a.status === filterStatus) || [];

  const statusCounts = apps?.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!apps || apps.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.applications.title}</h1>
          <p className="text-muted-foreground mt-1">{t.applications.subtitle}</p>
        </div>
        <div className="text-center py-20">
          <Bookmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium">{t.applications.noApps}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{t.applications.noAppsDesc}</p>
          <Button onClick={() => setLocation("/dashboard")} className="gap-2">
            {t.applications.goToJobs}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.applications.title}</h1>
        <p className="text-muted-foreground mt-1">{t.applications.subtitle}</p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button
          onClick={() => setFilterStatus("all")}
          className={`p-3 rounded-lg border text-center transition-all ${filterStatus === "all" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
        >
          <div className="text-lg font-bold">{apps.length}</div>
          <div className="text-xs text-muted-foreground">{t.applications.all}</div>
        </button>
        {STATUS_ORDER.filter(s => s !== "bookmarked").map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`p-3 rounded-lg border text-center transition-all ${filterStatus === status ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
          >
            <div className="text-lg font-bold">{statusCounts[status] || 0}</div>
            <div className="text-xs text-muted-foreground">{(t.applications.statuses as any)[status]}</div>
          </button>
        ))}
      </div>

      {/* Application list */}
      <div className="grid gap-3">
        {filtered.map(app => (
          <Card key={app.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-sm">{app.jobTitle}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                      {(t.applications.statuses as any)[app.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {app.company}
                    </span>
                    {app.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {app.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t.applications.appliedOn}: {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {app.notes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-secondary/50 rounded px-2 py-1">{app.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Select
                    value={app.status}
                    onValueChange={(val) => updateStatus.mutate({ id: app.id, status: val as any })}
                  >
                    <SelectTrigger className="h-8 w-auto text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ORDER.map(s => (
                        <SelectItem key={s} value={s}>{(t.applications.statuses as any)[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setNotesModal({ id: app.id, notes: app.notes || "" })}>
                        <StickyNote className="mr-2 h-4 w-4" />
                        {t.applications.notes}
                      </DropdownMenuItem>
                      {app.applyUrl && (
                        <DropdownMenuItem onClick={() => window.open(app.applyUrl!, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t.jobs.applyExternal}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => removeApp.mutate({ id: app.id })} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.applications.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notes Modal */}
      <Dialog open={!!notesModal} onOpenChange={() => setNotesModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.applications.notes}</DialogTitle>
            <DialogDescription>Add notes about this application</DialogDescription>
          </DialogHeader>
          {notesModal && (
            <div className="space-y-4">
              <Textarea
                value={notesModal.notes}
                onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNotesModal(null)}>{t.common.cancel}</Button>
                <Button
                  onClick={() => saveNotes.mutate({ id: notesModal.id, status: "applied", notes: notesModal.notes })}
                  disabled={saveNotes.isPending}
                >
                  {t.common.save}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
