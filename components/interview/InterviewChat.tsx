"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Flag } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/Button";
import { MarkdownView } from "@/components/interview/MarkdownView";
import { MessageBubble } from "@/components/interview/MessageBubble";
import { INTERVIEW_TYPE_LABELS } from "@/lib/ai/prompts";
import { useInterviewStorage } from "@/lib/storage/storage-provider";
import type { InterviewStorage } from "@/lib/storage/types";
import type { InterviewSession } from "@/types/interview";

type HydratedState =
  | { status: "loading" }
  | { status: "not_found" }
  | {
      status: "ready";
      session: InterviewSession;
      initialMessages: UIMessage[];
      initialFeedback: string | null;
    };

export function InterviewChat({ sessionId }: { sessionId: string }) {
  const storage = useInterviewStorage();
  const [hydrated, setHydrated] = useState<HydratedState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setHydrated({ status: "loading" });
    Promise.all([
      storage.getSession(sessionId),
      storage.loadMessages(sessionId),
      storage.loadFeedback(sessionId),
    ])
      .then(([session, messages, feedback]) => {
        if (cancelled) return;
        if (!session) {
          setHydrated({ status: "not_found" });
          return;
        }
        setHydrated({
          status: "ready",
          session,
          initialMessages: messages,
          initialFeedback: feedback,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load interview", err);
        setHydrated({ status: "not_found" });
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, storage]);

  if (hydrated.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted">
        Загружаем интервью…
      </div>
    );
  }

  if (hydrated.status === "not_found") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="font-display text-2xl italic text-foreground">
          Интервью не найдено.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Возможно, оно было удалено или открыто на другом устройстве.
        </p>
        <Link
          href="/interview/new"
          className={buttonClassName("primary", "mt-6 h-11 px-5 text-sm")}
        >
          Начать новое
        </Link>
      </div>
    );
  }

  return (
    <ChatInner
      session={hydrated.session}
      initialMessages={hydrated.initialMessages}
      initialFeedback={hydrated.initialFeedback}
      storage={storage}
    />
  );
}

