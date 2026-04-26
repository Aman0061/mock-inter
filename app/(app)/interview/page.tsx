import Link from "next/link";
import { InterviewList } from "@/components/interview/InterviewList";
import { buttonClassName } from "@/components/ui/Button";

export const metadata = {
  title: "Интервью — MockBuddy",
};

export default function InterviewIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-10">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Архив
          </p>
          <h1 className="mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Все <span className="font-display italic text-primary">интервью</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            История тренировок. Кликни на любое — продолжишь с того же места
            или пересмотришь фидбек.
          </p>
        </div>
        <Link
          href="/interview/new"
          className={buttonClassName("primary", "h-11 px-5 text-sm")}
        >
          Новое интервью →
        </Link>
      </header>

      <div className="mt-10">
        <InterviewList />
      </div>
    </div>
  );
}
