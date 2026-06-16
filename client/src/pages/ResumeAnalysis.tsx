import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/contexts/i18nContext";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  FileText, Upload, Loader2, AlertCircle, CheckCircle2, XCircle,
  TrendingUp, Target, Lightbulb, Globe, RefreshCw, ChevronDown, ChevronUp,
  Zap, ArrowUp, ArrowRight, Sparkles, MapPin, Tag
} from "lucide-react";
import { toast } from "sonner";
import { ResumeTemplates } from "@/components/ResumeTemplates";
import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Improvement {
  issue: string;
  suggestion: string;
  impact: string;
  priority: "high" | "medium" | "low";
}

interface ActionPlanTask {
  title: string;
  category: "skill" | "resume" | "research" | "network" | "prep";
}

interface AnalysisResult {
  interviewProbability: number;
  overallScore: number;
  strengths: string[];
  improvements: Improvement[];
  regionSpecificTips: string[];
  missingKeywords: string[];
  actionPlanTasks: ActionPlanTask[];
  summary: string;
  targetRegion?: string;
  analyzedAt?: number;
}

type AnalysisStatus = "idle" | "pending" | "success" | "partial" | "failed";

const PARSE_FALLBACK_MESSAGE = "We could not fully parse this file. You can paste your resume text instead.";

// ─── Region options ───────────────────────────────────────────────────────────
const REGIONS = [
  { value: "singapore", label: "🇸🇬 Singapore", flag: "SG" },
  { value: "korea", label: "🇰🇷 Korea", flag: "KR" },
  { value: "uae", label: "🇦🇪 UAE / Dubai", flag: "AE" },
  { value: "hongkong", label: "🇭🇰 Hong Kong", flag: "HK" },
  { value: "australia", label: "🇦🇺 Australia", flag: "AU" },
];

