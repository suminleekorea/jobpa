import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/contexts/i18nContext";
import { getLoginUrl } from "@/const";
import {
  TrendingUp, FileText, Target, BarChart3, Bookmark,
  ArrowRight, ChevronDown, ChevronUp, Globe, Sparkles, Zap,
  Bot, Users, Languages, DollarSign, MessageCircle, Newspaper
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

function LanguageToggle() {
  const { language, setLanguage } = useI18n();
  return (
    <button
      onClick={() => setLanguage(language === "ko" ? "en" : "ko")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
    >
      <Languages className="h-3.5 w-3.5" />
      {language === "ko" ? "EN" : "KO"}
    </button>
  );
}

function Navbar() {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight">{t.brand.name}</span>
            <span className="text-sm text-muted-foreground font-medium">{t.brand.tagline}</span>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {isAuthenticated ? (
            <Button onClick={() => setLocation("/dashboard")} size="sm">
              {t.nav.dashboard}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button onClick={() => { window.location.href = getLoginUrl(); }} size="sm">
              {t.nav.getStarted}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const stats = [
    { icon: Bot, value: "5+", label: t.hero.stats.agents },
    { icon: BarChart3, value: "6+", label: t.hero.stats.analyses },
    { icon: Languages, value: "2", label: t.hero.stats.languages },
    { icon: DollarSign, value: "$0", label: t.hero.stats.price },
  ];

  return (
    <section className="pt-32 pb-20 relative overflow-hidden">
      {/* Subtle dot grid texture */}
      <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {t.hero.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight whitespace-pre-line">
            {t.hero.title}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto whitespace-pre-line leading-relaxed">
            {t.hero.subtitle}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <Zap className="h-4 w-4 shrink-0" />
            <span>{t.hero.note}</span>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Button size="lg" onClick={() => setLocation("/dashboard")} className="px-8 shadow-lg shadow-primary/20">
                {t.nav.dashboard}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" onClick={() => { window.location.href = getLoginUrl(); }} className="px-8 shadow-lg shadow-primary/20">
                {t.nav.getStarted}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <stat.icon className="h-5 w-5 text-primary mb-1" />
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { t, language } = useI18n();
  const features = [
    { icon: TrendingUp, ...t.features.market, color: "text-blue-600 bg-blue-50" },
    { icon: FileText, ...t.features.resume, color: "text-emerald-600 bg-emerald-50" },
    { icon: Target, ...t.features.fit, color: "text-violet-600 bg-violet-50" },
    { icon: BarChart3, ...t.features.reports, color: "text-amber-600 bg-amber-50" },
    { icon: Bookmark, ...t.features.tracking, color: "text-rose-600 bg-rose-50" },
    { icon: Newspaper, title: language === "ko" ? "산업 트렌드" : "Industry Trends", desc: language === "ko" ? "IT, 금융, 헬스케어, 에너지 등 다양한 산업의 채용 트렌드를 확인하세요." : "Stay updated with hiring trends across IT, finance, healthcare, energy, and more.", color: "text-cyan-600 bg-cyan-50" },
    { icon: MessageCircle, title: language === "ko" ? "AI 커리어 챗봇" : "AI Career Chat", desc: language === "ko" ? "취업 전략, 비자 정보, 연봉 협상 등 무엇이든 AI에게 물어보세요." : "Chat with our AI assistant about job strategy, visa info, salary benchmarks, and more.", color: "text-indigo-600 bg-indigo-50" },
  ];

  return (
    <section className="py-20 bg-card/50">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">{t.features.title}</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">{t.features.subtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-card">
              <CardContent className="p-6">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const { t } = useI18n();
  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">{t.howItWorks.title}</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {t.howItWorks.steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                {step.step}
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConsultingTeaser() {
  const { t } = useI18n();
  return (
    <section className="py-20">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            {t.consulting.badge}
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">{t.consulting.title}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">{t.consulting.desc}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
            {t.consulting.features.map((feature, i) => (
              <div key={i} className="px-4 py-3 rounded-lg bg-card border text-sm font-medium">
                {feature}
              </div>
            ))}
          </div>
          <Button variant="outline" size="lg" onClick={() => {
            const el = document.getElementById("consulting-waitlist");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}>
            {t.consulting.waitlist}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">{t.faq.title}</h2>
          <p className="mt-3 text-muted-foreground">{t.faq.subtitle}</p>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {t.faq.items.map((item, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-sm pr-4">{item.q}</span>
                {openIndex === i ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <section className="py-20 bg-primary/90 text-primary-foreground">
      <div className="container text-center">
        <h2 className="text-3xl font-bold tracking-tight">{t.cta.title}</h2>
        <p className="mt-3 text-primary-foreground/80 max-w-lg mx-auto">{t.cta.subtitle}</p>
        <div className="mt-8">
          {isAuthenticated ? (
            <Button size="lg" variant="secondary" onClick={() => setLocation("/dashboard")} className="px-8">
              {t.nav.dashboard}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button size="lg" variant="secondary" onClick={() => { window.location.href = getLoginUrl(); }} className="px-8">
              {t.nav.getStarted}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="py-8 border-t">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-medium text-foreground">{t.brand.full}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{t.footer.madeBy}</span>
          <span className="text-border">|</span>
          <span>{t.footer.builtWith}</span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ConsultingTeaser />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
