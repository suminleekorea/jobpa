import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { Sparkles, Loader2, Check, Star, Zap, Crown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Consulting() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const joinWaitlist = trpc.consulting.joinWaitlist.useMutation({
    onSuccess: () => { setSubmitted(true); toast.success(t.consulting.waitlistSuccess); },
    onError: (err) => toast.error(err.message),
  });

  const plans = [
    {
      name: t.consulting.plans.free.name,
      price: "$0",
      period: t.consulting.plans.free.period,
      icon: Zap,
      features: t.consulting.plans.free.features,
      current: true,
      color: "border-border",
    },
    {
      name: t.consulting.plans.pro.name,
      price: t.consulting.plans.pro.price,
      period: t.consulting.plans.pro.period,
      icon: Star,
      features: t.consulting.plans.pro.features,
      current: false,
      color: "border-primary ring-1 ring-primary/20",
      badge: t.consulting.comingSoon,
    },
    {
      name: t.consulting.plans.enterprise.name,
      price: t.consulting.plans.enterprise.price,
      period: t.consulting.plans.enterprise.period,
      icon: Crown,
      features: t.consulting.plans.enterprise.features,
      current: false,
      color: "border-border",
      badge: t.consulting.comingSoon,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.consulting.title}</h1>
        <p className="text-muted-foreground mt-1">{t.consulting.desc}</p>
      </div>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t.consulting.plansTitle}</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <Card key={i} className={`relative ${plan.color}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {plan.badge}
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <plan.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{plan.name}</h3>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {plan.current ? (
                    <Button variant="outline" className="w-full" disabled>
                      {t.consulting.currentPlan}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => {
                      document.getElementById("waitlist-form")?.scrollIntoView({ behavior: "smooth" });
                    }}>
                      {t.consulting.waitlist}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 1:1 Consulting Teaser */}
      <Card className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <CardContent className="p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            {t.consulting.comingSoon}
          </div>
          <h2 className="text-xl font-bold mb-2">{t.consulting.oneOnOne}</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">{t.consulting.oneOnOneDesc}</p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {t.consulting.features.map((f, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-card border text-sm">{f}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Form */}
      <Card id="waitlist-form">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t.consulting.waitlistTitle}</h2>
          {submitted ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold">{t.consulting.waitlistSuccess}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.consulting.waitlistSuccessDesc}</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-md">
              <div>
                <Label className="text-sm">{t.consulting.formName}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">{t.consulting.formEmail}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">{t.consulting.formMessage}</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1" />
              </div>
              <Button
                onClick={() => joinWaitlist.mutate({ name, email, message })}
                disabled={joinWaitlist.isPending || !email.trim()}
                className="gap-2"
              >
                {joinWaitlist.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {t.consulting.joinWaitlist}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
