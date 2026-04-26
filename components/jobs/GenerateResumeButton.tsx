"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function GenerateResumeButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileEmpty, setProfileEmpty] = useState(false);

  async function handleClick() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setProfileEmpty(false);
    try {
      const response = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = (await response.json()) as {
        id?: string;
        error?: string;
        code?: string;
      };
      if (!response.ok || !data.id) {
        if (data.code === "profile_empty") {
          setProfileEmpty(true);
          setSubmitting(false);
          return;
        }
        throw new Error(data.error ?? `status ${response.status}`);
      }
      router.push(`/resumes/${data.id}`);
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error ? err.message : "Не удалось собрать резюме"
      );
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClick}
        disabled={submitting}
        variant="secondary"
        className="h-11 px-5 text-sm"
      >
        <FileText className="mr-2 h-4 w-4" strokeWidth={1.75} />
        {submitting ? "Собираем резюме…" : "Собрать резюме под себя"}
      </Button>
      {profileEmpty && (
        <p className="rounded-xl border border-primary/30 bg-accent-soft px-4 py-3 text-xs text-foreground">
          Сначала заполни{" "}
          <Link
            href="/profile"
            className="font-medium text-primary underline underline-offset-2"
          >
            профиль
          </Link>{" "}
          — без него AI не на чём собирать.
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
