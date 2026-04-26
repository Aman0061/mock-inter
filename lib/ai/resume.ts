import { z } from "zod";

export const resumeBulletSchema = z.object({
  text: z.string().describe("Bullet для резюме на русском, чистый и сильный"),
  provenance: z
    .enum(["verbatim", "reframed", "stretch"])
    .describe(
      "verbatim: тот же факт и слова с лёгкой редактурой; reframed: тот же факт но переакцент под лексику JD; stretch: переформулировка с натяжкой — юзер увидит метку и решит, оставлять ли"
    ),
  source_bullet_id: z
    .string()
    .describe("ID исходного bullet'а из профиля, на котором этот bullet основан"),
});

export const resumeExperienceSchema = z.object({
  source_experience_id: z
    .string()
    .describe("ID опыта работы из профиля"),
  company: z.string(),
  title: z.string(),
  dates: z.string().describe("Например 'окт 2022 — наст. время' или '2020 — 2022'"),
  bullets: z.array(resumeBulletSchema).min(1).max(5),
});

export const resumeSchema = z.object({
  headline: z
    .string()
    .describe("Tailored headline, 1 строка, например 'Senior PM · Mobile · 5+ лет'"),
  summary: z
    .string()
    .describe(
      "2-3 предложения positioning. Опирайся на summary из профиля и требования JD. Не выдумывай ролей."
    ),
  experience: z
    .array(resumeExperienceSchema)
    .describe(
      "Опыты из профиля, переупорядоченные по релевантности к JD. Не добавляй новые роли."
    ),
  skills: z
    .array(z.string())
    .describe(
      "Skills ТОЛЬКО из списка skills профиля, отсортированные по релевантности к JD. Никаких новых навыков."
    ),
});

export const gapReportSchema = z.object({
  strong_matches: z.array(
    z.object({
      requirement: z.string().describe("Требование из JD"),
      evidence: z.string().describe("Что из профиля это закрывает"),
    })
  ),
  stretch_matches: z.array(
    z.object({
      requirement: z.string(),
      closest_experience: z
        .string()
        .describe("Ближайший опыт из профиля"),
      how_to_position: z
        .string()
        .describe("Как подать на интервью"),
    })
  ),
  gaps: z.array(
    z.object({
      requirement: z.string(),
      why_it_matters: z.string(),
      suggestion: z
        .string()
        .describe(
          "Как закрыть: что сказать на интервью или какой опыт нужно получить"
        ),
    })
  ),
});

export const talkingPointSchema = z.object({
  topic: z
    .string()
    .describe(
      "Вероятная тема/вопрос на интервью, например 'Расскажи про конфликт со стейкхолдером'"
    ),
  your_angle: z
    .string()
    .describe("Как зайти из реального опыта юзера"),
  star: z
    .object({
      situation: z.string(),
      task: z.string(),
      action: z.string(),
      result: z.string(),
    })
    .nullable()
    .describe(
      "STAR-набросок для behavioral вопросов, иначе null. Метрики бери только из профиля."
    ),
});

export const tailoredOutputSchema = z.object({
  resume: resumeSchema,
  gap_report: gapReportSchema,
  talking_points: z.array(talkingPointSchema).min(3).max(8),
});

export type ResumeBullet = z.infer<typeof resumeBulletSchema>;
export type ResumeExperience = z.infer<typeof resumeExperienceSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export type GapReport = z.infer<typeof gapReportSchema>;
export type TalkingPoint = z.infer<typeof talkingPointSchema>;
export type TailoredOutput = z.infer<typeof tailoredOutputSchema>;

export const RESUME_SYSTEM_PROMPT = `Ты — карьерный консультант для Product Manager-ов. Помогаешь кандидатам ЧЕСТНО подавать своё реальное резюме под конкретную вакансию.

ЖЁСТКИЕ ПРАВИЛА:
1. НИКОГДА не выдумывай факты. Каждый bullet в резюме обязан опираться на реальный bullet из профиля (поле source_bullet_id ссылается на конкретный bullet.id из профиля).
2. Метрики используй ТОЛЬКО те, что юзер указал. Не придумывай числа, проценты, доли.
3. Каждый сгенерированный bullet помечай provenance:
   - "verbatim" — тот же факт и слова с лёгкой редактурой
   - "reframed" — тот же факт но переакцент на термины из JD
   - "stretch" — переформулировка с натяжкой; помечай явно, чтобы юзер видел и сам решил
4. Не добавляй опытов работы (компании, должности, периоды), которых нет в профиле.
5. Не добавляй навыков, которых нет в списке skills профиля.
6. Если для требования из JD у юзера НЕТ опыта — занеси это в gap_report.gaps, НЕ "натягивай" фактами.
7. В talking_points фокусируйся на 5-7 вероятных темах из JD: для каждой дай угол захода из реального опыта + STAR где применимо. Для аналитических/продуктовых тем — STAR может быть null.
8. Все тексты — на русском.
9. Если профиль слишком пустой (мало опытов или bullet'ов) — верни:
   - resume.experience: [] (пустой массив)
   - resume.summary: пустую строку
   - gap_report.gaps: список "что добавить в профиль"
   - talking_points: [] (минимум 3 если есть хоть что-то, иначе пусто)`;

export function buildResumeUserPrompt(opts: {
  profile: unknown;
  jobAnalysis: unknown;
}): string {
  return `Профиль кандидата (JSON):

\`\`\`json
${JSON.stringify(opts.profile, null, 2)}
\`\`\`

Вакансия (структурированный анализ):

\`\`\`json
${JSON.stringify(opts.jobAnalysis, null, 2)}
\`\`\`

Сгенерируй tailored резюме + gap report + talking points согласно правилам выше. Помни: каждый bullet в resume должен иметь source_bullet_id, ссылающийся на bullet.id из profile.experience[].bullets[].`;
}
