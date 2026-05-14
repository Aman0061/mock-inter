"use client";

import { useMemo, useState, type ReactNode } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Download, Loader2, PenSquare, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GapReport } from "@/components/resumes/GapReport";
import { ResumeView } from "@/components/resumes/ResumeView";
import type {
  GapReport as GapReportType,
  Resume,
  ResumeBullet,
  ResumeExperience,
} from "@/lib/ai/resume";

type Props = {
  resumeId: string;
  initialResume: Resume;
  gapReport: GapReportType;
};

type EditableResume = Resume & {
  knowledge: string[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

function normalizeResume(resume: Resume): EditableResume {
  const runtimeResume = resume as Resume & { knowledge?: string[] };
  return {
    ...resume,
    knowledge: runtimeResume.knowledge ?? [],
  };
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(values: string[]): string {
  return values.join("\n");
}

function slugifyFilename(value: string): string {
  const base = value.trim().toLowerCase();
  if (!base) return "resume";
  return base
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  Object.assign(element.style, styles);
}

function createTextElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  text: string,
  styles: Partial<CSSStyleDeclaration> = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.textContent = text;
  applyStyles(element, styles);
  return element;
}

function createExportResumeNode(resume: EditableResume): HTMLDivElement {
  const root = document.createElement("div");
  const primary = "#FF6B35";
  const muted = "#9A968D";

  applyStyles(root, {
    width: "920px",
    boxSizing: "border-box",
    backgroundColor: "#13141A",
    color: "#F2EFE8",
    border: "1px solid rgba(242, 239, 232, 0.08)",
    borderRadius: "24px",
    padding: "48px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.55",
  });

  root.appendChild(
    createTextElement("h1", resume.headline || "Резюме", {
      margin: "0",
      color: "#F2EFE8",
      fontSize: "34px",
      fontWeight: "700",
      lineHeight: "1.15",
    })
  );
  if (resume.target_role) {
    root.appendChild(
      createTextElement("p", resume.target_role, {
        margin: "8px 0 0",
        color: primary,
        fontSize: "24px",
        fontWeight: "700",
        lineHeight: "1.25",
      })
    );
  }

  function appendSectionTitle(title: string) {
    root.appendChild(
      createTextElement("h2", title, {
        margin: "42px 0 0",
        color: primary,
        fontSize: "12px",
        fontWeight: "700",
        letterSpacing: "3px",
        lineHeight: "1.4",
      })
    );
  }

  function appendBulletList(values: string[]) {
    const list = document.createElement("ul");
    applyStyles(list, {
      margin: "16px 0 0",
      padding: "0 0 0 18px",
      color: "#F2EFE8",
      fontSize: "16px",
    });
    values.forEach((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      applyStyles(item, { margin: "0 0 10px", paddingLeft: "8px" });
      list.appendChild(item);
    });
    root.appendChild(list);
  }

  if (resume.summary.trim()) {
    appendSectionTitle("PROFESSIONAL SUMMARY");
    root.appendChild(
      createTextElement("p", resume.summary, {
        margin: "18px 0 0",
        color: "#F2EFE8",
        fontSize: "17px",
      })
    );
  }

  if (resume.skills.length > 0) {
    appendSectionTitle("SKILLS");
    appendBulletList(resume.skills);
  }

  if (resume.knowledge.length > 0) {
    appendSectionTitle("ROLE KNOWLEDGE");
    appendBulletList(resume.knowledge);
  }

  if (resume.experience.length > 0) {
    appendSectionTitle("WORK EXPERIENCE");
    resume.experience.forEach((item) => {
      const article = document.createElement("article");
      applyStyles(article, { margin: "22px 0 0" });
      article.appendChild(
        createTextElement(
          "p",
          `${item.company} ${item.title ? `| ${item.title}` : ""}${
            item.dates ? ` | ${item.dates}` : ""
          }`,
          {
            margin: "0",
            color: "#F2EFE8",
            fontSize: "18px",
            fontWeight: "700",
            lineHeight: "1.35",
          }
        )
      );
      const bullets = item.bullets.map((bullet) => bullet.text.trim()).filter(Boolean);
      if (bullets.length > 0) appendBulletListFor(article, bullets);
      root.appendChild(article);
    });
  }

  if (resume.alignment?.honesty_note) {
    root.appendChild(
      createTextElement("p", resume.alignment.honesty_note, {
        margin: "38px 0 0",
        color: muted,
        fontSize: "13px",
        fontStyle: "italic",
      })
    );
  }

  return root;
}

function appendBulletListFor(parent: HTMLElement, values: string[]) {
  const list = document.createElement("ul");
  applyStyles(list, {
    margin: "14px 0 0",
    padding: "0 0 0 18px",
    color: "#F2EFE8",
    fontSize: "16px",
  });
  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    applyStyles(item, { margin: "0 0 10px", paddingLeft: "8px" });
    list.appendChild(item);
  });
  parent.appendChild(list);
}

