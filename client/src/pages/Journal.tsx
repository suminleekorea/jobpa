import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Save, X, Calendar } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

const moodEmojis: Record<string, string> = {
  great: "😄", good: "🙂", okay: "😐", tough: "😓", frustrated: "😤",
};

export default function Journal() {
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(today);
  const [mood, setMood] = useState("");
  const [content, setContent] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();
  const { data: entries = [], isLoading: listLoading } = trpc.journal.list.useQuery();
  const { data: todayEntry, isLoading: entryLoading } = trpc.journal.getByDate.useQuery(
    { date: selectedDate }
  );

  // Sync form state when entry data changes
  const prevEntryRef = useRef<any>(null);
  useEffect(() => {
    if (todayEntry && todayEntry !== prevEntryRef.current) {
      setMood(todayEntry.mood || "");
      setContent(todayEntry.content || "");
      setHighlights(todayEntry.highlights || []);
      setGoals(todayEntry.goals || []);
      setIsEditing(false);
      prevEntryRef.current = todayEntry;
    } else if (!todayEntry && !entryLoading) {
      setMood(""); setContent(""); setHighlights([]); setGoals([]);
      setIsEditing(false);
      prevEntryRef.current = null;
    }
  }, [todayEntry, entryLoading]);

  const saveMutation = trpc.journal.save.useMutation({
    onSuccess: () => {
      utils.journal.list.invalidate();
      utils.journal.getByDate.invalidate();
      utils.gamification.profile.invalidate();
      toast.success(t.common.save + "!");
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      date: selectedDate,
      mood: mood || undefined,
      content: content || undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
      goals: goals.length > 0 ? goals : undefined,
    });
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights(prev => [...prev, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals(prev => [...prev, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const moodKeys = Object.keys(moodEmojis);
  const moodLabels = t.journal.moods as Record<string, string>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {t.journal.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t.journal.todayEntry}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-sm border rounded-lg px-3 py-1.5 bg-background"
          />
        </div>
      </div>

      {/* Mood Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.journal.mood}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {moodKeys.map(key => (
              <button
                key={key}
                onClick={() => { setMood(key); setIsEditing(true); }}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  mood === key
                    ? "border-primary bg-primary/10 scale-105 shadow-sm"
                    : "border-transparent bg-muted/50 hover:bg-muted"
                }`}
              >
                <span className="text-2xl">{moodEmojis[key]}</span>
                <span className="text-xs font-medium">{moodLabels[key] || key}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.journal.content}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={content}
            onChange={e => { setContent(e.target.value); setIsEditing(true); }}
            placeholder={t.journal.placeholder}
            className="min-h-[150px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.journal.highlights}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2 bg-green-50 dark:bg-green-950 rounded-lg px-3 py-2">
              <span className="text-green-600">✓</span>
              <span className="flex-1 text-sm">{h}</span>
              <button onClick={() => { setHighlights(prev => prev.filter((_, idx) => idx !== i)); setIsEditing(true); }}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newHighlight}
              onChange={e => setNewHighlight(e.target.value)}
              placeholder={t.journal.highlightPlaceholder}
              className="flex-1"
              onKeyDown={e => { if (e.key === "Enter") addHighlight(); }}
            />
            <Button size="icon" variant="outline" onClick={addHighlight} disabled={!newHighlight.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tomorrow's Goals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.journal.goals}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {goals.map((g, i) => (
            <div key={i} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 rounded-lg px-3 py-2">
              <span className="text-blue-600">→</span>
              <span className="flex-1 text-sm">{g}</span>
              <button onClick={() => { setGoals(prev => prev.filter((_, idx) => idx !== i)); setIsEditing(true); }}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              placeholder={t.journal.goalPlaceholder}
              className="flex-1"
              onKeyDown={e => { if (e.key === "Enter") addGoal(); }}
            />
            <Button size="icon" variant="outline" onClick={addGoal} disabled={!newGoal.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg" className="gap-2">
          <Save className="h-4 w-4" />
          {t.journal.save}
          {isEditing && <Badge variant="secondary" className="ml-1 text-xs">unsaved</Badge>}
        </Button>
      </div>

      {/* Past Entries */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Past Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entries.slice(0, 10).map((entry: any) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedDate(entry.date)}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedDate === entry.date ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                  }`}
                >
                  <span className="text-lg">{entry.mood ? moodEmojis[entry.mood] || "📝" : "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.date}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.content?.slice(0, 60) || "No content"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground">
        +15 XP per journal entry
      </div>
    </div>
  );
}
