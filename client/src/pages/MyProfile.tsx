import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/contexts/i18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User, Briefcase, GraduationCap, Target, Plus, X, Save,
  Linkedin, Globe, Info, CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";

type ExperienceItem = { company: string; role: string; period: string; description: string };
type EducationItem = { school: string; degree: string; field: string; period: string };

export default function MyProfile() {
  const { t } = useI18n();
  const p = t.myProfile;
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const upsertMutation = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      toast.success(p.saved);
      utils.profile.get.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  const utils = trpc.useUtils();

  // Form state
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [targetRole, setTargetRole] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [targetSalary, setTargetSalary] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // Collapsible sections
  const [openSections, setOpenSections] = useState({
    personal: true, skills: true, experience: true, education: true, preferences: true,
  });

  // Populate form from loaded profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setHeadline(profile.headline ?? "");
      setEmail(profile.email ?? "");
      setPhone(profile.phone ?? "");
      setLocation(profile.location ?? "");
      setSummary(profile.summary ?? "");
      setSkills((profile.skills as string[]) ?? []);
      setExperience((profile.experience as ExperienceItem[]) ?? []);
      setEducation((profile.education as EducationItem[]) ?? []);
      setTargetRole(profile.targetRole ?? "");
      setTargetLocation(profile.targetLocation ?? "");
      setTargetSalary(profile.targetSalary ?? "");
      setVisaStatus(profile.visaStatus ?? "");
      setLinkedinUrl(profile.linkedinUrl ?? "");
      setPortfolioUrl(profile.portfolioUrl ?? "");
    }
  }, [profile]);

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) { setSkills([...skills, s]); }
    setSkillInput("");
  };
  const removeSkill = (s: string) => setSkills(skills.filter((x) => x !== s));

  const addExperience = () =>
    setExperience([...experience, { company: "", role: "", period: "", description: "" }]);
  const updateExp = (i: number, field: keyof ExperienceItem, val: string) => {
    const updated = [...experience];
    updated[i] = { ...updated[i], [field]: val };
    setExperience(updated);
  };
  const removeExp = (i: number) => setExperience(experience.filter((_, idx) => idx !== i));

  const addEducation = () =>
    setEducation([...education, { school: "", degree: "", field: "", period: "" }]);
  const updateEdu = (i: number, field: keyof EducationItem, val: string) => {
    const updated = [...education];
    updated[i] = { ...updated[i], [field]: val };
    setEducation(updated);
  };
  const removeEdu = (i: number) => setEducation(education.filter((_, idx) => idx !== i));

  const handleSave = () => {
    upsertMutation.mutate({
      fullName, headline, email, phone, location, summary,
      skills, experience, education,
      targetRole, targetLocation, targetSalary, visaStatus,
      linkedinUrl, portfolioUrl,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const SectionHeader = ({
    icon, title, sectionKey,
  }: { icon: React.ReactNode; title: string; sectionKey: keyof typeof openSections }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between py-3 text-left"
    >
      <div className="flex items-center gap-2 font-semibold text-gray-800">
        {icon}
        {title}
      </div>
      {openSections[sectionKey] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{p.title}</h1>
        <p className="text-gray-500 mt-1 text-sm">{p.subtitle}</p>
      </div>

      {/* Info banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{p.usedInFit}</span>
        </div>
        <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{p.usedInChat}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* ── Personal Information ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 border-b border-gray-100">
            <SectionHeader icon={<User className="w-4 h-4 text-blue-500" />} title={p.personalInfo} sectionKey="personal" />
          </div>
          {openSections.personal && (
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.fullName}</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Kim Minjun" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.headline}</Label>
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Senior Software Engineer @ Google" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.email}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.phone}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+65 9123 4567" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.location}</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Singapore" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.linkedinUrl}</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <Input className="pl-9" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm text-gray-600 mb-1 block">{p.portfolioUrl}</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-9" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm text-gray-600 mb-1 block">{p.summary}</Label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="Briefly describe your background, strengths, and career goals..."
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Skills ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 border-b border-gray-100">
            <SectionHeader icon={<Target className="w-4 h-4 text-purple-500" />} title={p.skills} sectionKey="skills" />
          </div>
          {openSections.skills && (
            <div className="px-6 py-5">
              <div className="flex gap-2 mb-3">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder={p.skillsPlaceholder}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1 px-3 py-1 text-sm">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      <X className="w-3 h-3 ml-1 text-gray-400 hover:text-red-500" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Work Experience ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 border-b border-gray-100">
            <SectionHeader icon={<Briefcase className="w-4 h-4 text-orange-500" />} title={p.experience} sectionKey="experience" />
          </div>
          {openSections.experience && (
            <div className="px-6 py-5 space-y-4">
              {experience.map((exp, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4 relative bg-gray-50">
                  <button
                    type="button"
                    onClick={() => removeExp(i)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">{p.company}</Label>
                      <Input value={exp.company} onChange={(e) => updateExp(i, "company", e.target.value)} placeholder="Google" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">{p.role}</Label>
                      <Input value={exp.role} onChange={(e) => updateExp(i, "role", e.target.value)} placeholder="Software Engineer" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-gray-500 mb-1 block">{p.period}</Label>
                      <Input value={exp.period} onChange={(e) => updateExp(i, "period", e.target.value)} placeholder="Jan 2021 - Dec 2023" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs text-gray-500 mb-1 block">{p.description}</Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExp(i, "description", e.target.value)}
                        rows={3}
                        placeholder="Key responsibilities and achievements..."
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addExperience} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" />
                {p.addExperience}
              </Button>
            </div>
          )}
        </div>

        {/* ── Education ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 border-b border-gray-100">
            <SectionHeader icon={<GraduationCap className="w-4 h-4 text-green-500" />} title={p.education} sectionKey="education" />
          </div>
          {openSections.education && (
            <div className="px-6 py-5 space-y-4">
              {education.map((edu, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4 relative bg-gray-50">
                  <button
                    type="button"
                    onClick={() => removeEdu(i)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">{p.school}</Label>
                      <Input value={edu.school} onChange={(e) => updateEdu(i, "school", e.target.value)} placeholder="National University of Singapore" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">{p.degree}</Label>
                      <Input value={edu.degree} onChange={(e) => updateEdu(i, "degree", e.target.value)} placeholder="Bachelor of Science" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">{p.field}</Label>
                      <Input value={edu.field} onChange={(e) => updateEdu(i, "field", e.target.value)} placeholder="Computer Science" />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">{p.period}</Label>
                      <Input value={edu.period} onChange={(e) => updateEdu(i, "period", e.target.value)} placeholder="2017 - 2021" />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addEducation} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" />
                {p.addEducation}
              </Button>
            </div>
          )}
        </div>

        {/* ── Job Preferences ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 border-b border-gray-100">
            <SectionHeader icon={<Target className="w-4 h-4 text-blue-500" />} title={p.jobPreferences} sectionKey="preferences" />
          </div>
          {openSections.preferences && (
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.targetRole}</Label>
                <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Senior Product Manager" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.targetLocation}</Label>
                <Input value={targetLocation} onChange={(e) => setTargetLocation(e.target.value)} placeholder="Singapore, Seoul" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.targetSalary}</Label>
                <Input value={targetSalary} onChange={(e) => setTargetSalary(e.target.value)} placeholder="SGD 8,000 - 12,000" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">{p.visaStatus}</Label>
                <Input value={visaStatus} onChange={(e) => setVisaStatus(e.target.value)} placeholder="Employment Pass (EP)" />
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2 pb-8">
          <Button
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {upsertMutation.isPending ? t.common.loading : t.common.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
