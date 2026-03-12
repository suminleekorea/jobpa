import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Bot, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const LOCATIONS = [
  { id: "singapore", flag: "🇸🇬" },
  { id: "hongkong", flag: "🇭🇰" },
  { id: "dubai", flag: "🇦🇪" },
  { id: "korea", flag: "🇰🇷" },
  { id: "remote", flag: "🌍" },
];

export default function Onboarding() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);

  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [targetCompanies, setTargetCompanies] = useState("");
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [needsVisaSponsorship, setNeedsVisaSponsorship] = useState(false);
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([]);

  const saveSurvey = trpc.survey.save.useMutation({
    onSuccess: () => setLocation("/dashboard"),
  });

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const handleSubmit = () => {
    saveSurvey.mutate({
      lookingFor, targetRole, experienceLevel, interests,
      targetCompanies, preferredLocations, salaryExpectation,
      needsVisaSponsorship, preferredJobTypes,
    });
  };

  const totalSteps = 5;
  const canNext = step === 0 ? lookingFor.length > 0 :
    step === 1 ? targetRole.length > 0 :
    step === 2 ? experienceLevel.length > 0 :
    step === 3 ? interests.length > 0 : true;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container py-6">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">{t.brand.name}</span>
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

          {/* Step 0: What are you looking for? */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center">{t.onboarding.lookingForTitle}</h2>
              <p className="text-sm text-muted-foreground text-center">{t.onboarding.lookingForSubtitle}</p>
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

          {/* Step 1: Target Role */}
          {step === 1 && (
            <div className="space-y-4 max-w-md mx-auto">
              <Label className="text-base font-semibold">{t.onboarding.step1}</Label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder={t.onboarding.jobRolePlaceholder}
                className="h-12 text-base"
              />
            </div>
          )}

          {/* Step 2: Experience Level */}
          {step === 2 && (
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

          {/* Step 3: Interests */}
          {step === 3 && (
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

          {/* Step 4: Additional Info */}
          {step === 4 && (
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
