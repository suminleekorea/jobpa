import { useI18n } from "@/contexts/i18nContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Sparkles, Loader2,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const INDUSTRY_SECTORS = [
  { id: "all", icon: "\u{1F310}", labelKo: "\uC804\uCCB4 \uC0B0\uC5C5", labelEn: "All Industries" },
  { id: "tech", icon: "\u{1F4BB}", labelKo: "\uAE30\uC220/IT", labelEn: "Tech / IT" },
  { id: "finance", icon: "\u{1F4B0}", labelKo: "\uAE08\uC735/\uD540\uD14C\uD06C", labelEn: "Finance / Fintech" },
  { id: "healthcare", icon: "\u{1F3E5}", labelKo: "\uD5EC\uC2A4\uCF00\uC5B4", labelEn: "Healthcare" },
  { id: "energy", icon: "\u26A1", labelKo: "\uC5D0\uB108\uC9C0/ESG", labelEn: "Energy / ESG" },
  { id: "marketing", icon: "\u{1F4E3}", labelKo: "\uB9C8\uCF00\uD305", labelEn: "Marketing" },
  { id: "consulting", icon: "\u{1F3E2}", labelKo: "\uCEE8\uC124\uD305", labelEn: "Consulting" },
];

const REGIONS = [
  { id: "Singapore, Korea, India", labelKo: "\uC2F1\uAC00\uD3EC\uB974 + \uD55C\uAD6D + \uC778\uB3C4", labelEn: "SG + Korea + India" },
  { id: "Singapore", labelKo: "\uC2F1\uAC00\uD3EC\uB974", labelEn: "Singapore" },
  { id: "Korea", labelKo: "\uD55C\uAD6D", labelEn: "Korea" },
  { id: "India", labelKo: "\uC778\uB3C4", labelEn: "India" },
];

const STATIC_TRENDS = [
  {
    sector: "tech", icon: "\u{1F4BB}", trend: "up",
    titleKo: "AI/ML \uC5D4\uC9C0\uB2C8\uC5B4 \uC218\uC694 \uAE09\uC99D", titleEn: "AI/ML Engineering Demand Surges",
    descKo: "AI \uBC0F \uBA38\uC2E0\uB7EC\uB2DD \uC9C1\uBB34\uAC00 APAC \uC804\uC5ED\uC5D0\uC11C \uC804\uB144 \uB300\uBE44 45% \uC99D\uAC00\uD588\uC2B5\uB2C8\uB2E4.",
    descEn: "AI and machine learning roles have grown 45% YoY across APAC.",
    skills: ["Python", "PyTorch", "LLM", "RAG", "MLOps"],
    salaryChange: "+12%", region: "APAC",
  },
  {
    sector: "finance", icon: "\u{1F4B0}", trend: "stable",
    titleKo: "\uD540\uD14C\uD06C \uCC44\uC6A9 \uC548\uC815\uD654", titleEn: "Fintech Hiring Stabilizes",
    descKo: "\uAE09\uACA9\uD55C \uC131\uC7A5 \uC774\uD6C4 \uD540\uD14C\uD06C \uCC44\uC6A9\uC774 \uC548\uC815\uD654. \uCEF4\uD50C\uB77C\uC774\uC5B8\uC2A4 \uC218\uC694 \uB192\uC74C.",
    descEn: "After rapid growth, fintech hiring has stabilized. Compliance roles in high demand.",
    skills: ["Compliance", "Risk", "Blockchain", "RegTech"],
    salaryChange: "+5%", region: "Singapore",
  },
  {
    sector: "healthcare", icon: "\u{1F3E5}", trend: "up",
    titleKo: "\uD5EC\uC2A4\uD14C\uD06C \uD22C\uC790 \uAE09\uC99D", titleEn: "HealthTech Investment Surges",
    descKo: "\uB514\uC9C0\uD138 \uD5EC\uC2A4\uCF00\uC5B4 \uBC0F \uBC14\uC774\uC624\uD14C\uD06C \uBD84\uC57C \uD22C\uC790\uAC00 \uC99D\uAC00\uD558\uBA70 \uAD00\uB828 \uC9C1\uBB34 \uC218\uC694 \uC0C1\uC2B9.",
    descEn: "Digital health and biotech investment is rising, driving demand for tech-health hybrid roles.",
    skills: ["Data Science", "Bioinformatics", "HL7 FHIR", "Python"],
    salaryChange: "+9%", region: "Singapore",
  },
];

function MarkdownContent({ content }: { content: string }) {
  const html = content
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-5 mb-2 text-foreground">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-3 mb-1 text-foreground">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm text-muted-foreground">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm text-muted-foreground">$2</li>')
    .replace(/\n\n/g, '</p><p class="mt-2 text-sm text-muted-foreground">')
    .replace(/\n/g, '<br/>');
  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-muted-foreground">${html}</p>` }}
    />
  );
}

export default function Trends() {
  const { language, t } = useI18n();
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("Singapore, Korea, India");
  const [aiResult, setAiResult] = useState<{ content: string; sector: string; region: string; generatedAt: string } | null>(null);

  const generate = trpc.trend.generate.useMutation({
    onSuccess: (data) => {
      setAiResult(data);
      toast.success(t.trends.generated);
    },
    onError: (err) => toast.error(err.message || "Failed to generate trends"),
  });

  const sectorLabel = (s: typeof INDUSTRY_SECTORS[0]) => language === "ko" ? s.labelKo : s.labelEn;
  const regionLabel = (r: typeof REGIONS[0]) => language === "ko" ? r.labelKo : r.labelEn;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            {t.trends.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.trends.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRY_SECTORS.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.icon} {sectorLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.id} value={r.id}>{regionLabel(r)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => generate.mutate({ sector: selectedSector === "all" ? undefined : selectedSector, region: selectedRegion })}
            disabled={generate.isPending}
            className="gap-2"
          >
            {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generate.isPending ? t.trends.generating : t.trends.generate}
          </Button>
        </div>
      </div>

      {aiResult && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {t.trends.aiReport}
              <Badge variant="secondary" className="ml-auto text-xs">
                {new Date(aiResult.generatedAt).toLocaleDateString()}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {aiResult.sector !== "all sectors" ? `${aiResult.sector} \u00B7 ` : ""}{aiResult.region}
            </p>
          </CardHeader>
          <CardContent>
            <MarkdownContent content={aiResult.content} />
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 gap-1 text-xs"
              onClick={() => generate.mutate({ sector: selectedSector === "all" ? undefined : selectedSector, region: selectedRegion })}
              disabled={generate.isPending}
            >
              <RefreshCw className="h-3 w-3" />
              {t.trends.regenerate}
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          {t.trends.keyHighlights}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STATIC_TRENDS.map((item, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-sm leading-tight">
                        {language === "ko" ? item.titleKo : item.titleEn}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.region}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.trend === "up" ? "bg-emerald-100 text-emerald-700" :
                    item.trend === "down" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {item.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> :
                     item.trend === "down" ? <ArrowDownRight className="h-3 w-3" /> :
                     <Minus className="h-3 w-3" />}
                    {item.salaryChange}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {language === "ko" ? item.descKo : item.descEn}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs px-2 py-0">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {!aiResult && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3" />
            <h3 className="font-medium mb-1">
              {t.trends.getLatest}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t.trends.getLatestDesc}
            </p>
            <Button
              onClick={() => generate.mutate({ sector: selectedSector === "all" ? undefined : selectedSector, region: selectedRegion })}
              disabled={generate.isPending}
              className="gap-2"
            >
              {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {t.trends.generate}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
