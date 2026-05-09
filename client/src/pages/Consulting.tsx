import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Briefcase, Globe, Languages, Star, Clock, Leaf, Filter,
  ChevronRight, Building2, Users, Linkedin, CheckCircle2,
  ArrowLeft, Calendar,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type SessionType = {
  name: string;
  durationMinutes: number;
  priceCredits: number;
  description: string;
};

type CareerItem = {
  company: string;
  role: string;
  period: string;
};

type Consultant = {
  id: number;
  displayName: string;
  title?: string | null;
  bio?: string | null;
  specialties?: string[] | null;
  targetRegions?: string[] | null;
  languages?: string[] | null;
  yearsExperience?: number | null;
  sessionPriceCredits?: number | null;
  avatarUrl?: string | null;
  photoUrl?: string | null;
  linkedinUrl?: string | null;
  industry?: string | null;
  industries?: string[] | null;
  careerHistory?: CareerItem[] | null;
  sessionTypes?: SessionType[] | null;
  totalSessions?: number | null;
  avgRating?: number | null;
};

// ─── Industry Filter Options ──────────────────────────────────────────────────
const INDUSTRY_FILTERS = [
  { id: "all", label: "전체" },
  { id: "Technology", label: "테크/IT" },
  { id: "Finance", label: "금융" },
  { id: "Consulting", label: "컨설팅" },
  { id: "Marketing", label: "마케팅" },
  { id: "Healthcare", label: "헬스케어" },
  { id: "Education", label: "교육" },
  { id: "Startup", label: "스타트업" },
  { id: "HR", label: "HR/채용" },
];

// ─── Sprouts Credit Packages ──────────────────────────────────────────────────
const CREDIT_PACKAGES = [
  { credits: 5, price: "S$15", priceKrw: "₩15,000", popular: false, label: "스타터" },
  { credits: 10, price: "S$25", priceKrw: "₩25,000", popular: true, label: "베스트" },
  { credits: 20, price: "S$45", priceKrw: "₩45,000", popular: false, label: "프리미엄" },
];

// ─── Default session types ────────────────────────────────────────────────────
const DEFAULT_SESSION_TYPES: SessionType[] = [
  { name: "30분 빠른 상담", durationMinutes: 30, priceCredits: 5, description: "이력서 피드백, 비자 질문, 빠른 커리어 방향 점검" },
  { name: "60분 심층 코칭", durationMinutes: 60, priceCredits: 10, description: "취업 전략 수립, 면접 준비, 링크드인 프로필 최적화" },
  { name: "90분 커리어 로드맵", durationMinutes: 90, priceCredits: 15, description: "싱가포르/APAC 취업 전체 전략 수립 + 액션플랜 작성" },
];

