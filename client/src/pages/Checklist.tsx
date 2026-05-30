import { useI18n } from "@/contexts/i18nContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Plus, Sparkles, Trash2, Trophy } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const today = () => new Date().toISOString().slice(0, 10);

export default function Checklist() {
  const { t } = useI18n();
  const [date] = useState(today);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("apply");

  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.checklist.get.useQuery({ date });
  const { data: xpProfile } = trpc.gamification.profile.useQuery();

  const addMutation = trpc.checklist.add.useMutation({
    onSuccess: () => { utils.checklist.get.invalidate(); setNewTitle(""); toast.success("Added!"); },
  });
  const toggleMutation = trpc.checklist.toggle.useMutation({
    onSuccess: () => { utils.checklist.get.invalidate(); utils.gamification.profile.invalidate(); },
  });
  const removeMutation = trpc.checklist.remove.useMutation({
    onSuccess: () => { utils.checklist.get.invalidate(); toast.success("Removed"); },
  });

  const completed = items.filter((i: any) => i.isCompleted).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const categoryColors: Record<string, string> = {
    apply: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    research: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    network: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    skill: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    prep: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  };

  const categoryKey = (cat: string) => {
    const cats = t.checklist.categories as Record<string, string>;
    return cats[cat] || cat;
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header with XP */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            {t.checklist.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{date}</p>
        </div>
        {xpProfile && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div className="text-sm">
              <span className="font-bold text-amber-700 dark:text-amber-300">Lv.{xpProfile.level}</span>
              <span className="text-muted-foreground ml-2">{xpProfile.totalXP} XP</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              {completed}/{total} {t.checklist.completed}
            </span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          {progress === 100 && total > 0 && (
            <p className="text-center mt-3 text-sm font-medium text-green-600 dark:text-green-400 animate-pulse">
              All tasks complete! +{total * 10} XP earned today!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add New Item */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t.checklist.categories as Record<string, string>).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={t.checklist.placeholder}
              className="flex-1"
              onKeyDown={e => {
                if (e.key === "Enter" && newTitle.trim()) {
                  addMutation.mutate({ date, title: newTitle.trim(), category: newCategory });
                }
              }}
            />
            <Button
              onClick={() => {
                if (newTitle.trim()) addMutation.mutate({ date, title: newTitle.trim(), category: newCategory });
              }}
              disabled={!newTitle.trim() || addMutation.isPending}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t.common.loading}</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t.checklist.noItems}</p>
            <p className="text-xs text-muted-foreground mt-1">Add tasks above or get AI suggestions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <Card
              key={item.id}
              className={`transition-all duration-200 ${item.isCompleted ? "opacity-60 bg-muted/30" : "hover:shadow-md"}`}
            >
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <button
                  onClick={() => toggleMutation.mutate({ id: item.id, isCompleted: !item.isCompleted })}
                  className={`h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                    item.isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 hover:border-primary"
                  }`}
                >
                  {item.isCompleted && <CheckSquare className="h-4 w-4" />}
                </button>
                <span className={`flex-1 text-sm ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                  {item.title}
                </span>
                {item.category && (
                  <Badge variant="secondary" className={`text-xs ${categoryColors[item.category] || ""}`}>
                    {categoryKey(item.category)}
                  </Badge>
                )}
                {item.isAIGenerated && (
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <button
                  onClick={() => removeMutation.mutate({ id: item.id })}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* XP Info */}
      <div className="text-center text-xs text-muted-foreground">
        <span>+10 XP per completed task</span>
        <span className="mx-2">|</span>
        <span>Complete all tasks for bonus XP!</span>
      </div>
    </div>
  );
}
