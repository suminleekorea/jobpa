import { useAuth } from "@/_core/hooks/useAuth";
import { BrandLogo } from "@/components/BrandLogo";
import { PublicSeo } from "@/components/PublicSeo";
import { DashboardPreviewMockup } from "@/components/marketing/DashboardPreviewMockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/contexts/i18nContext";
import { industryPages, rolePages } from "@/lib/marketingPages";
import {
  TrendingUp, FileText, Target, BarChart3, Bookmark,
  ArrowRight, ChevronDown, ChevronUp, Globe, Sparkles, Zap,
  Users, DollarSign, MessageCircle, Newspaper, Bot
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
          <BrandLogo size="sm" />
          <span className="hidden truncate text-sm font-medium text-muted-foreground sm:inline">{t.brand.tagline}</span>
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
    { icon: BarChart3, value: "23", label: t.hero.stats.agents },
    { icon: Zap, value: "14", label: t.hero.stats.analyses },
    { icon: FileText, value: "6", label: t.hero.stats.languages },
    { icon: DollarSign, value: "S$0", label: t.hero.stats.price },
  ];

  const proof = [
    "Candidate-side AI, not recruiter software",
    "Role fit, resume gaps, applications, and follow-ups in one loop",
    "Paid consulting path when users need human strategy",
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
          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm font-semibold text-primary shadow-sm">
            AI Career Ops that tracks, tailors, and improves every application.
          </div>
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
          <div className="mx-auto mt-8 grid max-w-4xl gap-3 text-left md:grid-cols-3">
            {proof.map((item) => (
              <div key={item} className="rounded-2xl border bg-card/80 p-4 text-sm font-medium shadow-sm">
                <Users className="mb-3 h-4 w-4 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
        {/* Dashboard Preview Screenshot */}
        <div className="relative mx-auto mt-12 max-w-5xl px-0 sm:mt-16 sm:px-4">
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 rounded-3xl blur-2xl opacity-70" />
          <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl shadow-primary/10">
            <img
              src="/jobpa-dashboard-preview-job-pa.png"
              alt="JobPA Dashboard"
              className="w-full h-auto object-contain block"
              loading="lazy"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">Live dashboard preview with job-pa.com, resume score, market trends, AI chat, and application pipeline.</p>
        </div>
      </div>
    </section>
  );
}

function CareerOpsPositioningSection() {
  const loops = [
    {
      title: "Find signal",
      desc: "Scan roles by market, role fit, visa signal, salary, and company context before wasting applications.",
    },
    {
      title: "Tailor proof",
      desc: "Turn each JD into resume gaps, keyword coverage, and interview stories tied to the role.",
    },
    {
      title: "Move pipeline",
      desc: "Track applications, follow-ups, prep tasks, and decisions like a personal operating system.",
    },
  ];

  return (
    <section className="overflow-hidden bg-slate-950 py-20 text-white">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Agentic AI Career Ops
            </div>
            <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Not another job board. Your job search operating system.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
              JobPA helps job seekers run the whole pipeline: discover roles, score fit, tailor resumes, track applications, and prepare the next action.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                <Link href="/career-ops">
                  Explore Career Ops <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link href="/dashboard-preview">View dashboard preview</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {loops.map((loop, index) => (
              <div key={loop.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-lg font-black text-slate-950">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold">{loop.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{loop.desc}</p>
              </div>
            ))}
            <div className="sm:col-span-3 lg:col-span-1">
              <DashboardPreviewMockup compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductFocusSection() {
  const products = [
    {
      icon: BarChart3,
      eyebrow: "Product 01",
      title: "Career Ops Dashboard",
      desc: "A command center for applications, fit scores, resume gaps, follow-ups, and next-best actions.",
      points: ["Track every application", "Prioritize realistic roles", "Move from saved job to interview prep"],
      href: "/dashboard-preview",
      cta: "View dashboard",
    },
    {
      icon: Bot,
      eyebrow: "Product 02",
      title: "AI Career Assistant",
      desc: "A friendly agent that answers career questions, turns advice into actions, and routes high-stakes moments to consulting.",
      points: ["Ask about role strategy", "Tailor resume and interview proof", "Escalate to paid expert support"],
      href: "/login",
      cta: "Start free",
    },
  ];

  return (
    <section className="bg-background py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Two products, one workflow
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-5xl">Keep JobPA simple: dashboard plus assistant.</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Resume analysis, job fit, interview prep, reports, and consulting are modules inside the Career Ops workflow, not separate products.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {products.map((product) => (
            <Card key={product.title} className="overflow-hidden border-primary/10 bg-card shadow-sm">
              <CardContent className="p-0">
                <div className="grid min-h-full gap-0 sm:grid-cols-[0.78fr_1.22fr]">
                  <div className="flex flex-col justify-between bg-slate-950 p-6 text-white">
                    <div>
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400 text-slate-950">
                        <product.icon className="h-7 w-7" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">{product.eyebrow}</p>
                      <h3 className="mt-3 text-2xl font-black leading-tight">{product.title}</h3>
                    </div>
                    <Button asChild className="mt-8 bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                      <Link href={product.href}>
                        {product.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="p-6">
                    <p className="text-base leading-relaxed text-muted-foreground">{product.desc}</p>
                    <div className="mt-6 space-y-3">
                      {product.points.map((point) => (
                        <div key={point} className="flex items-center gap-3 rounded-2xl border bg-background p-3 text-sm font-medium">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIAssistantLayerSection() {
  const assistantFlows = [
    {
      title: "Ask the AI Assistant",
      desc: "Get direct help on role strategy, resume positioning, visa context, salary questions, and follow-up timing.",
    },
    {
      title: "Turn advice into actions",
      desc: "The assistant converts questions into next steps: tailor this resume, prep this story, follow up with this company.",
    },
    {
      title: "Escalate to human consulting",
      desc: "When stakes are high, route from AI guidance into paid expert help for resume, interview, visa, or strategy review.",
    },
  ];

  return (
    <section className="bg-gradient-to-br from-cyan-50 via-white to-slate-50 py-20">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800">
              <Bot className="h-3.5 w-3.5" />
              AI Career Assistant inside Career Ops
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              A career assistant that sits in the middle of every application.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Career Ops is the system. The AI Assistant is the friendly agent that explains what to do next, why it matters, and when to ask for human support.
            </p>
          </div>
          <div className="grid gap-4">
            {assistantFlows.map((flow, index) => (
              <div key={flow.title} className="rounded-3xl border bg-background p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold">{flow.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{flow.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SeoEntryPointsSection() {
  const featuredPages = [...rolePages.slice(0, 5), ...industryPages.slice(0, 5)];

  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Globe className="h-3.5 w-3.5" />
            Role and industry playbooks
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Built for how candidates actually search</h2>
          <p className="mt-3 text-muted-foreground">
            Dedicated Career Ops pages target high-intent searches across business, marketing, CS, analytics, SaaS, fintech, consulting, healthcare, and AI startups.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {featuredPages.map((page) => (
            <Link
              key={page.path}
              href={page.path}
              className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{page.kind}</p>
              <h3 className="mt-3 min-h-12 text-base font-semibold leading-snug">{page.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{page.description}</p>
              <span className="mt-5 inline-flex items-center text-sm font-medium text-primary">
                Open page <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
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
          <BrandLogo size="sm" textClassName="text-sm" />
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
      <PublicSeo
        title="JobPA - Agentic AI Career Ops for Job Seekers"
        description="JobPA is AI Career Ops with an AI Career Assistant that tracks, tailors, and improves every application with fit scoring, resume tailoring, application tracking, and consulting paths."
        path="/"
        keywords={["agentic AI career ops", "AI career assistant", "AI job search", "application tracker", "resume tailoring", "career consulting", "Singapore jobs"]}
      />
      <Navbar />
      <main>
        <HeroSection />
        <ProductFocusSection />
        <CareerOpsPositioningSection />
        <AIAssistantLayerSection />
        <SeoEntryPointsSection />
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