// ─── Consultant Card ──────────────────────────────────────────────────────────
function ConsultantCard({ consultant, onClick }: { consultant: Consultant; onClick: () => void }) {
  const photo = consultant.photoUrl || consultant.avatarUrl;
  const initials = consultant.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const rating = consultant.avgRating ?? 5;
  const sessions = consultant.totalSessions ?? 0;
  const industries = (consultant.industries as string[] | null) ?? (consultant.industry ? [consultant.industry] : []);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-border/60 bg-card"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Avatar className="w-16 h-16 shrink-0 rounded-xl">
            <AvatarImage src={photo ?? undefined} alt={consultant.displayName} className="object-cover" />
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-tight">{consultant.displayName}</h3>
                {consultant.title && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{consultant.title}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium text-foreground">{rating}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {industries.slice(0, 2).map(ind => (
                <Badge key={ind} variant="secondary" className="text-xs px-2 py-0.5 font-normal">{ind}</Badge>
              ))}
              {(consultant.targetRegions ?? []).slice(0, 1).map(r => (
                <Badge key={r} variant="outline" className="text-xs px-2 py-0.5 font-normal text-muted-foreground">{r}</Badge>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-3.5" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {consultant.yearsExperience ?? 0}년 경력
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {sessions}회 세션
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Leaf className="w-3.5 h-3.5" />
            {consultant.sessionPriceCredits ?? 5} Sprouts~
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Consultant Detail View ───────────────────────────────────────────────────
function ConsultantDetail({
  consultant,
  credits,
  onBack,
  onBook,
}: {
  consultant: Consultant;
  credits: number;
  onBack: () => void;
  onBook: (sessionType: SessionType) => void;
}) {
  const photo = consultant.photoUrl || consultant.avatarUrl;
  const initials = consultant.displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const rating = consultant.avgRating ?? 5;
  const sessions = consultant.totalSessions ?? 0;
  const sessionTypeList = (consultant.sessionTypes as SessionType[] | null)?.length
    ? (consultant.sessionTypes as SessionType[])
    : DEFAULT_SESSION_TYPES;
  const careerHistory = consultant.careerHistory as CareerItem[] | null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        컨설턴트 목록으로
      </button>

      {/* Profile header */}
      <Card className="border border-border/60">
        <CardContent className="p-6">
          <div className="flex gap-5">
            <Avatar className="w-20 h-20 shrink-0 rounded-2xl">
              <AvatarImage src={photo ?? undefined} alt={consultant.displayName} className="object-cover" />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{consultant.displayName}</h2>
                  {consultant.title && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{consultant.title}</p>
                  )}
                </div>
                {consultant.linkedinUrl && (
                  <a
                    href={consultant.linkedinUrl.startsWith("http") ? consultant.linkedinUrl : `https://${consultant.linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0 border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-medium text-foreground">{rating}</span>
                  <span className="text-xs">/ 5</span>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {sessions}회 세션 완료
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {consultant.yearsExperience ?? 0}년 경력
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {((consultant.industries as string[] | null) ?? (consultant.industry ? [consultant.industry] : [])).map(ind => (
              <Badge key={ind} variant="secondary" className="text-xs">{ind}</Badge>
            ))}
            {(consultant.targetRegions ?? []).map(r => (
              <Badge key={r} variant="outline" className="text-xs text-muted-foreground">
                <Globe className="w-3 h-3 mr-1" />{r}
              </Badge>
            ))}
            {(consultant.languages ?? []).map(l => (
              <Badge key={l} variant="outline" className="text-xs text-muted-foreground">
                <Languages className="w-3 h-3 mr-1" />{l}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {consultant.bio && (
        <Card className="border border-border/60">
          <CardHeader className="pb-2 pt-5 px-5">
            <h3 className="text-sm font-semibold text-foreground">소개</h3>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{consultant.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Career History */}
      {careerHistory && careerHistory.length > 0 && (
        <Card className="border border-border/60">
          <CardHeader className="pb-2 pt-5 px-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              경력 사항
            </h3>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">
            {careerHistory.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{item.role}</p>
                  <p className="text-xs text-muted-foreground">{item.company} · {item.period}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Specialties */}
      {consultant.specialties && consultant.specialties.length > 0 && (
        <Card className="border border-border/60">
          <CardHeader className="pb-2 pt-5 px-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              전문 분야
            </h3>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex flex-wrap gap-2">
              {consultant.specialties.map(s => (
                <span key={s} className="text-xs bg-primary/8 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                  {s}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Types — Booking */}
      <Card className="border border-border/60">
        <CardHeader className="pb-2 pt-5 px-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              세션 선택
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Leaf className="w-3.5 h-3.5 text-emerald-500" />
              내 Sprouts: <span className="font-semibold text-foreground ml-0.5">{credits}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          {sessionTypeList.map((st, i) => {
            const canAfford = credits >= st.priceCredits;
            return (
              <div
                key={i}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                  canAfford
                    ? "border-border/60 hover:border-primary/40 hover:bg-primary/4 cursor-pointer"
                    : "border-border/40 opacity-50 cursor-not-allowed"
                }`}
                onClick={() => canAfford && onBook(st)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{st.name}</span>
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />{st.durationMinutes}분
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{st.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    <Leaf className="w-3.5 h-3.5" />
                    {st.priceCredits}
                  </div>
                  {canAfford ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <span className="text-xs text-destructive font-medium">잔액 부족</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sprouts Purchase Modal ───────────────────────────────────────────────────
function SproutsPurchaseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState(1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-500" />
            Sprouts 충전
          </DialogTitle>
          <DialogDescription>
            Sprouts는 JobPA 내 컨설팅 세션 예약에 사용되는 크레딧입니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {CREDIT_PACKAGES.map((pkg, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selected === i
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2.5 left-3 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                  인기
                </span>
              )}
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Leaf className="w-4 h-4 text-emerald-500" />
                  {pkg.credits} Sprouts
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{pkg.label}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{pkg.price}</p>
                <p className="text-xs text-muted-foreground">{pkg.priceKrw}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <Button
            className="w-full"
            onClick={() => {
              toast.info("결제 기능은 곧 출시됩니다! 현재 베타 기간 중 무료 Sprouts를 지급해드립니다.");
              onClose();
            }}
          >
            결제하기 — {CREDIT_PACKAGES[selected].price}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            베타 기간 중 무료 Sprouts 지급 예정
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Book Session Confirm Modal ───────────────────────────────────────────────
function BookSessionModal({
  open,
  consultant,
  sessionType,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  consultant: Consultant | null;
  sessionType: SessionType | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  if (!consultant || !sessionType) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>세션 예약 확인</DialogTitle>
          <DialogDescription>아래 세션을 예약하시겠습니까?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-lg">
                <AvatarImage src={consultant.photoUrl ?? consultant.avatarUrl ?? undefined} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                  {consultant.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-foreground">{consultant.displayName}</p>
                <p className="text-xs text-muted-foreground">{sessionType.name}</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">세션 시간</span>
              <span className="font-medium">{sessionType.durationMinutes}분</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">차감 Sprouts</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5" />
                {sessionType.priceCredits}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>취소</Button>
            <Button className="flex-1" onClick={onConfirm} disabled={isPending}>
              {isPending ? "예약 중..." : "예약 확정"}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            예약 후 컨설턴트가 일정을 확인하여 연락드립니다
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Consulting Page ─────────────────────────────────────────────────────
export default function Consulting() {
  const { user } = useAuth();
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [bookingSession, setBookingSession] = useState<SessionType | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);

  const { data: consultants = [], isLoading } = trpc.consulting.list.useQuery();
  const { data: credits } = trpc.consulting.myCredits.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  const bookSessionMutation = trpc.consulting.bookSession.useMutation({
    onSuccess: () => {
      toast.success("세션이 예약되었습니다! 컨설턴트가 곧 연락드릴 예정입니다.");
      utils.consulting.myCredits.invalidate();
      utils.consulting.mySessions.invalidate();
      setShowBookModal(false);
      setBookingSession(null);
    },
    onError: (err) => {
      if (err.message.includes("credits") || err.message.includes("Insufficient")) {
        toast.error("Sprouts가 부족합니다. 충전 후 다시 시도해주세요.");
        setShowPurchaseModal(true);
      } else {
        toast.error(err.message || "예약 중 오류가 발생했습니다.");
      }
      setShowBookModal(false);
    },
  });

  const creditBalance = credits?.balance ?? 0;

  const filteredConsultants = useMemo(() => {
    if (selectedIndustry === "all") return consultants;
    return consultants.filter(c => {
      const inds = ((c as Consultant).industries as string[] | null) ?? [];
      const ind = ((c as Consultant).industry as string | null) ?? "";
      return inds.includes(selectedIndustry) || ind.includes(selectedIndustry);
    });
  }, [consultants, selectedIndustry]);

  const handleBook = (st: SessionType) => {
    if (!user) {
      toast.error("로그인 후 예약할 수 있습니다.");
      return;
    }
    if (creditBalance < st.priceCredits) {
      toast.error(`Sprouts가 부족합니다. ${st.priceCredits} Sprouts가 필요합니다.`);
      setShowPurchaseModal(true);
      return;
    }
    setBookingSession(st);
    setShowBookModal(true);
  };

  const confirmBook = () => {
    if (!selectedConsultant || !bookingSession) return;
    bookSessionMutation.mutate({
      consultantId: selectedConsultant.id,
      topic: bookingSession.name,
    });
  };

  // ── Detail View ──
  if (selectedConsultant) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <ConsultantDetail
          consultant={selectedConsultant}
          credits={creditBalance}
          onBack={() => setSelectedConsultant(null)}
          onBook={handleBook}
        />
        <BookSessionModal
          open={showBookModal}
          consultant={selectedConsultant}
          sessionType={bookingSession}
          onClose={() => setShowBookModal(false)}
          onConfirm={confirmBook}
          isPending={bookSessionMutation.isPending}
        />
        <SproutsPurchaseModal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} />
      </div>
    );
  }

  // ── Directory View ──
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">커리어 컨설턴트</h1>
          <p className="text-sm text-muted-foreground mt-1">
            현직자·취업 전문가와 1:1 세션으로 커리어를 가속하세요
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg">
              <Leaf className="w-3.5 h-3.5" />
              <span className="font-semibold">{creditBalance}</span>
              <span className="text-xs">Sprouts</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPurchaseModal(true)}
              className="text-xs"
            >
              충전
            </Button>
          </div>
        )}
      </div>

      {/* Industry Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        {INDUSTRY_FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedIndustry(f.id)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
              selectedIndustry === f.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Consultant Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : filteredConsultants.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">해당 분야의 컨설턴트가 아직 없습니다</p>
          <p className="text-xs mt-1">곧 더 많은 전문가가 합류할 예정입니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConsultants.map(c => (
            <ConsultantCard
              key={c.id}
              consultant={c as Consultant}
              onClick={() => setSelectedConsultant(c as Consultant)}
            />
          ))}
        </div>
      )}

      {/* Become a Consultant CTA */}
      <Card className="border border-dashed border-border/60 bg-muted/20">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">컨설턴트로 참여하고 싶으신가요?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              현직자·취업 전문가라면 JobPA 파트너 컨설턴트로 활동하실 수 있습니다
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs"
            onClick={() => toast.info("컨설턴트 신청 기능이 곧 오픈됩니다! 관심 있으시면 contact@jobpa.io로 연락주세요.")}
          >
            신청하기
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </CardContent>
      </Card>

      <SproutsPurchaseModal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} />
    </div>
  );
}
