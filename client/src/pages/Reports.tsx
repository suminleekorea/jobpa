import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { BarChart3, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const { t } = useI18n();
  const { data: reports, isLoading } = trpc.report.list.useQuery();
  const generate = trpc.report.generate.useMutation({
    onSuccess: () => toast.success("Report generated"),
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
          {t.reports.generate}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="text-center py-20">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium">{t.reports.noReports}</h3>
          <p className="text-sm text-muted-foreground mt-1">Generate your first report to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{report.reportType}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