function ChatInner({
  session,
  initialMessages,
  initialFeedback,
  storage,
}: {
  session: InterviewSession;
  initialMessages: UIMessage[];
  initialFeedback: string | null;
  storage: InterviewStorage;
}) {
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(initialFeedback);
  const [feedbackStatus, setFeedbackStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/interview/chat",
      body: { type: session.type, company: session.company },
    }),
    messages: initialMessages,
  });

  // Persist messages with debounce so we don't write on every streaming chunk.
  // pendingSaveRef tracks the latest not-yet-flushed state so it can be
  // saved immediately if the user navigates away before the debounce fires.
  const pendingSaveRef = useRef<{
    messages: UIMessage[];
    feedback: string | null;
  } | null>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    pendingSaveRef.current = { messages, feedback };
    const timeoutId = setTimeout(() => {
      pendingSaveRef.current = null;
      storage.saveMessages(session.id, messages).catch((err) => {
        console.error("Failed to save messages", err);
      });
      storage
        .updateSessionMeta(session.id, {
          messageCount: messages.length,
          status: feedback ? "completed" : "active",
        })
        .catch((err) => console.error("Failed to update session meta", err));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [messages, feedback, session.id, storage]);

  useEffect(() => {
    return () => {
      const pending = pendingSaveRef.current;
      if (!pending) return;
      storage.saveMessages(session.id, pending.messages).catch((err) => {
        console.error("Failed to save messages", err);
      });
      storage
        .updateSessionMeta(session.id, {
          messageCount: pending.messages.length,
          status: pending.feedback ? "completed" : "active",
        })
        .catch((err) => console.error("Failed to update session meta", err));
    };
    // Flush-on-unmount only — intentionally not re-subscribing per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoscroll on new messages or while streaming.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, feedback]);

  const isBusy = status === "submitted" || status === "streaming";
  const canSend = input.trim().length > 0 && !isBusy && feedback === null;
  const assistantTurns = messages.filter((m) => m.role === "assistant").length;

  function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    sendMessage({ text: input.trim() });
    setInput("");
  }

  function handleStart() {
    sendMessage({ text: "Готов, начинаем!" });
  }

  async function handleFinish() {
    if (feedbackStatus === "loading") return;
    setFeedbackStatus("loading");
    setFeedbackError(null);
    setFeedback("");
    try {
      const response = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          type: session.type,
          company: session.company,
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Сервер ответил ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setFeedback(buffer);
      }
      buffer += decoder.decode();
      setFeedback(buffer);
      await storage.saveFeedback(session.id, buffer);
      await storage.updateSessionMeta(session.id, { status: "completed" });
      setFeedbackStatus("idle");
    } catch (err) {
      setFeedbackStatus("error");
      setFeedbackError(
        err instanceof Error ? err.message : "Не удалось получить фидбек"
      );
      setFeedback(initialFeedback);
    }
  }

  const showStartCta = messages.length === 0 && status === "ready";
  const showFinishCta = assistantTurns >= 2 && !feedback;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-border bg-background-elevated/40 px-5 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              {INTERVIEW_TYPE_LABELS[session.type]}
              {session.company ? ` · ${session.company}` : ""}
            </p>
            <h1 className="mt-1.5 font-display text-lg italic text-foreground sm:text-xl">
              Mock-интервью
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted sm:inline">
              Q{Math.max(assistantTurns, 1)} / ~7
            </span>
            {showFinishCta && (
              <Button
                variant="secondary"
                onClick={handleFinish}
                disabled={feedbackStatus === "loading"}
                className="h-9 px-3 text-xs"
              >
                <Flag className="mr-1.5 h-3 w-3" strokeWidth={1.75} />
                {feedbackStatus === "loading" ? "Готовлю фидбек…" : "Завершить"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {showStartCta && (
            <div className="rounded-3xl border border-dashed border-border bg-background-elevated/40 p-10 text-center">
              <p className="font-display text-2xl italic text-foreground">
                Готов начать?
              </p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                AI задаст 5–7 вопросов с follow-up&apos;ами. Когда захочешь
                закончить — нажми{" "}
                <span className="font-mono text-[11px] text-foreground">«Завершить»</span>.
              </p>
              <Button onClick={handleStart} className="mt-6 h-11 px-6">
                Начать интервью →
              </Button>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {status === "submitted" && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background-elevated px-4 py-3 text-sm text-muted-foreground">
                <span className="flex gap-1">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
                  <span
                    className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
                AI печатает
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              Ошибка: {error.message}
            </div>
          )}

          {feedback !== null && (
            <section className="mt-4 overflow-hidden rounded-3xl border border-border bg-background-elevated">
              <div className="border-b border-border bg-accent-soft px-6 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                  Фидбек по интервью
                </p>
                <p className="mt-1.5 font-display text-xl italic text-foreground">
                  Что сильно, что подтянуть.
                </p>
              </div>
              <div className="px-6 py-6">
                <MarkdownView content={feedback} />
              </div>
              {feedbackError && (
                <p className="border-t border-border px-6 py-3 text-xs text-danger">
                  {feedbackError}
                </p>
              )}
            </section>
          )}

          {feedback !== null && feedbackStatus !== "loading" && (
            <div className="flex flex-col items-stretch gap-4 rounded-3xl border border-border bg-background-elevated/60 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <p className="font-display text-lg italic text-foreground">
                  Что дальше?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Прогресс сохранён. Можно пройти ещё одно интервью или
                  вернуться на дашборд.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/interview/new"
                  className={buttonClassName("primary", "h-11 px-5 text-sm")}
                >
                  Новое интервью →
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonClassName("secondary", "h-11 px-5 text-sm")}
                >
                  На дашборд
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {feedback === null && (
        <form
          onSubmit={handleSend}
          className="border-t border-border bg-background/85 px-5 py-4 backdrop-blur sm:px-6"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) {
                    sendMessage({ text: input.trim() });
                    setInput("");
                  }
                }
              }}
              placeholder="Твой ответ… (Shift + Enter — перенос строки)"
              rows={2}
              disabled={isBusy}
              className="flex-1 resize-none rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <Button
              type="submit"
              disabled={!canSend}
              className="h-12 w-12 px-0"
              aria-label="Отправить"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2} />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
