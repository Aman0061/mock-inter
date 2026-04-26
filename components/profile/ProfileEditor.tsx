"use client";

import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ExperienceCard } from "./ExperienceCard";
import { SkillsInput } from "./SkillsInput";
import { EMPTY_PROFILE, type Experience, type Profile } from "@/types/profile";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function makeEmptyExperience(): Experience {
  return {
    id: uuid(),
    company: "",
    title: "",
    start_date: "",
    end_date: null,
    location: "",
    bullets: [{ id: uuid(), text: "" }],
  };
}

export function ProfileEditor() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setProfile({
          ...EMPTY_PROFILE,
          ...(data.profile as Partial<Profile>),
        });
        setHydrated(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Не удалось загрузить профиль");
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function addExperience() {
    update("experience", [makeEmptyExperience(), ...profile.experience]);
  }

  function updateExperience(id: string, partial: Partial<Experience>) {
    update(
      "experience",
      profile.experience.map((exp) =>
        exp.id === id ? { ...exp, ...partial } : exp
      )
    );
  }

  function removeExperience(id: string) {
    update(
      "experience",
      profile.experience.filter((exp) => exp.id !== id)
    );
  }

  async function handleSave() {
    if (saveStatus === "saving") return;
    setSaveStatus("saving");
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `status ${response.status}`);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      setSaveStatus("error");
      setError(
        err instanceof Error ? err.message : "Не удалось сохранить профиль"
      );
    }
  }

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background-elevated/40 p-10 text-center font-mono text-xs uppercase tracking-widest text-muted">
        Загружаем…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {/* Header section */}
      <section>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Кто ты
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="full_name"
              className="text-xs font-medium text-muted-foreground"
            >
              Имя и фамилия
            </label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              placeholder="Аман Мукашев"
              className="mt-2"
              autoComplete="name"
            />
          </div>
          <div>
            <label
              htmlFor="headline"
              className="text-xs font-medium text-muted-foreground"
            >
              Должность / позиционирование
            </label>
            <Input
              id="headline"
              value={profile.headline}
              onChange={(e) => update("headline", e.target.value)}
              placeholder="Product Manager · 4 года в B2C"
              className="mt-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="location"
              className="text-xs font-medium text-muted-foreground"
            >
              Город
            </label>
            <Input
              id="location"
              value={profile.location ?? ""}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Алматы · готов к релокации"
              className="mt-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="summary"
              className="text-xs font-medium text-muted-foreground"
            >
              О себе{" "}
              <span className="text-muted">— 2-3 предложения, своими словами</span>
            </label>
            <textarea
              id="summary"
              value={profile.summary ?? ""}
              onChange={(e) => update("summary", e.target.value)}
              rows={3}
              placeholder="PM с фокусом на growth для мобильных приложений. Веду продукт от ресерча до запуска и аналитики после."
              className="mt-2 w-full resize-y rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </section>

      {/* Experience section */}
      <section>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Опыт работы
          </p>
          <button
            type="button"
            onClick={addExperience}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background-elevated px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-border-strong"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Добавить
          </button>
        </div>
        {profile.experience.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-background-elevated/40 p-8 text-center">
            <p className="font-display text-base italic text-foreground">
              Тут будет твой опыт.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Добавь хотя бы одну компанию с парой bullet&apos;ов — без этого AI не
              сможет собрать резюме.
            </p>
            <Button onClick={addExperience} className="mt-5 h-10 px-4 text-sm">
              <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
              Первый опыт
            </Button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {profile.experience.map((exp) => (
              <ExperienceCard
                key={exp.id}
                experience={exp}
                onChange={(partial) => updateExperience(exp.id, partial)}
                onRemove={() => removeExperience(exp.id)}
                makeBulletId={uuid}
              />
            ))}
          </div>
        )}
      </section>

      {/* Skills */}
      <section>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Навыки
        </p>
        <div className="mt-5">
          <SkillsInput
            skills={profile.skills}
            onChange={(skills) => update("skills", skills)}
          />
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-2xl border border-border bg-background-elevated/95 px-5 py-3 backdrop-blur">
        <div className="text-xs text-muted-foreground">
          {saveStatus === "saved" && (
            <span className="text-success">✓ Сохранено</span>
          )}
          {saveStatus === "error" && (
            <span className="text-danger">{error ?? "Ошибка"}</span>
          )}
          {saveStatus === "idle" &&
            "Изменения не отправлены — нажми «Сохранить»"}
          {saveStatus === "saving" && "Сохраняем…"}
        </div>
        <Button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="h-10 px-5 text-sm"
        >
          <Save className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
          Сохранить
        </Button>
      </div>
    </div>
  );
}
