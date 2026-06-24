import { useAuth } from "@/_core/hooks/useAuth";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Loader2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const LOCATIONS = [
  { id: "singapore", flag: "SG" },
  { id: "hongkong", flag: "HK" },
  { id: "dubai", flag: "UAE" },
  { id: "korea", flag: "KR" },
  { id: "remote", flag: "Remote" },
];

const LOCATION_LABELS: Record<string, string> = {
  singapore: "Singapore",
  hongkong: "Hong Kong",
  dubai: "Dubai / UAE",
  korea: "Korea",
  remote: "Remote / Global",
};

const USER_TYPE_OPTIONS = [
  {
    id: "job_seeker",
    icon: UserRound,
    title: "I am looking for a job",
    desc: "Use JobPA to run your own Career Ops: search, resume, applications, interview prep, and mentoring support.",
    badge: "Candidate workspace",
  },
  {
    id: "career_consultant",
    icon: BriefcaseBusiness,
    title: "I am a career coach or mentor",
    desc: "Use JobPA to support candidates, manage readiness signals, and prepare for future paid mentoring workflows.",
    badge: "Coach / partner workspace",
  },
];

const TRUST_NOTES = [
  "AI guidance only: users stay in control of applications and decisions.",
  "Sensitive career data should be reviewed carefully before upload.",
  "Paid mentoring and coach workflows will be separated from free candidate tools.",
];

const TARGET_ROLE_SUGGESTIONS = [
  "Product Marketing Manager",
  "Customer Success Manager",
  "Growth Marketer",
  "Marketing Analyst",
  "Business Analyst",
  "Business Operations Analyst",
  "Strategy Associate",
  "Partnerships Manager",
  "Account Manager",
  "Sales / Business Development",
  "Project Manager",
  "Operations Specialist",
  "Consultant",
  "Financial Analyst",
  "People Operations",
];

const COACH_LOOKING_FOR_OPTIONS = [
  {
    id: "coach_client_matching",
    label: "Support the right job seekers",
    desc: "Show your expertise and define which candidate-side blockers you can mentor on.",
  },
  {
    id: "coach_consulting_packages",
    label: "Sell simple consulting packages",
    desc: "Turn your experience into clear beta offers, discovery calls, and paid support.",
  },
];

const COACH_TARGET_SUGGESTIONS = [
  "Resume and LinkedIn branding",
  "Singapore job-search strategy",
  "Career pivot positioning",
  "PMO / consulting positioning",
  "Teaching to EdTech positioning",
  "Business roles for international students",
  "Interview storytelling",
  "Visa-sensitive job-search strategy",
];

const COACH_CLIENT_SEGMENTS = [
  "International students",
  "Career switchers",
  "Teachers moving into EdTech",
  "PMO / operations professionals",
  "Marketing graduates",
  "Customer success candidates",
  "Product marketing candidates",
  "Early-career job seekers",
  "Visa-sensitive candidates",
  "Non-tech business professionals",
];

const APPLICATION_STAGES = [
  { id: "exploring", label: "Exploring options", desc: "I am still deciding my target path." },
  { id: "actively_applying", label: "Actively applying", desc: "I am applying now and need better conversion." },
  { id: "interviewing", label: "Interviewing", desc: "I have interviews and need prep." },
  { id: "stuck", label: "Stuck / no response", desc: "I have applied but am not getting callbacks." },
  { id: "pivoting", label: "Career pivot", desc: "I want to move into a new function or industry." },
];

const COACH_WORKFLOW_STAGES = [
  { id: "coach_beta_clients", label: "Beta clients", desc: "Testing the service with first users." },
  { id: "coach_manual_delivery", label: "Manual delivery", desc: "Running calls, reviews, and follow-ups manually." },
  { id: "coach_repeatable_packages", label: "Packaging services", desc: "Turning support into clear paid tiers." },
  { id: "coach_scaling", label: "Scaling delivery", desc: "Need dashboards, templates, and client tracking." },
  { id: "coach_b2b_partner", label: "B2B / partner support", desc: "Supporting schools, cohorts, or partner groups." },
];

