import { InterviewSetupForm } from "@/components/interview/InterviewSetupForm";

export const metadata = {
  title: "Новое интервью — MockBuddy",
};

export default async function NewInterviewPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const params = await searchParams;
  const initialCompany =
    typeof params.company === "string" ? params.company.slice(0, 80) : "";
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
      <header className="border-b border-border pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Шаг 1 из 1
        </p>
        <h1 className="mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          Что сегодня{" "}
          <span className="font-display italic text-primary">тренируем?</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Выбери тип интервью — AI-PM подстроится. Опционально укажи компанию,
          и он будет вести интервью в их стиле.
        </p>
      </header>

      <div className="mt-10">
        <InterviewSetupForm initialCompany={initialCompany} />
      </div>
    </div>
  );
}
