import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/contexts/i18nContext";
import {
  TrendingUp, FileText, Target, BarChart3, Bookmark,
  ArrowRight, ChevronDown, ChevronUp, Globe, Sparkles, Zap,
  Bot, Users, Languages, DollarSign, MessageCircle, Newspaper
} from "lucide-react";
import { useState } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Star } from "lucide-react";



function Navbar() {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container flex h-16 min-w-0 items-center justify-between gap-2">
        <button onClick={() => setLocation("/")} className="flex min-w-0 items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight">{t.brand.name}</span>
            <span className="hidden truncate text-sm font-medium text-muted-foreground sm:inline">{t.brand.tagline}</span>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSelector />
          {isAuthenticated ? (
            <Button onClick={() => setLocation("/dashboard")} size="sm">
              {t.nav.dashboard}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button onClick={() => { setLocation("/login"); }} size="sm">
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
    { icon: Languages, value: "4", label: t.hero.stats.languages },
    { icon: DollarSign, value: "$0", label: t.hero.stats.price },
  ];

  return (
    <section className="relative overflow-hidden px-0 pb-16 pt-28 sm:pb-20 sm:pt-32">
      {/* Subtle dot grid texture */}
      <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="truncate">{t.hero.badge}</span>
          </div>
          <h1 className="break-words text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t.hero.subtitle}
          </p>
          <div className="mt-4 inline-flex max-w-full items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-left text-sm text-amber-700">
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
              <Button size="lg" onClick={() => { setLocation("/login"); }} className="px-8 shadow-lg shadow-primary/20">
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
        {/* Dashboard Preview Screenshot */}
        <div className="relative mx-auto mt-12 max-w-5xl px-0 sm:mt-16 sm:px-4">
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 rounded-3xl blur-2xl opacity-70" />
          <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl shadow-primary/10">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663393467842/7CDWVFFxWiw496tEAbvLTL/jobpa_hero_preview-5Gbawz8jxTjXQ8L9akENvz.png"
              alt="JobPA Dashboard"
              className="w-full h-auto object-contain block"
              loading="lazy"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">✨ Live dashboard — resume score, job trends, AI chat, XP all in one place</p>
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
    { icon: Newspaper, ...t.features.trendsFeat, color: "text-cyan-600 bg-cyan-50" },
    { icon: MessageCircle, ...t.features.chatFeat, color: "text-indigo-600 bg-indigo-50" },
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

function ReviewsSection() {
  const { t } = useI18n();
  const { data: reviews } = trpc.reviews.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const submit = trpc.reviews.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setShowForm(false);
      setComment("");
      setDisplayName("");
      utils.reviews.list.invalidate();
    },
  });

  const demoReviews = [
    { id: -1, displayName: "Jiyeon K.", rating: 5, comment: t.reviews.demo[0], targetRole: "Data Analyst", targetMarket: "Singapore" },
    { id: -2, displayName: "Rahul M.", rating: 5, comment: t.reviews.demo[1], targetRole: "Product Manager", targetMarket: "Singapore" },
    { id: -3, displayName: "Suji L.", rating: 4, comment: t.reviews.demo[2], targetRole: "Marketing Manager", targetMarket: "Singapore" },
  ];

  const displayReviews = (reviews && reviews.length > 0) ? reviews : demoReviews;

  return (
    <section className="py-20 bg-card/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            {t.reviews.title}
          </h2>
          <p className="text-muted-foreground">
            {t.reviews.subtitle}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto mb-10">
          {displayReviews.slice(0, 3).map((review) => (
            <div key={review.id} className="bg-background rounded-xl p-6 border shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{review.comment}"</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{review.displayName || t.reviews.anonymous}</p>
                {review.targetMarket && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{review.targetMarket}</span>
                )}
              </div>
              {review.targetRole && (
                <p className="text-xs text-muted-foreground mt-1">{review.targetRole}</p>
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          {!showForm && !submitted && (
            <button
              onClick={() => isAuthenticated ? setShowForm(true) : (window.location.href = "/login")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium hover:bg-accent transition-colors"
            >
              <Star className="h-4 w-4" />
              {t.reviews.leaveReview}
            </button>
          )}
          {submitted && (
            <p className="text-sm text-emerald-600 font-medium">
              {t.reviews.submitted}
            </p>
          )}
          {showForm && (
            <div className="max-w-md mx-auto bg-background border rounded-xl p-6 text-left shadow-sm">
              <h3 className="font-semibold mb-4">{t.reviews.writeReview}</h3>
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star className={`h-6 w-6 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm mb-3 bg-background"
                placeholder={t.reviews.namePlaceholder}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm mb-3 bg-background resize-none"
                rows={3}
                placeholder={t.reviews.contentPlaceholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => submit.mutate({ rating, comment, displayName: displayName || undefined })}
                  disabled={comment.length < 10 || submit.isPending}
                  className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                >
                  {submit.isPending ? t.reviews.submitting : t.reviews.submit}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  {t.reviews.cancel}
                </button>
              </div>
            </div>
          )}
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
            <Button size="lg" variant="secondary" onClick={() => { setLocation("/login"); }} className="px-8">
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
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <span>{t.footer.madeBy}</span>
          <span className="opacity-30">|</span>
          <span>{t.footer.builtWith}</span>
          <span className="opacity-30">|</span>
          <Link href="/disclaimer" className="hover:text-primary hover:underline transition-colors">{t.disclaimer.nav}</Link>
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
        <ReviewsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
