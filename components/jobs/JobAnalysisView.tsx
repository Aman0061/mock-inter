import Link from "next/link";
import { ArrowUpRight, Briefcase, FileText, Sparkles } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { GenerateResumeButton } from "@/components/jobs/GenerateResumeButton";
import {
  QUESTION_TYPE_LABELS,
  SENIORITY_LABELS,
  type JobAnalysis,
} from "@/lib/ai/job-analysis";

const DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

type JobRow = {
  id: string;
  raw_text: string;
  title: string | null;
  company: string | null;
  seniority: string | null;
  analysis: JobAnalysis;
  created_at: string;
  updated_at: string;
};

export function JobAnalysisView({ job }: { job: JobRow }) {
  const a = job.analysis;
  const company = job.company ?? a.company;
  const title = job.title ?? a.title;
  const seniorityLabel = job.seniority
    ? SENIORITY_LABELS[job.seniority] ?? job.seniority
    : SENIORITY_LABELS[a.seniority];

  const interviewHref = `/interview/new?company=${encodeURIComponent(company)}`;

  // Group questions by type
  const questionsByType = a.questions.reduce<
    Partial<Record<keyof typeof QUESTION_TYPE_LABELS, typeof a.questions>>
  >((acc, q) => {
    const list = acc[q.type] ?? [];
    list.push(q);
    acc[q.type] = list;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      {/* Header */}
      <header className="border-b border-border pb-10">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          <Briefcase className="h-3 w-3" strokeWidth={1.75} />
          <span>{company}</span>
          <span aria-hidden>·</span>
          <span>{seniorityLabel}</span>
          <span aria-hidden>·</span>
          <span>
            проанализировано{" "}
            {DATE_FORMATTER.format(new Date(job.created_at))}
          </span>
        </div>
        <h1 className="mt-5 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {a.summary}
        </p>
        <div className="mt-8 flex flex-wrap items-start gap-3">
          <Link
            href={interviewHref}
            className={buttonClassName("primary", "h-11 px-5 text-sm")}
          >
            <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Начать интервью под эту вакансию
          </Link>
          <GenerateResumeButton jobId={job.id} />
          <Link
            href="/jobs"
            className={buttonClassName("ghost", "h-11 px-4 text-sm")}
          >
            ← Все вакансии
          </Link>
        </div>
      </header>

      {/* Competencies */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between border-b border-border pb-3">
          <h2 className="font-display text-2xl tracking-tight">
            Что <span className="italic text-primary">проверят</span>
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {a.competencies.length} компетенций
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {a.competencies.map((c, i) => (
            <article
              key={c.title}
              className="rounded-2xl border border-border bg-background-elevated p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-lg text-foreground">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.why}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Questions by type */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between border-b border-border pb-3">
          <h2 className="font-display text-2xl tracking-tight">
            Какие <span className="italic text-primary">вопросы</span> зададут
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {a.questions.length} вопросов
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-8">
          {(
            Object.keys(QUESTION_TYPE_LABELS) as Array<
              keyof typeof QUESTION_TYPE_LABELS
            >
          )
            .filter((type) => (questionsByType[type]?.length ?? 0) > 0)
            .map((type) => (
              <div key={type}>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  {QUESTION_TYPE_LABELS[type]}
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {questionsByType[type]!.map((q, i) => (
                    <li
                      key={`${type}-${i}`}
                      className="rounded-xl border border-border bg-background-elevated p-5"
                    >
                      <p className="font-display text-base italic text-foreground">
                        «{q.question}»
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        <span className="font-mono uppercase tracking-widest text-muted">
                          зачем спросят:
                        </span>{" "}
                        {q.why}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </section>

      {/* Prep plan */}
      <section className="mt-14">
        <div className="flex items-baseline justify-between border-b border-border pb-3">
          <h2 className="font-display text-2xl tracking-tight">
            План <span className="italic text-primary">подготовки</span>
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {a.prep_plan.length} шагов
          </p>
        </div>
        <ol className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border">
          {a.prep_plan.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-5 bg-background-elevated p-6"
            >
              <span className="font-mono text-2xl font-medium text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <h3 className="font-display text-base text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Bottom CTA */}
      <section className="mt-14">
        <div className="flex flex-col items-stretch gap-4 rounded-3xl border border-border bg-accent-soft p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <p className="font-display text-xl italic text-foreground">
              Готов проверить себя?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Запустим mock-интервью с этим контекстом — компанию подставим
              автоматически.
            </p>
          </div>
          <Link
            href={interviewHref}
            className={buttonClassName("primary", "h-12 px-6 text-sm")}
          >
            Начать интервью
            <ArrowUpRight className="ml-1.5 h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </section>

      {/* Raw JD (collapsed) */}
      <details className="mt-10 rounded-2xl border border-border bg-background-elevated/40">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground [&::-webkit-details-marker]:hidden">
          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
          Оригинал вакансии
        </summary>
        <pre className="border-t border-border bg-background px-5 py-5 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {job.raw_text}
        </pre>
      </details>
    </div>
  );
}
