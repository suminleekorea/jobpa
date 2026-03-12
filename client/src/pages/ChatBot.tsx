import { useI18n } from "@/contexts/i18nContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox } from "@/components/AIChatBox";
import { Bot, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import type { UIMessage } from "ai";

export default function ChatBot() {
  const { language } = useI18n();
  const { user } = useAuth();
  const isKo = language === "ko";

  const [chatId] = useState(() => `career-${user?.id || "anon"}-${Date.now()}`);
  const [initialMessages] = useState<UIMessage[]>([]);

  const suggestedPrompts = useMemo(() => {
    if (isKo) {
      return [
        "싱가포르에서 데이터 분석가로 취업하려면 어떻게 해야 하나요?",
        "두바이 취업 비자 종류와 요건을 알려주세요",
        "프론트엔드 개발자 면접 준비 팁을 알려주세요",
        "홍콩 vs 싱가포르 테크 직무 연봉 비교해주세요",
      ];
    }
    return [
      "How do I get a job as a data analyst in Singapore?",
      "What are the visa options for working in Dubai?",
      "Give me interview tips for a frontend developer role",
      "Compare tech salaries in Hong Kong vs Singapore",
    ];
  }, [isKo]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            {isKo ? "AI 커리어 어시스턴트" : "AI Career Assistant"}
            <Sparkles className="h-4 w-4 text-amber-500" />
          </h1>
          <p className="text-sm text-muted-foreground">
            {isKo
              ? "취업 전략, 이력서 피드백, 비자 정보, 연봉 협상 등 무엇이든 물어보세요."
              : "Ask about job strategy, resume tips, visa info, salary negotiation, and more."}
          </p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0">
        <AIChatBox
          chatId={chatId}
          initialMessages={initialMessages}
          placeholder={isKo ? "커리어에 대해 무엇이든 물어보세요..." : "Ask me anything about your career..."}
          emptyStateMessage={isKo
            ? "안녕하세요! JobPA 커리어 어시스턴트입니다. 취업 전략, 비자 정보, 면접 준비, 연봉 협상 등 무엇이든 도와드릴게요."
            : "Hi! I'm your JobPA Career Assistant. I can help with job search strategy, visa info, interview prep, salary negotiation, and more."}
          suggestedPrompts={suggestedPrompts}
        />
      </div>
    </div>
  );
}
