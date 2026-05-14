import { z } from "zod";
import type { InterviewType } from "./prompts";

export const SENIORITY_LABELS: Record<string, string> = {
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
  lead: "Lead / Head",
};

export const QUESTION_TYPE_LABELS: Record<InterviewType, string> = {
  product_sense: "Продуктовое мышление",
  behavioral: "Поведенческое",
  analytical: "Аналитическое",
  strategy: "Стратегия",
};

export const jobAnalysisSchema = z.object({
  company: z
    .string()
    .describe("Название компании из вакансии. Если не указано — 'Не указано'."),
  title: z.string().describe("Должность из вакансии."),
  seniority: z
    .enum(["junior", "middle", "senior", "lead"])
    .describe(
      "Уровень: junior (0-2 года), middle (2-5), senior (5+), lead (с менеджментом или 7+)."
    ),
  summary: z
    .string()
    .describe(
      "Одно-два предложения: за что отвечает специалист на этой роли и какие у него стейкхолдеры."
    ),
  competencies: z
    .array(
      z.object({
        title: z.string().describe("Название компетенции."),
        why: z
          .string()
          .describe("Почему она важна именно для этой роли (1-2 предложения)."),
      })
    )
    .min(4)
    .max(6)
    .describe(
      "Ключевые компетенции, которые проверят на собесе для этой конкретной роли."
    ),
  questions: z
    .array(
      z.object({
        type: z.enum(["product_sense", "behavioral", "analytical", "strategy"]),
        question: z
          .string()
          .describe(
            "Реалистичный вопрос интервьюера — конкретный, с привязкой к продукту/контексту компании."
          ),
        why: z.string().describe("Что этим вопросом проверяют."),
      })
    )
    .min(6)
    .max(10)
    .describe("Вероятные вопросы для собеседования по этой вакансии."),
  prep_plan: z
    .array(
      z.object({
        title: z.string().describe("Шаг подготовки."),
        description: z
          .string()
          .describe("Что конкретно сделать (1-2 предложения, практическое)."),
      })
    )
    .min(3)
    .max(5)
    .describe("План подготовки за 1-2 недели."),
});

export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;

export const JOB_ANALYSIS_SYSTEM_PROMPT = `Ты — опытный senior PM/BA и рекрутер, специализирующийся на Product и Product-adjacent ролях в СНГ и FAANG: Product Manager, Project Manager, Business Analyst, Product Analyst, System/Technical Analyst.

На вход — текст вакансии. Твоя задача: извлечь структурированные данные, которые помогут кандидату подготовиться и затем адаптировать резюме под конкретную роль.

Правила:
- Все тексты — на русском.
- Формулируй вопросы как реальный интервьюер: конкретно, с привязкой к продукту/контексту компании. Не давай общие "расскажи о метриках", а формулируй так, как реально спросят на этом собесе.
- Компетенции — то, что РЕАЛЬНО проверят на этой роли (специфика этой вакансии, а не общий список PM-скиллов).
- Если вакансия не PM, не притягивай её к PM: для Business Analyst выделяй требования к discovery, требованиям, процессам, интеграциям, SQL/аналитике, документации и стейкхолдерам; для Product Analyst — метрики, эксперименты, SQL/BI; для Project Manager — сроки, риски, коммуникации, delivery.
- План подготовки — практические шаги (что почитать, какие кейсы прорешать), без воды.
- Если в вакансии не указана компания — поставь "Не указано" (не выдумывай).
- Уровень определи по описанию (years of experience, scope, seniority hints).
- Не выдумывай детали, которых нет в тексте вакансии. Только то, что реально извлекается.`;
