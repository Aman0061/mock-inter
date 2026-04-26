import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { SENIORITY_LABELS } from "@/lib/ai/job-analysis";

const DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export type JobListItem = {
  id: string;
  title: string | null;
  company: string | null;
  seniority: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export function JobList({ jobs }: { jobs: JobListItem[] }) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-elevated/40 p-14 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-border bg-background">
          <Briefcase
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.75}
          />
        </div>
        <p className="mt-5 font-display text-xl italic text-foreground">
          Здесь будут твои разборы вакансий.
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Загрузи описание вакансии — AI сделает разбор, и ты увидишь, к чему
          готовиться.
        </p>
        <Link
          href="/jobs/new"
          className={buttonClassName("primary", "mt-6 h-11 px-5 text-sm")}
        >
          Разобрать первую
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="group rounded-xl border border-border bg-background-elevated transition hover:border-border-strong"
        >
          <Link
            href={`/jobs/${job.id}`}
            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {job.title ?? "Без названия"}
                {job.company && (
                  <span className="text-muted-foreground"> · {job.company}</span>
                )}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {DATE_FORMATTER.format(new Date(job.updated_at))}
                {job.seniority && (
                  <>
                    {" · "}
                    {SENIORITY_LABELS[job.seniority] ?? job.seniority}
                  </>
                )}
              </span>
            </div>
            <ArrowRight
              className="hidden h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100 sm:block"
              strokeWidth={1.75}
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
