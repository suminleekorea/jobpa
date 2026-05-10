import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, Minimize2, History, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

function generateSessionId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState(() => generateSessionId());
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const saveMessageMutation = trpc.chat.saveMessage.useMutation();
  const deleteSessionMutation = trpc.chat.deleteSession.useMutation();
  const utils = trpc.useUtils();

  const { data: sessions } = trpc.chat.sessions.useQuery(undefined, {
    enabled: !!user && isOpen,
  });

  const { data: savedMessages } = trpc.chat.messages.useQuery(
    { sessionId },
    { enabled: !!user && isOpen && showHistory === false }
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: {
            message: messages[messages.length - 1],
            chatId: id,
          },
        };
      },
    }),
    id: sessionId,
    onFinish: async (message) => {
      if (!user) return;
      // Extract text content from the finished assistant message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const textContent = (message as any).parts
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((message as any).parts as any[])
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text ?? "")
            .join("")
        : typeof (message as any).content === "string"
        ? (message as any).content
        : "";
      if (textContent) {
        await saveMessageMutation.mutateAsync({
          sessionId,
          role: "assistant",
          content: textContent,
        });
        utils.chat.sessions.invalidate();
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Load saved messages when opening an existing session from history
  const loadSession = useCallback(
    async (sid: string) => {
      setSessionId(sid);
      setShowHistory(false);
      // Messages will be loaded via savedMessages query
    },
    []
  );

  // Sync saved messages into useChat when loading a session
  useEffect(() => {
    if (savedMessages && savedMessages.length > 0 && messages.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const converted = savedMessages.map((m: any) => ({
        id: String(m.id),
        role: m.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: m.content }],
        content: m.content,
      }));
      setMessages(converted);
    }
  }, [savedMessages, messages.length, setMessages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !showHistory) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showHistory]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue.trim();
    setInputValue("");

    // Save user message to DB if logged in
    if (user) {
      const title = text.slice(0, 50);
      await saveMessageMutation.mutateAsync({
        sessionId,
        role: "user",
        content: text,
        sessionTitle: title,
      });
      utils.chat.sessions.invalidate();
    }

    sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setSessionId(generateSessionId());
    setMessages([]);
    setShowHistory(false);
  };

  const handleDeleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSessionMutation.mutateAsync({ sessionId: sid });
    utils.chat.sessions.invalidate();
    if (sid === sessionId) startNewChat();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Panel */}
      {isOpen && (
        <div
          className={cn(
            "w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden",
            "animate-in slide-in-from-bottom-4 fade-in duration-200"
          )}
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">JobPA AI</p>
                <p className="text-xs text-gray-400 mt-0.5">Career Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
                    onClick={() => setShowHistory(!showHistory)}
                    title="Chat history"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
                    onClick={startNewChat}
                    title="New chat"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* History Panel */}
          {showHistory && user ? (
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-2 px-1">Recent Conversations</p>
              {!sessions || sessions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No chat history yet</p>
              ) : (
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <div
                      key={session.sessionId}
                      onClick={() => loadSession(session.sessionId)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors group",
                        session.sessionId === sessionId
                          ? "bg-gray-900 text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <span className="truncate flex-1">{session.title || "Chat"}</span>
                      <button
                        onClick={(e) => handleDeleteSession(session.sessionId, e)}
                        className={cn(
                          "ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded",
                          session.sessionId === sessionId
                            ? "text-gray-300 hover:text-white"
                            : "text-gray-400 hover:text-red-500"
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">안녕하세요! JobPA AI입니다</p>
                    <p className="text-xs text-gray-500 mt-1">취업 전략, 비자, 이력서, 연봉 협상까지 무엇이든 물어보세요</p>
                    <div className="mt-4 space-y-2">
                      {[
                        "싱가포르 EP 비자 조건이 뭔가요?",
                        "데이터 분석가 연봉 얼마나 돼요?",
                        "이력서 어떻게 써야 하나요?",
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          className="block w-full text-left text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                          onClick={() => {
                            setInputValue(prompt);
                            inputRef.current?.focus();
                          }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const textContent = message.parts
                    ? (message.parts as any[])
                        .filter((p) => p.type === "text")
                        .map((p) => (p as any).text ?? "")
                        .join("")
                    : "";
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                          message.role === "user"
                            ? "bg-gray-900 text-white rounded-br-sm"
                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                        )}
                      >
                        {textContent}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-gray-400 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="취업 관련 질문을 해보세요..."
                    className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          "hover:scale-105 active:scale-95",
          isOpen
            ? "bg-gray-200 text-gray-700"
            : "bg-gray-900 text-white hover:bg-gray-700"
        )}
        aria-label="Open AI Career Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
