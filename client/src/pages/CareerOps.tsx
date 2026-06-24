import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { getExternalHref } from "@/lib/externalLinks";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Bookmark,
  Briefcase,
  ChevronRight,
  ClipboardCheck,
  Coffee,
  Copy,
  Crown,
  ExternalLink,
  FileDown,
  Linkedin,
  Loader2,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type CareerOpsItem = {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    source: string;
    applyUrl: string;
    visa: boolean;
    type: string;
    experience: string;
    industry: string;
    posted: number;
    remote: boolean;
    description: string;
    closingDate?: string;
    skills?: string[];
  };
  fitScore: number;
  grade: string;
  decision: { level: string; label: string; summary: string };
  matchedSkills?: string[];
  missingSkills?: string[];
  strategy?: string[];
  interviewTips?: string[];
  resumeVariant?: { title: string; markdown: string; keywords?: string[]; gaps?: string[] };
  sourcePolicy?: string;
};

const gradeStyles: Record<string, string> = {
  A: "border-emerald-300 bg-emerald-50 text-emerald-900",
  "A-": "border-emerald-300 bg-emerald-50 text-emerald-900",
  "B+": "border-blue-300 bg-blue-50 text-blue-900",
  B: "border-blue-300 bg-blue-50 text-blue-900",
  "B-": "border-sky-300 bg-sky-50 text-sky-900",
  "C+": "border-amber-300 bg-amber-50 text-amber-900",
  C: "border-amber-300 bg-amber-50 text-amber-900",
  D: "border-orange-300 bg-orange-50 text-orange-900",
  F: "border-red-300 bg-red-50 text-red-900",
};

const careerModules = [
  {
    id: "job-recommendations",
    title: "Weekly Job Picks",
    description: "Shortlist roles based on your target market, visa context, seniority, and resume fit.",
    status: "Live",
    tier: "Free",
    icon: Radar,
    accent: "from-cyan-400 to-blue-500",
  },
  {
    id: "linkedin-coffee-chat",
    title: "Resume-Based LinkedIn Outreach",
    description: "Turn your resume signals into a concise coffee chat message for LinkedIn.",
    status: "New",
    tier: "Free",
    icon: Linkedin,
    accent: "from-amber-300 to-orange-500",
  },
];

const careerFlowStages = [
  {
    stage: "Resume signal",
    question: "What proof can I lead with?",
    moduleIds: ["linkedin-coffee-chat"],
  },
  {
    stage: "Target jobs",
    question: "Which roles are worth chasing?",
    moduleIds: ["job-recommendations"],
  },
  {
    stage: "Human support",
    question: "When should I book a consult?",
    moduleIds: ["job-recommendations", "linkedin-coffee-chat"],
  },
];

function buildCoffeeChatMessage(name: string, role: string, context: string, senderName: string) {
  const recipient = name.trim() || "there";
  const targetText = role.trim() || "your career path";
  const opportunityText = /\b(opportunit|roles?|jobs?|positions?)\b/i.test(targetText)
    ? targetText
    : `${targetText} opportunities`;
  const reason = context.trim() || "my resume has relevant experience that connects to your work";
  const signature = senderName.trim() || "JobPA user";

  return `Hi ${recipient},

I came across your profile and noticed ${reason}. I am currently exploring ${opportunityText} and trying to understand the market from people who have actually been close to the work.

Would you be open to a short 15-minute coffee chat sometime this or next week? I am not asking for a referral right away. I would really value your perspective on what skills matter, how teams evaluate candidates, and what mistakes to avoid when applying.

Thank you,
${signature}`;
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "career_ops_resume";
}

async function downloadResumePdf(item: CareerOpsItem) {
  if (!item.resumeVariant?.markdown) {
    toast.error("No resume variant available yet");
    return;
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageHeight = doc.internal.pageSize.getHeight();
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const lines = doc.splitTextToSize(item.resumeVariant.markdown, width);
  let y = margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 14;
  }
  doc.save(`${safeFileName(item.resumeVariant.title)}.pdf`);
}

