import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { FileText, Upload, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function ResumeAnalysis() {
  const { t } = useI18n();
  const { data: resume } = trpc.resume.get.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.resume.title}</h1>
        <p className="text-muted-foreground mt-1">{t.resume.subtitle}</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{t.resume.upload}</h3>
          <p className="text-sm text-muted-foreground mb-6">{t.resume.uploadDesc}</p>
          <Button onClick={() => toast.info(t.common.comingSoon)} className="gap-2">
            <FileText className="h-4 w-4" />
            {t.resume.upload}
          </Button>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>PDF, DOCX, TXT (max 10MB)</span>
          </div>
        </CardContent>
      </Card>

      {resume && resume.analysisResult != null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.resume.overallScore}: {String(resume.overallScore ?? 0)}/100
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Analysis results will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