const URGENCY_OPTIONS = [
  { id: "asap", label: "ASAP", desc: "Need momentum this month." },
  { id: "1_3_months", label: "1-3 months", desc: "Structured search window." },
  { id: "3_6_months", label: "3-6 months", desc: "Planning and positioning." },
  { id: "passive", label: "Passive", desc: "Open to better opportunities." },
];

const WORK_AUTH_OPTIONS = [
  { id: "no_sponsorship_needed", label: "No sponsorship needed" },
  { id: "need_sponsorship", label: "Need sponsorship" },
  { id: "student_pass", label: "Student pass / graduate visa" },
  { id: "dependent_pass", label: "Dependent pass" },
  { id: "not_sure", label: "Not sure yet" },
];

const SUPPORT_NEEDS = [
  "Resume analysis",
  "Role targeting",
  "Weekly job recommendations",
  "LinkedIn branding",
  "Coffee chat messages",
  "Interview prep",
  "Salary negotiation",
  "Visa / work pass context",
  "1:1 career consultation",
];

const COACH_SUPPORT_NEEDS = [
  "Client matching",
  "Resume / LinkedIn review",
  "Discovery call proposal",
  "Weekly consultation plan",
  "Outcome-safe paid package",
];

const CAREER_MODULES = [
  "Career Ops flow",
  "Job recommendations",
  "Resume tailoring",
  "Job fit scoring",
  "Application tracker",
  "Coffee chat outreach",
  "LinkedIn branding",
  "Human consulting",
];

const COACH_CAREER_MODULES = [
  "Client matching",
  "Consulting proposal builder",
];

