"use client";

import { forwardRef } from "react";
import type { Profile } from "@/types/profile";

function normalizeUrl(value: string): string {
  if (!value.trim()) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

function formatMonth(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

function formatRange(start: string, end: string | null): string {
  const startLabel = formatMonth(start);
  const endLabel = end ? formatMonth(end) : "по н.в.";
  if (!startLabel && !endLabel) return "";
  if (!startLabel) return endLabel;
  return `${startLabel} — ${endLabel}`;
}

export const ResumeLivePreview = forwardRef<
  HTMLDivElement,
  { profile: Profile }
>(function ResumeLivePreview({ profile }, ref) {
  const contacts = [
    profile.location.trim(),
    profile.phone.trim(),
    profile.email.trim(),
    profile.github.trim(),
    profile.linkedin.trim(),
  ].filter(Boolean);

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[920px] rounded-3xl border border-border bg-background-elevated px-8 py-9 text-foreground shadow-2xl shadow-black/25 print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-[14mm] print:text-black print:shadow-none sm:px-11 sm:py-11"
    >
      <header>
        <h2 className="text-[34px] font-bold tracking-tight print:text-[30px]">
          {profile.full_name.trim() || "Ваше имя"}
        </h2>
        <p className="mt-2 text-[26px] font-semibold leading-tight text-primary print:text-[20px] print:text-black">
          {profile.headline.trim() || "Product Manager"}
        </p>
        {contacts.length > 0 && (
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground print:text-[13px] print:text-black">
            {contacts.join(" | ")}
          </p>
        )}
      </header>

      {profile.summary.trim() && (
        <section className="mt-11">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-primary print:text-[11px] print:text-black">
            PROFESSIONAL SUMMARY
          </p>
          <p className="mt-4 text-[17px] leading-relaxed print:text-[13px]">
            {profile.summary}
          </p>
        </section>
      )}

      {profile.skills.length > 0 && (
        <section className="mt-11">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-primary print:text-[11px] print:text-black">
            SKILLS
          </p>
          <ul className="mt-4 space-y-3 text-[16px] leading-relaxed print:text-[13px]">
            {profile.skills.map((skill) => (
              <li key={skill} className="flex gap-3">
                <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-foreground print:bg-black" />
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.experience.length > 0 && (
        <section className="mt-11">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-primary print:text-[11px] print:text-black">
            WORK EXPERIENCE
          </p>

          <div className="mt-5 space-y-7">
            {profile.experience.map((item) => (
              <article key={item.id}>
                <p className="text-[18px] leading-snug print:text-[14px]">
                  <span className="font-bold">{item.company || "Компания"}</span>
                  {item.location && <span> | {item.location}</span>}{" "}
                  <span className="font-semibold">{item.title || "Роль"}</span>
                  {formatRange(item.start_date, item.end_date) && (
                    <span> | {formatRange(item.start_date, item.end_date)}</span>
                  )}
                </p>

                {item.context.trim() && (
                  <p className="mt-1.5 text-[17px] italic text-muted-foreground print:text-[13px] print:text-black">
                    {item.context}
                  </p>
                )}

                {item.bullets.length > 0 && (
                  <ul className="mt-3 space-y-2.5 text-[16px] leading-relaxed print:text-[13px]">
                    {item.bullets
                      .filter((bullet) => bullet.text.trim())
                      .map((bullet) => (
                        <li key={bullet.id} className="flex gap-3">
                          <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-foreground print:bg-black" />
                          <span>{bullet.text}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {profile.education.length > 0 && (
        <section className="mt-11">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-primary print:text-[11px] print:text-black">
            EDUCATION
          </p>
          <ul className="mt-4 space-y-3 text-[16px] leading-relaxed print:text-[13px]">
            {profile.education.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-foreground print:bg-black" />
                <div>
                  <p>
                    <span className="font-bold">
                      {item.institution || "Учебное заведение"}
                    </span>
                    {(item.degree || item.field) && (
                      <span>
                        {" "}
                        | {[item.degree, item.field].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {formatRange(item.start_date, item.end_date) && (
                      <span> | {formatRange(item.start_date, item.end_date)}</span>
                    )}
                  </p>
                  {item.details.trim() && (
                    <p className="text-muted-foreground print:text-black">{item.details}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!profile.summary.trim() &&
        profile.skills.length === 0 &&
        profile.experience.length === 0 &&
        profile.education.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground print:border-black print:text-black">
            Preview появится по мере заполнения формы.
          </div>
        )}

      {(profile.github.trim() || profile.linkedin.trim()) && (
        <footer className="mt-9 border-t border-border pt-4 text-xs text-muted-foreground print:border-black print:text-black">
          {profile.github.trim() && (
            <a href={normalizeUrl(profile.github)} className="underline">
              {profile.github}
            </a>
          )}
          {profile.github.trim() && profile.linkedin.trim() && " | "}
          {profile.linkedin.trim() && (
            <a href={normalizeUrl(profile.linkedin)} className="underline">
              {profile.linkedin}
            </a>
          )}
        </footer>
      )}
    </div>
  );
});
