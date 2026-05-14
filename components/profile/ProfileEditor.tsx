"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Brain,
  Briefcase,
  Download,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  LoaderCircle,
  PenSquare,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
  Wrench,
} from "lucide-react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  extractMetricFromText,
  formatStarBullet,
} from "@/lib/ai/star-format";
import {
  EMPTY_PROFILE,
  normalizeProfile,
  profileFormSchema,
  type Education,
  type Experience,
  type ExperienceBullet,
  type Profile,
} from "@/types/profile";
import { ResumeLivePreview } from "./ResumeLivePreview";
import { SkillsInput } from "./SkillsInput";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type EditorMode = "start" | "edit" | "preview";
type ProfileFormValues = Profile;
type RoleLensId = "pm" | "ba" | "project" | "analyst";

type ProfileApiError = {
  error?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

type RoleLens = {
  id: RoleLensId;
  label: string;
  angle: string;
  headlinePrefix: string;
  summaryFocus: string;
  keywords: string[];
  prompts: string[];
};

type WorkspaceInsights = {
  score: number;
  bulletCount: number;
  metricBullets: number;
  strongBullets: number;
  missingSignals: string[];
  suggestedSkills: string[];
  headlineSuggestion: string;
  summarySuggestion: string;
  nextActions: string[]; 
};

const ROLE_LENSES: RoleLens[] = [
  {
    id: "pm",
    label: "Product Manager",
    angle: "продукт, метрики, discovery, delivery",
    headlinePrefix: "Product Manager",
    summaryFocus: "управлении продуктом, приоритизации и росте ключевых метрик",
    keywords: ["SQL", "A/B-тесты", "CJM", "JTBD", "Discovery", "Roadmap"],
    prompts: [
      "Какое продуктовое решение ты запустил и что изменилось в поведении пользователя?",
      "Какие метрики трекал сам: retention, conversion, GMV, NPS?",
      "Где ты принимал приоритеты, а не просто исполнял?",
    ],
  },
  {
    id: "ba",
    label: "Business Analyst",
    angle: "требования, процессы, интеграции, документация",
    headlinePrefix: "Business Analyst",
    summaryFocus: "сборе требований, описании процессов и работе со стейкхолдерами",
    keywords: ["BPMN", "User Stories", "SQL", "API", "Requirements", "Confluence"],
    prompts: [
      "Какие требования собирал и с кем согласовывал?",
      "Где описывал процессы, схемы или интеграции?",
      "Какие изменения помогли команде быстрее согласовывать реализацию?",
    ],
  },
  {
    id: "project",
    label: "Project Manager",
    angle: "delivery, сроки, координация, риски",
    headlinePrefix: "Project Manager",
    summaryFocus: "доставке проектов, управлении сроками и синхронизации команд",
    keywords: ["Delivery", "Stakeholders", "Risk Management", "Planning", "Agile", "Scrum"],
    prompts: [
      "Какой проект довел до релиза в ограниченные сроки?",
      "Какие риски снимал сам и как это повлияло на delivery?",
      "Как координировал команды и снимал блокеры?",
    ],
  },
  {
    id: "analyst",
    label: "Product Analyst",
    angle: "аналитика, эксперименты, data-driven решения",
    headlinePrefix: "Product Analyst",
    summaryFocus: "анализе данных, проверке гипотез и поиске точек роста",
    keywords: ["SQL", "Python", "A/B-тесты", "Funnels", "Retention", "BI"],
    prompts: [
      "Какой анализ привел к конкретному продуктовому решению?",
      "Какие гипотезы ты проверял на данных?",
      "Где твой вывод изменил roadmap или UX?",
    ],
  },
];

const DOMAIN_LIBRARY = [
  { matchers: ["bank", "банк", "fintech", "финтех", "платеж"], label: "FinTech" },
  { matchers: ["saas", "b2b", "crm", "platform"], label: "B2B SaaS" },
  { matchers: ["mobile", "app", "приложен"], label: "Mobile" },
  { matchers: ["marketplace", "ecommerce", "e-commerce", "маркетплейс"], label: "Marketplace" },
];

function getRoleLens(roleLensId: RoleLensId): RoleLens {
  return ROLE_LENSES.find((item) => item.id === roleLensId) ?? ROLE_LENSES[0];
}

function collectProfileCorpus(profile: Profile): string {
  return [
    profile.headline,
    profile.summary,
    profile.skills.join(" "),
    ...profile.experience.flatMap((experience) => [
      experience.company,
      experience.title,
      experience.location,
      experience.context,
      ...experience.bullets.flatMap((bullet) => [bullet.raw_input, bullet.text, bullet.metric]),
    ]),
    ...profile.education.flatMap((education) => [
      education.institution,
      education.degree,
      education.field,
      education.details,
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

function inferDomains(profile: Profile): string[] {
  const corpus = collectProfileCorpus(profile);
  return DOMAIN_LIBRARY.filter((domain) =>
    domain.matchers.some((matcher) => corpus.includes(matcher))
  ).map((domain) => domain.label);
}

function buildHeadlineSuggestion(profile: Profile, roleLensId: RoleLensId): string {
  const roleLens = getRoleLens(roleLensId);
  const domains = inferDomains(profile);
  const domainLabel = domains[0] ?? "Digital Products";
  const seniority =
    profile.experience.length >= 4
      ? "Senior"
      : profile.experience.length >= 2
        ? ""
        : "";

  return [seniority, roleLens.headlinePrefix, domainLabel]
    .filter(Boolean)
    .join(" · ");
}

function buildSummarySuggestion(profile: Profile, roleLensId: RoleLensId): string {
  const roleLens = getRoleLens(roleLensId);
  const metricBullets = profile.experience.flatMap((experience) => experience.bullets).filter(
    (bullet) => Boolean(bullet.metric || extractMetricFromText(bullet.text))
  ).length;
  const domains = inferDomains(profile);
  const domainLabel = domains.join(" и ");

  return `Специалист с фокусом на ${roleLens.summaryFocus}${
    domainLabel ? ` в домене ${domainLabel}` : ""
  }. Есть практический опыт работы с кросс-функциональными командами, переводом задач в понятные deliverables и доведением инициатив до результата.${
    metricBullets > 0
      ? ` В профиле уже есть ${metricBullets} достижений с измеримым эффектом, что помогает собирать сильное резюме под конкретную вакансию.`
      : " Следующий шаг: добавить больше достижений с метриками, чтобы резюме звучало убедительнее."
  }`;
}

function deriveWorkspaceInsights(
  profile: Profile,
  roleLensId: RoleLensId
): WorkspaceInsights {
  const roleLens = getRoleLens(roleLensId);
  const allBullets = profile.experience.flatMap((experience) => experience.bullets);
  const bulletCount = allBullets.filter(
    (bullet) => bullet.raw_input.trim() || bullet.text.trim()
  ).length;
  const metricBullets = allBullets.filter((bullet) =>
    Boolean(bullet.metric || extractMetricFromText(`${bullet.raw_input} ${bullet.text}`))
  ).length;
  const strongBullets = allBullets.filter(
    (bullet) =>
      bullet.text.includes("S/T:") &&
      bullet.text.includes("A:") &&
      bullet.text.includes("R:")
  ).length;

  const corpus = collectProfileCorpus(profile);
  const suggestedSkills = roleLens.keywords.filter(
    (skill) =>
      !profile.skills.some((current) => current.toLowerCase() === skill.toLowerCase()) &&
      !corpus.includes(skill.toLowerCase())
  ).slice(0, 5);

  const missingSignals: string[] = [];
  if (!profile.headline.trim()) missingSignals.push("Нет headline под целевую роль");
  if (!profile.summary.trim()) missingSignals.push("Нет summary с сильным позиционированием");
  if (bulletCount < 4) missingSignals.push("Мало достижений: стоит собрать еще 2-3 кейса");
  if (metricBullets < 2) missingSignals.push("Не хватает bullet'ов с измеримым результатом");
  if (profile.skills.length < 6) missingSignals.push("Слабый skill stack для AI-tailoring");
  if (profile.education.length === 0) missingSignals.push("Нет блока education");

  const score = Math.max(
    18,
    Math.min(
      97,
      Math.round(
        (profile.full_name.trim() ? 12 : 0) +
          (profile.headline.trim() ? 14 : 0) +
          (profile.summary.trim() ? 16 : 0) +
          Math.min(profile.experience.length * 10, 28) +
          Math.min(metricBullets * 8, 20) +
          Math.min(profile.skills.length * 2, 12)
      )
    )
  );

  const nextActions =
    missingSignals.length > 0
      ? missingSignals.slice(0, 3)
      : [
          "Профиль уже сильный. Теперь можно шлифовать формулировки под конкретную вакансию.",
          "Добавь 1-2 альтернативных headline под смежные роли.",
        ];

  return {
    score,
    bulletCount,
    metricBullets,
    strongBullets,
    missingSignals,
    suggestedSkills,
    headlineSuggestion: buildHeadlineSuggestion(profile, roleLensId),
    summarySuggestion: buildSummarySuggestion(profile, roleLensId),
    nextActions,
  };
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function makeEmptyBullet(): ExperienceBullet {
  return {
    id: uuid(),
    raw_input: "",
    text: "",
    metric: "",
  };
}

function makeEmptyExperience(): Experience {
  return {
    id: uuid(),
    company: "",
    title: "",
    start_date: "",
    end_date: null,
    location: "",
    context: "",
    bullets: [makeEmptyBullet()],
  };
}

function makeEmptyEducation() {
  return {
    id: uuid(),
    institution: "",
    degree: "",
    field: "",
    start_date: "",
    end_date: "",
    details: "",
  };
}

function slugifyFilename(value: string): string {
  const base = value.trim().toLowerCase();
  if (!base) return "resume";
  return base
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

function createExportResumeNode(profile: Profile): HTMLDivElement {
  const root = document.createElement("div");
  applyStyles(root, {
    width: "920px",
    boxSizing: "border-box",
    backgroundColor: "#13141A",
    color: "#F2EFE8",
    border: "1px solid rgba(242, 239, 232, 0.08)",
    borderRadius: "24px",
    padding: "44px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.55",
  });

  const muted = "#9A968D";
  const primary = "#FF6B35";

  root.appendChild(
    createTextElement("h1", profile.full_name.trim() || "Ваше имя", {
      margin: "0",
      color: "#F2EFE8",
      fontSize: "34px",
      fontWeight: "700",
      lineHeight: "1.15",
    })
  );
  root.appendChild(
    createTextElement("p", profile.headline.trim() || "Product Manager", {
      margin: "8px 0 0",
      color: primary,
      fontSize: "26px",
      fontWeight: "700",
      lineHeight: "1.2",
    })
  );

  const contacts = [
    profile.location.trim(),
    profile.phone.trim(),
    profile.email.trim(),
    profile.github.trim(),
    profile.linkedin.trim(),
  ].filter(Boolean);
  if (contacts.length > 0) {
    root.appendChild(
      createTextElement("p", contacts.join(" | "), {
        margin: "12px 0 0",
        color: muted,
        fontSize: "15px",
      })
    );
  }

  function appendSectionTitle(title: string) {
    root.appendChild(
      createTextElement("h2", title, {
        margin: "44px 0 0",
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
      applyStyles(item, {
        margin: "0 0 10px",
        paddingLeft: "8px",
      });
      list.appendChild(item);
    });
    root.appendChild(list);
  }

  if (profile.summary.trim()) {
    appendSectionTitle("PROFESSIONAL SUMMARY");
    root.appendChild(
      createTextElement("p", profile.summary, {
        margin: "18px 0 0",
        color: "#F2EFE8",
        fontSize: "17px",
      })
    );
  }

  if (profile.skills.length > 0) {
    appendSectionTitle("SKILLS");
    appendBulletList(profile.skills);
  }

  const filledExperience = profile.experience.filter(
    (item) =>
      item.company.trim() ||
      item.title.trim() ||
      item.context.trim() ||
      item.bullets.some((bullet) => bullet.text.trim())
  );
  if (filledExperience.length > 0) {
    appendSectionTitle("WORK EXPERIENCE");
    filledExperience.forEach((item: Experience) => {
      const article = document.createElement("article");
      applyStyles(article, { margin: "22px 0 0" });
      const range = formatRange(item.start_date, item.end_date);
      article.appendChild(
        createTextElement(
          "p",
          `${item.company || "Компания"}${item.location ? ` | ${item.location}` : ""} ${
            item.title || "Роль"
          }${range ? ` | ${range}` : ""}`,
          {
            margin: "0",
            color: "#F2EFE8",
            fontSize: "18px",
            fontWeight: "700",
            lineHeight: "1.35",
          }
        )
      );
      if (item.context.trim()) {
        article.appendChild(
          createTextElement("p", item.context, {
            margin: "6px 0 0",
            color: muted,
            fontSize: "17px",
            fontStyle: "italic",
          })
        );
      }
      const bullets = item.bullets
        .map((bullet) => bullet.text.trim())
        .filter(Boolean);
      if (bullets.length > 0) {
        const list = document.createElement("ul");
        applyStyles(list, {
          margin: "14px 0 0",
          padding: "0 0 0 18px",
          fontSize: "16px",
        });
        bullets.forEach((bullet) => {
          const listItem = document.createElement("li");
          listItem.textContent = bullet;
          applyStyles(listItem, {
            margin: "0 0 10px",
            paddingLeft: "8px",
          });
          list.appendChild(listItem);
        });
        article.appendChild(list);
      }
      root.appendChild(article);
    });
  }

  const filledEducation = profile.education.filter(
    (item) => item.institution.trim() || item.degree.trim() || item.field.trim()
  );
  if (filledEducation.length > 0) {
    appendSectionTitle("EDUCATION");
    filledEducation.forEach((item: Education) => {
      const range = formatRange(item.start_date, item.end_date);
      const wrapper = document.createElement("div");
      applyStyles(wrapper, { margin: "16px 0 0", fontSize: "16px" });
      wrapper.appendChild(
        createTextElement(
          "p",
          `${item.institution || "Учебное заведение"}${
            item.degree || item.field
              ? ` | ${[item.degree, item.field].filter(Boolean).join(", ")}`
              : ""
          }${range ? ` | ${range}` : ""}`,
          { margin: "0", color: "#F2EFE8", fontWeight: "700" }
        )
      );
      if (item.details.trim()) {
        wrapper.appendChild(
          createTextElement("p", item.details, {
            margin: "6px 0 0",
            color: muted,
          })
        );
      }
      root.appendChild(wrapper);
    });
  }

  return root;
}

function hasMeaningfulProfileData(profile: Profile): boolean {
  if (profile.full_name.trim()) return true;
  if (profile.headline.trim()) return true;
  if (profile.summary.trim()) return true;
  if (profile.skills.some((skill) => skill.trim())) return true;
  if (
    profile.experience.some(
      (item) =>
        item.company.trim() ||
        item.title.trim() ||
        item.context.trim() ||
        item.bullets.some((bullet) => bullet.raw_input.trim() || bullet.text.trim())
    )
  ) {
    return true;
  }
  if (
    profile.education.some(
      (item) => item.institution.trim() || item.degree.trim() || item.field.trim()
    )
  ) {
    return true;
  }
  return false;
}

function getApiErrorMessage(payload: ProfileApiError | null, fallback: string): string {
  if (!payload) return fallback;
  const parts = [
    payload.error,
    payload.details ?? undefined,
    payload.hint ?? undefined,
    payload.code ? `код: ${payload.code}` : undefined,
  ].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(" · ") : fallback;
}

async function patchProfile(profile: Profile): Promise<void> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });

  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => null)) as ProfileApiError | null;
    throw new Error(getApiErrorMessage(payload, `status ${response.status}`));
  }
}

export function ProfileEditor() {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<EditorMode>("start");
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [roleLensId, setRoleLensId] = useState<RoleLensId>("pm");
  const [captureDraft, setCaptureDraft] = useState("");
  const [captureTarget, setCaptureTarget] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: EMPTY_PROFILE,
    mode: "onChange",
  });

  const {
    control,
    register,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = form;

  const experienceFields = useFieldArray({
    control,
    name: "experience",
  });

  const educationFields = useFieldArray({
    control,
    name: "education",
  });

  const watchedProfile = useWatch({ control });
  const normalizedProfile = useMemo(
    () => normalizeProfile(watchedProfile),
    [watchedProfile]
  );
  const hasCurrentData = hasMeaningfulProfileData(normalizedProfile);
  const roleLens = getRoleLens(roleLensId);
  const workspaceInsights = useMemo(
    () => deriveWorkspaceInsights(normalizedProfile, roleLensId),
    [normalizedProfile, roleLensId]
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response
            .json()
            .catch(() => null)) as ProfileApiError | null;
          throw new Error(getApiErrorMessage(payload, `status ${response.status}`));
        }
        return response.json() as Promise<{ profile?: unknown }>;
      })
      .then((payload) => {
        if (cancelled) return;
        const normalized = normalizeProfile(payload.profile);
        reset(normalized);
        setMode(hasMeaningfulProfileData(normalized) ? "preview" : "start");
        setSaveStatus("idle");
        setStatusMessage("");
        setHydrated(true);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        reset(EMPTY_PROFILE);
        setMode("start");
        setSaveStatus("error");
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить профиль из Supabase"
        );
        setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [reset]);

  useEffect(() => {
    if (experienceFields.fields.length === 0) {
      setCaptureTarget(0);
      return;
    }
    if (captureTarget > experienceFields.fields.length - 1) {
      setCaptureTarget(experienceFields.fields.length - 1);
    }
  }, [captureTarget, experienceFields.fields.length]);

  async function handleSave() {
    setSaveStatus("saving");
    setStatusMessage("");
    try {
      await patchProfile(normalizedProfile);
      setSaveStatus("saved");
      setStatusMessage("Профиль сохранен в Supabase");
      setMode("preview");
      setIsLivePreviewOpen(false);
    } catch (error) {
      setSaveStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Не удалось сохранить профиль"
      );
    }
  }

  async function downloadPdfFromPreview() {
    setIsExportingPdf(true);
    let exportNode: HTMLDivElement | null = null;
    try {
      exportNode = createExportResumeNode(normalizedProfile);
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
        if (!context) {
          throw new Error("Не удалось подготовить изображение для PDF");
        }

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

        const imageData = pageCanvas.toDataURL("image/png", 1.0);
        const renderedHeightMm = sliceHeightPx / pxPerMm;

        if (page > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          margin,
          contentWidth,
          renderedHeightMm,
          undefined,
          "FAST"
        );

        offsetY += sliceHeightPx;
        page += 1;
      }

      pdf.save(`${slugifyFilename(normalizedProfile.full_name)}-mockbuddy-resume.pdf`);
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Не удалось скачать PDF"
      );
    } finally {
      exportNode?.remove();
      setIsExportingPdf(false);
    }
  }

  function applyHeadlineSuggestion() {
    setValue("headline", workspaceInsights.headlineSuggestion, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setSaveStatus("idle");
    setStatusMessage("Headline обновлен под выбранную роль");
  }

  function applySummarySuggestion() {
    setValue("summary", workspaceInsights.summarySuggestion, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setSaveStatus("idle");
    setStatusMessage("Summary собран из текущего профиля");
  }

  function applySuggestedSkill(skill: string) {
    const current = getValues("skills");
    if (current.includes(skill)) return;
    setValue("skills", [...current, skill], {
      shouldDirty: true,
      shouldTouch: true,
    });
    setSaveStatus("idle");
    setStatusMessage(`Навык «${skill}» добавлен в базу профиля`);
  }

  function addCaptureToProfile() {
    const raw = captureDraft.trim();
    if (!raw) return;

    const experiences = getValues("experience");
    if (experiences.length === 0) {
      experienceFields.append({
        ...makeEmptyExperience(),
        bullets: [],
      });
    }

    const targetIndex =
      experiences.length === 0
        ? 0
        : Math.min(captureTarget, Math.max(experiences.length - 1, 0));
    const currentExperiences = getValues("experience");
    const star = formatStarBullet(raw);
    const nextBullet: ExperienceBullet = {
      id: uuid(),
      raw_input: raw,
      text: star.text,
      metric: star.metric,
    };

    setValue(
      `experience.${targetIndex}.bullets`,
      [...currentExperiences[targetIndex].bullets, nextBullet],
      { shouldDirty: true, shouldTouch: true }
    );
    setCaptureDraft("");
    setCaptureTarget(targetIndex);
    setSaveStatus("idle");
    setStatusMessage("Черновик превращен в достижение. Дальше можно отполировать формулировку ниже.");
  }

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background-elevated/40 p-10 text-center font-mono text-xs uppercase tracking-widest text-muted">
        Загружаем профиль…
      </div>
    );
  }

  if (mode === "start") {
    return (
      <div className="space-y-6">
        {saveStatus === "error" && (
          <div className="rounded-2xl border border-danger/35 bg-danger/10 px-5 py-4 text-sm text-danger">
            {statusMessage || "Не удалось загрузить профиль"}
          </div>
        )}
        <section className="rounded-[2rem] border border-border bg-background-elevated p-7 sm:p-9">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Career Workspace
          </p>
          <h2 className="mt-4 max-w-4xl text-4xl leading-tight tracking-tight sm:text-5xl">
            Не форма, а{" "}
            <span className="font-display italic text-primary">
              рабочее пространство
            </span>{" "}
            для твоего опыта
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Здесь мы сначала выгружаем опыт из головы, потом превращаем его в
            сильные bullet&apos;ы, а уже после этого собираем чистое резюме под
            нужную роль.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <WorkspaceMiniCard
              title="1. Захватить опыт"
              description="Пиши сыро: что запускал, с кем работал, какие цифры трогал."
            />
            <WorkspaceMiniCard
              title="2. Упаковать"
              description="MockBuddy переведет мысли в STAR и подскажет слабые места."
            />
            <WorkspaceMiniCard
              title="3. Подстроить"
              description="Дальше AI будет собирать резюме под PM, BA, Project или Analyst."
            />
          </div>
          <Button onClick={() => setMode("edit")} className="mt-8 h-11 px-5 text-sm">
            <PenSquare className="mr-1.5 h-4 w-4" />
            Открыть workspace
          </Button>
        </section>
      </div>
    );
  }

  if (mode === "preview") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background-elevated/95 px-4 py-3 text-sm backdrop-blur sm:px-5">
          <div className="text-muted-foreground">
            {saveStatus === "saved" && (
              <span className="text-success">{statusMessage || "Сохранено"}</span>
            )}
            {saveStatus === "error" && (
              <span className="text-danger">
                {statusMessage || "Не удалось сохранить профиль"}
              </span>
            )}
            {saveStatus === "idle" && "Резюме сохранено и готово к скачиванию"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setMode("edit");
                setIsLivePreviewOpen(false);
                setSaveStatus("idle");
                setStatusMessage("");
              }}
              className="h-9 px-4 text-xs"
            >
              <PenSquare className="mr-1.5 h-4 w-4" />
              Редактировать
            </Button>
            <Button
              type="button"
              onClick={() => void downloadPdfFromPreview()}
              disabled={!hasCurrentData || isExportingPdf}
              className="h-9 px-4 text-xs"
            >
              {isExportingPdf ? (
                <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              Скачать PDF
            </Button>
          </div>
        </div>

        <ResumeLivePreview ref={previewRef} profile={normalizedProfile} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background-elevated/95 px-4 py-3 text-sm backdrop-blur sm:px-5">
        <div className="text-muted-foreground">
          {saveStatus === "saving" && "Сохраняем…"}
          {saveStatus === "error" && (
            <span className="text-danger">{statusMessage || "Ошибка сохранения"}</span>
          )}
          {saveStatus === "idle" && "Заполни поля и сохрани внизу страницы"}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsLivePreviewOpen((value) => !value)}
            className="h-9 px-4 text-xs"
          >
            {isLivePreviewOpen ? (
              <EyeOff className="mr-1.5 h-4 w-4" />
            ) : (
              <Eye className="mr-1.5 h-4 w-4" />
            )}
            {isLivePreviewOpen ? "Скрыть Live Preview" : "Открыть Live Preview"}
          </Button>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-[1.75rem] border border-border bg-background-elevated p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                Workspace Cockpit
              </p>
              <h2 className="mt-3 text-3xl leading-tight tracking-tight">
                Твой опыт как{" "}
                <span className="font-display italic text-primary">
                  карьерная база
                </span>
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Выбери роль, под которую мы собираем базу. Это не меняет правду,
                только помогает сделать нужный акцент в headline, summary и
                кейсах.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-accent-soft px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary">
                Profile Health
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">
                {workspaceInsights.score}%
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {ROLE_LENSES.map((option) => {
              const active = option.id === roleLensId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRoleLensId(option.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-primary/40 bg-accent-soft text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <WorkspaceStat
              icon={<Briefcase className="h-4 w-4 text-primary" />}
              label="Достижения"
              value={String(workspaceInsights.bulletCount)}
              helper="Всего bullet'ов в базе"
            />
            <WorkspaceStat
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="С метрикой"
              value={String(workspaceInsights.metricBullets)}
              helper="С цифрой или эффектом"
            />
            <WorkspaceStat
              icon={<Target className="h-4 w-4 text-primary" />}
              label="Сильные STAR"
              value={String(workspaceInsights.strongBullets)}
              helper="Bullet'ы с S/T, A и R"
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">Что стоит добрать</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {workspaceInsights.nextActions.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">
                Подсказки под роль {roleLens.label}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {roleLens.prompts.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-border bg-background-elevated p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h3 className="font-display text-2xl">AI Co-pilot</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Здесь мы переводим поток мыслей в структуру и сразу усиливаем базу
            профиля без выдуманных фактов.
          </p>

          <div className="mt-5 space-y-4">
            <SuggestionBlock
              title="Headline suggestion"
              value={workspaceInsights.headlineSuggestion}
              actionLabel="Применить"
              onAction={applyHeadlineSuggestion}
            />
            <SuggestionBlock
              title="Summary suggestion"
              value={workspaceInsights.summarySuggestion}
              actionLabel="Вставить в summary"
              onAction={applySummarySuggestion}
            />
          </div>

          {workspaceInsights.suggestedSkills.length > 0 && (
            <div className="mt-5 rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Skill prompts</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {workspaceInsights.suggestedSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => applySuggestedSkill(skill)}
                    className="rounded-full border border-primary/20 bg-accent-soft px-3 py-1.5 text-xs text-foreground transition hover:border-primary/40"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-background-elevated p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display text-2xl">Career Dump</h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Пиши как есть: что запускал, с кем работал, какие цифры трогал,
              какие блокеры снимал. Мы превратим это в bullet и положим в нужный опыт.
            </p>
          </div>
          <div className="min-w-[220px]">
            <label className="text-xs uppercase tracking-[0.16em] text-muted">
              Куда добавить
            </label>
            <select
              value={String(captureTarget)}
              onChange={(event) => setCaptureTarget(Number(event.target.value))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/40"
            >
              {(experienceFields.fields.length > 0
                ? experienceFields.fields
                : [{ id: "new", company: "", title: "" }]
              ).map((item, index) => (
                <option key={item.id} value={index}>
                  {item.company || item.title
                    ? `${item.company || "Компания"} · ${item.title || "Роль"}`
                    : "Новый опыт"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <textarea
          rows={4}
          value={captureDraft}
          onChange={(event) => setCaptureDraft(event.target.value)}
          className="mt-5 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Например: Координировал запуск QR-платежей с банком-партнером, согласовал требования между бизнесом и разработкой, сократил время подготовки релиза..."
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Лучшая форма для ввода: контекст + действие + результат или метрика.
          </p>
          <Button type="button" onClick={addCaptureToProfile} className="h-10 px-4 text-sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Превратить в достижение
          </Button>
        </div>
      </section>

      <form className="space-y-8">
        <section className="rounded-2xl border border-border bg-background-elevated p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <h2 className="font-display text-2xl">База кандидата</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Контакты и базовое позиционирование. Это каркас, на который дальше
            AI будет собирать резюме.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Имя и фамилия</label>
              <Input
                placeholder="Aman Mukanbet uulu"
                className="mt-1.5"
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Headline</label>
              <Input
                placeholder="Product Manager (Technical & SaaS Focus)"
                className="mt-1.5"
                {...register("headline")}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Локация</label>
              <Input
                placeholder="Бишкек, Кыргызстан"
                className="mt-1.5"
                {...register("location")}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Телефон</label>
              <Input
                placeholder="+996 700 000 000"
                className="mt-1.5"
                {...register("phone")}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input
                placeholder="example@mail.com"
                className="mt-1.5"
                {...register("email")}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">GitHub</label>
              <Input
                placeholder="github.com/username"
                className="mt-1.5"
                {...register("github")}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">LinkedIn</label>
              <Input
                placeholder="linkedin.com/in/username"
                className="mt-1.5"
                {...register("linkedin")}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background-elevated p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="font-display text-2xl">Позиционирование</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            2-4 предложения о том, где ты силен, какую роль закрываешь и на чем
            строится твоя ценность.
          </p>
          <textarea
            rows={5}
            className="mt-5 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Product Manager с опытом запуска и масштабирования продуктов..."
            {...register("summary")}
          />
        </section>

        <section className="rounded-2xl border border-border bg-background-elevated p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <h2 className="font-display text-2xl">Опыт и кейсы</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Достижения вводятся свободным текстом и автоматически приводятся к
                STAR-буллитам без выдуманных результатов.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => experienceFields.append(makeEmptyExperience())}
              className="h-9 px-3 text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Добавить опыт
            </Button>
          </div>

          <div className="mt-5 space-y-5">
            {experienceFields.fields.map((field, index) => (
              <ExperienceSectionField
                key={field.id}
                index={index}
                control={control}
                register={register}
                setValue={setValue}
                roleLens={roleLens}
                onRemove={() => experienceFields.remove(index)}
              />
            ))}

            {experienceFields.fields.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Добавьте хотя бы один опыт, чтобы AI мог собирать релевантное
                резюме.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background-elevated p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <h2 className="font-display text-2xl">Навыки и инструменты</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            То, что реально умеешь и чем пользовался. AI потом выберет из этой
            базы релевантное под вакансию.
          </p>
          <div className="mt-5">
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <SkillsInput
                  skills={field.value}
                  onChange={(next) => field.onChange(next)}
                />
              )}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background-elevated p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <h2 className="font-display text-2xl">Образование</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Образование, сертификации, доп. программы.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => educationFields.append(makeEmptyEducation())}
              className="h-9 px-3 text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Добавить
            </Button>
          </div>

          <div className="mt-5 space-y-4">
            {educationFields.fields.map((field, index) => (
              <article
                key={field.id}
                className="rounded-xl border border-border bg-background p-4 sm:p-5"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">Institution</label>
                    <Input
                      className="mt-1.5"
                      placeholder="Кыргызский Национальный Университет"
                      {...register(`education.${index}.institution`)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Degree</label>
                    <Input
                      className="mt-1.5"
                      placeholder="Бакалавр"
                      {...register(`education.${index}.degree`)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Field</label>
                    <Input
                      className="mt-1.5"
                      placeholder="Программная инженерия"
                      {...register(`education.${index}.field`)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Start</label>
                    <Input
                      type="month"
                      className="mt-1.5"
                      {...register(`education.${index}.start_date`)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">End</label>
                    <Input
                      type="month"
                      className="mt-1.5"
                      {...register(`education.${index}.end_date`)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground">Details</label>
                    <textarea
                      rows={2}
                      className="mt-1.5 w-full resize-y rounded-xl border border-border bg-background-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Дополнительные детали по программе..."
                      {...register(`education.${index}.details`)}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => educationFields.remove(index)}
                    className="h-8 px-3 text-xs text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Удалить
                  </Button>
                </div>
              </article>
            ))}

            {educationFields.fields.length === 0 && (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Добавьте хотя бы одно образование для завершенного CV.
              </p>
            )}
          </div>
        </section>
      </form>

      {isLivePreviewOpen && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-background-elevated/80 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Live Preview</p>
            <p className="mt-1">
              Превью открывается по кнопке и обновляется в реальном времени.
            </p>
          </div>
          <ResumeLivePreview ref={previewRef} profile={normalizedProfile} />
        </section>
      )}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background-elevated/95 px-4 py-3 backdrop-blur sm:px-5">
        <div className="text-xs text-muted-foreground">
          {saveStatus === "saving" && "Сохраняем профиль…"}
          {saveStatus === "error" && (
            <span className="text-danger">{statusMessage || "Ошибка сохранения"}</span>
          )}
          {(saveStatus === "idle" || saveStatus === "saved") &&
            "Нажми «Сохранить» — после сохранения откроется режим просмотра"}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setMode(hasCurrentData ? "preview" : "start");
              setIsLivePreviewOpen(false);
              setSaveStatus("idle");
              setStatusMessage("");
            }}
            className="h-10 px-4 text-sm"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveStatus === "saving"}
            className="h-10 px-5 text-sm"
          >
            {saveStatus === "saving" ? (
              <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}

type ExperienceSectionFieldProps = {
  control: Control<ProfileFormValues>;
  register: UseFormRegister<ProfileFormValues>;
  setValue: UseFormSetValue<ProfileFormValues>;
  index: number;
  roleLens: RoleLens;
  onRemove: () => void;
};

function ExperienceSectionField({
  control,
  register,
  setValue,
  index,
  roleLens,
  onRemove,
}: ExperienceSectionFieldProps) {
  const bullets = useFieldArray({
    control,
    name: `experience.${index}.bullets`,
  });
  const bulletValues =
    useWatch({
      control,
      name: `experience.${index}.bullets`,
    }) ?? [];

  return (
    <article className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <div className="mb-4 rounded-xl border border-primary/15 bg-accent-soft px-4 py-3">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">
          Фокус для {roleLens.label}
        </p>
        <p className="mt-1 text-sm text-foreground">
          Покажи опыт через угол: {roleLens.angle}.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">Компания</label>
          <Input
            className="mt-1.5"
            placeholder="Optima Bank"
            {...register(`experience.${index}.company`)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Роль</label>
          <Input
            className="mt-1.5"
            placeholder="Project Manager"
            {...register(`experience.${index}.title`)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Локация</label>
          <Input
            className="mt-1.5"
            placeholder="Бишкек"
            {...register(`experience.${index}.location`)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Начало</label>
          <Input
            type="month"
            className="mt-1.5"
            {...register(`experience.${index}.start_date`)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Конец</label>
          <Controller
            control={control}
            name={`experience.${index}.end_date`}
            render={({ field }) => (
              <Input
                type="month"
                className="mt-1.5"
                value={field.value ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  field.onChange(value || null);
                }}
              />
            )}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground">
            Контекст роли
          </label>
          <Input
            className="mt-1.5"
            placeholder="Развитие мобильного банкинга и запуск новых финтех-продуктов."
            {...register(`experience.${index}.context`)}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {bullets.fields.map((bulletField, bulletIndex) => {
          const starField = `experience.${index}.bullets.${bulletIndex}.text` as const;
          const starValue = bulletValues[bulletIndex]?.text ?? "";
          return (
            <div
              key={bulletField.id}
              className="rounded-lg border border-border bg-background-elevated p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Достижение #{bulletIndex + 1}
                </p>
                {bulletValues[bulletIndex]?.metric && (
                  <span className="rounded-full border border-primary/20 bg-accent-soft px-2 py-1 text-[11px] text-primary">
                    Метрика: {bulletValues[bulletIndex]?.metric}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => bullets.remove(bulletIndex)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-danger transition hover:bg-danger/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Удалить
                </button>
              </div>

              <Controller
                control={control}
                name={`experience.${index}.bullets.${bulletIndex}.raw_input`}
                render={({ field }) => (
                  <textarea
                    rows={3}
                    className="mt-2 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Напиши как есть: какая была задача, что сделал лично, какой получился эффект..."
                    value={field.value}
                    onChange={(event) => {
                      const rawValue = event.target.value;
                      field.onChange(rawValue);
                      const star = formatStarBullet(rawValue);
                      setValue(starField, star.text, { shouldDirty: true });
                      setValue(
                        `experience.${index}.bullets.${bulletIndex}.metric`,
                        star.metric,
                        { shouldDirty: true }
                      );
                    }}
                  />
                )}
              />

              <div className="mt-2 rounded-lg border border-primary/20 bg-accent-soft px-3 py-2 text-xs leading-relaxed text-foreground">
                <p className="font-semibold text-primary">STAR output</p>
                <p className="mt-1">{starValue || "Появится после ввода текста выше."}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Подсказка: самый сильный bullet = контекст + действие + измеримый
                результат.
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => bullets.append(makeEmptyBullet())}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-border-strong hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить достижение
        </button>
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          className="h-8 px-3 text-xs text-danger hover:bg-danger/10"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Удалить опыт
        </Button>
      </div>
    </article>
  );
}

function WorkspaceMiniCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function WorkspaceStat({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function SuggestionBlock({
  title,
  value,
  actionLabel,
  onAction,
}: {
  title: string;
  value: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{value}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-accent-soft px-3 py-1.5 text-xs text-foreground transition hover:border-primary/40"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {actionLabel}
      </button>
    </div>
  );
}
