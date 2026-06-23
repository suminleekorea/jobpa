import { BrandLogo } from "@/components/BrandLogo";
import { PublicSeo } from "@/components/PublicSeo";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, FileText, Mail, MessageCircle, ShieldCheck, Sparkles, Target, UserRound } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

const client = {
  name: "Kimberly Nguyen",
  date: "23 June 2026",
  goal: "Singapore job search strategy improvement",
  focus: "EAL / English teaching roles in international schools",
  adjacent: ["Academic Coordination", "Student Success", "Education Consulting", "Corporate Training", "Learning & Development", "Client / Stakeholder Engagement"],
  price: "Complimentary beta tester access",
  duration: "30-day beta cycle",
};

const supportItems = [
  "CV positioning and resume refinement",
  "Singapore-specific role targeting",
  "Weekly curated job recommendations to test JobPA features",
  "LinkedIn branding support - normally paid, complimentary during beta",
  "Adjacent role path testing beyond EAL teaching",
  "Weekly consultation - normally paid, complimentary during beta",
];

const milestones = [
  { week: "0", title: "Onboarding", output: "Send latest CV and target preferences" },
  { week: "1", title: "CV + first job list", output: "Resume feedback and first curated job list" },
  { week: "2", title: "Market feedback", output: "Refine roles, channels, and application strategy" },
  { week: "3", title: "LinkedIn branding", output: "Profile/content direction and continued recommendations" },
  { week: "4", title: "Progress review", output: "Review results and decide next-month strategy" },
];

const expectations = [
  { label: "Direction", value: "Clearer job-search focus" },
  { label: "Applications", value: "More focused weekly execution" },
  { label: "Market fit", value: "Realistic SG role targeting" },
  { label: "Job list", value: "10-20 relevant roles / week" },
];

