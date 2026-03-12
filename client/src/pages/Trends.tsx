import { useI18n } from "@/contexts/i18nContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, Globe, Briefcase, DollarSign, Building2, Newspaper,
  ExternalLink, ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
} from "lucide-react";
import { useState, useMemo } from "react";

// Industry trend data (curated insights)
const INDUSTRY_SECTORS = [
  { id: "tech", icon: "💻", color: "bg-blue-500/10 text-blue-600" },
  { id: "finance", icon: "💰", color: "bg-emerald-500/10 text-emerald-600" },
  { id: "healthcare", icon: "🏥", color: "bg-rose-500/10 text-rose-600" },
  { id: "energy", icon: "⚡", color: "bg-amber-500/10 text-amber-600" },
  { id: "manufacturing", icon: "🏭", color: "bg-slate-500/10 text-slate-600" },
  { id: "retail", icon: "🛍️", color: "bg-purple-500/10 text-purple-600" },
] as const;

interface TrendItem {
  sector: string;
  title: string;
  titleKo: string;
  trend: "up" | "down" | "stable";
  description: string;
  descriptionKo: string;
  hotSkills: string[];
  avgSalaryChange: string;
  topCompanies: string[];
  region: string;
}

const TREND_DATA: TrendItem[] = [
  {
    sector: "tech", title: "AI/ML Engineering Demand Surges", titleKo: "AI/ML 엔지니어 수요 급증",
    trend: "up", description: "AI and machine learning roles have grown 45% YoY across APAC. Singapore and Dubai are leading hubs for AI talent acquisition.",
    descriptionKo: "AI 및 머신러닝 직무가 APAC 전역에서 전년 대비 45% 증가했습니다. 싱가포르와 두바이가 AI 인재 채용의 주요 허브입니다.",
    hotSkills: ["Python", "PyTorch", "LLM", "RAG", "MLOps"], avgSalaryChange: "+12%",
    topCompanies: ["Google", "Grab", "Sea", "ByteDance", "Shopee"], region: "APAC",
  },
  {
    sector: "tech", title: "Cloud & DevOps Remains Strong", titleKo: "클라우드 & DevOps 꾸준한 성장",
    trend: "up", description: "Cloud infrastructure and DevOps roles continue to grow as companies accelerate digital transformation.",
    descriptionKo: "기업들의 디지털 전환 가속화로 클라우드 인프라 및 DevOps 직무가 지속적으로 성장 중입니다.",
    hotSkills: ["AWS", "Kubernetes", "Terraform", "CI/CD", "Go"], avgSalaryChange: "+8%",
    topCompanies: ["AWS", "Microsoft", "GovTech", "DBS", "OCBC"], region: "Singapore",
  },
  {
    sector: "finance", title: "Fintech Hiring Stabilizes", titleKo: "핀테크 채용 안정화",
    trend: "stable", description: "After rapid growth, fintech hiring has stabilized. Compliance and risk roles are in high demand.",
    descriptionKo: "급격한 성장 이후 핀테크 채용이 안정화되었습니다. 컴플라이언스 및 리스크 관련 직무 수요가 높습니다.",
    hotSkills: ["Compliance", "Risk Management", "Blockchain", "RegTech", "SQL"], avgSalaryChange: "+5%",
    topCompanies: ["DBS", "OCBC", "Revolut", "Wise", "Stripe"], region: "Singapore",
  },
  {
    sector: "finance", title: "Dubai Financial Hub Expansion", titleKo: "두바이 금융 허브 확장",
    trend: "up", description: "DIFC and ADGM continue to attract global financial institutions, creating new roles in wealth management and digital banking.",
    descriptionKo: "DIFC와 ADGM이 글로벌 금융기관을 유치하며 자산관리 및 디지털 뱅킹 분야의 새로운 직무를 창출하고 있습니다.",
    hotSkills: ["Wealth Management", "Islamic Finance", "Digital Banking", "AML", "Python"], avgSalaryChange: "+10%",
    topCompanies: ["Emirates NBD", "HSBC", "Standard Chartered", "Mashreq", "FAB"], region: "Dubai",
  },
  {
    sector: "healthcare", title: "HealthTech & Biotech Growth", titleKo: "헬스테크 & 바이오테크 성장",
    trend: "up", description: "Post-pandemic investment in health technology continues. Singapore's biomedical sector is a key growth area.",
    descriptionKo: "팬데믹 이후 헬스 테크놀로지 투자가 지속되고 있습니다. 싱가포르의 바이오메디컬 분야가 주요 성장 영역입니다.",
    hotSkills: ["Bioinformatics", "Clinical Data", "Regulatory Affairs", "AI in Healthcare", "R"], avgSalaryChange: "+7%",
    topCompanies: ["A*STAR", "Roche", "Novartis", "Illumina", "Temasek"], region: "Singapore",
  },
  {
    sector: "energy", title: "Green Energy Transition Roles", titleKo: "그린 에너지 전환 직무",
    trend: "up", description: "Sustainability and green energy roles are booming across the Gulf and APAC as governments push net-zero targets.",
    descriptionKo: "정부의 탄소중립 목표 추진으로 걸프 및 APAC 전역에서 지속가능성 및 그린 에너지 직무가 급증하고 있습니다.",
    hotSkills: ["Sustainability", "ESG", "Solar/Wind", "Carbon Trading", "Project Management"], avgSalaryChange: "+15%",
    topCompanies: ["ACWA Power", "Masdar", "Shell", "TotalEnergies", "Sembcorp"], region: "Dubai",
  },
  {
    sector: "manufacturing", title: "Smart Manufacturing Adoption", titleKo: "스마트 제조 도입 확대",
    trend: "stable", description: "Industry 4.0 adoption is steady. IoT and automation skills are increasingly required in manufacturing roles.",
    descriptionKo: "인더스트리 4.0 도입이 꾸준히 진행 중입니다. 제조업 직무에서 IoT 및 자동화 기술이 점점 더 요구되고 있습니다.",
    hotSkills: ["IoT", "PLC", "Automation", "Lean Six Sigma", "Data Analytics"], avgSalaryChange: "+4%",
    topCompanies: ["Samsung", "Hyundai", "Micron", "GlobalFoundries", "ST Engineering"], region: "Korea",
  },
  {
    sector: "retail", title: "E-commerce & Digital Marketing", titleKo: "이커머스 & 디지털 마케팅",
    trend: "stable", description: "E-commerce platforms continue hiring for logistics, data analytics, and digital marketing roles.",
    descriptionKo: "이커머스 플랫폼에서 물류, 데이터 분석, 디지털 마케팅 직무 채용이 지속되고 있습니다.",
    hotSkills: ["SEO/SEM", "Data Analytics", "Supply Chain", "CRM", "Content Marketing"], avgSalaryChange: "+3%",
    topCompanies: ["Shopee", "Lazada", "Amazon", "Coupang", "Noon"], region: "APAC",
  },
  {
    sector: "tech", title: "Cybersecurity Talent Shortage", titleKo: "사이버보안 인재 부족",
    trend: "up", description: "Cybersecurity roles remain critically understaffed. Demand outpaces supply by 3:1 across APAC.",
    descriptionKo: "사이버보안 직무의 인력 부족이 심각합니다. APAC 전역에서 수요가 공급을 3:1로 초과하고 있습니다.",
    hotSkills: ["SIEM", "Penetration Testing", "Cloud Security", "Zero Trust", "CISSP"], avgSalaryChange: "+18%",
    topCompanies: ["Palo Alto Networks", "CrowdStrike", "GovTech", "Ensign", "NCS"], region: "Singapore",
  },
  {
    sector: "finance", title: "Hong Kong Crypto & Web3 Revival", titleKo: "홍콩 크립토 & Web3 부활",
    trend: "up", description: "Hong Kong's pro-crypto regulatory stance is attracting Web3 companies and creating new roles in digital assets.",
    descriptionKo: "홍콩의 친크립토 규제 정책이 Web3 기업을 유치하며 디지털 자산 분야의 새로운 직무를 창출하고 있습니다.",
    hotSkills: ["Solidity", "DeFi", "Tokenomics", "Compliance", "Rust"], avgSalaryChange: "+20%",
    topCompanies: ["Animoca Brands", "HashKey", "Crypto.com", "Circle", "OSL"], region: "Hong Kong",
  },
];

