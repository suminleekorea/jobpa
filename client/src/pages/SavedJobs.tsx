import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getExternalHref } from "@/lib/externalLinks";
import { trpc } from "@/lib/trpc";
import { Bookmark, Briefcase, Building2, ExternalLink, Loader2, MapPin, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function SavedJobs() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: applications, isLoading } = trpc.application.list.useQuery();
  const updateStatus = trpc.application.updateStatus.useMutation({
    onSuccess: () => {
      utils.application.list.invalidate();
      toast.success("Moved to Applications Tracker");
    },
  });
  const removeApp = trpc.application.remove.useMutation({
    onSuccess: () => {
      utils.application.list.invalidate();
      toast.success("Removed from saved jobs");
    },
  });

  const savedJobs = (applications ?? []).filter(app => app.status === "bookmarked");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Jobs</h1>
          <p className="text-muted-foreground mt-1">Shortlist roles, then move the strongest ones into your tracker.</p>
        </div>
        <Button onClick={() => setLocation("/dashboard/jobs")} className="gap-2">
          <Briefcase className="h-4 w-4" />
          Find Jobs
        </Button>
      </div>

      {savedJobs.length === 0 ? (
        <div className="text-center py-20 rounded-lg border border-dashed">
          <Bookmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium">No saved jobs yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Save a few roles from Job Postings, then run fit checks before applying.
          </p>
          <Button onClick={() => setLocation("/dashboard/jobs")} className="gap-2">
            Browse Job Postings
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {savedJobs.map(job => {
            const applyHref = getExternalHref(job.applyUrl);
            return (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{job.jobTitle}</h3>
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                          saved
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.company}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {job.location}
                          </span>
                        )}
                        {job.salary && <span>{job.salary}</span>}
                      </div>
                      {job.notes && <p className="mt-2 text-sm text-muted-foreground">{job.notes}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {applyHref && (
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <a href={applyHref} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: job.id, status: "applied" })}
                        disabled={updateStatus.isPending}
                      >
                        Start Application
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeApp.mutate({ id: job.id })}
                        disabled={removeApp.isPending}
                        aria-label="Remove saved job"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
