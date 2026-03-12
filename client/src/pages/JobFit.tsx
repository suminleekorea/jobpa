import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { Target, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function JobFit() {
  const { t } = useI18n();
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const { data: resume } = trpc.resume.get.useQuery();
  const { data: history } = trpc.fit.history.useQuery();
  const evaluate = trpc.fit.evaluate.useMutation({
    onSuccess: () => toast.success("Evaluation saved"),
    onError: (err) => toast.error(err.message),
  });
  const hasResume = resume && resume.analysisResult != null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.fit.title}</h1>
        <p className="text-muted-foreground mt-1">{t.fit.subtitle}</p>
      </div>
      {!hasResume && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">{t.fit.needResume}</p>
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
          <Button onClick={() => evaluate.mutate({ targetRole, jobDescription })} disabled={evaluate.isPending || !jobDescription.trim()} className="gap-2">
            {evaluate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            {t.fit.evaluate}
          </Button>
        </CardContent>
      </Card>
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
