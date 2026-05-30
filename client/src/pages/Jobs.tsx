import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import {
  Search, MapPin, Building2, Clock, ExternalLink, Filter, X,
  Briefcase, Bookmark, Check, Globe, BadgeCheck, Loader2, RefreshCw,
  TrendingUp, Users, DollarSign,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

// LinkedIn brand colors
const LINKEDIN_BLUE = "bg-[#0A66C2] text-white";

// Source badge colors
const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  careergov: { label: "Career@Gov", color: "bg-blue-100 text-blue-800" },
  mcf: { label: "MCF", color: "bg-emerald-100 text-emerald-800" },
  psg: { label: "PSG Tech", color: "bg-green-100 text-green-800" },
  govtech: { label: "GovTech", color: "bg-teal-100 text-teal-800" },
  linkedin: { label: "LinkedIn", color: `${LINKEDIN_BLUE}` },
  indeed: { label: "Indeed", color: "bg-purple-100 text-purple-800" },
  glassdoor: { label: "Glassdoor", color: "bg-green-100 text-green-800" },
  jobsdb: { label: "JobsDB", color: "bg-orange-100 text-orange-800" },
  bayt: { label: "Bayt", color: "bg-red-100 text-red-800" },
  gulftalent: { label: "GulfTalent", color: "bg-amber-100 text-amber-800" },
  saramin: { label: "사람인", color: "bg-indigo-100 text-indigo-800" },
  jobkorea: { label: "잡코리아", color: "bg-rose-100 text-rose-800" },
  google: { label: "Google Jobs", color: "bg-gray-100 text-gray-800" },
};

function getSourceBadge(source?: string) {
  if (!source) return SOURCE_BADGES.google;
  const key = source.toLowerCase().replace(/[^a-z]/g, "");
  return SOURCE_BADGES[key] || { label: source, color: "bg-gray-100 text-gray-800" };
}

// Detect if a job is likely MNC / foreigner-friendly
function isMNCJob(job: JobItem): boolean {
  const mncs = [
    "google", "microsoft", "amazon", "meta", "apple", "netflix", "salesforce",
    "oracle", "sap", "ibm", "accenture", "deloitte", "pwc", "kpmg", "ey",
    "mckinsey", "bcg", "bain", "jp morgan", "goldman sachs", "morgan stanley",
    "citibank", "hsbc", "standard chartered", "dbs", "ocbc", "uob",
    "grab", "sea", "shopee", "lazada", "bytedance", "tiktok", "alibaba",
    "samsung", "lg", "hyundai", "sk", "lotte", "posco",
    "siemens", "bosch", "shell", "bp", "exxon", "chevron",
    "unilever", "procter", "nestle", "novartis", "pfizer", "johnson",
    "3m", "honeywell", "ge", "philips", "sony", "panasonic",
  ];
  const companyLower = (job.company || "").toLowerCase();
  return mncs.some(mnc => companyLower.includes(mnc)) || job.visa === true;
}

// Detect if job has high salary
function isHighSalaryJob(job: JobItem): boolean {
  if (!job.salary) return false;
  const salaryStr = job.salary.toLowerCase();
  // Look for numbers above certain thresholds
  const numbers = salaryStr.match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ""))) || [];
  if (numbers.length === 0) return false;
  const maxNum = Math.max(...numbers);
  // SGD 8k+/mo, HKD 40k+/mo, AED 20k+/mo, KRW 6M+/mo
  if (salaryStr.includes("sgd") || salaryStr.includes("s$")) return maxNum >= 8000;
  if (salaryStr.includes("hkd") || salaryStr.includes("hk$")) return maxNum >= 40000;
  if (salaryStr.includes("aed")) return maxNum >= 20000;
  if (salaryStr.includes("krw") || salaryStr.includes("₩")) return maxNum >= 6000000;
  if (salaryStr.includes("k")) return maxNum >= 8; // 8k+
  return maxNum >= 8000;
}

