type Bubble = {
  role: "assistant" | "user";
  text: string;
};

const PREVIEW: Bubble[] = [
  {
    role: "assistant",
    text: "Здравствуйте! Представь, что ты PM в Яндекс.Картах. Какую новую фичу ты бы предложил, чтобы улучшить опыт пользователей?",
  },
  {
    role: "user",
    text: "Совместное построение маршрута для друзей: каждый видит ETA остальных. Метрика — DAU участников групповых маршрутов.",
  },
  {
    role: "assistant",
    text: "Окей. А какой сегмент пользователей ты бы выбрал в первую очередь и почему?",
  },
];

export function ChatPreview() {
  return (
    <section className="px-5 pb-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-border bg-background-elevated">
          <div className="flex items-center gap-3 border-b border-border px-5 py-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
            </div>
            <p className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              Продуктовое мышление · Яндекс
            </p>
          </div>
          <div className="flex flex-col gap-3 px-5 py-7">
            {PREVIEW.map((bubble, i) => (
              <div
                key={i}
                className={`flex ${
                  bubble.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    bubble.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background text-foreground"
                  }`}
                >
                  {bubble.text}
                </div>
              </div>
            ))}
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                <span className="flex gap-1">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
                  <span
                    className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
                AI печатает
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
