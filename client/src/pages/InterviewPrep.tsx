import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Briefcase, CalendarCheck, FileText, Loader2, Mail, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function InterviewPrep() {
  const [, setLocation] = useLocation();
  const { data: applications, isLoading: appsLoading } = trpc.application.list.useQuery();
  const { data: preps, refetch } = trpc.interview.list.useQuery();
  const [applicationId, setApplicationId] = useState("");
  const [notes, setNotes] = useState("");
  const [latestPrep, setLatestPrep] = useState<any>(null);

  const interviewApps = useMemo(
    () => (applications ?? []).filter(app => ["interview", "offer"].includes(app.status)),
    [applications]
  );

  const generatePrep = trpc.interview.prep.useMutation({
    onSuccess: (data) => {
      setLatestPrep(data.prep);
      refetch();
      toast.success("Interview prep generated");
    },
    onError: (error) => toast.error(error.message || "Could not generate interview prep"),
  });

  const selected = interviewApps.find(app => String(app.id) === applicationId);
  const prep = latestPrep ?? ((preps?.[0]?.prep as any) || null);

  if (appsLoading) {
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
          <h1 className="text-2xl font-bold tracking-tight">Interview Prep</h1>
          <p className="text-muted-foreground mt-1">Turn interview-stage applications into questions, stories, and follow-up actions.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/dashboard/applications")} className="gap-2">
          <Briefcase className="h-4 w-4" />
          Applications
        </Button>
      </div>

      {interviewApps.length === 0 ? (
        <div className="text-center py-20 rounded-lg border border-dashed">
          <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium">No interview-stage applications yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Move an application to Interview in the tracker, then generate prep here.
          </p>
          <Button onClick={() => setLocation("/dashboard/applications")}>Open Applications Tracker</Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Prep
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Interview application</Label>
              <Select value={applicationId} onValueChange={setApplicationId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select an interview-stage application" />
                </SelectTrigger>
                <SelectContent>
                  {interviewApps.map(app => (
                    <SelectItem key={app.id} value={String(app.id)}>
                      {app.company} - {app.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Notes from recruiter or job description</Label>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Paste interview format, recruiter notes, company priorities, or open questions..."
                className="mt-1.5"
              />
            </div>
            <Button
              onClick={() => generatePrep.mutate({
                applicationId: Number(applicationId),
                jobTitle: selected?.jobTitle,
                company: selected?.company,
                notes,
              })}
              disabled={!applicationId || generatePrep.isPending}
              className="gap-2"
            >
              {generatePrep.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Interview Prep
            </Button>
          </CardContent>
        </Card>
      )}

      {prep && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Likely Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {(prep.likelyQuestions ?? []).map((question: string, index: number) => (
                  <li key={index} className="rounded-md border bg-card p-3">{question}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                STAR Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {(prep.starStories ?? []).map((story: string, index: number) => (
                  <li key={index} className="rounded-md border bg-card p-3">{story}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Follow-Up Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{prep.followUpTiming}</p>
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-4 text-sm font-sans">{prep.followUpEmail}</pre>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{prep.disclaimer || "AI interview preparation is guidance only. Tailor every answer truthfully to your own experience."}</span>
          </div>
        </div>
      )}
    </div>
  );
}