const NEWS_ITEMS = [
  { title: "Singapore launches S$150M AI initiative for workforce development", titleKo: "싱가포르, 인력 개발을 위한 1.5억 달러 AI 이니셔티브 출시", source: "CNA", date: "2025-03-10", url: "https://www.channelnewsasia.com", sector: "tech", region: "Singapore" },
  { title: "Dubai DIFC records 30% growth in fintech registrations", titleKo: "두바이 DIFC, 핀테크 등록 30% 성장 기록", source: "Gulf News", date: "2025-03-09", url: "https://gulfnews.com", sector: "finance", region: "Dubai" },
  { title: "Hong Kong announces new Top Talent Pass scheme expansion", titleKo: "홍콩, 탑 탤런트 패스 제도 확대 발표", source: "SCMP", date: "2025-03-08", url: "https://www.scmp.com", sector: "tech", region: "Hong Kong" },
  { title: "Korea's semiconductor industry hiring surges amid chip war", titleKo: "반도체 전쟁 속 한국 반도체 산업 채용 급증", source: "Korea Herald", date: "2025-03-07", url: "https://www.koreaherald.com", sector: "manufacturing", region: "Korea" },
  { title: "Remote work policies tighten across APAC tech firms", titleKo: "APAC 테크 기업들의 원격근무 정책 강화", source: "Tech in Asia", date: "2025-03-06", url: "https://www.techinasia.com", sector: "tech", region: "APAC" },
  { title: "Singapore healthcare sector to create 10,000 new jobs by 2026", titleKo: "싱가포르 헬스케어 부문, 2026년까지 10,000개 신규 일자리 창출", source: "Straits Times", date: "2025-03-05", url: "https://www.straitstimes.com", sector: "healthcare", region: "Singapore" },
  { title: "UAE Golden Visa program expanded to include more tech professionals", titleKo: "UAE 골든 비자 프로그램, 더 많은 기술 전문가 포함으로 확대", source: "Khaleej Times", date: "2025-03-04", url: "https://www.khaleejtimes.com", sector: "tech", region: "Dubai" },
  { title: "ESG reporting mandates drive demand for sustainability roles in APAC", titleKo: "ESG 보고 의무화로 APAC 지속가능성 직무 수요 증가", source: "Bloomberg", date: "2025-03-03", url: "https://www.bloomberg.com", sector: "energy", region: "APAC" },
];

