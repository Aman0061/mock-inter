"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MIN_LENGTH = 100;
const MAX_LENGTH = 20000;

export function JobForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    if (text.trim().length < MIN_LENGTH) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: text.trim() }),
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error ?? `Сервер ответил ${response.status}`);
      }
      router.push(`/jobs/${data.id}`);
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Что-то пошло не так. Попробуй ещё раз."
      );
    }
  }

  const validLength = text.trim().length >= MIN_LENGTH;
  const tooLong = text.length > MAX_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label
          htmlFor="jd"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
        >
          Текст вакансии
        </label>
        <textarea
          id="jd"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          disabled={submitting}
          placeholder="Скопируй описание вакансии PM (от 100 до 20 000 символов). AI вытащит компетенции, придумает вопросы и составит план подготовки."
          className="mt-3 w-full resize-y rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
        <p
          className={`mt-2 font-mono text-[10px] uppercase tracking-wider ${
            tooLong ? "text-danger" : "text-muted"
          }`}
        >
          {text.length.toLocaleString("ru-RU")} / {MAX_LENGTH.toLocaleString("ru-RU")} символов · минимум {MIN_LENGTH}
        </p>
      </div>

      {submitting && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-accent-soft px-4 py-3 text-sm text-foreground">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: "300ms" }}
            />
          </span>
          AI читает вакансию — обычно 10–20 секунд. Не закрывай страницу.
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
        <Button
          type="submit"
          disabled={submitting || !validLength || tooLong}
          className="h-12 px-6"
        >
          <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.75} />
          {submitting ? "Анализируем…" : "Проанализировать"}
        </Button>
      </div>
    </form>
  );
}
