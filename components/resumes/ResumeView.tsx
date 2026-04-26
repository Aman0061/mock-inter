"use client";

import { useState } from "react";
import { Eye, EyeOff, Info } from "lucide-react";
import type { Resume, ResumeBullet } from "@/lib/ai/resume";

const PROVENANCE_META: Record<
  ResumeBullet["provenance"],
  { label: string; tone: string; description: string }
> = {
  verbatim: {
    label: "точно",
    tone: "border-success/30 bg-success/10 text-success",
    description: "Тот же факт и слова из профиля, лёгкая редактура.",
  },
  reframed: {
    label: "переакцент",
    tone: "border-primary/30 bg-accent-soft text-primary",
    description: "Тот же факт, переформулировано под лексику этой вакансии.",
  },
  stretch: {
    label: "с натяжкой",
    tone: "border-danger/30 bg-danger/10 text-danger",
    description:
      "AI взял на себя смелость — проверь, не приписывает ли тебе чего лишнего.",
  },
};

export function ResumeView({ resume }: { resume: Resume }) {
  const [honestMode, setHonestMode] = useState(false);

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="font-display text-2xl tracking-tight">
          Резюме
        </h2>
        <button
          type="button"
          onClick={() => setHonestMode((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            honestMode
              ? "border-primary/40 bg-accent-soft text-foreground"
              : "border-border bg-background-elevated text-muted-foreground hover:text-foreground"
          }`}
        >
          {honestMode ? (
            <>
              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              Честный режим
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
              Включить честный режим
            </>
          )}
        </button>
      </div>

      {honestMode && <ProvenanceLegend />}

      <article className="mt-6 rounded-3xl border border-border bg-background-elevated px-6 py-8 sm:px-10 sm:py-10">
        {/* Headline */}
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Позиционирование
          </p>
          <h3 className="mt-3 text-3xl leading-tight tracking-tight">
            {resume.headline}
          </h3>
          {resume.summary && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {resume.summary}
            </p>
          )}
        </header>

        {/* Experience */}
        {resume.experience.length > 0 && (
          <section className="mt-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Опыт
            </p>
            <div className="mt-5 flex flex-col gap-8">
              {resume.experience.map((exp, i) => (
                <div key={`${exp.source_experience_id}-${i}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
                    <h4 className="font-display text-lg italic text-foreground">
                      {exp.title}, {exp.company}
                    </h4>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                      {exp.dates}
                    </span>
                  </div>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {exp.bullets.map((bullet, j) => (
                      <BulletRow
                        key={`${bullet.source_bullet_id}-${j}`}
                        bullet={bullet}
                        honestMode={honestMode}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <section className="mt-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Навыки
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {resume.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Empty resume warning */}
        {resume.experience.length === 0 && (
          <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-foreground">
            <p className="font-medium text-danger">
              В профиле слишком мало данных
            </p>
            <p className="mt-2 text-muted-foreground">
              Добавь больше опыта в{" "}
              <a
                href="/profile"
                className="text-primary underline underline-offset-2"
              >
                профиле
              </a>{" "}
              и сгенерируй резюме заново. Минимум — компания + 2 bullet&apos;а
              с конкретикой.
            </p>
          </div>
        )}
      </article>
    </section>
  );
}

function BulletRow({
  bullet,
  honestMode,
}: {
  bullet: ResumeBullet;
  honestMode: boolean;
}) {
  const meta = PROVENANCE_META[bullet.provenance];
  return (
    <li className="flex gap-3">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm leading-relaxed text-foreground">{bullet.text}</p>
        {honestMode && (
          <span
            className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${meta.tone}`}
            title={meta.description}
          >
            {meta.label}
          </span>
        )}
      </div>
    </li>
  );
}

function ProvenanceLegend() {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-background-elevated px-4 py-3 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} />
      <div className="flex-1">
        <p>
          В честном режиме на каждом bullet видно, что сделал AI:
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
          {(Object.entries(PROVENANCE_META) as Array<
            [keyof typeof PROVENANCE_META, (typeof PROVENANCE_META)[keyof typeof PROVENANCE_META]]
          >).map(([key, meta]) => (
            <li key={key} className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${meta.tone}`}
              >
                {meta.label}
              </span>
              <span>{meta.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