function PrivateProposalNoIndex() {
  useEffect(() => {
    const rules = "noindex,nofollow,noarchive,noimageindex,nosnippet";
    const setRobots = (name: string) => {
      let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = rules;
    };
    setRobots("robots");
    setRobots("googlebot");
  }, []);

  return null;
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 text-white backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size="sm" variant="light" />
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex">
            <Link href="/career-ops">Career Ops</Link>
          </Button>
          <Button asChild size="sm" className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">
            <a href="mailto:leewaterfolk@gmail.com">Accept next step</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function PageShell({ page, eyebrow, title, children }: { page: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="relative mx-auto min-h-[980px] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl shadow-cyan-950/30 sm:p-10 print:min-h-[10.5in] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="relative flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-600">{eyebrow}</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h2>
        </div>
        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">Page</p>
          <p className="text-2xl font-black">{page}</p>
        </div>
      </div>
      <div className="relative pt-8">{children}</div>
    </section>
  );
}

function StatusPipeline() {
  const steps = [
    { title: "1. CV + profile", body: "Review positioning and clarify target paths" },
    { title: "2. Curated jobs", body: "10-20 roles/week to test JobPA recommendations" },
    { title: "3. Apply + feedback", body: "Kimberly applies and shares market response" },
    { title: "4. Weekly consult", body: "Complimentary paid support + LinkedIn branding" },
  ];

  return (
    <div className="rounded-3xl bg-slate-950 p-5 text-white">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cyan-200">Simple weekly beta flow</p>
          <p className="text-xs text-slate-400">Kimberly tests JobPA while receiving complimentary paid-support features.</p>
        </div>
        <Sparkles className="h-5 w-5 text-cyan-300" />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            {index < steps.length - 1 && (
              <div className="absolute -right-3 top-1/2 hidden h-0.5 w-6 -translate-y-1/2 bg-cyan-300 md:block" />
            )}
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-sm font-black text-slate-950">
              {index + 1}
            </div>
            <p className="text-sm font-black">{step.title}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProposalKimberly() {
  return (
    <div className="min-h-screen bg-slate-950 text-white print:bg-white">
      <PublicSeo
        title="JobPA Proposal for Kimberly Nguyen - Beta Career Support"
        description="A private two-page JobPA Beta Career Support proposal for Singapore job search strategy, CV positioning, and weekly curated job recommendations."
        path="/proposal/kimberly"
        keywords={["JobPA proposal", "career support proposal", "Singapore job search", "career consulting"]}
      />
      <PrivateProposalNoIndex />
      <Header />

      <main className="relative overflow-hidden py-10 sm:py-14 print:py-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.26),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.18),transparent_26%)] print:hidden" />
        <div className="container relative space-y-8 print:space-y-0 print:p-0">
          <div className="mx-auto max-w-5xl pb-2 print:hidden">
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-100">
              Template v1 - client-facing proposal
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              JobPA Beta Career Support Proposal
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">
              A concise two-page proposal for Kimberly after the discovery call: situation, beta tester scope, weekly flow, complimentary paid-support access, and next step.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => window.print()} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                Save as PDF <FileText className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <a href="mailto:leewaterfolk@gmail.com?subject=JobPA%20Beta%20Career%20Support%20-%20Kimberly">Email follow-up</a>
              </Button>
            </div>
          </div>

          <PageShell page="01" eyebrow="Client snapshot" title="From five months stuck to a focused Singapore job-search plan.">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.86fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                      <UserRound className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">Client</p>
                      <h3 className="text-2xl font-black">{client.name}</h3>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <CalendarDays className="mb-2 h-4 w-4 text-cyan-600" />
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Call date</p>
                      <p className="mt-1 font-semibold">{client.date}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <Target className="mb-2 h-4 w-4 text-emerald-600" />
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Main goal</p>
                      <p className="mt-1 font-semibold">{client.goal}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">Diagnosis</p>
                  <h3 className="mt-2 text-2xl font-black">Likely blocker: positioning, market fit, and channel strategy.</h3>
                  <p className="mt-4 leading-relaxed text-slate-600">
                    Kimberly's teaching background is not the weak point. The issue is more likely how her experience is positioned for Singapore employers, whether the target roles are realistic, and whether adjacent education/business paths are being tested.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {["CV positioning", "SG role targeting", "Adjacent paths"].map((item) => (
                      <div key={item} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <StatusPipeline />
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl bg-gradient-to-br from-cyan-300 to-emerald-300 p-6 text-slate-950 shadow-xl shadow-cyan-200/60">
                  <p className="text-sm font-black uppercase tracking-[0.18em]">Product</p>
                  <h3 className="mt-2 text-3xl font-black">JobPA Beta Career Support</h3>
                  <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-800">
                    A 30-day beta tester cycle combining Career Ops, complimentary paid-support features, weekly job recommendations, and practical Singapore market navigation.
                  </p>
                  <div className="mt-6 rounded-2xl bg-white/75 p-4 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Beta tester access</p>
                    <p className="mt-1 text-3xl font-black">{client.price}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{client.duration}</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-bold text-slate-500">Current focus</p>
                  <p className="mt-2 text-xl font-black">{client.focus}</p>
                  <p className="mt-5 text-sm font-bold text-slate-500">Possible adjacent paths</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {client.adjacent.map((role) => (
                      <span key={role} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm font-semibold leading-relaxed">
                      JobPA provides structured guidance and support. It does not guarantee interviews, job offers, visa approval, salary outcomes, or employer responses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </PageShell>

          <PageShell page="02" eyebrow="30-day support plan" title="Clear scope, weekly rhythm, one immediate next step.">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">What JobPA helps with</p>
                      <h3 className="text-2xl font-black">Support scope</h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {supportItems.map((item) => (
                      <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <p className="text-sm font-medium text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-950 p-6 text-white">
                  <p className="text-sm font-bold text-cyan-200">Next step</p>
                  <h3 className="mt-2 text-2xl font-black">Send latest CV via WhatsApp or email.</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    After receiving the CV, JobPA will review current positioning, prepare initial CV feedback, build the first curated job list, and schedule the first weekly check-in.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <a className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950" href="mailto:leewaterfolk@gmail.com">
                      Send by email <Mail className="ml-2 h-4 w-4" />
                    </a>
                    <div className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-200">
                      WhatsApp CV <MessageCircle className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {expectations.map((item) => (
                    <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600">{item.label}</p>
                      <p className="mt-2 text-lg font-black text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">Milestones</p>
                  <div className="mt-5 space-y-3">
                    {milestones.map((item) => (
                      <div key={item.week} className="grid grid-cols-[3.5rem_1fr] gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-cyan-700 shadow-sm">
                          W{item.week}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-950">{item.title}</h4>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.output}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">Client responsibilities</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {["Send latest CV", "Share role preferences", "Apply consistently", "Give feedback weekly", "Attend check-ins", "Build LinkedIn visibility"].map((item) => (
                      <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-cyan-200 bg-cyan-50 p-5 text-slate-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Pricing</p>
                  <p className="mt-1 text-2xl font-black">{client.price}</p>
                  <p className="text-sm font-semibold text-slate-600">Weekly consultation and LinkedIn branding are normally paid support features, but are complimentary for Kimberly during the beta test.</p>
                </div>
                <div className="text-sm font-semibold text-slate-600 sm:max-w-md">
                  Beta tester access includes complimentary weekly consultation, curated job recommendations to test the JobPA workflow, CV positioning, LinkedIn branding, and Singapore market navigation.
                </div>
              </div>
            </div>
          </PageShell>
        </div>
      </main>
    </div>
  );
}