export function ResumeWorkspace({ resumeId, initialResume, gapReport }: Props) {
  const [resume, setResume] = useState<EditableResume>(() =>
    normalizeResume(initialResume)
  );
  const [draft, setDraft] = useState<EditableResume>(() =>
    normalizeResume(initialResume)
  );
  const [editing, setEditing] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const skillsText = useMemo(() => joinLines(draft.skills), [draft.skills]);
  const knowledgeText = useMemo(
    () => joinLines(draft.knowledge),
    [draft.knowledge]
  );

  function updateDraft(patch: Partial<EditableResume>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updateExperience(index: number, patch: Partial<ResumeExperience>) {
    setDraft((current) => ({
      ...current,
      experience: current.experience.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function updateBullet(expIndex: number, bulletIndex: number, text: string) {
    setDraft((current) => ({
      ...current,
      experience: current.experience.map((item, itemIndex) => {
        if (itemIndex !== expIndex) return item;
        return {
          ...item,
          bullets: item.bullets.map((bullet, currentBulletIndex) =>
            currentBulletIndex === bulletIndex ? { ...bullet, text } : bullet
          ),
        };
      }),
    }));
  }

  function addBullet(expIndex: number) {
    setDraft((current) => ({
      ...current,
      experience: current.experience.map((item, itemIndex) => {
        if (itemIndex !== expIndex) return item;
        const sourceId = item.bullets[0]?.source_bullet_id ?? item.source_experience_id;
        const newBullet: ResumeBullet = {
          text: "",
          provenance: "stretch",
          source_bullet_id: sourceId,
        };
        return { ...item, bullets: [...item.bullets, newBullet] };
      }),
    }));
  }

  function removeBullet(expIndex: number, bulletIndex: number) {
    setDraft((current) => ({
      ...current,
      experience: current.experience.map((item, itemIndex) =>
        itemIndex === expIndex
          ? {
              ...item,
              bullets: item.bullets.filter((_, index) => index !== bulletIndex),
            }
          : item
      ),
    }));
  }

  async function saveResume() {
    setSaveState("saving");
    setMessage("");
    const normalizedDraft: EditableResume = {
      ...draft,
      skills: draft.skills.map((item) => item.trim()).filter(Boolean),
      knowledge: draft.knowledge.map((item) => item.trim()).filter(Boolean),
      experience: draft.experience.map((item) => ({
        ...item,
        bullets: item.bullets
          .map((bullet) => ({ ...bullet, text: bullet.text.trim() }))
          .filter((bullet) => bullet.text),
      })),
    };

    const response = await fetch(`/api/resumes/${resumeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume: normalizedDraft }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setSaveState("error");
      setMessage(payload?.error ?? `Не удалось сохранить: status ${response.status}`);
      return;
    }

    setResume(normalizedDraft);
    setDraft(normalizedDraft);
    setEditing(false);
    setSaveState("saved");
    setMessage("Резюме сохранено");
  }

  async function downloadPdf() {
    setIsExporting(true);
    let exportNode: HTMLDivElement | null = null;
    try {
      exportNode = createExportResumeNode(resume);
      applyStyles(exportNode, {
        position: "fixed",
        left: "-10000px",
        top: "0",
        zIndex: "-1",
      });
      document.body.appendChild(exportNode);

      const canvas = await html2canvas(exportNode, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#13141A",
        logging: false,
        onclone: (clonedDocument) => {
          clonedDocument
            .querySelectorAll("style, link[rel='stylesheet']")
            .forEach((node) => node.remove());
        },
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;
      const pxPerMm = canvas.width / contentWidth;
      const pageHeightPx = Math.floor(contentHeight * pxPerMm);
      let offsetY = 0;
      let page = 0;

      while (offsetY < canvas.height) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - offsetY);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const context = pageCanvas.getContext("2d");
        if (!context) throw new Error("Не удалось подготовить PDF");
        context.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );
        if (page > 0) pdf.addPage();
        pdf.addImage(
          pageCanvas.toDataURL("image/png", 1),
          "PNG",
          margin,
          margin,
          contentWidth,
          sliceHeightPx / pxPerMm,
          undefined,
          "FAST"
        );
        offsetY += sliceHeightPx;
        page += 1;
      }

      pdf.save(`${slugifyFilename(resume.headline || resume.target_role)}-mockbuddy.pdf`);
    } catch (error) {
      setSaveState("error");
      setMessage(error instanceof Error ? error.message : "Не удалось скачать PDF");
    } finally {
      exportNode?.remove();
      setIsExporting(false);
    }
  }

  if (editing) {
    return (
      <section className="mt-12 rounded-3xl border border-border bg-background-elevated p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              Редактирование
            </p>
            <h2 className="mt-2 font-display text-2xl">Созданное резюме</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft(resume);
                setEditing(false);
              }}
            >
              <X className="mr-1.5 h-4 w-4" />
              Отмена
            </Button>
            <Button
              type="button"
              onClick={() => void saveResume()}
              disabled={saveState === "saving"}
            >
              {saveState === "saving" ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Сохранить
            </Button>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            {message}
          </div>
        )}

        <div className="mt-6 grid gap-5">
          <Field label="Headline">
            <input
              value={draft.headline}
              onChange={(event) => updateDraft({ headline: event.target.value })}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50"
            />
          </Field>
          <Field label="Целевая роль">
            <input
              value={draft.target_role}
              onChange={(event) => updateDraft({ target_role: event.target.value })}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/50"
            />
          </Field>
          <Field label="Summary">
            <textarea
              value={draft.summary}
              onChange={(event) => updateDraft({ summary: event.target.value })}
              rows={5}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary/50"
            />
          </Field>
          <Field label="Skills, каждый с новой строки">
            <textarea
              value={skillsText}
              onChange={(event) => updateDraft({ skills: splitLines(event.target.value) })}
              rows={5}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary/50"
            />
          </Field>
          <Field label="Знания под вакансию, каждый пункт с новой строки">
            <textarea
              value={knowledgeText}
              onChange={(event) =>
                updateDraft({ knowledge: splitLines(event.target.value) })
              }
              rows={5}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary/50"
            />
          </Field>

          {draft.experience.map((item, expIndex) => (
            <div
              key={`${item.source_experience_id}-${expIndex}`}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={item.company}
                  onChange={(event) =>
                    updateExperience(expIndex, { company: event.target.value })
                  }
                  className="rounded-xl border border-border bg-background-elevated px-3 py-2 text-sm outline-none focus:border-primary/50"
                  placeholder="Компания"
                />
                <input
                  value={item.title}
                  onChange={(event) =>
                    updateExperience(expIndex, { title: event.target.value })
                  }
                  className="rounded-xl border border-border bg-background-elevated px-3 py-2 text-sm outline-none focus:border-primary/50"
                  placeholder="Роль"
                />
                <input
                  value={item.dates}
                  onChange={(event) =>
                    updateExperience(expIndex, { dates: event.target.value })
                  }
                  className="rounded-xl border border-border bg-background-elevated px-3 py-2 text-sm outline-none focus:border-primary/50"
                  placeholder="Даты"
                />
              </div>
              <div className="mt-4 space-y-3">
                {item.bullets.map((bullet, bulletIndex) => (
                  <div key={`${bullet.source_bullet_id}-${bulletIndex}`} className="flex gap-2">
                    <textarea
                      value={bullet.text}
                      onChange={(event) =>
                        updateBullet(expIndex, bulletIndex, event.target.value)
                      }
                      rows={2}
                      className="min-h-16 flex-1 rounded-xl border border-border bg-background-elevated px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeBullet(expIndex, bulletIndex)}
                      className="h-10 rounded-xl border border-border px-3 text-muted-foreground transition hover:text-danger"
                      aria-label="Удалить bullet"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addBullet(expIndex)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Добавить bullet
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setDraft(resume);
            setEditing(true);
          }}
        >
          <PenSquare className="mr-1.5 h-4 w-4" />
          Редактировать
        </Button>
        <Button type="button" onClick={() => void downloadPdf()} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Скачать
        </Button>
      </div>
      {message && (
        <div className="mt-5 rounded-2xl border border-border bg-background-elevated px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}
      <ResumeView resume={resume} />
      <GapReport report={gapReport} />
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
