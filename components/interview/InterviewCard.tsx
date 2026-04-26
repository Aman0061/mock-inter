"use client";

import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import { INTERVIEW_TYPE_LABELS } from "@/lib/ai/prompts";
import type { InterviewSession } from "@/types/interview";

const DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function InterviewCard({
  session,
  onDelete,
}: {
  session: InterviewSession;
  onDelete: () => void;
}) {
  const isCompleted = session.status === "completed";

  return (
    <li className="group relative flex items-stretch gap-4 rounded-xl border border-border bg-background-elevated p-4 transition hover:border-border-strong sm:p-5">
      <Link
        href={`/interview/${session.id}`}
        className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6"
      >
        <div className="flex min-w-0 flex-col gap-1.5 sm:w-64">
          <span className="text-sm font-medium text-foreground">
            {INTERVIEW_TYPE_LABELS[session.type]}
            {session.company && (
              <span className="text-muted-foreground"> · {session.company}</span>
            )}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {DATE_FORMATTER.format(new Date(session.updatedAt))}
          </span>
        </div>

        <div className="flex flex-1 items-center gap-4 text-xs text-muted-foreground">
          <span className="font-mono">
            {session.messageCount} реплик
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
              isCompleted
                ? "bg-success/10 text-success"
                : "bg-accent-soft text-primary"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isCompleted ? "bg-success" : "bg-primary"
              }`}
            />
            {isCompleted ? "завершено" : "в процессе"}
          </span>
        </div>

        <ArrowRight
          className="hidden h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100 sm:block"
          strokeWidth={1.75}
        />
      </Link>

      <button
        type="button"
        onClick={onDelete}
        className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-lg text-muted opacity-0 transition hover:bg-background hover:text-danger group-hover:opacity-100 sm:self-center"
        aria-label="Удалить интервью"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </li>
  );
}
