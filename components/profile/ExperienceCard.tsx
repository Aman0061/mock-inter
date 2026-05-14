"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { Experience, ExperienceBullet } from "@/types/profile";

export function ExperienceCard({
  experience,
  onChange,
  onRemove,
  makeBulletId,
}: {
  experience: Experience;
  onChange: (partial: Partial<Experience>) => void;
  onRemove: () => void;
  makeBulletId: () => string;
}) {
  function updateBullet(id: string, partial: Partial<ExperienceBullet>) {
    onChange({
      bullets: experience.bullets.map((b) =>
        b.id === id ? { ...b, ...partial } : b
      ),
    });
  }

  function addBullet() {
    onChange({
      bullets: [
        ...experience.bullets,
        { id: makeBulletId(), raw_input: "", text: "", metric: "" },
      ],
    });
  }

  function removeBullet(id: string) {
    onChange({
      bullets: experience.bullets.filter((b) => b.id !== id),
    });
  }

  return (
    <article className="rounded-2xl border border-border bg-background-elevated p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Компания
          </label>
          <Input
            value={experience.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="Яндекс"
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Должность
          </label>
          <Input
            value={experience.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Senior Product Manager"
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Начало
          </label>
          <Input
            type="month"
            value={experience.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Конец{" "}
            <span className="text-muted">
              — пусто = по настоящее время
            </span>
          </label>
          <Input
            type="month"
            value={experience.end_date ?? ""}
            onChange={(e) =>
              onChange({ end_date: e.target.value || null })
            }
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-medium text-muted-foreground">
          Что делал — bullet&apos;ы{" "}
          <span className="text-muted">
            (с метриками, если есть — AI не будет их выдумывать)
          </span>
        </p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {experience.bullets.map((bullet, i) => (
            <li key={bullet.id} className="flex gap-2">
              <span className="mt-3 font-mono text-[10px] text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <textarea
                value={bullet.raw_input || bullet.text}
                onChange={(e) =>
                  updateBullet(bullet.id, {
                    raw_input: e.target.value,
                    text: e.target.value,
                  })
                }
                rows={2}
                placeholder="Запустил фичу X для Y, что подняло метрику Z на N%"
                className="flex-1 resize-y rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => removeBullet(bullet.id)}
                className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-background hover:text-danger"
                aria-label="Удалить bullet"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addBullet}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-border-strong hover:text-foreground"
        >
          <Plus className="h-3 w-3" strokeWidth={1.75} />
          Добавить bullet
        </button>
      </div>

      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-3 w-3" strokeWidth={1.75} />
          Удалить опыт
        </button>
      </div>
    </article>
  );
}
