import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import {
  Search, MapPin, Building2, Clock, ExternalLink, Filter, X,
  Briefcase, Bookmark, Check, ChevronDown, ChevronUp, Globe, BadgeCheck
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// Source badge colors
const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  "careergov": { label: "Career@Gov", color: "bg-blue-100 text-blue-800" },
  "mcf": { label: "MCF", color: "bg-emerald-100 text-emerald-800" },
  "linkedin": { label: "LinkedIn", color: "bg-sky-100 text-sky-800" },
  "indeed": { label: "Indeed", color: "bg-purple-100 text-purple-800" },
  "glassdoor": { label: "Glassdoor", color: "bg-green-100 text-green-800" },
  "jobsdb": { label: "JobsDB", color: "bg-orange-100 text-orange-800" },
  "bayt": { label: "Bayt", color: "bg-red-100 text-red-800" },
  "gulftalent": { label: "GulfTalent", color: "bg-amber-100 text-amber-800" },
  "saramin": { label: "사람인", color: "bg-indigo-100 text-indigo-800" },
  "jobkorea": { label: "잡코리아", color: "bg-rose-100 text-rose-800" },
  "google": { label: "Google Jobs", color: "bg-gray-100 text-gray-800" },
};

function getSourceBadge(source?: string) {
  if (!source) return SOURCE_BADGES.google;
  const key = source.toLowerCase().replace(/[^a-z]/g, "");
  return SOURCE_BADGES[key] || { label: source, color: "bg-gray-100 text-gray-800" };
}

// Demo job data (in production this would come from JSearch API)
const DEMO_JOBS = [
  { id: 1, title: "AI Engineer", company: "GovTech Singapore", location: "singapore", salary: "S$8,000-12,000/mo", source: "careergov", applyUrl: "https://careers.gov.sg", visa: true, type: "fulltime", experience: "mid", industry: "government", posted: 1, remote: false, description: "Design and implement AI/ML solutions for government digital services." },
  { id: 2, title: "Senior Backend Developer", company: "Grab", location: "singapore", salary: "S$10,000-15,000/mo", source: "linkedin", applyUrl: "https://linkedin.com/jobs", visa: true, type: "fulltime", experience: "senior", industry: "tech", posted: 2, remote: false, description: "Build scalable backend services for ride-hailing and delivery platform." },
  { id: 3, title: "Full Stack Developer", company: "Crypto.com", location: "hongkong", salary: "HK$50,000-80,000/mo", source: "jobsdb", applyUrl: "https://jobsdb.com", visa: true, type: "fulltime", experience: "mid", industry: "finance", posted: 3, remote: false, description: "Develop and maintain crypto exchange platform features." },
  { id: 4, title: "DevOps Engineer", company: "Emirates NBD", location: "dubai", salary: "AED 25,000-40,000/mo", source: "bayt", applyUrl: "https://bayt.com", visa: true, type: "fulltime", experience: "mid", industry: "finance", posted: 1, remote: false, description: "Manage cloud infrastructure and CI/CD pipelines for banking services." },
  { id: 5, title: "Data Scientist", company: "Coupang", location: "korea", salary: "₩6,000,000-9,000,000/mo", source: "saramin", applyUrl: "https://saramin.co.kr", visa: true, type: "fulltime", experience: "mid", industry: "ecommerce", posted: 5, remote: false, description: "Apply ML models to optimize e-commerce recommendation systems." },
  { id: 6, title: "Frontend Engineer (Remote)", company: "Vercel", location: "remote", salary: "$120,000-180,000/yr", source: "linkedin", applyUrl: "https://vercel.com/careers", visa: false, type: "fulltime", experience: "senior", industry: "tech", posted: 2, remote: true, description: "Build the future of web development tools and frameworks." },
  { id: 7, title: "ML Engineer Intern", company: "HSBC", location: "hongkong", salary: "HK$20,000/mo", source: "jobsdb", applyUrl: "https://hsbc.com/careers", visa: true, type: "internship", experience: "entry", industry: "finance", posted: 7, remote: false, description: "Support ML team in developing fraud detection models." },
  { id: 8, title: "Cloud Architect", company: "Careem", location: "dubai", salary: "AED 35,000-50,000/mo", source: "gulftalent", applyUrl: "https://gulftalent.com", visa: true, type: "fulltime", experience: "senior", industry: "tech", posted: 4, remote: false, description: "Design and implement cloud-native architecture for ride-hailing platform." },
  { id: 9, title: "Software Engineer", company: "MOM Singapore", location: "singapore", salary: "S$6,000-9,000/mo", source: "mcf", applyUrl: "https://www.mycareersfuture.gov.sg", visa: true, type: "contract", experience: "junior", industry: "government", posted: 1, remote: false, description: "Develop digital services for Ministry of Manpower." },
  { id: 10, title: "Product Manager", company: "Sea Group", location: "singapore", salary: "S$12,000-18,000/mo", source: "linkedin", applyUrl: "https://linkedin.com/jobs", visa: true, type: "fulltime", experience: "senior", industry: "tech", posted: 3, remote: false, description: "Lead product strategy for Shopee's AI features." },
];

