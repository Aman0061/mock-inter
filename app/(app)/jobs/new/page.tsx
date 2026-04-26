import { JobForm } from "@/components/jobs/JobForm";

export const metadata = {
  title: "Анализ вакансии — MockBuddy",
};

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
      <header className="border-b border-border pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Шаг 1 из 1
        </p>
        <h1 className="mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          Разберём{" "}
          <span className="font-display italic text-primary">вакансию</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Вставь текст вакансии PM — AI извлечёт компетенции, придумает
          реалистичные вопросы и составит план подготовки.
        </p>
      </header>

      <div className="mt-10">
        <JobForm />
      </div>
    </div>
  );
}
