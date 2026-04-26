import { CheckCircle2, CircleAlert, Triangle } from "lucide-react";
import type { GapReport as GapReportType } from "@/lib/ai/resume";

export function GapReport({ report }: { report: GapReportType }) {
  return (
    <section className="mt-14">
      <div className="border-b border-border pb-3">
        <h2 className="font-display text-2xl tracking-tight">
          Что у тебя <span className="italic text-primary">не закрыто</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Честный разбор: что в вакансии есть и что AI смог сматчить, что
          натянули с натяжкой, а чего у тебя в опыте нет совсем.
        </p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <Block
          icon={CheckCircle2}
          tone="text-success"
          label="Закрываешь уверенно"
          count={report.strong_matches.length}
        >
          {report.strong_matches.length === 0 ? (
            <EmptyMessage>Сильных совпадений мало.</EmptyMessage>
          ) : (
            <ul className="flex flex-col gap-3">
              {report.strong_matches.map((m, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium text-foreground">
                    {m.requirement}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.evidence}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block
          icon={CircleAlert}
          tone="text-primary"
          label="Можешь подать с натяжкой"
          count={report.stretch_matches.length}
        >
          {report.stretch_matches.length === 0 ? (
            <EmptyMessage>Натяжек нет.</EmptyMessage>
          ) : (
            <ul className="flex flex-col gap-3">
              {report.stretch_matches.map((m, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium text-foreground">
                    {m.requirement}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ближе всего: {m.closest_experience}
                  </p>
                  <p className="mt-1.5 text-xs text-foreground">
                    <span className="font-mono uppercase tracking-widest text-muted">
                      Как подать:
                    </span>{" "}
                    {m.how_to_position}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block
          icon={Triangle}
          tone="text-danger"
          label="Нет в опыте"
          count={report.gaps.length}
        >
          {report.gaps.length === 0 ? (
            <EmptyMessage>Дыр нет — ты идеально совпадаешь.</EmptyMessage>
          ) : (
            <ul className="flex flex-col gap-3">
              {report.gaps.map((g, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium text-foreground">{g.requirement}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {g.why_it_matters}
                  </p>
                  <p className="mt-1.5 text-xs text-foreground">
                    <span className="font-mono uppercase tracking-widest text-muted">
                      Совет:
                    </span>{" "}
                    {g.suggestion}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Block>
      </div>
    </section>
  );
}

function Block({
  icon: Icon,
  tone,
  label,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-background-elevated p-5">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${tone}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em]">
            {label}
          </p>
        </div>
        <span className="font-mono text-xs text-muted">{count}</span>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
