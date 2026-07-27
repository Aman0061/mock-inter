const FAQS = [
  {
    q: "Сколько это стоит?",
    a: "Сейчас бесплатно — мы в закрытой бете и собираем фидбек. Платные планы появятся, когда мы откроем доступ к живым интервьюерам.",
  },
  {
    q: "Какой уровень PM мне подойдёт?",
    a: "От Junior, который только переключается в продакт, до Senior, готовящегося к собесу в FAANG. AI определяет уровень по ответам и подстраивает глубину follow-up'ов.",
  },
  {
    q: "Чем вы лучше, чем подготовка с друзьями или ChatGPT в браузере?",
    a: "Мы не general-purpose AI, а специально настроенный PM-интервьюер: с правильным фреймингом вопросов, follow-up'ами по делу и структурированным фидбеком по тем критериям, по которым реально оценивают на собесах.",
  },
  {
    q: "Безопасно ли использовать GPT для интервью?",
    a: "Транскрипты не используются OpenAI для дообучения моделей (мы используем API без opt-in). История хранится в твоём аккаунте и доступна только тебе.",
  },
  {
    q: "Когда можно будет потренироваться с живым PM из Яндекса/Ozon/Google?",
    a: "Маркетплейс живых интервьюеров планируем на Q3 2026. Запишись в waitlist, чтобы попасть в первую волну с приоритетом и спецценой.",
  },
  {
    q: "Можно ли удалить аккаунт и данные?",
    a: "Отдельные интервью можно удалить в любой момент (вкладка «Все интервью» → значок корзины). Полное удаление аккаунта появится в настройках — сейчас можно написать нам напрямую.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            FAQ
          </p>
          <h2 className="mt-4 text-3xl tracking-tight sm:text-4xl">
            Часто задаваемые{" "}
            <span className="font-display italic text-primary">вопросы</span>
          </h2>
        </div>
        <div className="mt-12 overflow-hidden rounded-2xl border border-border">
          {FAQS.map((item, i) => (
            <details
              key={item.q}
              className={`group bg-background-elevated px-5 py-5 transition open:bg-background-elevated/80 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="ml-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs text-muted transition group-open:rotate-45 group-open:border-primary/40 group-open:text-primary"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
