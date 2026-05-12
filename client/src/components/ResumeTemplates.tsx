/**
 * ResumeTemplates — Download resume as PDF in two styles:
 *  1. International Standard (clean, ATS-friendly)
 *  2. Korean Saramin 자소서 (Korean cover letter style)
 *
 * Uses jsPDF for PDF generation. Profile data auto-fills the template.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/contexts/i18nContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Globe, BookOpen, Loader2, UserCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import jsPDF from "jspdf";

type ExperienceItem = { company: string; role: string; period: string; description: string };
type EducationItem = { school: string; degree: string; field: string; period: string };

// ─── PDF Generators ──────────────────────────────────────────────────────────

function generateInternationalPDF(profile: Record<string, unknown>) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const skills = (profile.skills as string[]) ?? [];
  const experience = (profile.experience as ExperienceItem[]) ?? [];
  const education = (profile.education as EducationItem[]) ?? [];

  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addLine = (text: string, fontSize: number, bold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, margin, y);
    y += fontSize * 0.45 + 2;
  };

  const addWrappedText = (text: string, fontSize: number) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * (fontSize * 0.45 + 1) + 2;
  };

  const addSectionTitle = (title: string) => {
    y += 4;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 100, 200);
    doc.text(title.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(30, 100, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // Header
  doc.setFillColor(30, 100, 200);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text((profile.fullName as string) || "Your Name", margin, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text((profile.headline as string) || "Professional Title", margin, 26);

  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email as string);
  if (profile.phone) contactParts.push(profile.phone as string);
  if (profile.location) contactParts.push(profile.location as string);
  if (profile.linkedinUrl) contactParts.push((profile.linkedinUrl as string).replace("https://", ""));
  doc.setFontSize(9);
  doc.text(contactParts.join("  |  "), margin, 34);
  y = 50;

  // Summary
  if (profile.summary) {
    addSectionTitle("Professional Summary");
    addWrappedText(profile.summary as string, 10);
  }

  // Skills
  if (skills.length > 0) {
    addSectionTitle("Skills");
    addWrappedText(skills.join("  •  "), 10);
  }

  // Experience
  if (experience.length > 0) {
    addSectionTitle("Work Experience");
    experience.forEach(exp => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(exp.role || "", margin, y);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`${exp.company || ""}  |  ${exp.period || ""}`, margin, y + 5);
      y += 9;
      if (exp.description) {
        addWrappedText(exp.description, 9.5);
      }
      y += 3;
    });
  }

  // Education
  if (education.length > 0) {
    addSectionTitle("Education");
    education.forEach(edu => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${edu.degree || ""} in ${edu.field || ""}`, margin, y);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`${edu.school || ""}  |  ${edu.period || ""}`, margin, y + 5);
      y += 11;
    });
  }

  // Job Preferences
  const prefs: string[] = [];
  if (profile.targetRole) prefs.push(`Target Role: ${profile.targetRole}`);
  if (profile.targetLocation) prefs.push(`Target Location: ${profile.targetLocation}`);
  if (profile.targetSalary) prefs.push(`Target Salary: ${profile.targetSalary}`);
  if (profile.visaStatus) prefs.push(`Visa Status: ${profile.visaStatus}`);
  if (prefs.length > 0) {
    addSectionTitle("Job Preferences");
    prefs.forEach(p => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`• ${p}`, margin, y);
      y += 6;
    });
  }

  doc.save(`${(profile.fullName as string || "resume").replace(/\s+/g, "_")}_International_Resume.pdf`);
}

function generateKoreanSaraminPDF(profile: Record<string, unknown>) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const skills = (profile.skills as string[]) ?? [];
  const experience = (profile.experience as ExperienceItem[]) ?? [];
  const education = (profile.education as EducationItem[]) ?? [];

  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addKoreanText = (text: string, x: number, yPos: number, fontSize: number, bold = false, color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(text, x, yPos);
  };

  const addWrappedText = (text: string, fontSize: number) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * (fontSize * 0.45 + 1) + 3;
  };

  // Header — Korean style with red accent
  doc.setFillColor(220, 30, 30);
  doc.rect(0, 0, pageWidth, 8, "F");

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("이력서 / 자기소개서", margin, 22);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Curriculum Vitae & Cover Letter (Korean Saramin Style)", margin, 29);

  // Divider
  doc.setDrawColor(220, 30, 30);
  doc.setLineWidth(1);
  doc.line(margin, 33, pageWidth - margin, 33);
  y = 42;

  // Personal Info Box
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(220, 220, 220);
  doc.rect(margin, y - 5, contentWidth, 32, "FD");

  addKoreanText("성명 (Name)", margin + 3, y + 2, 9, true, [100, 100, 100]);
  addKoreanText((profile.fullName as string) || "홍길동", margin + 3, y + 9, 13, true);
  addKoreanText("직함 (Title)", margin + 80, y + 2, 9, true, [100, 100, 100]);
  addKoreanText((profile.headline as string) || "직책", margin + 80, y + 9, 11);
  addKoreanText("연락처 (Contact)", margin + 3, y + 17, 9, true, [100, 100, 100]);
  const contact = [profile.email, profile.phone, profile.location].filter(Boolean).join("  /  ");
  addKoreanText(contact, margin + 3, y + 23, 9);
  y += 38;

  const addSection = (title: string, korTitle: string) => {
    y += 4;
    doc.setFillColor(220, 30, 30);
    doc.rect(margin, y - 4, 3, 10, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`${korTitle}  (${title})`, margin + 6, y + 2);
    y += 8;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  // 자기소개 (Self Introduction)
  if (profile.summary) {
    addSection("Self Introduction", "자기소개");
    addWrappedText(profile.summary as string, 10);
  }

  // 기술 (Skills)
  if (skills.length > 0) {
    addSection("Skills", "보유 기술");
    addWrappedText(skills.join("  /  "), 10);
  }

  // 경력 사항 (Work Experience)
  if (experience.length > 0) {
    addSection("Work Experience", "경력 사항");
    experience.forEach((exp, idx) => {
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 3, contentWidth, 8, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${idx + 1}. ${exp.company || ""}`, margin + 2, y + 2);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`${exp.role || ""}  |  ${exp.period || ""}`, margin + 2, y + 8);
      y += 13;
      if (exp.description) {
        addWrappedText(exp.description, 9.5);
      }
      y += 2;
    });
  }

  // 학력 (Education)
  if (education.length > 0) {
    addSection("Education", "학력");
    education.forEach(edu => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`${edu.school || ""}`, margin, y);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`${edu.degree || ""}  ${edu.field || ""}  |  ${edu.period || ""}`, margin, y + 5);
      y += 11;
    });
  }

  // 취업 목표 (Job Preferences)
  const prefs: string[] = [];
  if (profile.targetRole) prefs.push(`희망 직무: ${profile.targetRole}`);
  if (profile.targetLocation) prefs.push(`희망 지역: ${profile.targetLocation}`);
  if (profile.targetSalary) prefs.push(`희망 연봉: ${profile.targetSalary}`);
  if (profile.visaStatus) prefs.push(`비자 상태: ${profile.visaStatus}`);
  if (prefs.length > 0) {
    addSection("Job Preferences", "취업 목표");
    prefs.forEach(p => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`• ${p}`, margin, y);
      y += 6;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`JobPA 취업비서  |  Page ${i} of ${pageCount}`, margin, 290);
  }

  doc.save(`${(profile.fullName as string || "이력서").replace(/\s+/g, "_")}_사람인_자소서.pdf`);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ResumeTemplates() {
  const { t } = useI18n();
  const r = (t.resume as any);
  const { data: profile } = trpc.profile.get.useQuery();
  const [generatingIntl, setGeneratingIntl] = useState(false);
  const [generatingKorean, setGeneratingKorean] = useState(false);

  const hasProfile = profile && (profile.fullName || profile.summary || (profile.skills as string[])?.length > 0);

  const handleDownloadIntl = async () => {
    setGeneratingIntl(true);
    try {
      generateInternationalPDF((profile || {}) as Record<string, unknown>);
      toast.success("International resume PDF downloaded!");
    } catch (e) {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingIntl(false);
    }
  };

  const handleDownloadKorean = async () => {
    setGeneratingKorean(true);
    try {
      generateKoreanSaraminPDF((profile || {}) as Record<string, unknown>);
      toast.success("한국 사람인 자소서 PDF 다운로드 완료!");
    } catch (e) {
      toast.error("PDF 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setGeneratingKorean(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          {r.templates}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{r.templatesDesc}</p>
      </div>

      {!hasProfile && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <UserCircle className="w-4 h-4 shrink-0" />
          <span>
            {(t as any).myProfile?.usedInFit || "Set up your profile to auto-fill the resume template."}
            {" "}
            <Link href="/dashboard/profile" className="underline font-medium">
              {t.nav.myProfile}
            </Link>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* International Standard */}
        <Card className="border-blue-200 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{r.templateIntl}</h3>
                  <Badge variant="secondary" className="text-xs">ATS-Friendly</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{r.templateIntlDesc}</p>
              </div>
            </div>

            {/* Preview mockup */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-xs space-y-1.5 font-mono">
              <div className="h-3 bg-blue-600 rounded-sm w-full" />
              <div className="h-2 bg-gray-300 rounded-sm w-3/4" />
              <div className="h-2 bg-gray-200 rounded-sm w-1/2" />
              <div className="border-t border-gray-200 pt-1.5 mt-1.5">
                <div className="h-1.5 bg-blue-200 rounded-sm w-1/3 mb-1" />
                <div className="h-1.5 bg-gray-200 rounded-sm w-full mb-0.5" />
                <div className="h-1.5 bg-gray-200 rounded-sm w-5/6" />
              </div>
              <div className="border-t border-gray-200 pt-1.5">
                <div className="h-1.5 bg-blue-200 rounded-sm w-1/4 mb-1" />
                <div className="flex gap-1 flex-wrap">
                  {["React", "Python", "SQL"].map(s => (
                    <span key={s} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px]">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleDownloadIntl}
              disabled={generatingIntl}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {generatingIntl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {r.downloadPdf}
            </Button>
          </CardContent>
        </Card>

        {/* Korean Saramin Style */}
        <Card className="border-red-200 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{r.templateKorean}</h3>
                  <Badge variant="secondary" className="text-xs">사람인 스타일</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{r.templateKoreanDesc}</p>
              </div>
            </div>

            {/* Preview mockup */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-xs space-y-1.5 font-mono">
              <div className="h-2 bg-red-600 rounded-sm w-full" />
              <div className="h-3 bg-gray-800 rounded-sm w-2/3" />
              <div className="bg-gray-100 border border-gray-200 rounded p-1.5 mt-1">
                <div className="grid grid-cols-2 gap-1">
                  <div className="h-1.5 bg-gray-300 rounded-sm" />
                  <div className="h-1.5 bg-gray-200 rounded-sm" />
                  <div className="h-1.5 bg-gray-300 rounded-sm" />
                  <div className="h-1.5 bg-gray-200 rounded-sm" />
                </div>
              </div>
              <div className="border-t border-gray-200 pt-1.5">
                <div className="flex items-center gap-1 mb-1">
                  <div className="h-3 w-1 bg-red-600 rounded-sm" />
                  <div className="h-1.5 bg-gray-700 rounded-sm w-1/3" />
                </div>
                <div className="h-1.5 bg-gray-200 rounded-sm w-full mb-0.5" />
                <div className="h-1.5 bg-gray-200 rounded-sm w-4/5" />
              </div>
            </div>

            <Button
              onClick={handleDownloadKorean}
              disabled={generatingKorean}
              className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {generatingKorean ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {r.downloadPdf}
            </Button>
          </CardContent>
        </Card>
      </div>

      {hasProfile && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <UserCircle className="w-3 h-3" />
          {r.fillWithProfile} — {profile?.fullName || ""}
        </p>
      )}
    </div>
  );
}
