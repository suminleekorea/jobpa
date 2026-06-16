import { useI18n } from "@/contexts/i18nContext";
import { Mail, Phone, User, Clock, Shield, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Disclaimer() {
  const { t } = useI18n();
  const d = t.disclaimer;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{d.title}</h1>
          </div>
          <p className="text-muted-foreground text-sm">{d.lastUpdated}</p>
          <div className="mt-4">
            <Link href="/" className="text-primary text-sm hover:underline">← {t.nav.home}</Link>
          </div>
        </div>
      </div>

      <div className="container py-10 max-w-3xl">
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <h2 className="font-semibold mb-2">AI, Privacy, and Visa Limitations</h2>
          <p className="leading-relaxed">
            JobPA provides career guidance, workflow support, and demo/staging job discovery. It does not guarantee employment,
            interviews, offers, salary outcomes, or visa approval. Visa, immigration, tax, and legal topics are general guidance only;
            verify decisions with official government sources, employers, or qualified professionals. Use sanitized demo data for review
            and do not deploy publicly without explicit approval.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 mb-16">
          {d.sections.map((section: { heading: string; body: string }, i: number) => (
            <div key={i} className="border-l-2 border-primary/30 pl-5">
              <h2 className="text-base font-semibold text-foreground mb-2">{section.heading}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 my-10" />

        {/* Contact / Partnership Section */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{d.contact.title}</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">{d.contact.subtitle}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Founder */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50">
              <User className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Founder</p>
                <p className="text-sm font-medium text-foreground">{d.contact.founder}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50">
              <Phone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">WhatsApp / Phone</p>
                <a
                  href={`tel:${d.contact.phone.replace(/\s/g, '')}`}
                  className="text-sm font-medium text-primary hover:underline font-mono"
                >
                  {d.contact.phone}
                </a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50">
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Email</p>
                <a
                  href={`mailto:${d.contact.email}`}
                  className="text-sm font-medium text-primary hover:underline break-all"
                >
                  {d.contact.email}
                </a>
              </div>
            </div>

            {/* Response time */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50">
              <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Response Time</p>
                <p className="text-sm text-foreground">{d.contact.responseTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-10">
          {t.brand.full} · {t.footer.builtWith}
        </p>
      </div>
    </div>
  );
}