interface JobItem {
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
}

interface ApplyModalProps {
  open: boolean;
  onClose: () => void;
  job: JobItem | null;
}

function ApplyConfirmModal({ open, onClose, job }: ApplyModalProps) {
  const { t } = useI18n();
  const saveApp = trpc.application.save.useMutation({
    onSuccess: () => {
      toast.success(t.applyModal.saved);
      onClose();
    },
    onError: () => {
      toast.error("Failed to save. Please try again.");
    },
  });

  if (!job) return null;

  const handleApplied = () => {
    saveApp.mutate({
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      applyUrl: job.applyUrl,
      source: job.source,
      status: "applied",
      salary: job.salary,
    });
  };

  const handleBookmark = () => {
    saveApp.mutate({
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      applyUrl: job.applyUrl,
      source: job.source,
      status: "bookmarked",
      salary: job.salary,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.applyModal.title}</DialogTitle>
          <DialogDescription>{t.applyModal.subtitle}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <div className="p-3 rounded-lg bg-secondary/50 mb-4">
            <p className="font-medium text-sm">{job.title}</p>
            <p className="text-xs text-muted-foreground">{job.company}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleApplied} disabled={saveApp.isPending} className="gap-2">
              <Check className="h-4 w-4" />
              {t.applyModal.applied}
            </Button>
            <Button variant="outline" onClick={handleBookmark} disabled={saveApp.isPending} className="gap-2">
              <Bookmark className="h-4 w-4" />
              {t.applyModal.bookmark}
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
              {t.applyModal.notYet}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Jobs() {
  const { t } = useI18n();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [selectedExperience, setSelectedExperience] = useState<string>("all");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedPosted, setSelectedPosted] = useState<string>("all");
  const [visaOnly, setVisaOnly] = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>("all");

  // New filters
  const [linkedinFirst, setLinkedinFirst] = useState(false);
  const [mncOnly, setMncOnly] = useState(false);
  const [highSalaryOnly, setHighSalaryOnly] = useState(false);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

  // Fetch real jobs from server
  const { data: jobsData, isLoading, isError, refetch, isFetching } = trpc.jobs.list.useQuery(
    {
      search: searchQuery || undefined,
      location: selectedLocation !== "all" ? selectedLocation : undefined,
      limit: 200,
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const allJobs: JobItem[] = (jobsData?.jobs as JobItem[]) || [];

  const locations = [
    { id: "all", label: t.applications.all },
    { id: "singapore", label: t.locations.singapore },
    { id: "hongkong", label: t.locations.hongkong },
    { id: "dubai", label: t.locations.dubai },
    { id: "korea", label: t.locations.korea },
    { id: "remote", label: t.locations.remote },
  ];

  const activeFilterCount = [
    selectedJobType !== "all", selectedExperience !== "all",
    selectedIndustry !== "all", selectedPosted !== "all", visaOnly, remoteOnly,
    selectedSource !== "all", linkedinFirst, mncOnly, highSalaryOnly,
  ].filter(Boolean).length;

  // Client-side filtering + sorting
  const filteredJobs = useMemo(() => {
    let jobs = allJobs.filter(job => {
      if (selectedJobType !== "all" && job.type !== selectedJobType) return false;
      if (selectedExperience !== "all" && job.experience !== selectedExperience) return false;
      if (selectedIndustry !== "all" && job.industry !== selectedIndustry) return false;
      if (selectedPosted !== "all") {
        const days = parseInt(selectedPosted.replace(/\D/g, ""));
        if (job.posted > days) return false;
      }
      if (visaOnly && !job.visa) return false;
      if (remoteOnly && !job.remote) return false;
      if (selectedSource !== "all") {
        const jobSource = (job.source || "").toLowerCase().replace(/[^a-z]/g, "");
        if (jobSource !== selectedSource) return false;
      }
      if (mncOnly && !isMNCJob(job)) return false;
      if (highSalaryOnly && !isHighSalaryJob(job)) return false;
      return true;
    });

    // LinkedIn-first sorting: LinkedIn jobs bubble to top
    if (linkedinFirst) {
      jobs = [...jobs].sort((a, b) => {
        const aIsLinkedIn = (a.source || "").toLowerCase().includes("linkedin");
        const bIsLinkedIn = (b.source || "").toLowerCase().includes("linkedin");
        if (aIsLinkedIn && !bIsLinkedIn) return -1;
        if (!aIsLinkedIn && bIsLinkedIn) return 1;
        return 0;
      });
    }

    return jobs;
  }, [allJobs, selectedJobType, selectedExperience, selectedIndustry, selectedPosted, visaOnly, remoteOnly, selectedSource, linkedinFirst, mncOnly, highSalaryOnly]);

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput);
  }, [searchInput]);

  const handleApplyClick = (job: JobItem) => {
    window.open(job.applyUrl, "_blank");
    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedJobType("all"); setSelectedExperience("all");
    setSelectedIndustry("all"); setSelectedPosted("all"); setVisaOnly(false); setRemoteOnly(false);
    setSelectedSource("all"); setLinkedinFirst(false); setMncOnly(false); setHighSalaryOnly(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.jobs.title}</h1>
          <p className="text-muted-foreground mt-1">{t.jobs.subtitle}</p>
        </div>
        {jobsData && (
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium">{filteredJobs.length} jobs</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 justify-end flex-wrap">
              {(jobsData.sources as any).careergov > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Career@Gov: {(jobsData.sources as any).careergov}
                </span>
              )}
              {(jobsData.sources as any).mcf > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  MCF: {(jobsData.sources as any).mcf}
                </span>
              )}
              {(jobsData.sources as any).jsearch > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#0A66C2]" />
                  LinkedIn+: {(jobsData.sources as any).jsearch}
                </span>
              )}
              {(jobsData.sources as any).saramin > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  사람인: {(jobsData.sources as any).saramin}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Smart Filter Quick Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setLinkedinFirst(!linkedinFirst)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            linkedinFirst
              ? "bg-[#0A66C2] text-white border-[#0A66C2] shadow-sm"
              : "border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/10"
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          {(t.jobs as any).linkedinPriority}
        </button>
        <button
          onClick={() => setMncOnly(!mncOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            mncOnly
              ? "bg-violet-600 text-white border-violet-600 shadow-sm"
              : "border-violet-400 text-violet-700 hover:bg-violet-50"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          {(t.jobs as any).mncFriendly}
        </button>
        <button
          onClick={() => setHighSalaryOnly(!highSalaryOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            highSalaryOnly
              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
              : "border-amber-400 text-amber-700 hover:bg-amber-50"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          {(t.jobs as any).highSalary}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t.jobs.searchPlaceholder}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch} disabled={isFetching} className="gap-2 shrink-0">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {t.jobs.search || "Search"}
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="shrink-0">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Location quick filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {locations.map(loc => (
          <button
            key={loc.id}
            onClick={() => setSelectedLocation(loc.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
              selectedLocation === loc.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/30"
            }`}
          >
            {loc.label}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1.5 shrink-0 ml-auto"
        >
          <Filter className="h-3.5 w-3.5" />
          {t.jobs.filters}
          {activeFilterCount > 0 && (
            <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Detailed Filter Panel */}
      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">{t.jobs.filterLabels.jobType}</Label>
                <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.applications.all}</SelectItem>
                    {Object.entries(t.jobs.jobTypes).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">{t.jobs.filterLabels.experience}</Label>
                <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.applications.all}</SelectItem>
                    {Object.entries(t.jobs.experienceLevels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">{t.jobs.filterLabels.industry}</Label>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.applications.all}</SelectItem>
                    {Object.entries(t.jobs.industries).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">{t.jobs.filterLabels.posted}</Label>
                <Select value={selectedPosted} onValueChange={setSelectedPosted}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.applications.all}</SelectItem>
                    {Object.entries(t.jobs.postedOptions).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">{(t.jobs.filterLabels as any).source}</Label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.applications.all}</SelectItem>
                    {Object.entries((t.jobs as any).sources || {}).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between col-span-1">
                <Label className="text-xs font-medium">{t.jobs.filterLabels.visa}</Label>
                <Switch checked={visaOnly} onCheckedChange={setVisaOnly} />
              </div>
              <div className="flex items-center justify-between col-span-1">
                <Label className="text-xs font-medium">{t.jobs.filterLabels.remote}</Label>
                <Switch checked={remoteOnly} onCheckedChange={setRemoteOnly} />
              </div>
              <div className="flex items-center justify-between col-span-1">
                <Label className="text-xs font-medium">{(t.jobs as any).linkedinPriority}</Label>
                <Switch checked={linkedinFirst} onCheckedChange={setLinkedinFirst} />
              </div>
              <div className="flex items-center justify-between col-span-1">
                <Label className="text-xs font-medium">{(t.jobs as any).mncFriendly}</Label>
                <Switch checked={mncOnly} onCheckedChange={setMncOnly} />
              </div>
              <div className="flex items-center justify-between col-span-1">
                <Label className="text-xs font-medium">{(t.jobs as any).highSalary}</Label>
                <Switch checked={highSalaryOnly} onCheckedChange={setHighSalaryOnly} />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{activeFilterCount} {t.jobs.activeFilters}</span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                  <X className="h-3 w-3" />
                  {t.jobs.clearFilters}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {linkedinFirst && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/30">
              LinkedIn {(t.jobs as any).linkedinPriority}
              <button onClick={() => setLinkedinFirst(false)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {mncOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800 border border-violet-200">
              {(t.jobs as any).mncFriendly}
              <button onClick={() => setMncOnly(false)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {highSalaryOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              {(t.jobs as any).highSalary}
              <button onClick={() => setHighSalaryOnly(false)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {selectedJobType !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {(t.jobs.jobTypes as any)[selectedJobType] || selectedJobType}
              <button onClick={() => setSelectedJobType("all")} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {selectedExperience !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {(t.jobs.experienceLevels as any)[selectedExperience] || selectedExperience}
              <button onClick={() => setSelectedExperience("all")} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {selectedIndustry !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {(t.jobs.industries as any)[selectedIndustry] || selectedIndustry}
              <button onClick={() => setSelectedIndustry("all")} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {selectedPosted !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {(t.jobs.postedOptions as any)[selectedPosted] || selectedPosted}
              <button onClick={() => setSelectedPosted("all")} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {selectedSource !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {((t.jobs as any).sources || {})[selectedSource] || selectedSource}
              <button onClick={() => setSelectedSource("all")} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {visaOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              {t.jobs.filterLabels.visa}
              <button onClick={() => setVisaOnly(false)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {remoteOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {t.jobs.filterLabels.remote}
              <button onClick={() => setRemoteOnly(false)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
            {t.jobs.clearFilters}
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <h3 className="font-medium">Loading real job listings...</h3>
          <p className="text-sm text-muted-foreground mt-1">Fetching from Career@Gov, MCF, LinkedIn, Indeed, Glassdoor & more</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-16">
          <Briefcase className="h-12 w-12 text-destructive/30 mx-auto mb-4" />
          <h3 className="font-medium text-destructive">Failed to load jobs</h3>
          <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* Job Listings */}
      {!isLoading && !isError && (
        <>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium">{t.jobs.noResults}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.jobs.noResultsDesc}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredJobs.map(job => {
                const badge = getSourceBadge(job.source);
                const isLinkedIn = (job.source || "").toLowerCase().includes("linkedin");
                const isMNC = isMNCJob(job);
                const isHighSalary = isHighSalaryJob(job);
                return (
                  <Card
                    key={job.id}
                    className={`hover:shadow-md transition-shadow ${isLinkedIn && linkedinFirst ? "border-[#0A66C2]/30 bg-[#0A66C2]/[0.02]" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-base">{job.title}</h3>
                            {/* Source badge — LinkedIn gets special styling */}
                            {isLinkedIn ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#0A66C2] text-white flex items-center gap-1">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                LinkedIn
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                            {/* MNC badge */}
                            {isMNC && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {(t.jobs as any).mncBadge}
                              </span>
                            )}
                            {/* Visa/Foreigner-friendly badge */}
                            {job.visa && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                                <BadgeCheck className="h-3 w-3" />
                                {(t.jobs as any).foreignerFriendly || "Visa OK"}
                              </span>
                            )}
                            {/* High salary badge */}
                            {isHighSalary && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {(t.jobs as any).highSalary}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {job.company}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {(t.locations as any)[job.location]?.replace(/^.\s/, "") || job.location}
                            </span>
                            {job.salary && (
                              <span className="text-foreground font-medium">{job.salary}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {job.posted === 0 ? "Today" : `${job.posted}d ago`}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
                              {(t.jobs.jobTypes as any)[job.type] || job.type}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
                              {(t.jobs.experienceLevels as any)[job.experience] || job.experience}
                            </span>
                            {job.skills && job.skills.length > 0 && job.skills.slice(0, 3).map(skill => (
                              <span key={skill} className="px-2 py-0.5 rounded text-xs bg-violet-50 text-violet-700 border border-violet-200">
                                {skill}
                              </span>
                            ))}
                            {job.closingDate && (
                              <span className="text-xs text-muted-foreground">
                                Closes: {job.closingDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleApplyClick(job)}
                          className={`gap-2 shrink-0 ${isLinkedIn ? "bg-[#0A66C2] hover:bg-[#004182] text-white" : ""}`}
                          size="sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t.jobs.applyExternal}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Korean Platform External Resources */}
      {selectedLocation === "korea" && (
        <div className="rounded-xl border bg-gradient-to-br from-rose-50/60 to-indigo-50/60 dark:from-rose-950/20 dark:to-indigo-950/20 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🇰🇷</span>
            <h3 className="font-semibold text-sm">한국 전문 잡지 직접 검색</h3>
            <span className="text-xs text-muted-foreground">(API 미제공 플랫폼)</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">아래 플랫폼은 공식 API를 제공하지 않아 직접 연동이 어렵습니다. 아래 링크를 통해 직접 검색하세요.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="https://www.jobkorea.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border bg-white dark:bg-card p-3 hover:shadow-md transition-all hover:border-rose-300 group"
            >
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">JK</span>
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm group-hover:text-rose-600 transition-colors">잡코리아</div>
                <div className="text-xs text-muted-foreground truncate">신입·경력 국내 최대 잡지</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
            </a>
            <a
              href="https://www.incruit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border bg-white dark:bg-card p-3 hover:shadow-md transition-all hover:border-orange-300 group"
            >
              <div className="h-9 w-9 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">IN</span>
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm group-hover:text-orange-600 transition-colors">인크루트</div>
                <div className="text-xs text-muted-foreground truncate">신입·인턴 특화 잡지</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
            </a>
            <a
              href="https://www.peoplenjob.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border bg-white dark:bg-card p-3 hover:shadow-md transition-all hover:border-indigo-300 group"
            >
              <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">PJ</span>
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm group-hover:text-indigo-600 transition-colors">피플앤잡</div>
                <div className="text-xs text-muted-foreground truncate">외국계 기업 전문 잡지</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
            </a>
          </div>
        </div>
      )}

      <ApplyConfirmModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        job={selectedJob}
      />
    </div>
  );
}