function ResultCard({
  item,
  onSave,
  onApply,
  saving,
  applying,
}: {
  item: CareerOpsItem;
  onSave: (item: CareerOpsItem) => void;
  onApply: (item: CareerOpsItem) => void;
  saving?: boolean;
  applying?: boolean;
}) {
  const gradeClass = gradeStyles[item.grade] ?? "border-border bg-muted text-foreground";
  const matched = item.matchedSkills ?? [];
  const missing = item.missingSkills ?? [];
  const applyHref = getExternalHref(item.job.applyUrl);

  return (
    <Card className="max-w-full overflow-hidden">
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
          <div className="min-w-0 space-y-4 p-4 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 break-words text-base font-semibold">{item.job.title}</h3>
                  <Badge variant="outline">{item.job.source}</Badge>
                  {item.job.remote && <Badge variant="secondary">Remote</Badge>}
                  {item.job.visa && <Badge className="bg-emerald-600 text-white">Visa signal</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.job.company} - {item.job.location}
                  {item.job.salary ? ` - ${item.job.salary}` : ""}
                </p>
              </div>
              <div className={`rounded-md border px-3 py-2 text-center ${gradeClass}`}>
                <div className="text-xs font-medium">Grade</div>
                <div className="text-2xl font-bold leading-tight">{item.grade}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.decision?.label ?? "Evaluation"}</span>
                <span className="text-muted-foreground">{item.fitScore}/100</span>
              </div>
              <Progress value={item.fitScore} className="h-2" />
              <p className="text-sm text-muted-foreground">{item.decision?.summary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium">Matched evidence</p>
                <div className="flex flex-wrap gap-2">
                  {matched.length > 0 ? matched.map(skill => (
                    <span key={skill} className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                      {skill}
                    </span>
                  )) : <span className="text-sm text-muted-foreground">No strong match detected yet.</span>}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Gaps to handle</p>
                <div className="flex flex-wrap gap-2">
                  {missing.length > 0 ? missing.map(skill => (
                    <span key={skill} className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                      {skill}
                    </span>
                  )) : <span className="text-sm text-muted-foreground">No major keyword gaps detected.</span>}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium">Application strategy</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {(item.strategy ?? []).slice(0, 3).map((step, index) => <li key={index}>- {step}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Interview hooks</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {(item.interviewTips ?? []).slice(0, 3).map((step, index) => <li key={index}>- {step}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t bg-muted/30 p-4 lg:border-l lg:border-t-0">
            <div className="grid gap-2">
              <Button onClick={() => onSave(item)} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                Save
              </Button>
              <Button onClick={() => onApply(item)} disabled={applying} variant="outline" className="w-full gap-2">
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                Start application
              </Button>
              <Button onClick={() => downloadResumePdf(item)} variant="outline" className="w-full gap-2">
                <FileDown className="h-4 w-4" />
                Resume PDF
              </Button>
              {applyHref && (
                <Button asChild variant="ghost" className="w-full gap-2">
                  <a href={applyHref} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open posting
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CareerOps() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [location, setTargetLocation] = useState("all");
  const [limit, setLimit] = useState("10");
  const [scanResult, setScanResult] = useState<any>(null);
  const [manualResult, setManualResult] = useState<CareerOpsItem | null>(null);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualJd, setManualJd] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(["job-recommendations", "linkedin-coffee-chat"]);
  const [coffeeName, setCoffeeName] = useState("");
  const [coffeeRole, setCoffeeRole] = useState("business strategy / consulting roles in Singapore");
  const [coffeeContext, setCoffeeContext] = useState("");
  const utils = trpc.useUtils();
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: latestAnalysis } = trpc.resumeAnalysis.latest.useQuery();

  const scan = trpc.careerOps.scan.useMutation({
    onSuccess: (data) => {
      setScanResult(data);
      toast.success("Career Ops scan completed");
    },
    onError: (error) => toast.error(error.message || "Career Ops scan failed"),
  });

  const evaluateManual = trpc.careerOps.evaluateManual.useMutation({
    onSuccess: (data: any) => {
      setManualResult(data);
      toast.success("JD evaluation completed");
    },
    onError: (error) => toast.error(error.message || "JD evaluation failed"),
  });

  const saveJob = trpc.careerOps.saveJob.useMutation({
    onSuccess: () => {
      utils.application.list.invalidate();
      toast.success("Saved to JobPA");
    },
    onError: (error) => toast.error(error.message || "Could not save job"),
  });

  const createApplication = trpc.application.save.useMutation({
    onSuccess: () => {
      utils.application.list.invalidate();
      toast.success("Application tracked");
      setLocation("/dashboard/applications");
    },
    onError: (error) => toast.error(error.message || "Could not start application"),
  });

  const evaluations: CareerOpsItem[] = useMemo(() => scanResult?.evaluations ?? [], [scanResult]);
  const priorityCount = evaluations.filter(item => ["A", "A-", "B+"].includes(item.grade)).length;
  const senderName = user?.name?.trim() || "JobPA user";
  const resumeSignal = useMemo(() => {
    const strengths = Array.isArray(latestAnalysis?.strengths) ? latestAnalysis.strengths.slice(0, 2).join(", ") : "";
    const role = (profile as any)?.targetRole || latestAnalysis?.targetRole || "my target role";
    if (strengths) return `my resume shows ${strengths}, and I am targeting ${role}`;
    return `my resume and background are aligned with ${role}`;
  }, [latestAnalysis, profile]);
  const coffeeMessage = useMemo(
    () => buildCoffeeChatMessage(coffeeName, coffeeRole, coffeeContext || resumeSignal, senderName),
    [coffeeName, coffeeRole, coffeeContext, resumeSignal, senderName],
  );
  const selectedModuleLabels = careerModules
    .filter((module) => selectedModules.includes(module.id))
    .map((module) => module.title);

  const handleSave = (item: CareerOpsItem) => {
    saveJob.mutate({
      job: { ...item.job, applyUrl: getExternalHref(item.job.applyUrl) ?? item.job.applyUrl },
      notes: `Career Ops ${item.grade} (${item.fitScore}/100): ${item.decision?.label}`,
    });
  };

  const handleApply = (item: CareerOpsItem) => {
    const applyUrl = getExternalHref(item.job.applyUrl) ?? item.job.applyUrl;
    createApplication.mutate({
      jobTitle: item.job.title,
      company: item.job.company,
      location: item.job.location,
      applyUrl,
      source: item.job.source,
      status: "applied",
      salary: item.job.salary,
      notes: `Career Ops ${item.grade} (${item.fitScore}/100). ${item.decision?.summary ?? ""}`,
    });
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules((current) =>
      current.includes(moduleId)
        ? current.filter((item) => item !== moduleId)
        : [...current, moduleId],
    );
  };

  const copyCoffeeMessage = async () => {
    await navigator.clipboard.writeText(coffeeMessage);
    toast.success("Coffee chat message copied");
  };

  return (
    <div className="mx-auto max-w-full space-y-6 overflow-hidden">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">Agentic AI Career Ops</Badge>
          <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Career Ops workspace</h1>
          <p className="mt-1 text-muted-foreground">
            Focus on two workflows: shortlist relevant jobs, then use your resume to write better LinkedIn coffee chat messages.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button variant="outline" onClick={() => setLocation("/dashboard/resume")} className="gap-2">
            <FileDown className="h-4 w-4" />
            Resume
          </Button>
          <Button variant="outline" onClick={() => setLocation("/dashboard/applications")} className="gap-2">
            <Briefcase className="h-4 w-4" />
            Tracker
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Radar className="h-4 w-4 text-primary" />
            Agent scans
          </div>
          <div className="mt-2 text-3xl font-bold">{evaluations.length}</div>
          <p className="text-xs text-muted-foreground">Current scan results</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Agent picks
          </div>
          <div className="mt-2 text-3xl font-bold">{priorityCount}</div>
          <p className="text-xs text-muted-foreground">A to B+ roles</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Human control
          </div>
          <div className="mt-2 text-xl font-semibold capitalize">{scanResult?.mode ?? "ready"}</div>
          <p className="text-xs text-muted-foreground">Agents recommend. You decide.</p>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            JobPA Career Ops is agentic AI for job search operations. It recommends and prepares actions, but never auto-applies, bypasses logins, or submits applications without you.
          </span>
        </div>
      </div>

      <Card className="overflow-hidden border-0 bg-slate-950 text-white shadow-2xl shadow-cyan-950/20">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0 space-y-6 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Badge className="mb-3 bg-cyan-300 text-slate-950 hover:bg-cyan-300">
                    Whole Career Subscription
                  </Badge>
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                    Pick the next useful action, not another tool.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                    JobPA stays focused: job recommendations and resume-based LinkedIn outreach. Consulting is the paid path when a human needs to step in.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Selected</p>
                  <p className="mt-1 text-2xl font-black">{selectedModules.length}</p>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-[620px] items-stretch gap-3">
                  {careerFlowStages.map((stage, index) => {
                    const stageModules = careerModules.filter((module) => stage.moduleIds.includes(module.id));
                    const stageSelected = stage.moduleIds.some((moduleId) => selectedModules.includes(moduleId));
                    return (
                      <div key={stage.stage} className="flex min-w-[155px] flex-1 items-stretch gap-3">
                        <div className={`flex flex-1 flex-col rounded-3xl border p-3 transition ${
                          stageSelected ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-white/10 bg-white/[0.05] text-white"
                        }`}>
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span className={`rounded-full px-2 py-1 text-[10px] font-black ${
                              stageSelected ? "bg-slate-950 text-cyan-200" : "bg-white/10 text-cyan-100"
                            }`}>
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                              stageSelected ? "text-slate-600" : "text-slate-500"
                            }`}>
                              {stageSelected ? "Active" : "Optional"}
                            </span>
                          </div>
                          <p className="text-base font-black">{stage.stage}</p>
                          <p className={`mt-1 min-h-[34px] text-xs leading-relaxed ${stageSelected ? "text-slate-700" : "text-slate-400"}`}>
                            {stage.question}
                          </p>
                          <div className="mt-4 space-y-2">
                            {stageModules.map((module) => {
                              const selected = selectedModules.includes(module.id);
                              const Icon = module.icon;
                              return (
                                <button
                                  key={`${stage.stage}-${module.id}`}
                                  type="button"
                                  onClick={() => toggleModule(module.id)}
                                  className={`flex w-full items-center gap-2 rounded-2xl px-2.5 py-2 text-left text-xs font-bold transition ${
                                    selected
                                      ? "bg-slate-950 text-cyan-200"
                                      : stageSelected
                                        ? "bg-white/70 text-slate-700 hover:bg-white"
                                        : "bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]"
                                  }`}
                                >
                                  <Icon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="min-w-0 truncate">{module.title}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {index < careerFlowStages.length - 1 && (
                          <div className="hidden items-center text-slate-500 xl:flex">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-200">Module shelf</p>
                  <p className="text-xs text-slate-500">Tap cards to add/remove from the journey flow</p>
                </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {careerModules.map((module) => {
                  const Icon = module.icon;
                  const selected = selectedModules.includes(module.id);
                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => toggleModule(module.id)}
                      className={`group min-h-[190px] rounded-3xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                        selected
                          ? "border-cyan-300 bg-white text-slate-950 shadow-cyan-900/20"
                          : "border-white/10 bg-white/[0.045] text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${module.accent} text-white shadow-lg`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                            selected ? "bg-slate-950 text-cyan-200" : "bg-white/10 text-cyan-100"
                          }`}>
                            {module.status}
                          </span>
                          <span className={`text-[11px] font-bold ${selected ? "text-slate-500" : "text-slate-400"}`}>
                            {module.tier}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-base font-black">{module.title}</h3>
                      <p className={`mt-2 text-sm leading-relaxed ${selected ? "text-slate-600" : "text-slate-400"}`}>
                        {module.description}
                      </p>
                      <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                        selected ? "bg-cyan-100 text-cyan-800" : "bg-slate-900 text-slate-300"
                      }`}>
                        {selected ? "Included in my journey" : "Tap to add"}
                      </div>
                    </button>
                  );
                })}
              </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.035] p-5 sm:p-6 lg:border-l lg:border-t-0">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Career+ path</p>
            <p className="text-xs text-slate-400">Free focus tools first, paid mentoring when needed.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {selectedModuleLabels.map((label, index) => (
                    <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-3 py-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-100">{label}</span>
                    </div>
                  ))}
                  {selectedModuleLabels.length === 0 && (
                    <p className="rounded-2xl bg-white/[0.06] p-3 text-sm text-slate-400">
                      Select modules to build a visible career journey.
                    </p>
                  )}
                </div>
                <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs leading-relaxed text-amber-100">
                  Paid modules are shown intentionally as future monetization paths. JobPA should sell scoped support, not guaranteed outcomes.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 via-white to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coffee className="h-5 w-5 text-amber-700" />
            Resume-Based LinkedIn Coffee Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Recipient name</Label>
              <Input
                value={coffeeName}
                onChange={(event) => setCoffeeName(event.target.value)}
                placeholder="Kim, Alex, hiring manager..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm">Target LinkedIn topic</Label>
              <Input
                value={coffeeRole}
                onChange={(event) => setCoffeeRole(event.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm">Resume signal to mention</Label>
              <Textarea
                value={coffeeContext}
                onChange={(event) => setCoffeeContext(event.target.value)}
                placeholder={resumeSignal}
                rows={4}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-col rounded-3xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-cyan-600" />
                <p className="text-sm font-black">Generated outreach draft</p>
              </div>
              <Button variant="outline" size="sm" onClick={copyCoffeeMessage} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <Textarea value={coffeeMessage} readOnly rows={10} className="min-h-[260px] resize-none border-0 bg-slate-50 text-sm leading-relaxed" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-5 w-5 text-primary" />
            Approved Job Scan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_140px_auto]">
            <div>
              <Label className="text-sm">Search query</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="AI product manager, backend engineer, growth marketer..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm">Target market</Label>
              <Select value={location} onValueChange={setTargetLocation}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="singapore">Singapore</SelectItem>
                  <SelectItem value="korea">Korea</SelectItem>
                  <SelectItem value="hongkong">Hong Kong</SelectItem>
                  <SelectItem value="dubai">Dubai</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Batch size</Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 roles</SelectItem>
                  <SelectItem value="10">10 roles</SelectItem>
                  <SelectItem value="15">15 roles</SelectItem>
                  <SelectItem value="20">20 roles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => scan.mutate({
                  search: search || undefined,
                  location,
                  limit: Number(limit),
                })}
                disabled={scan.isPending}
                className="w-full gap-2 md:w-auto"
              >
                {scan.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
                Run scan
              </Button>
            </div>
          </div>
          {scanResult?.message && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {scanResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Paste JD Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm">Job title</Label>
              <Input value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm">Company</Label>
              <Input value={manualCompany} onChange={(event) => setManualCompany(event.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Job description</Label>
            <Textarea
              value={manualJd}
              onChange={(event) => setManualJd(event.target.value)}
              rows={7}
              placeholder="Paste the JD text here..."
              className="mt-1.5"
            />
          </div>
          <Button
            onClick={() => evaluateManual.mutate({
              jobTitle: manualTitle || undefined,
              company: manualCompany || undefined,
              jobDescription: manualJd,
            })}
            disabled={evaluateManual.isPending || manualJd.trim().length < 20}
            className="w-full gap-2 sm:w-auto"
          >
            {evaluateManual.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Evaluate pasted JD
          </Button>
        </CardContent>
      </Card>

      {manualResult && (
        <section className="space-y-3">
          <h2 className="font-semibold">Pasted JD Result</h2>
          <ResultCard
            item={manualResult}
            onSave={handleSave}
            onApply={handleApply}
            saving={saveJob.isPending}
            applying={createApplication.isPending}
          />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Scan Results</h2>
          {scanResult?.sourcePolicy && <span className="hidden text-xs text-muted-foreground md:inline">{scanResult.sourcePolicy}</span>}
        </div>

        {scan.isPending ? (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
            <p className="font-medium">Scoring jobs</p>
            <p className="mt-1 text-sm text-muted-foreground">JobPA is using approved sources and local fallback rules.</p>
          </div>
        ) : evaluations.length > 0 ? (
          <div className="grid gap-3">
            {evaluations.map(item => (
              <ResultCard
                key={item.job.id}
                item={item}
                onSave={handleSave}
                onApply={handleApply}
                saving={saveJob.isPending}
                applying={createApplication.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <Radar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="font-medium">No Career Ops scan yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Run a scan from approved data sources or paste a JD above. Strong matches can move into Saved Jobs, Applications, Resume Analysis, and Interview Prep.
            </p>
          </div>
        )}
      </section>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            AI output is guidance only. For legal, visa, immigration, tax, salary, or employment decisions, verify with official sources and the employer.
          </span>
        </div>
      </div>
    </div>
  );
}
