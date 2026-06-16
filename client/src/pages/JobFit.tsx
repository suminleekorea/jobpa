import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { Target, Loader2, AlertCircle, UserCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function JobFit() {
  const { t } = useI18n();
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [currentResult, setCurrentResult] = useState<any>(null);
  const { data: resume } = trpc.resume.get.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: history } = trpc.fit.history.useQuery();
  const utils = trpc.useUtils();
  const evaluate = trpc.fit.evaluate.useMutation({
    onSuccess: (data: any) => {
      setCurrentResult(data.result ?? data);
      utils.fit.history.invalidate();
      toast.success("Evaluation saved");
    },
    onError: (err) => toast.error(err.message),
  });
  const hasResume = resume && resume.analysisResult != null;
  const hasProfile = profile && (profile.fullName || (profile.skills && (profile.skills as string[]).length > 0) || (profile.experience && (profile.experience as unknown[]).length > 0));

  // Pre-fill target role from profile
  useEffect(() => {
    if (profile?.targetRole && !targetRole) {
      setTargetRole(profile.targetRole);
    }
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.fit.title}</h1>
        <p className="text-muted-foreground mt-1">{t.fit.subtitle}</p>
      </div>

      {/* Profile banner - shown when user has a profile */}
      {hasProfile && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">{profile.fullName || profile.headline}</p>
              <p className="text-xs text-blue-600">{t.myProfile.usedInFit}</p>
            </div>
            <Link href="/dashboard/profile" className="text-xs text-blue-600 underline">
              {t.nav.myProfile}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* No resume and no profile warning */}
      {!hasResume && !hasProfile && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800">{t.fit.needResume}</p>
            </div>
            <Link href="/dashboard/profile" className="text-xs text-amber-700 underline flex items-center gap-1">
              <UserCircle className="w-3 h-3" />
              {t.nav.myProfile}
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium">{t.fit.targetRole}</Label>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. AI Engineer" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-sm font-medium">Job Description</Label>
            <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder={t.fit.jdPlaceholder} rows={8} className="mt-1.5" />
          </div>
          <Button onClick={() => evaluate.mutate({ targetRole, jobDescription })} disabled={evaluate.isPending || jobDescription.trim().length < 20} className="gap-2">
            {evaluate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            {t.fit.evaluate}
          </Button>
        </CardContent>
      </Card>
      {currentResult?.fitScore != null && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">Fit Evaluation</h2>
                <p className="text-sm text-muted-foreground">AI guidance only; recruiter decisions are not guaranteed.</p>
              </div>
              <div className="text-3xl font-bold text-primary">{currentResult.fitScore}/100</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">Matched skills</p>
                <div className="flex flex-wrap gap-2">
                  {(currentResult.matchedSkills ?? []).length > 0 ? currentResult.matchedSkills.map((skill: string) => (
                    <span key={skill} className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">{skill}</span>
                  )) : <span className="text-sm text-muted-foreground">No strong matches detected yet.</span>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Missing skills</p>
                <div className="flex flex-wrap gap-2">
                  {(currentResult.missingSkills ?? []).length > 0 ? currentResult.missingSkills.map((skill: string) => (
                    <span key={skill} className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">{skill}</span>
                  )) : <span className="text-sm text-muted-foreground">No major keyword gaps detected.</span>}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">Application strategy</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {(currentResult.strategy ?? []).map((item: string, index: number) => <li key={index}>{item}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Interview prep</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  {(currentResult.interviewTips ?? []).map((item: string, index: number) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {history && history.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Previous Evaluations</h2>
          {history.map((ev) => (
            <Card key={ev.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{ev.targetRole || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(ev.createdAt).toLocaleDateString()}</p>
                </div>
                {ev.fitScore != null && <div className="text-2xl font-bold text-primary">{String(ev.fitScore)}/100</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
