import { useI18n } from "@/contexts/i18nContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox } from "@/components/AIChatBox";
import { Bot, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import type { UIMessage } from "ai";

export default function ChatBot() {
  const { language, t } = useI18n();
  const { user } = useAuth();

  const [chatId] = useState(() => `career-${user?.id || "anon"}-${Date.now()}`);
  const [initialMessages] = useState<UIMessage[]>([]);

  const suggestedPrompts = [...t.chatbot.prompts];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            {t.chatbot.title}
            <Sparkles className="h-4 w-4 text-amber-500" />
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.chatbot.subtitleFull}
          </p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0">
        <AIChatBox
          chatId={chatId}
          initialMessages={initialMessages}
          placeholder={t.chatbot.placeholder}
          emptyStateMessage={t.chatbot.emptyDesc}
          suggestedPrompts={suggestedPrompts}
        />
      </div>
    </div>
  );
}
