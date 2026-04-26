"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Brain, Compass, LineChart, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  INTERVIEW_TYPE_DESCRIPTIONS,
  INTERVIEW_TYPE_LABELS,
  type InterviewType,
} from "@/lib/ai/prompts";
import { useInterviewStorage } from "@/lib/storage/storage-provider";

const TYPE_ICONS: Record<InterviewType, LucideIcon> = {
  product_sense: Brain,
  behavioral: MessageCircle,
  analytical: LineChart,
  strategy: Compass,
};

const COMPANY_SUGGESTIONS = ["Яндекс", "Kaspi", "Ozon", "Тинькофф", "Google", "Авито"];

const TYPES: InterviewType[] = [
  "product_sense",
  "behavioral",
  "analytical",
  "strategy",
];

export function InterviewSetupForm({
  initialCompany = "",
}: {
  initialCompany?: string;
}) {
  const router = useRouter();
  const storage = useInterviewStorage();
  const [type, setType] = useState<InterviewType>("product_sense");
  const [company, setCompany] = useState(initialCompany);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const session = await storage.createSession({
        type,
        company: company.trim() || undefined,
      });
      router.push(`/interview/${session.id}`);
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось создать интервью. Попробуй ещё раз."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <fieldset>
        <legend className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Тип интервью
        </legend>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {TYPES.map((t) => {
            const selected = t === type;
            const Icon = TYPE_ICONS[t];
            return (
              <label
                key={t}
                className={`group cursor-pointer rounded-2xl border p-5 transition ${
                  selected
                    ? "border-primary/40 bg-accent-soft"
                    : "border-border bg-background-elevated hover:border-border-strong"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={selected}
                  onChange={() => setType(t)}
                  className="sr-only"
                />
                <div className="flex items-start gap-4">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition ${
                      selected
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="flex-1">
                    <p className="font-display text-base text-foreground">
                      {INTERVIEW_TYPE_LABELS[t]}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {INTERVIEW_TYPE_DESCRIPTIONS[t]}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <label
          htmlFor="company"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
        >
          Компания <span className="text-muted opacity-60">— необязательно</span>
        </label>
        <Input
          id="company"
          name="company"
          placeholder="Яндекс.Карты, Kaspi Pay, OpenAI…"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          autoComplete="off"
          disabled={submitting}
        />
        <div className="flex flex-wrap gap-1.5">
          {COMPANY_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setCompany(suggestion)}
              disabled={submitting}
              className="rounded-full border border-border bg-background-elevated px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition hover:border-border-strong hover:text-foreground disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end border-t border-border pt-6">
        <Button type="submit" disabled={submitting} className="h-12 px-6">
          {submitting ? "Создаём…" : "Начать интервью"}
          {!submitting && (
            <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.75} />
          )}
        </Button>
      </div>
    </form>
  );
}
