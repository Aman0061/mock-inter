"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function SkillsInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (!value) return;
    if (skills.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...skills, value]);
    setDraft("");
  }

  function remove(value: string) {
    onChange(skills.filter((s) => s !== value));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background-elevated px-3 py-2.5">
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs text-foreground"
          >
            {skill}
            <button
              type="button"
              onClick={() => remove(skill)}
              className="grid h-3.5 w-3.5 place-items-center rounded-full text-primary transition hover:bg-primary/20"
              aria-label={`Удалить ${skill}`}
            >
              <X className="h-2.5 w-2.5" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (
              e.key === "Backspace" &&
              draft === "" &&
              skills.length > 0
            ) {
              remove(skills[skills.length - 1]);
            }
          }}
          onBlur={commit}
          placeholder={
            skills.length === 0 ? "SQL, A/B-тесты, Mixpanel…" : "Ещё навык…"
          }
          className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Жми Enter или запятую, чтобы добавить. AI выберет из этого списка
        релевантные под каждую вакансию — но новых навыков сам не добавит.
      </p>
    </div>
  );
}
