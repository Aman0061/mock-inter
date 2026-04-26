import type { TalkingPoint } from "@/lib/ai/resume";

const STAR_LABELS: Record<keyof NonNullable<TalkingPoint["star"]>, string> = {
  situation: "Situation",
  task: "Task",
  action: "Action",
  result: "Result",
};

export function TalkingPointsView({ points }: { points: TalkingPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background-elevated/40 p-10 text-center">
        <p className="font-display text-lg italic text-foreground">
          Нет talking points.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          В профиле было слишком мало данных, чтобы AI смог их собрать.
        </p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {points.map((point, i) => (
        <li
          key={`${point.topic}-${i}`}
          className="rounded-2xl border border-border bg-background-elevated p-6"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            {String(i + 1).padStart(2, "0")} · Тема
          </p>
          <h3 className="mt-3 font-display text-xl italic text-foreground">
            «{point.topic}»
          </h3>

          <div className="mt-5 rounded-xl border border-border bg-background px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Твой угол захода
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {point.your_angle}
            </p>
          </div>

          {point.star && (
            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                STAR-набросок
              </p>
              <dl className="mt-3 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
                {(
                  Object.keys(STAR_LABELS) as Array<keyof typeof STAR_LABELS>
                ).map((key) => (
                  <div key={key} className="bg-background-elevated p-4">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-primary">
                      {STAR_LABELS[key]}
                    </dt>
                    <dd className="mt-2 text-xs leading-relaxed text-foreground">
                      {point.star![key]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
