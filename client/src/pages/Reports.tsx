import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { BarChart3, Loader2, FileText, ChevronRight, Calendar } from "lucide-react";
import { toast } from "sonner";

// Simple markdown renderer
function MarkdownContent({ content }: { content: string }) {
  const html = content
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2 text-foreground">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1 text-foreground">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$2</li>')
    .replace(/\n\n/g, '</p><p class="mt-2 text-sm text-muted-foreground">')
    .replace(/\n/g, '<br/>');
  return (
    <div
      className="prose prose-sm max-w-none text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-muted-foreground">${html}</p>` }}
    />
  );
}

export default function Reports() {
  const { t, language } = useI18n();
  const { data: reports, isLoading, refetch } = trpc.report.list.useQuery();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const generate = trpc.report.generate.useMutation({
    onSuccess: () => {
      toast.success(t.reports.reportGenerated);
      refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to generate report"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.reports.title}</h1>
          <p className="text-muted-foreground mt-1">{t.reports.subtitle}</p>
        </div>
        <Button onClick={() => generate.mutate()} disabled={generate.isPending} className="gap-2">
          {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          {generate.isPending ? t.reports.generating : t.reports.generate}
        </Button>
      </div>

      {/* What is a Daily Report */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-primary mb-1">
            {t.reports.whatIsReport}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.reports.criteriaDetail}
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="text-center py-20">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium">{t.reports.noReports}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t.reports.firstReportDesc}
          </p>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending} className="mt-4 gap-2">
            {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            {t.reports.generateFirst}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{report.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString(undefined, {
                          year: "numeric", month: "long", day: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {report.reportType === "daily" ? t.reports.daily : report.reportType}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedReport?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {selectedReport?.content ? (
              <MarkdownContent content={selectedReport.content} />
            ) : (
              <p className="text-sm text-muted-foreground">{t.reports.noContent}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
