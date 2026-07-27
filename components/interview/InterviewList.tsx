"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { InterviewCard } from "@/components/interview/InterviewCard";
import { buttonClassName } from "@/components/ui/Button";
import { useInterviewStorage } from "@/lib/storage/storage-provider";
import type { InterviewSession } from "@/types/interview";

export function InterviewList({ limit }: { limit?: number } = {}) {
  const storage = useInterviewStorage();
  const [sessions, setSessions] = useState<InterviewSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await storage.listSessions();
      setSessions(list);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Не удалось загрузить интервью"
      );
      setSessions([]);
    }
  }, [storage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDelete(id: string) {
    if (!confirm("Удалить это интервью? Действие необратимо.")) return;
    try {
      await storage.deleteSession(id);
      await refresh();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Не удалось удалить интервью"
      );
    }
  }

  if (sessions === null) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background-elevated/40 p-8 text-center font-mono text-xs uppercase tracking-widest text-muted">
        Загружаем…
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-elevated/40 p-14 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-border bg-background">
          <Plus className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <p className="mt-5 font-display text-xl italic text-foreground">
          Здесь будет история твоих интервью.
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Запусти первое — оно появится тут со всеми ответами и фидбеком.
        </p>
        {error && (
          <p className="mt-4 max-w-sm text-xs text-danger">{error}</p>
        )}
        <Link
          href="/interview/new"
          className={buttonClassName("primary", "mt-6 h-11 px-5 text-sm")}
        >
          Запустить первое
        </Link>
      </div>
    );
  }

  const visible = limit ? sessions.slice(0, limit) : sessions;

  return (
    <ul className="flex flex-col gap-2">
      {visible.map((session) => (
        <InterviewCard
          key={session.id}
          session={session}
          onDelete={() => handleDelete(session.id)}
        />
      ))}
    </ul>
  );
}