// ─── Probability Gauge ────────────────────────────────────────────────────────
function ProbabilityGauge({ value }: { value: number }) {
  const color = value >= 70 ? "text-emerald-600" : value >= 45 ? "text-amber-500" : "text-rose-500";
  const bgColor = value >= 70 ? "bg-emerald-500" : value >= 45 ? "bg-amber-500" : "bg-rose-500";
  const label = value >= 70 ? "High" : value >= 45 ? "Moderate" : "Low";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={value >= 70 ? "#10b981" : value >= 45 ? "#f59e0b" : "#f43f5e"}
            strokeWidth="12"
            strokeDasharray={`${(value / 100) * 314} 314`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{value}%</span>
          <span className="text-xs text-muted-foreground">Interview</span>
        </div>
      </div>
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
        value >= 70 ? "bg-emerald-50 text-emerald-700" : value >= 45 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
      }`}>
        <div className={`h-2 w-2 rounded-full ${bgColor}`} />
        {label} Probability
      </div>
    </div>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const config = {
    high: { label: "High", className: "bg-rose-50 text-rose-700 border-rose-200" },
    medium: { label: "Medium", className: "bg-amber-50 text-amber-700 border-amber-200" },
    low: { label: "Low", className: "bg-blue-50 text-blue-700 border-blue-200" },
  };
  const c = config[priority];
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${c.className}`}>{c.label}</span>;
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onFile, file, isDragging, onDragOver, onDragLeave, onDrop }: {
  onFile: (f: File) => void;
  file: File | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        isDragging ? "border-primary bg-primary/5" : file ? "border-emerald-400 bg-emerald-50/50" : "border-border hover:border-primary/50 hover:bg-secondary/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {file ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="font-medium text-emerald-700">{file.name}</p>
          <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Drop your resume here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
          <div className="flex items-center gap-2 mt-2">
            {["PDF", "DOCX", "TXT"].map(f => (
              <span key={f} className="px-2 py-0.5 rounded bg-secondary text-xs font-medium">{f}</span>
            ))}
            <span className="text-xs text-muted-foreground">· max 10MB</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ResumeAnalysis() {
  const { t, language } = useI18n();
  const [, setLocation] = useLocation();
  const { data: savedResume, refetch } = trpc.resume.get.useQuery();
  const utils = trpc.useUtils();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [targetRegion, setTargetRegion] = useState("singapore");
  const [jobDescription, setJobDescription] = useState("");
  const [showJD, setShowJD] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [pasteText, setPasteText] = useState("");
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [parseInfo, setParseInfo] = useState<{ method: string; label: string | null; warning: string | null } | null>(null);

  // Sync savedResume to result state once data loads (fixes "load failed" issue)
  useEffect(() => {
    if (savedResume?.analysisResult && !result) {
      setResult(savedResume.analysisResult as AnalysisResult);
      setAnalysisStatus("success");
    }
  }, [savedResume]);
  const [showAllImprovements, setShowAllImprovements] = useState(false);

  const addChecklistItem = trpc.checklist.add.useMutation({
    onSuccess: () => utils.checklist.get.invalidate(),
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleAnalyze = async () => {
    if (!file) {
      toast.error(t.resume.noFile);
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStatus("pending");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("targetRegion", targetRegion);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/resume/upload-analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = data.error || "";
        if (errMsg.includes("Only PDF") || errMsg.includes("not allowed")) {
          throw new Error(t.resume.errors.fileType);
        } else if (errMsg.includes("10MB") || errMsg.includes("LIMIT_FILE_SIZE") || errMsg.includes("too large")) {
          throw new Error(t.resume.errors.fileSize);
        } else if (errMsg.includes("extract") || errMsg.includes("text")) {
          throw new Error(t.resume.errors.extractFail);
        } else if (errMsg.includes("Unauthorized") || errMsg.includes("401")) {
          throw new Error(t.resume.errors.unauthorized);
        } else {
          throw new Error(errMsg || t.resume.errors.default);
        }
      }

      if (!data.success) {
        const msg = data.message || PARSE_FALLBACK_MESSAGE;
        setAnalysisStatus("failed");
        setAnalysisError(msg);
        setShowPasteFallback(true);
        toast.error(msg);
        return;
      }

      setAnalysisStatus(data.status === "partial" ? "partial" : "success");
      setResult(data.analysis);
      if (data.parseInfo) setParseInfo(data.parseInfo);
      await refetch();
      const parseLabel = data.parseInfo?.label;
      toast.success(
        parseLabel
          ? `✅ Resume parsed successfully (${parseLabel})`
          : t.resume.success
      );
    } catch (err: any) {
      const msg = err.message || t.resume.errors.default;
      setAnalysisStatus("failed");
      setAnalysisError(msg);
      setShowPasteFallback(true);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzePaste = async () => {
    if (pasteText.trim().length < 50) {
      const msg = "Paste at least a few resume sections before retrying.";
      setAnalysisError(msg);
      toast.error(msg);
      return;
    }
    setIsAnalyzing(true);
    setAnalysisStatus("pending");
    setAnalysisError(null);
    try {
      const response = await fetch("/api/resume/analyze-text", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: pasteText,
          targetRegion,
          jobDescription,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Resume text analysis failed.");
      if (!data.success) {
        const msg = data.message || PARSE_FALLBACK_MESSAGE;
        setAnalysisStatus("failed");
        setAnalysisError(msg);
        toast.error(msg);
        return;
      }
      setResult(data.analysis);
      setParseInfo(data.parseInfo ?? { method: "text", label: "Pasted text", warning: null });
      setAnalysisStatus(data.status === "partial" ? "partial" : "success");
      setShowPasteFallback(false);
      await refetch();
      toast.success(data.status === "partial" ? "Partial resume analysis created" : "Resume text analyzed");
    } catch (err: any) {
      const msg = err.message || "Resume text analysis failed.";
      setAnalysisStatus("failed");
      setAnalysisError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddToChecklist = async (tasks: ActionPlanTask[]) => {
    const today = new Date().toISOString().split("T")[0];
    let added = 0;
    for (const task of tasks) {
      try {
        await addChecklistItem.mutateAsync({
          date: today,
          title: `[이력서] ${task.title}`,
          category: task.category,
          isAIGenerated: true,
        });
        added++;
      } catch {
        // skip duplicates
      }
    }
    toast.success(language === "ko" ? `${added}개 액션 아이템이 체크리스트에 추가됐습니다!` : `${added} action items added to your checklist!`);
  };

  const displayedImprovements = result
    ? showAllImprovements ? result.improvements : result.improvements.slice(0, 3)
    : [];

  const regionLabel = REGIONS.find(r => r.value === (result?.targetRegion || targetRegion))?.label || "";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.resume.title}</h1>
        <p className="text-muted-foreground mt-1">{t.resume.subtitle}</p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            {result ? (language === "ko" ? "이력서 재분석" : "Re-analyze Resume") : (language === "ko" ? "이력서 업로드" : "Upload Resume")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone
            file={file}
            isDragging={isDragging}
            onFile={setFile}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />

          {/* Region + JD */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {language === "ko" ? "목표 지역" : "Target Region"}
              </Label>
              <Select value={targetRegion} onValueChange={setTargetRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <button
                onClick={() => setShowJD(!showJD)}
                className="w-full text-left"
              >
                <Label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 cursor-pointer">
                  <Target className="h-3.5 w-3.5" />
                  {language === "ko" ? "채용 공고 붙여넣기 (선택)" : "Paste Job Description (optional)"}
                  {showJD ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
                </Label>
              </button>
              {showJD && (
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={language === "ko" ? "채용 공고 내용을 붙여넣으면 더 정확한 분석이 가능합니다..." : "Paste the job description for more accurate analysis..."}
                  rows={4}
                  className="text-sm"
                />
              )}
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className="w-full gap-2"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.resume.analyzing}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {result
                  ? t.resume.analyze
                  : t.resume.analyze}
              </>
            )}
          </Button>

          {analysisStatus !== "idle" && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${
              analysisStatus === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : analysisStatus === "partial"
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : analysisStatus === "failed"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-border bg-secondary/40 text-muted-foreground"
            }`}>
              Status: {analysisStatus === "pending" ? "pending" : analysisStatus}
              {analysisStatus === "partial" && " - parsed with limited text. Paste text below for a fuller retry."}
            </div>
          )}

          {result && parseInfo?.label && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Parsed: {parseInfo.label}</span>
            </div>
          )}
          {result && parseInfo?.warning && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400">{parseInfo.warning}</p>
          )}
          {result && (
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3" />
              {(t.resume.lastAnalyzed || "Last analyzed: {date}").replace("{date}", new Date(result.analyzedAt || 0).toLocaleDateString())}
            </p>
          )}
          {analysisError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 flex flex-col gap-2">
              <div className="flex items-start gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{analysisError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="self-start gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => { setAnalysisError(null); handleAnalyze(); }}
                disabled={!file || isAnalyzing}
              >
                <RefreshCw className="h-3 w-3" />
                {t.resume.retry}
              </Button>
            </div>
          )}

          {(showPasteFallback || analysisStatus === "partial") && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div>
                <Label className="text-sm font-medium">Paste resume text fallback</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {PARSE_FALLBACK_MESSAGE}
                </p>
              </div>
              <Textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                rows={8}
                placeholder="Paste your resume text here, including summary, work experience, education, skills, and certifications..."
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <span className="text-xs text-muted-foreground">{pasteText.trim().length} characters</span>
                <Button onClick={handleAnalyzePaste} disabled={isAnalyzing || pasteText.trim().length < 50} className="gap-2">
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Analyze Pasted Text
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Score Overview */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="sm:col-span-1">
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <ProbabilityGauge value={result.interviewProbability} />
              </CardContent>
            </Card>
            <Card className="sm:col-span-2">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{language === "ko" ? "전체 이력서 점수" : "Overall Resume Score"}</h3>
                  <span className="text-2xl font-bold text-primary">{result.overallScore}/100</span>
                </div>
                <Progress value={result.overallScore} className="h-2" />
                <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {regionLabel}
                  </Badge>
                  {result.missingKeywords?.slice(0, 4).map((kw, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs">
                      <Tag className="h-2.5 w-2.5" />
                      {kw}
                    </Badge>
                  ))}
                  {(result.missingKeywords?.length || 0) > 4 && (
                    <Badge variant="secondary" className="text-xs">+{result.missingKeywords.length - 4} more</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {language === "ko" ? "강점" : "Strengths"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-amber-500" />
                {language === "ko" ? "개선 사항" : "Improvements"}
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {result.improvements.length} {language === "ko" ? "개" : "items"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayedImprovements.map((imp, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{imp.issue}</span>
                    </div>
                    <PriorityBadge priority={imp.priority} />
                  </div>
                  <div className="ml-6 space-y-1">
                    <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      {imp.suggestion}
                    </p>
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      {imp.impact}
                    </p>
                  </div>
                </div>
              ))}
              {result.improvements.length > 3 && (
                <button
                  onClick={() => setShowAllImprovements(!showAllImprovements)}
                  className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1 py-1"
                >
                  {showAllImprovements ? (
                    <><ChevronUp className="h-4 w-4" />{language === "ko" ? "접기" : "Show less"}</>
                  ) : (
                    <><ChevronDown className="h-4 w-4" />{language === "ko" ? `${result.improvements.length - 3}개 더 보기` : `Show ${result.improvements.length - 3} more`}</>
                  )}
                </button>
              )}
            </CardContent>
          </Card>

          {/* Region-Specific Tips */}
          {result.regionSpecificTips?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-5 w-5 text-blue-500" />
                  {language === "ko" ? `${regionLabel} 지역별 팁` : `${regionLabel} Market Tips`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.regionSpecificTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <MapPin className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Action Plan Tasks */}
          {result.actionPlanTasks?.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-5 w-5 text-primary" />
                  {language === "ko" ? "오늘의 액션 플랜" : "Today's Action Plan"}
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {language === "ko" ? "체크리스트에 자동 추가" : "Auto-add to checklist"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {result.actionPlanTasks.map((task, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${
                        task.category === "skill" ? "bg-violet-400" :
                        task.category === "resume" ? "bg-amber-400" :
                        task.category === "research" ? "bg-blue-400" :
                        task.category === "network" ? "bg-emerald-400" : "bg-rose-400"
                      }`} />
                      <span>{task.title}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{task.category}</Badge>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleAddToChecklist(result.actionPlanTasks)}
                  disabled={addChecklistItem.isPending}
                  className="w-full gap-2"
                  variant="default"
                >
                  {addChecklistItem.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {language === "ko" ? "체크리스트에 추가하기" : "Add to My Checklist"}
                </Button>
              </CardContent>
            </Card>
          )}
          {/* Next Step Suggestions */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
                <ArrowRight className="h-5 w-5 text-emerald-600" />
                {language === "ko" ? "다음 단계 추천" : "Recommended Next Steps"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  icon: "💬",
                  titleKo: "AI 커리어 챗봇에게 물어보기",
                  titleEn: "Ask AI Career Chatbot",
                  descKo: "이력서 분석 결과를 바탕으로 맞춤형 커리어 조언을 받아보세요.",
                  descEn: "Get personalized career advice based on your resume analysis.",
                  href: "/dashboard/chat",
                },
                {
                  icon: "👥",
                  titleKo: "전문 컨설턴트 상담 예약",
                  titleEn: "Book a Career Consultant",
                  descKo: "싱가포르 취업 전문가와 1:1 세션으로 더 구체적인 전략을 세워보세요.",
                  descEn: "Book a 1:1 session with a Singapore career expert for a concrete strategy.",
                  href: "/dashboard/consulting",
                },
                {
                  icon: "🔍",
                  titleKo: "맞춤 채용 공고 찾기",
                  titleEn: "Find Matching Job Listings",
                  descKo: "분석된 스킬과 목표 직무에 맞는 채용 공고를 검색해보세요.",
                  descEn: "Search for job listings matching your analyzed skills and target role.",
                  href: "/dashboard/jobs",
                },
              ].map((step, i) => (
                <button
                  key={i}
                  onClick={() => setLocation(step.href)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all text-left"
                >
                  <span className="text-xl">{step.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-900">
                      {language === "ko" ? step.titleKo : step.titleEn}
                    </p>
                    <p className="text-xs text-emerald-700/70 truncate">
                      {language === "ko" ? step.descKo : step.descEn}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-400 shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        </>
      )}
      {/* Resume Template Download */}
      <ResumeTemplates />
    </div>
  );
}
