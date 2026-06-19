import { BrandLogo } from "@/components/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, Bot, BriefcaseBusiness, CheckCircle2, FileText, Radar, Sparkles } from "lucide-react";

const pipelineStages = [
  { label: "Sourced", value: 9, tone: "bg-sky-400", width: "82%" },
  { label: "Applied", value: 7, tone: "bg-cyan-300", width: "72%" },
  { label: "Interview", value: 4, tone: "bg-emerald-300", width: "48%" },
  { label: "Offer", value: 1, tone: "bg-amber-300", width: "18%" },
];

const priorityDeals = [
  { role: "Product Marketing Manager", company: "Fintech scaleup", stage: "Interview", score: 86 },
  { role: "Customer Success Manager", company: "B2B SaaS", stage: "Applied", score: 81 },
  { role: "Business Analyst", company: "AI startup", stage: "Shortlist", score: 78 },
];

const agentQueue = [
  "Rewrite resume proof for PMM role",
  "Prep 5 interview stories",
  "Send follow-up before Friday",
];

export function DashboardPreviewMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-2xl shadow-cyan-500/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.25),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.22),transparent_32%)]" />
      <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.74fr_1.26fr]">
        <aside className="hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 lg:block">
          <div className="mb-6">
            <BrandLogo size="sm" variant="light" />
            <p className="mt-1 text-xs text-slate-400">Agentic Career Console</p>
          </div>
          {["Home", "Career Pipeline", "Resume Ops", "Agent Queue", "Reports"].map((item, index) => (
            <div
              key={item}
              className={`mb-2 rounded-xl px-3 py-2 text-sm transition ${
                index === 1 ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/20" : "text-slate-300"
              }`}
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge className="mb-2 bg-cyan-300 text-slate-950 hover:bg-cyan-300">Live Career Ops CRM</Badge>
              <h3 className="text-2xl font-black tracking-tight">Your job search pipeline, operated by an AI agent.</h3>
              <p className="mt-1 text-sm text-slate-300">Track every lead, stage, next action, fit score, and resume variant in one command center.</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-right">
              <p className="text-xs text-cyan-100">Pipeline health</p>
              <p className="text-3xl font-black">86%</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: BriefcaseBusiness, label: "Active roles", value: "23" },
              { icon: Radar, label: "Next actions", value: "14" },
              { icon: FileText, label: "Resume variants", value: "6" },
            ].map((metric) => (
              <Card key={metric.label} className="border-white/10 bg-white/[0.06] p-4 text-white">
                <metric.icon className="mb-3 h-5 w-5 text-cyan-300" />
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-slate-400">{metric.label}</p>
              </Card>
            ))}
          </div>

          <Card className="border-white/10 bg-white/[0.06] p-4 text-white">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">Career pipeline</p>
                <p className="text-xs text-slate-400">Salesforce-style stages for job opportunities</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {pipelineStages.map((stage) => (
                <div key={stage.label} className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-300">{stage.label}</p>
                    <span className="text-lg font-black">{stage.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${stage.tone}`} style={{ width: stage.width }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-white/10 bg-white/[0.06] p-4 text-white">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Priority opportunities</p>
                <Sparkles className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="space-y-3">
                {priorityDeals.map((app) => (
                  <div key={app.role} className="rounded-xl border border-white/10 bg-slate-900/80 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{app.role}</p>
                        <p className="text-xs text-slate-400">{app.company}</p>
                      </div>
                      <Badge variant="outline" className="border-cyan-300/40 text-cyan-100">{app.score}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">{app.stage}</p>
                  </div>
                ))}
              </div>
            </Card>

            {!compact && (
              <Card className="border-white/10 bg-white/[0.06] p-4 text-white">
                <div className="mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-cyan-300" />
                  <p className="font-semibold">Agent next-best actions</p>
                </div>
                <div className="space-y-3">
                  {agentQueue.map((task) => (
                    <div key={task} className="flex gap-3 rounded-xl bg-slate-900/70 p-3 text-sm text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
