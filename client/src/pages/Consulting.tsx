import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Star, CreditCard, Clock, Globe, Briefcase, CheckCircle2, AlertCircle, Plus, Coins } from "lucide-react";

const REGION_LABELS: Record<string, string> = {
  singapore: "🇸🇬 Singapore",
  korea: "🇰🇷 Korea",
  japan: "🇯🇵 Japan",
  usa: "🇺🇸 USA",
  australia: "🇦🇺 Australia",
  uae: "🇦🇪 UAE",
  global: "🌍 Global",
};

const SPECIALTY_OPTIONS = [
  "EP Visa / Work Pass", "Tech / Engineering", "Finance / Banking",
  "Marketing / Sales", "Healthcare", "Legal", "Consulting",
  "Resume Writing", "Interview Coaching", "LinkedIn Optimization",
  "Career Change", "Executive / C-Suite", "Fresh Graduate",
];

const REGION_OPTIONS = ["singapore", "korea", "japan", "usa", "australia", "uae", "global"];
const LANGUAGE_OPTIONS = ["Korean", "English", "Japanese", "Mandarin", "Cantonese", "Malay", "Tamil"];

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating / 10);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{(rating / 10).toFixed(1)}</span>
    </div>
  );
}

function ConsultantCard({ consultant, onBook }: { consultant: any; onBook: (c: any) => void }) {
  const specialties: string[] = consultant.specialties ?? [];
  const regions: string[] = consultant.targetRegions ?? [];
  const languages: string[] = consultant.languages ?? [];

  return (
    <Card className="hover:shadow-md transition-shadow border border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg shrink-0">
            {consultant.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">{consultant.displayName}</h3>
                {consultant.title && <p className="text-xs text-muted-foreground mt-0.5">{consultant.title}</p>}
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                  <Coins className="w-3.5 h-3.5" />
                  {consultant.sessionPriceCredits ?? 10}
                </div>
                <p className="text-xs text-muted-foreground">per session</p>
              </div>
            </div>
            {consultant.avgRating > 0 && <div className="mt-1.5"><StarRating rating={consultant.avgRating} /></div>}
            {consultant.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{consultant.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {specialties.slice(0, 3).map((s: string) => (
                <Badge key={s} variant="secondary" className="text-xs px-2 py-0.5">{s}</Badge>
              ))}
              {specialties.length > 3 && <Badge variant="outline" className="text-xs px-2 py-0.5">+{specialties.length - 3}</Badge>}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {regions.map((r: string) => (
                <span key={r} className="text-xs text-muted-foreground">{REGION_LABELS[r] ?? r}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {consultant.yearsExperience > 0 && (
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{consultant.yearsExperience}yr</span>
                )}
                {consultant.totalSessions > 0 && (
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{consultant.totalSessions}</span>
                )}
                {languages.length > 0 && (
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{(languages as string[]).slice(0, 2).join(", ")}</span>
                )}
              </div>
              <Button size="sm" className="h-7 text-xs" onClick={() => onBook(consultant)}>Book</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingDialog({ consultant, open, onClose }: { consultant: any; open: boolean; onClose: () => void }) {
  const [topic, setTopic] = useState("");
  const utils = trpc.useUtils();
  const { data: credits } = trpc.consulting.myCredits.useQuery();
  const bookMutation = trpc.consulting.bookSession.useMutation({
    onSuccess: () => {
      toast.success("Session booked! The consultant will confirm shortly.");
      utils.consulting.mySessions.invalidate();
      utils.consulting.myCredits.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const price = consultant?.sessionPriceCredits ?? 10;
  const hasEnough = (credits?.balance ?? 0) >= price;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Book a Session</DialogTitle></DialogHeader>
        {consultant && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {consultant.displayName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{consultant.displayName}</p>
                {consultant.title && <p className="text-xs text-muted-foreground">{consultant.title}</p>}
              </div>
              <div className="ml-auto text-right">
                <p className="font-semibold text-sm flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-primary" />{price}</p>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">Your balance:</span>
              <span className={`font-medium flex items-center gap-1 ${hasEnough ? "text-green-600" : "text-destructive"}`}>
                <Coins className="w-3.5 h-3.5" />{credits?.balance ?? 0} credits
              </span>
            </div>
            {!hasEnough && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Insufficient credits. You need {price - (credits?.balance ?? 0)} more.</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>What would you like to discuss?</Label>
              <Textarea placeholder="e.g. EP visa strategy, resume review for SG tech companies..." value={topic} onChange={e => setTopic(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1" disabled={!hasEnough || bookMutation.isPending}
                onClick={() => bookMutation.mutate({ consultantId: consultant.id, topic })}>
                {bookMutation.isPending ? "Booking..." : `Book (${price} credits)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ApplyForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    displayName: "", title: "", bio: "", linkedinUrl: "", motivation: "",
    yearsExperience: 0, specialties: [] as string[], targetRegions: [] as string[], languages: [] as string[],
  });

  const applyMutation = trpc.consulting.applyConsultant.useMutation({
    onSuccess: () => {
      toast.success("Application submitted! We'll review within 3-5 business days.");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggle = (field: "specialties" | "targetRegions" | "languages", value: string) => {
    setForm(f => ({ ...f, [field]: f[field].includes(value) ? f[field].filter(v => v !== value) : [...f[field], value] }));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Display Name *</Label>
          <Input placeholder="Your name" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Current Title</Label>
          <Input placeholder="e.g. Senior Recruiter @ Google" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>LinkedIn URL</Label>
          <Input placeholder="https://linkedin.com/in/..." value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Years of Experience</Label>
          <Input type="number" min={0} max={40} value={form.yearsExperience} onChange={e => setForm(f => ({ ...f, yearsExperience: Number(e.target.value) }))} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Bio</Label>
        <Textarea placeholder="Tell job seekers about your background..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Specialties</Label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map(s => (
            <button key={s} type="button" onClick={() => toggle("specialties", s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.specialties.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Target Regions</Label>
        <div className="flex flex-wrap gap-2">
          {REGION_OPTIONS.map(r => (
            <button key={r} type="button" onClick={() => toggle("targetRegions", r)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.targetRegions.includes(r) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
              {REGION_LABELS[r] ?? r}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Languages</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map(l => (
            <button key={l} type="button" onClick={() => toggle("languages", l)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.languages.includes(l) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Why do you want to be a consultant on JobPA?</Label>
        <Textarea placeholder="Share your motivation..." value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))} rows={3} />
      </div>
      <Button className="w-full" disabled={!form.displayName || applyMutation.isPending}
        onClick={() => applyMutation.mutate(form)}>
        {applyMutation.isPending ? "Submitting..." : "Submit Application"}
      </Button>
    </div>
  );
}

export default function ConsultingPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookingConsultant, setBookingConsultant] = useState<any>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);

  const { data: consultants = [], isLoading: consultantsLoading } = trpc.consulting.list.useQuery();
  const { data: myApplication } = trpc.consulting.myApplication.useQuery(undefined, { enabled: !!user });
  const { data: myProfile } = trpc.consulting.myProfile.useQuery(undefined, { enabled: !!user });
  const { data: credits } = trpc.consulting.myCredits.useQuery(undefined, { enabled: !!user });
  const { data: mySessions = [] } = trpc.consulting.mySessions.useQuery(undefined, { enabled: !!user });

  if (authLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Consulting Marketplace</h1>
          <p className="text-muted-foreground mt-1 text-sm">Book 1:1 sessions with experienced career consultants who've navigated the same journey.</p>
        </div>
        {user && (
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg text-sm">
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-semibold">{credits?.balance ?? 0}</span>
            <span className="text-muted-foreground">credits</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory"><Users className="w-4 h-4 mr-1.5" />Consultants</TabsTrigger>
          {user && <TabsTrigger value="sessions"><Clock className="w-4 h-4 mr-1.5" />My Sessions</TabsTrigger>}
          {user && <TabsTrigger value="become"><Star className="w-4 h-4 mr-1.5" />Become a Consultant</TabsTrigger>}
          {user && <TabsTrigger value="credits"><CreditCard className="w-4 h-4 mr-1.5" />Credits</TabsTrigger>}
        </TabsList>

        <TabsContent value="directory" className="mt-6">
          {consultantsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted/40 rounded-xl animate-pulse" />)}
            </div>
          ) : consultants.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No consultants yet</p>
              <p className="text-sm mt-1">Be the first to join as a consultant!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(consultants as any[]).map((c) => <ConsultantCard key={c.id} consultant={c} onBook={setBookingConsultant} />)}
            </div>
          )}
        </TabsContent>

        {user && (
          <TabsContent value="sessions" className="mt-6">
            {(mySessions as any[]).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No sessions booked yet</p>
                <p className="text-sm mt-1">Browse consultants and book your first session.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(mySessions as any[]).map((s) => (
                  <Card key={s.id} className="border border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{s.topic || "General consultation"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : "Time TBD"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={s.status === "confirmed" ? "default" : s.status === "completed" ? "secondary" : "outline"}>{s.status}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Coins className="w-3 h-3" />{s.creditsCharged}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {user && (
          <TabsContent value="become" className="mt-6">
            {myProfile ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold text-lg">You're a consultant!</h3>
                <p className="text-muted-foreground text-sm mt-1">Your profile is live in the marketplace.</p>
              </div>
            ) : myApplication ? (
              <div className="max-w-md mx-auto text-center py-12">
                {myApplication.status === "pending" ? (
                  <><Clock className="w-12 h-12 mx-auto mb-3 text-amber-500" /><h3 className="font-semibold text-lg">Application Under Review</h3><p className="text-muted-foreground text-sm mt-1">We'll get back to you within 3-5 business days.</p></>
                ) : myApplication.status === "rejected" ? (
                  <><AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" /><h3 className="font-semibold text-lg">Application Not Approved</h3><p className="text-muted-foreground text-sm mt-1">You may reapply in 30 days.</p></>
                ) : null}
              </div>
            ) : showApplyForm ? (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                  <Button variant="ghost" size="sm" onClick={() => setShowApplyForm(false)}>← Back</Button>
                  <h2 className="font-semibold">Consultant Application</h2>
                </div>
                <ApplyForm onSuccess={() => setShowApplyForm(false)} />
              </div>
            ) : (
              <div className="max-w-lg mx-auto text-center py-8 space-y-6">
                <div>
                  <Star className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <h2 className="text-xl font-bold">Share Your Expertise</h2>
                  <p className="text-muted-foreground text-sm mt-2">Help others navigate their career journey. Earn credits for every session you conduct.</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[{ icon: "💼", label: "Share your experience" }, { icon: "🪙", label: "Earn credits per session" }, { icon: "🌏", label: "Help the community" }].map(item => (
                    <div key={item.label} className="p-3 bg-muted/40 rounded-lg">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                <Button className="w-full max-w-xs" onClick={() => setShowApplyForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />Apply to Become a Consultant
                </Button>
              </div>
            )}
          </TabsContent>
        )}

        {user && (
          <TabsContent value="credits" className="mt-6">
            <div className="max-w-md space-y-4">
              <Card className="border border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-3xl font-bold flex items-center gap-2 mt-1">
                        <Coins className="w-7 h-7 text-primary" />{credits?.balance ?? 0}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground space-y-1">
                      <p>Total earned: <span className="text-foreground font-medium">{credits?.totalEarned ?? 0}</span></p>
                      <p>Total spent: <span className="text-foreground font-medium">{credits?.totalSpent ?? 0}</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm">How to Earn Credits</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    { action: "Welcome bonus", credits: "+5", desc: "Automatically on first login" },
                    { action: "Conduct a session", credits: "+10", desc: "As a consultant, per session" },
                    { action: "Refer a friend", credits: "+3", desc: "Coming soon" },
                  ].map(item => (
                    <div key={item.action} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                      <div>
                        <p className="font-medium text-xs">{item.action}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <span className="text-green-600 font-semibold text-sm">{item.credits}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <BookingDialog consultant={bookingConsultant} open={!!bookingConsultant} onClose={() => setBookingConsultant(null)} />
    </div>
  );
}
