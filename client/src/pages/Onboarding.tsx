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
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const LOCATIONS = [
  { id: "singapore", flag: "SG" },
  { id: "hongkong", flag: "HK" },
  { id: "dubai", flag: "UAE" },
  { id: "korea", flag: "KR" },
  { id: "remote", flag: "Remote" },
];

const USER_TYPE_OPTIONS = [
  {
    id: "job_seeker",
    icon: UserRound,
    title: "I am looking for a job",
    desc: "Use JobPA to run your own Career Ops: search, resume, applications, interview prep, and consulting support.",
    badge: "Candidate workspace",
  },
  {
    id: "career_consultant",
    icon: BriefcaseBusiness,
    title: "I am a career consultant or coach",
    desc: "Use JobPA to support candidates, manage readiness signals, and prepare for future paid consulting workflows.",
    badge: "Coach / partner workspace",
  },
];

const TRUST_NOTES = [
  "AI guidance only: users stay in control of applications and decisions.",
  "Sensitive career data should be reviewed carefully before upload.",
  "Paid consulting and coach workflows will be separated from free candidate tools.",
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

  const saveSurvey = trpc.survey.save.useMutation({
    onSuccess: () => setLocation("/dashboard"),
  });

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const handleSubmit = () => {
    const audienceTag = `audience:${userType}`;
    saveSurvey.mutate({
      lookingFor: Array.from(new Set([audienceTag, ...lookingFor])), targetRole, experienceLevel, interests,
      targetCompanies, preferredLocations, salaryExpectation,
      needsVisaSponsorship, preferredLanguage, preferredJobTypes,
    });
  };

  const totalSteps = 6;
  const selectedUserType = USER_TYPE_OPTIONS.find((option) => option.id === userType) ?? USER_TYPE_OPTIONS[0];
  const canNext = step === 0 ? userType.length > 0 :
    step === 1 ? lookingFor.length > 0 :
    step === 2 ? targetRole.length > 0 :
    step === 3 ? experienceLevel.length > 0 :
    step === 4 ? interests.length > 0 : true;

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
                <h2 className="text-xl font-semibold">{t.onboarding.lookingForTitle}</h2>
                <p className="text-sm text-muted-foreground mt-2">{t.onboarding.lookingForSubtitle}</p>
              </div>
              <div className="grid gap-3 mt-6">
                {t.onboarding.lookingForOptions.map((opt) => (
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
              <Label className="text-base font-semibold">{t.onboarding.step1}</Label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder={t.onboarding.jobRolePlaceholder}
                className="h-12 text-base"
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Popular non-tech and business roles</p>
                <div className="flex flex-wrap gap-2">
                  {TARGET_ROLE_SUGGESTIONS.map((role) => (
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
              <Label className="text-base font-semibold">{t.onboarding.step2}</Label>
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
              <Label className="text-base font-semibold">{t.onboarding.step3}</Label>
              <div className="flex flex-wrap gap-2">
                {t.onboarding.interests.map((interest) => (
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
            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <Label className="text-sm font-medium">{t.onboarding.step4}</Label>
              </div>
              <div>
                <Label className="text-sm">{t.onboarding.locationPlaceholder}</Label>
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
                      {loc.flag} {(t.locations as any)[loc.id]?.replace(/^.+\s/, "") || loc.id}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">{t.onboarding.jobRolePlaceholder?.replace("e.g.", "").trim()}</Label>
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
                <Label className="text-sm">{t.onboarding.salaryPlaceholder?.split(",")[0]}</Label>
                <Input
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(e.target.value)}
                  placeholder={t.onboarding.salaryPlaceholder}
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
                <Label className="text-sm">{t.onboarding.targetCompaniesPlaceholder?.split(",")[0]}</Label>
                <Textarea
                  value={targetCompanies}
                  onChange={(e) => setTargetCompanies(e.target.value)}
                  placeholder={t.onboarding.targetCompaniesPlaceholder}
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
