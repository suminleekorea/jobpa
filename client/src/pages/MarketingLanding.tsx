import { PublicSeo } from "@/components/PublicSeo";
import { BrandLogo } from "@/components/BrandLogo";
import { DashboardPreviewMockup } from "@/components/marketing/DashboardPreviewMockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { careerOpsPage, getMarketingPageByPath, industryPages, rolePages } from "@/lib/marketingPages";
import { ArrowRight, Bot, BriefcaseBusiness, Building2, CheckCircle2, Compass, GraduationCap, Handshake, MessageCircle, Search, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";

function MarketingNav() {
  return (
    <nav className="border-b border-white/10 bg-slate-950/90 text-white backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size="sm" variant="light" />
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex">
            <Link href="/dashboard-preview">Preview</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden text-white hover:bg-white/10 hover:text-white md:inline-flex">
            <Link href="/companies">Companies</Link>
          </Button>
          <Button asChild size="sm" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            <Link href="/login">Start free</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

function DashboardPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PublicSeo
        title="JobPA Dashboard Preview - Agentic AI Career Ops"
        description="Preview the JobPA Career Ops dashboard for job tracking, fit scoring, resume tailoring, and application pipeline management."
        path="/dashboard-preview"
        keywords={["JobPA dashboard", "career ops dashboard", "AI job search dashboard", "application tracker"]}
      />
      <MarketingNav />
      <main className="container py-12 sm:py-16">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
            Public dashboard preview
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">See the Career Ops console before signing in</h1>
          <p className="mt-5 text-lg text-slate-300">
            JobPA gives job seekers one operating view for discovery, fit scoring, resume gaps, applications, and interview prep.
          </p>
          <p className="mx-auto mt-4 max-w-2xl rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100">
            Public proof for job-pa.com: a candidate-side Career Ops console, not a recruiter CRM.
          </p>
        </div>
        <DashboardPreviewMockup />
      </main>
    </div>
  );
}

function CompaniesPage() {
  const partnerTypes = [
    {
      icon: GraduationCap,
      title: "Universities and bootcamps",
      body: "Give students one place to manage applications, improve resumes, and prepare for interviews.",
    },
    {
      icon: Building2,
      title: "Career communities",
      body: "Turn job-search chaos into structured cohorts, dashboards, and measurable readiness signals.",
    },
    {
      icon: BriefcaseBusiness,
      title: "Employers and partners",
      body: "Support candidates before interviews with clearer fit, stronger proof, and better preparation.",
    },
  ];

  const pilotSteps = [
    "Invite a small cohort of candidates",
    "Run Career Ops dashboard and AI Assistant workflows",
    "Identify who needs resume, interview, or strategy consulting",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PublicSeo
        title="JobPA for Companies - Candidate Success Infrastructure"
        description="JobPA helps companies, universities, and career communities make candidates application-ready with Career Ops dashboards, AI career assistance, and consulting workflows."
        path="/companies"
        keywords={["candidate success infrastructure", "career readiness platform", "AI career assistant", "career ops for companies", "job seeker support"]}
      />
      <MarketingNav />
      <main>
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.24),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.22),transparent_30%)]" />
          <div className="container relative grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                <Handshake className="h-3.5 w-3.5" />
                JobPA for companies
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                Help job seekers become application-ready before the interview.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                JobPA is candidate-side Career Ops infrastructure for companies, universities, bootcamps, and communities that want stronger resumes, clearer fit, better interview prep, and a path to expert consulting.
              </p>
              <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-5 text-sm font-semibold text-cyan-100">
                Not a recruiter CRM. Not auto-apply software. JobPA helps candidates run a better job-search pipeline.
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                  <Link href="/login">Request pilot <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/dashboard-preview">View candidate dashboard</Link>
                </Button>
              </div>
            </div>
            <DashboardPreviewMockup compact />
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03] py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium text-cyan-300">Who it is for</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">One B2B page, focused on candidate outcomes.</h2>
              <p className="mt-4 text-slate-400">
                The company page exists for partnerships and pilots. The core product remains B2C Career Ops.
              </p>
            </div>
            <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
              {partnerTypes.map((item) => (
                <Card key={item.title} className="border-white/10 bg-slate-900/80 text-white">
                  <CardContent className="p-6">
                    <item.icon className="mb-4 h-7 w-7 text-cyan-300" />
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-medium text-cyan-300">Pilot offer</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">A lightweight Career Ops pilot, not a heavy HR platform rollout.</h2>
              <p className="mt-4 text-slate-400">
                Start with a small candidate cohort. Use the dashboard and AI Assistant to find readiness gaps, then convert high-stakes needs into consulting.
              </p>
            </div>
            <div className="grid gap-4">
              {pilotSteps.map((step, index) => (
                <div key={step} className="flex gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
                    {index + 1}
                  </div>
                  <p className="pt-2 text-sm font-medium leading-relaxed text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cyan-400 py-12 text-slate-950">
          <div className="container flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em]">Revenue path</p>
              <h2 className="mt-2 text-3xl font-black">Free product adoption, paid consulting conversion.</h2>
            </div>
            <Button asChild size="lg" variant="secondary">
              <Link href="/career-ops">See Career Ops positioning</Link>
            </Button>
          </div>
        </section>
      </main>
      <RelatedPages />
    </div>
  );
}

function PilotFlowSection() {
  const steps = [
    {
      title: "Start free",
      body: "Create a profile and choose target roles, locations, industries, and non-tech or business skills.",
    },
    {
      title: "Run Career Ops",
      body: "Score fit, identify resume gaps, save jobs, track applications, and generate next-best actions.",
    },
    {
      title: "Convert to consulting",
      body: "When users need deeper help, route them to paid resume review, interview prep, visa strategy, or 1:1 consulting.",
    },
  ];

  return (
    <section className="border-t border-white/10 bg-white/[0.03] py-16">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-cyan-300">Pilot flow</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">From free Career Ops to paid expert support</h2>
          <p className="mt-4 text-slate-400">
            JobPA should acquire candidates through search and product proof, then monetize through high-trust consulting moments.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIAssistantBridgeSection() {
  return (
    <section className="border-y border-white/10 bg-slate-900 py-16">
      <div className="container grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
            <Bot className="h-3.5 w-3.5" />
            AI Career Assistant
          </p>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            The assistant layer between search and application.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            Career Ops is the workflow. The AI Assistant is the agent candidates talk to when they need strategy, resume positioning, interview prep, visa context, or the next best action.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: MessageCircle, title: "Ask", body: "Ask what to target, how to position, and how to explain your background." },
            { icon: CheckCircle2, title: "Act", body: "Convert advice into resume edits, follow-ups, prep tasks, and pipeline moves." },
            { icon: Sparkles, title: "Escalate", body: "Push complex moments into paid consulting when human judgment matters." },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <item.icon className="mb-4 h-6 w-6 text-cyan-300" />
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedPages() {
  return (
    <section className="border-t border-white/10 bg-slate-950 py-14">
      <div className="container">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-cyan-300">SEO entry points</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Built for role and industry searches</h2>
          </div>
          <Button asChild variant="outline" className="hidden border-white/20 bg-transparent text-white hover:bg-white/10 sm:inline-flex">
            <Link href="/dashboard-preview">View dashboard</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...rolePages.slice(0, 3), ...industryPages.slice(0, 3)].map((page) => (
            <Link key={page.path} href={page.path} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cyan-300/50 hover:bg-white/[0.07]">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{page.kind}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{page.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{page.description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-cyan-200">
                Open playbook <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketingLanding() {
  const [location] = useLocation();
  const page = getMarketingPageByPath(location);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PublicSeo
        title={`${page.title} | JobPA`}
        description={page.description}
        path={page.path}
        keywords={page.keywords}
      />
      <MarketingNav />
      <main>
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.24),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.2),transparent_30%)]" />
          <div className="container relative grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                {page.eyebrow}
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                {page.title}
              </h1>
              <p className="mt-5 inline-flex rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-semibold text-cyan-100">
                AI Career Ops that tracks, tailors, and improves every application.
              </p>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">{page.description}</p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">{page.audience}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                  <Link href="/login">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/dashboard-preview">View dashboard preview</Link>
                </Button>
              </div>
            </div>
            <DashboardPreviewMockup compact />
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03] py-14">
          <div className="container grid gap-5 md:grid-cols-3">
            {[
              { icon: Compass, title: "Positioning", body: page.promise },
              { icon: Search, title: "Keyword fit", body: page.keywords.join(" / ") },
              { icon: CheckCircle2, title: "Proof", body: page.proofPoints.join(" / ") },
            ].map((item) => (
              <Card key={item.title} className="border-white/10 bg-slate-900/80 text-white">
                <CardContent className="p-6">
                  <item.icon className="mb-4 h-6 w-6 text-cyan-300" />
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium text-cyan-300">Workflow</p>
              <h2 className="mt-2 text-3xl font-bold">What JobPA does after you pick a role</h2>
            </div>
            <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
              {page.workflows.map((workflow, index) => (
                <div key={workflow} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 font-black">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{workflow}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AIAssistantBridgeSection />

        {page.path !== careerOpsPage.path && (
          <section className="bg-cyan-400 py-12 text-slate-950">
            <div className="container flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em]">Core positioning</p>
                <h2 className="mt-2 text-3xl font-black">JobPA is Career Ops, not auto-apply spam.</h2>
              </div>
              <Button asChild size="lg" variant="secondary">
                <Link href="/career-ops">Read the Career Ops page</Link>
              </Button>
            </div>
          </section>
        )}
        <PilotFlowSection />
      </main>
      <RelatedPages />
    </div>
  );
}

export default function MarketingRoute() {
  const [location] = useLocation();
  if (location === "/dashboard-preview") return <DashboardPreviewPage />;
  if (location === "/companies") return <CompaniesPage />;
  return <MarketingLanding />;
}
