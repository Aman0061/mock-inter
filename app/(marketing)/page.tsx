import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { buttonClassName } from "@/components/ui/Button";
import { ChatPreview } from "@/components/landing/ChatPreview";
import { Faq } from "@/components/landing/Faq";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WaitlistForm } from "./_components/WaitlistForm";

const FEATURES = [
  {
    title: "AI-тренажёр",
    description:
      "Бесконечная практика mock-интервью с GPT-4o. Кейсы, поведенческие, продуктовое мышление — в любое время суток.",
  },
  {
    title: "Живые интервьюеры",
    description:
      "PM-ы из Яндекса, Kaspi, Ozon, Тинькофф и Google проведут с тобой настоящее собеседование и дадут разбор. Скоро.",
  },
  {
    title: "Анализ вакансий",
    description:
      "Загружай описание вакансии — получай список вопросов, к которым стоит подготовиться, и план подготовки. Скоро.",
  },
] as const;

const COMPANIES = ["Яндекс", "Kaspi", "Ozon", "Тинькофф", "Google", "Авито"];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <section className="relative isolate overflow-hidden px-6 pt-16 pb-16 sm:pt-24 sm:pb-20 lg:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.18),transparent_60%)]"
        />
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
            Закрытая бета · набираем первых пользователей
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Готовься к собеседованию на PM так,{" "}
            <span className="font-display italic text-primary">
              как будто это уже оффер
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            MockBuddy — маркетплейс mock-интервью для Product Manager-ов в СНГ.
            AI-тренажёр 24/7 и живые PM-ы из топ-компаний. Получай честный
            фидбек и отслеживай прогресс.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/interview/new"
              className={buttonClassName("primary", "h-12 px-6 text-base")}
            >
              Попробовать бесплатно →
            </Link>
            <Show when="signed-out">
              <Link
                href="/sign-up"
                className={buttonClassName("secondary", "h-12 px-6 text-base")}
              >
                Создать аккаунт
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className={buttonClassName("secondary", "h-12 px-6 text-base")}
              >
                В дашборд →
              </Link>
            </Show>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Быстрая регистрация. Прогресс сохраняется в твоём аккаунте.
          </p>
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-xs uppercase tracking-widest text-muted-foreground">
            Интервьюеры из компаний
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground">
            {COMPANIES.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      <HowItWorks />

      <ChatPreview />

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Что внутри
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Один продукт — три способа подготовиться
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur transition hover:border-white/20"
              >
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Faq />

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Запишись в waitlist
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Запустимся скоро. Оставь почту — пришлём приглашение в первой
            волне.
          </p>
          <div className="mx-auto mt-8 max-w-md" id="waitlist">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </div>
  );
}
