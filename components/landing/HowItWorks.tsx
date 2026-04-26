const STEPS = [
  {
    number: "01",
    title: "Выбери тип интервью",
    description:
      "Продуктовое мышление, поведенческое, аналитика или стратегия. Опционально укажи компанию — AI подстроится под её стиль.",
  },
  {
    number: "02",
    title: "Пройди интервью с AI-PM",
    description:
      "5–7 содержательных вопросов с follow-up'ами. Отвечай голосом мысли — AI углубляется, как реальный интервьюер.",
  },
  {
    number: "03",
    title: "Получи структурированный фидбек",
    description:
      "Сильные стороны, зоны роста, оценки по 5 критериям и список того, что почитать. Без воды и без лести.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Как это работает
          </p>
          <h2 className="mt-4 text-3xl tracking-tight sm:text-4xl">
            От первой реплики до{" "}
            <span className="font-display italic text-primary">фидбека</span>{" "}
            — за 15 минут
          </h2>
        </div>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="flex flex-col bg-background-elevated p-7"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                {step.number}
              </span>
              <h3 className="mt-4 font-display text-xl text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