export default function Trends() {
  const { language } = useI18n();
  const { user } = useAuth();
  const isKo = language === "ko";

  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const sectorLabels: Record<string, { en: string; ko: string }> = {
    tech: { en: "IT/Tech", ko: "IT/테크" },
    finance: { en: "Finance", ko: "금융" },
    healthcare: { en: "Healthcare", ko: "헬스케어" },
    energy: { en: "Energy", ko: "에너지" },
    manufacturing: { en: "Manufacturing", ko: "제조업" },
    retail: { en: "Retail/E-commerce", ko: "유통/이커머스" },
  };

  const regionLabels: Record<string, { en: string; ko: string }> = {
    Singapore: { en: "Singapore", ko: "싱가포르" },
    "Hong Kong": { en: "Hong Kong", ko: "홍콩" },
    Dubai: { en: "Dubai/UAE", ko: "두바이/UAE" },
    Korea: { en: "South Korea", ko: "한국" },
    APAC: { en: "APAC/Global", ko: "APAC/글로벌" },
  };

  const filteredTrends = useMemo(() => {
    return TREND_DATA.filter(item => {
      if (selectedSector !== "all" && item.sector !== selectedSector) return false;
      if (selectedRegion !== "all" && item.region !== selectedRegion) return false;
      return true;
    });
  }, [selectedSector, selectedRegion]);

  const filteredNews = useMemo(() => {
    return NEWS_ITEMS.filter(item => {
      if (selectedSector !== "all" && item.sector !== selectedSector) return false;
      if (selectedRegion !== "all" && item.region !== selectedRegion) return false;
      return true;
    });
  }, [selectedSector, selectedRegion]);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
    if (trend === "down") return <ArrowDownRight className="h-4 w-4 text-rose-500" />;
    return <Minus className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            {isKo ? "산업 트렌드 & 뉴스" : "Industry Trends & News"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isKo ? "다양한 산업의 채용 트렌드와 최신 뉴스를 확인하세요." : "Stay updated with hiring trends and news across industries."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={isKo ? "산업 선택" : "Select Sector"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isKo ? "전체 산업" : "All Sectors"}</SelectItem>
              {INDUSTRY_SECTORS.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.icon} {isKo ? sectorLabels[s.id]?.ko : sectorLabels[s.id]?.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={isKo ? "지역 선택" : "Select Region"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isKo ? "전체 지역" : "All Regions"}</SelectItem>
              {Object.entries(regionLabels).map(([key, val]) => (
                <SelectItem key={key} value={key}>{isKo ? val.ko : val.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sector Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {INDUSTRY_SECTORS.map(sector => {
          const sectorTrends = TREND_DATA.filter(t => t.sector === sector.id);
          const upCount = sectorTrends.filter(t => t.trend === "up").length;
          return (
            <Card
              key={sector.id}
              className={`cursor-pointer transition-all hover:shadow-md ${selectedSector === sector.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedSector(selectedSector === sector.id ? "all" : sector.id)}
            >
              <CardContent className="p-3 text-center">
                <div className="text-2xl mb-1">{sector.icon}</div>
                <p className="text-xs font-medium truncate">
                  {isKo ? sectorLabels[sector.id]?.ko : sectorLabels[sector.id]?.en}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {upCount > 0 && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                  <span className="text-xs text-muted-foreground">{sectorTrends.length} {isKo ? "트렌드" : "trends"}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            {isKo ? "채용 트렌드" : "Hiring Trends"}
          </TabsTrigger>
          <TabsTrigger value="news" className="gap-1.5">
            <Newspaper className="h-4 w-4" />
            {isKo ? "업계 뉴스" : "Industry News"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          {filteredTrends.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {isKo ? "선택한 필터에 해당하는 트렌드가 없습니다." : "No trends match the selected filters."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTrends.map((item, i) => (
                <Card key={i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{INDUSTRY_SECTORS.find(s => s.id === item.sector)?.icon}</span>
                        <CardTitle className="text-base leading-snug">
                          {isKo ? item.titleKo : item.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <TrendIcon trend={item.trend} />
                        <span className={`text-sm font-semibold ${item.avgSalaryChange.startsWith("+") ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {item.avgSalaryChange}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="w-fit text-xs mt-1">
                      <Globe className="h-3 w-3 mr-1" />
                      {isKo ? regionLabels[item.region]?.ko || item.region : item.region}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isKo ? item.descriptionKo : item.description}
                    </p>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        🔥 {isKo ? "인기 스킬" : "Hot Skills"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.hotSkills.map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        <Building2 className="h-3 w-3 inline mr-1" />
                        {isKo ? "주요 기업" : "Top Companies"}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.topCompanies.join(" · ")}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="news" className="space-y-3">
          {filteredNews.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {isKo ? "선택한 필터에 해당하는 뉴스가 없습니다." : "No news match the selected filters."}
              </CardContent>
            </Card>
          ) : (
            filteredNews.map((item, i) => (
              <Card key={i} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="text-2xl shrink-0">
                    {INDUSTRY_SECTORS.find(s => s.id === item.sector)?.icon || "📰"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm leading-snug">
                      {isKo ? item.titleKo : item.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span>{item.source}</span>
                      <span>·</span>
                      <span>{item.date}</span>
                      <span>·</span>
                      <Badge variant="outline" className="text-xs py-0">
                        {isKo ? regionLabels[item.region]?.ko || item.region : item.region}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" asChild>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
