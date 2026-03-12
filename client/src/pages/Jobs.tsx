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
  Briefcase, Bookmark, Check, Globe, BadgeCheck, Loader2, RefreshCw
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

// Source badge colors
const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  careergov: { label: "Career@Gov", color: "bg-blue-100 text-blue-800" },
  mcf: { label: "MCF", color: "bg-emerald-100 text-emerald-800" },
  linkedin: { label: "LinkedIn", color: "bg-sky-100 text-sky-800" },
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
      staleTime: 5 * 60 * 1000, // 5 min
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
  ].filter(Boolean).length;

  // Client-side filtering for type/experience/industry/posted/visa/remote
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      if (selectedJobType !== "all" && job.type !== selectedJobType) return false;
      if (selectedExperience !== "all" && job.experience !== selectedExperience) return false;
      if (selectedIndustry !== "all" && job.industry !== selectedIndustry) return false;
      if (selectedPosted !== "all") {
        const days = parseInt(selectedPosted.replace(/\D/g, ""));
        if (job.posted > days) return false;
      }
      if (visaOnly && !job.visa) return false;
      if (remoteOnly && !job.remote) return false;
      return true;
    });
  }, [allJobs, selectedJobType, selectedExperience, selectedIndustry, selectedPosted, visaOnly, remoteOnly]);

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
            <div className="text-xs text-muted-foreground flex items-center gap-2 justify-end">
              {jobsData.sources.careergov > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Career@Gov: {jobsData.sources.careergov}
                </span>
              )}
              {jobsData.sources.mcf > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  MCF: {jobsData.sources.mcf}
                </span>
              )}
            </div>
          </div>
        )}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <div className="flex items-center justify-between col-span-1">
                <Label className="text-xs font-medium">{t.jobs.filterLabels.visa}</Label>
                <Switch checked={visaOnly} onCheckedChange={setVisaOnly} />
              </div>
              <div className="flex items-center justify-between col-span-1">
                <Label className="text-xs font-medium">{t.jobs.filterLabels.remote}</Label>
                <Switch checked={remoteOnly} onCheckedChange={setRemoteOnly} />
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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <h3 className="font-medium">Loading real job listings...</h3>
          <p className="text-sm text-muted-foreground mt-1">Fetching from Career@Gov and MyCareersFuture</p>
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

      {/* Non-Singapore location notice */}
      {!isLoading && !isError && selectedLocation !== "all" && selectedLocation !== "singapore" && (
        <div className="text-center py-16">
          <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-medium">{(t.locations as any)[selectedLocation]} Jobs Coming Soon</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We're working on integrating job sources for this location. Currently, Singapore jobs from Career@Gov and MCF are available.
          </p>
          <Button variant="outline" onClick={() => setSelectedLocation("singapore")} className="mt-4">
            View Singapore Jobs
          </Button>
        </div>
      )}

      {/* Job Listings */}
      {!isLoading && !isError && (selectedLocation === "all" || selectedLocation === "singapore") && (
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
                return (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-base">{job.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                              {badge.label}
                            </span>
                            {job.visa && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                                <BadgeCheck className="h-3 w-3" />
                                Visa
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
                          className="gap-2 shrink-0"
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

      <ApplyConfirmModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        job={selectedJob}
      />
    </div>
  );
}