export default function Onboarding() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  const [userType, setUserType] = useState("job_seeker");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [targetCompanies, setTargetCompanies] = useState("");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [needsVisaSponsorship, setNeedsVisaSponsorship] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([]);
  const [applicationStage, setApplicationStage] = useState("");
  const [searchUrgency, setSearchUrgency] = useState("");
  const [workAuthorization, setWorkAuthorization] = useState("");
  const [supportNeeds, setSupportNeeds] = useState<string[]>([]);
  const [careerModules, setCareerModules] = useState<string[]>([]);

  const saveSurvey = trpc.survey.save.useMutation({
    onSuccess: () => setLocation("/dashboard"),
  });

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const handleSubmit = () => {
    const audienceTag = `audience:${userType}`;
    const structuredTags = [
      audienceTag,
      applicationStage ? `stage:${applicationStage}` : "",
      searchUrgency ? `urgency:${searchUrgency}` : "",
      workAuthorization ? `auth:${workAuthorization}` : "",
      ...supportNeeds.map((need) => `support:${need}`),
      ...careerModules.map((module) => `module:${module}`),
    ].filter(Boolean);
    saveSurvey.mutate({
      lookingFor: Array.from(new Set([...structuredTags, ...lookingFor])), targetRole, experienceLevel, interests,
      targetCompanies, preferredLocations, salaryExpectation,
      needsVisaSponsorship: needsVisaSponsorship || workAuthorization === "need_sponsorship",
      preferredLanguage,
      preferredJobTypes: Array.from(new Set([...preferredJobTypes, ...careerModules.map((module) => `module:${module}`)])),
    });
  };

  const totalSteps = 7;
  const isCoach = userType === "career_consultant";
  const selectedUserType = USER_TYPE_OPTIONS.find((option) => option.id === userType) ?? USER_TYPE_OPTIONS[0];
  const lookingForOptions = isCoach ? COACH_LOOKING_FOR_OPTIONS : t.onboarding.lookingForOptions;
  const roleSuggestions = isCoach ? COACH_TARGET_SUGGESTIONS : TARGET_ROLE_SUGGESTIONS;
  const workflowStages = isCoach ? COACH_WORKFLOW_STAGES : APPLICATION_STAGES;
  const supportNeedOptions = isCoach ? COACH_SUPPORT_NEEDS : SUPPORT_NEEDS;
  const careerModuleOptions = isCoach ? COACH_CAREER_MODULES : CAREER_MODULES;
  const interestOptions = isCoach ? COACH_CLIENT_SEGMENTS : t.onboarding.interests;
  const canNext = step === 0 ? userType.length > 0 :
    step === 1 ? lookingFor.length > 0 :
    step === 2 ? targetRole.length > 0 :
    step === 3 ? experienceLevel.length > 0 :
    step === 4 ? interests.length > 0 :
    step === 5 ? applicationStage.length > 0 && searchUrgency.length > 0 && workAuthorization.length > 0 && supportNeeds.length > 0 : true;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container py-6">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2">
          <BrandLogo size="sm" />
          <span className="text-sm text-muted-foreground">{t.brand.tagline}</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center pb-16">
        <div className="w-full max-w-2xl px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{t.onboarding.title}</h1>
            <p className="text-muted-foreground mt-2">{t.onboarding.subtitle}</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1 mb-8 max-w-md mx-auto">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>

          {/* Step 0: User type */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-semibold">First, which side are you on?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We will personalize the dashboard, onboarding, and future payment flow based on this.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {USER_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setUserType(option.id)}
                    className={`rounded-2xl border p-5 text-left transition-all ${
                      userType === option.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        userType === option.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        {option.badge}
                      </span>
                    </div>
                    <h3 className="font-semibold">{option.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{option.desc}</p>
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Transparent from day one
                </div>
                <div className="space-y-2">
                  {TRUST_NOTES.map((note) => (
                    <div key={note} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: What are you looking for? */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {selectedUserType.badge}
                </p>
                <h2 className="text-xl font-semibold">
                  {isCoach ? "What should your coach profile do?" : t.onboarding.lookingForTitle}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {isCoach
                    ? "Keep this focused: mentor candidates on profile, positioning, and application organization. JobPA is not an employment agency."
                    : t.onboarding.lookingForSubtitle}
                </p>
              </div>
              <div className="grid gap-3 mt-6">
                {lookingForOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleItem(lookingFor, setLookingFor, opt.id)}
                    className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                      lookingFor.includes(opt.id)
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${
                      lookingFor.includes(opt.id) ? "bg-primary text-primary-foreground" : "border-2 border-muted-foreground/30"
                    }`}>
                      {lookingFor.includes(opt.id) && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Step 2: Target Role */}
          {step === 2 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <Label className="text-base font-semibold">
                {isCoach ? "Your strongest coaching expertise" : t.onboarding.step1}
              </Label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder={isCoach ? "e.g. Resume branding for international students in Singapore" : t.onboarding.jobRolePlaceholder}
                className="h-12 text-base"
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {isCoach ? "Popular coach expertise areas" : "Popular non-tech and business roles"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {roleSuggestions.map((role) => (
                    <button
                      key={role}
                      onClick={() => setTargetRole(role)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        targetRole === role
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Experience Level */}
          {step === 3 && (
            <div className="space-y-4 max-w-md mx-auto">
              <Label className="text-base font-semibold">
                {isCoach ? "Your credibility level" : t.onboarding.step2}
              </Label>
              <div className="grid gap-3">
                {Object.entries(t.onboarding.experienceLevels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setExperienceLevel(key)}
                    className={`p-4 rounded-lg border text-left text-sm font-medium transition-all ${
                      experienceLevel === key
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {isCoach ? "Who do you want to help?" : t.onboarding.step3}
              </Label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleItem(interests, setInterests, interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      interests.includes(interest)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Additional Info */}
          {step === 5 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold">
                  {isCoach ? "Help JobPA understand your coaching workflow" : "Help JobPA understand your career workflow"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isCoach
                    ? "These structured answers make client intake, proposal generation, and future paid mentoring workflows easier to personalize."
                    : "These structured answers make job recommendations, resume analysis, and AI guidance more accurate."}
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">{isCoach ? "Current coaching workflow stage" : "Current search stage"}</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {workflowStages.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setApplicationStage(item.id)}
                      className={`rounded-2xl border p-3 text-left transition-all ${
                        applicationStage === item.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Timeline / urgency</Label>
                  <div className="grid gap-2">
                    {URGENCY_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSearchUrgency(item.id)}
                        className={`rounded-xl border px-3 py-2 text-left transition-all ${
                          searchUrgency === item.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Work authorization / visa context</Label>
                  <div className="grid gap-2">
                    {WORK_AUTH_OPTIONS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setWorkAuthorization(item.id);
                          setNeedsVisaSponsorship(item.id === "need_sponsorship");
                        }}
                        className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all ${
                          workAuthorization === item.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  {isCoach ? "What do you want JobPA to help you deliver?" : "What do you want JobPA to help with?"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {supportNeedOptions.map((need) => (
                    <button
                      key={need}
                      onClick={() => toggleItem(supportNeeds, setSupportNeeds, need)}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition-all ${
                        supportNeeds.includes(need)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      {need}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  {isCoach ? "Choose your Coach Ops modules" : "Choose your Career Ops modules"}
                </Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {careerModuleOptions.map((module) => (
                    <button
                      key={module}
                      onClick={() => toggleItem(careerModules, setCareerModules, module)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all ${
                        careerModules.includes(module) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md ${
                        careerModules.includes(module) ? "bg-primary text-primary-foreground" : "border border-muted-foreground/30"
                      }`}>
                        {careerModules.includes(module) && <Check className="h-3 w-3" />}
                      </div>
                      {module}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Additional Info */}
          {step === 6 && (
            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <Label className="text-sm font-medium">{t.onboarding.step4}</Label>
              </div>
              <div>
                <Label className="text-sm">Preferred markets / locations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => toggleItem(preferredLocations, setPreferredLocations, loc.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        preferredLocations.includes(loc.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {loc.flag} {LOCATION_LABELS[loc.id] ?? loc.id}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">{isCoach ? "Engagement type" : "Preferred job type"}</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {t.onboarding.jobTypes.map((jt) => (
                    <button
                      key={jt.id}
                      onClick={() => toggleItem(preferredJobTypes, setPreferredJobTypes, jt.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        preferredJobTypes.includes(jt.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {jt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">{isCoach ? "Monthly target budget" : "Salary expectation"}</Label>
                <Input
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(e.target.value)}
                  placeholder={isCoach ? "e.g. US$30 beta, US$99/month, custom" : t.onboarding.salaryPlaceholder}
                  className="mt-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t.jobs.visaSponsorship}</Label>
                <Switch checked={needsVisaSponsorship} onCheckedChange={setNeedsVisaSponsorship} />
              </div>
              <div>
                <Label className="text-sm">Preferred guidance language</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["English", "Korean", "Bilingual"].map((language) => (
                    <button
                      key={language}
                      onClick={() => setPreferredLanguage(language)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        preferredLanguage === language
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">{isCoach ? "Target client segments" : "Target companies"}</Label>
                <Textarea
                  value={targetCompanies}
                  onChange={(e) => setTargetCompanies(e.target.value)}
                  placeholder={isCoach ? "e.g. Vietnamese teachers in Singapore, SMU graduates, career switchers" : t.onboarding.targetCompaniesPlaceholder}
                  className="mt-2"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 max-w-md mx-auto">
            <Button
              variant="ghost"
              onClick={() => step > 0 ? setStep(step - 1) : setLocation("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {step > 0 ? t.onboarding.prev : t.common.cancel}
            </Button>
            {step < totalSteps - 1 ? (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(step + 1)} className="text-muted-foreground">
                  {t.onboarding.skip}
                </Button>
                <Button onClick={() => setStep(step + 1)} disabled={!canNext} className="gap-2">
                  {t.onboarding.next}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleSubmit} disabled={saveSurvey.isPending} className="gap-2">
                {saveSurvey.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.onboarding.submit}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