interface ApplyModalProps {
  open: boolean;
  onClose: () => void;
  job: typeof DEMO_JOBS[0] | null;
}

function ApplyConfirmModal({ open, onClose, job }: ApplyModalProps) {
  const { t } = useI18n();
  const saveApp = trpc.application.save.useMutation({
    onSuccess: () => {
      toast.success(t.applyModal.saved);
      onClose();
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
    toast.success(t.applyModal.bookmarked);
    onClose();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [selectedExperience, setSelectedExperience] = useState<string>("all");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedPosted, setSelectedPosted] = useState<string>("all");
  const [visaOnly, setVisaOnly] = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [salaryRange, setSalaryRange] = useState([0]);

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<typeof DEMO_JOBS[0] | null>(null);

  const locations = [
    { id: "all", label: t.applications.all },
    { id: "singapore", label: t.locations.singapore },
    { id: "hongkong", label: t.locations.hongkong },
    { id: "dubai", label: t.locations.dubai },
    { id: "korea", label: t.locations.korea },
    { id: "remote", label: t.locations.remote },
  ];

  const activeFilterCount = [
    selectedLocation !== "all", selectedJobType !== "all", selectedExperience !== "all",
    selectedIndustry !== "all", selectedPosted !== "all", visaOnly, remoteOnly,
  ].filter(Boolean).length;

  const filteredJobs = useMemo(() => {
    return DEMO_JOBS.filter(job => {
      if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase()) && !job.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedLocation !== "all" && job.location !== selectedLocation) return false;
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
  }, [searchQuery, selectedLocation, selectedJobType, selectedExperience, selectedIndustry, selectedPosted, visaOnly, remoteOnly]);

  const handleApplyClick = (job: typeof DEMO_JOBS[0]) => {
    window.open(job.applyUrl, "_blank");
    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedLocation("all"); setSelectedJobType("all"); setSelectedExperience("all");
    setSelectedIndustry("all"); setSelectedPosted("all"); setVisaOnly(false); setRemoteOnly(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.jobs.title}</h1>
        <p className="text-muted-foreground mt-1">{t.jobs.subtitle}</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.jobs.searchPlaceholder}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {/* Location quick filter */}
          <div className="flex gap-1 overflow-x-auto">
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
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 shrink-0"
          >
            <Filter className="h-4 w-4" />
            {t.jobs.filters}
            {activeFilterCount > 0 && (
              <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
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

      {/* Job Listings */}
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
                            {t.jobs.visaYes}
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
                          {job.posted} {t.jobs.postedDaysAgo}
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
                        {job.remote && (
                          <span className="px-2 py-0.5 rounded text-xs bg-violet-100 text-violet-800 flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Remote
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

      <ApplyConfirmModal
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        job={selectedJob}
      />
    </div>
  );
}
