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

export const resumeAlignmentSchema = z.object({
  target_role: z
    .string()
    .describe(
      "Роль, под которую адаптировано резюме. Должна совпадать с вакансией или быть честным смежным позиционированием."
    ),
  fit_score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Оценка совпадения резюме с вакансией после адаптации. Цель — около 70%, если профиль это позволяет."
    ),
  stretch_ratio: z
    .number()
    .min(0)
    .max(40)
    .describe(
      "Процент bullet'ов/формулировок с натяжкой. Никогда не выше 40."
    ),
  honesty_note: z
    .string()
    .describe(
      "Короткое объяснение, где резюме честно совпадает, а где использована смежная подача."
    ),
});

export const resumeExperienceSchema = z.object({
  source_experience_id: z
    .string()
    .describe("ID опыта работы из профиля"),
  company: z.string(),
  title: z.string(),
  dates: z.string().describe("Например 'окт 2022 — наст. время' или '2020 — 2022'"),
  bullets: z.array(resumeBulletSchema).max(6),
});

export const resumeSchema = z.object({
  target_role: z
    .string()
    .describe("Название роли из вакансии или честная смежная роль для headline."),
  headline: z
    .string()
    .describe(
      "Tailored headline под вакансию. Если вакансия Business Analyst — headline тоже должен быть Business Analyst/Business Analyst с продуктовым бэкграундом, если это честно выводится из профиля."
    ),
  summary: z
    .string()
    .describe(
      "2-3 предложения positioning под вакансию. Можно агрессивно переупаковывать опыт, но нельзя выдумывать hard facts."
    ),
  experience: z
    .array(resumeExperienceSchema)
    .describe(
      "Опыты из профиля, переупорядоченные по релевантности к JD. Не добавляй новые роли."
    ),
  skills: z
    .array(z.string())
    .describe(
      "Skills для резюме под JD: реальные навыки из профиля плюс аккуратные inferred/AI-suggested навыки, если они логично следуют из опыта или критичны для вакансии."
    ),
  knowledge: z
    .array(z.string())
    .describe(
      "Знания, домены и темы под вакансию, которые стоит подсветить или быстро добрать. Можно добавлять недостающие keywords из JD, но без выдуманных сертификатов/опыта."
    ),
  alignment: resumeAlignmentSchema,
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
  talking_points: z.array(talkingPointSchema).max(8),
});

export type ResumeBullet = z.infer<typeof resumeBulletSchema>;
export type ResumeAlignment = z.infer<typeof resumeAlignmentSchema>;
export type ResumeExperience = z.infer<typeof resumeExperienceSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export type GapReport = z.infer<typeof gapReportSchema>;
export type TalkingPoint = z.infer<typeof talkingPointSchema>;
export type TailoredOutput = z.infer<typeof tailoredOutputSchema>;

const MAX_STRETCH_RATIO = 40;

function normalizeGeneratedOutput(output: TailoredOutput): TailoredOutput {
  return {
    ...output,
    resume: {
      ...output.resume,
      knowledge: output.resume.knowledge,
      skills: output.resume.skills.filter(Boolean),
      experience: output.resume.experience
        .map((exp) => ({
          ...exp,
          bullets: exp.bullets.filter((bullet) => bullet.text.trim()),
        }))
        .filter((exp) => exp.bullets.length > 0),
    },
    talking_points: output.talking_points ?? [],
  };
}

function countBullets(resume: Resume): { total: number; stretch: number } {
  return resume.experience.reduce(
    (acc, exp) => {
      for (const bullet of exp.bullets) {
        acc.total += 1;
        if (bullet.provenance === "stretch") {
          acc.stretch += 1;
        }
      }
      return acc;
    },
    { total: 0, stretch: 0 }
  );
}

export function enforceResumeTruthBudget(output: TailoredOutput): TailoredOutput {
  const normalizedOutput = normalizeGeneratedOutput(output);
  const resume: Resume = {
    ...normalizedOutput.resume,
    experience: normalizedOutput.resume.experience.map((exp) => ({
      ...exp,
      bullets: [...exp.bullets],
    })),
  };

  let { total, stretch } = countBullets(resume);
  if (total > 0) {
    let maxStretch = Math.floor((total * MAX_STRETCH_RATIO) / 100);
    for (let expIndex = resume.experience.length - 1; expIndex >= 0; expIndex -= 1) {
      const exp = resume.experience[expIndex];
      for (let bulletIndex = exp.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
        if (stretch <= maxStretch) break;
        if (exp.bullets[bulletIndex].provenance !== "stretch") continue;
        exp.bullets.splice(bulletIndex, 1);
        stretch -= 1;
        total -= 1;
        maxStretch = Math.floor((total * MAX_STRETCH_RATIO) / 100);
      }
      if (exp.bullets.length === 0) {
        resume.experience.splice(expIndex, 1);
      }
    }
  }

  const finalCounts = countBullets(resume);
  const stretchRatio =
    finalCounts.total === 0
      ? 0
      : Math.round((finalCounts.stretch / finalCounts.total) * 100);
  const fitScore = Math.min(
    Math.max(Math.round(resume.alignment.fit_score), 0),
    stretchRatio > MAX_STRETCH_RATIO ? 65 : 85
  );

  return {
    ...normalizedOutput,
    resume: {
      ...resume,
      alignment: {
        ...resume.alignment,
        fit_score: fitScore,
        stretch_ratio: Math.min(stretchRatio, MAX_STRETCH_RATIO),
      },
    },
  };
}

export const RESUME_SYSTEM_PROMPT = `Ты — карьерный консультант для Product/Product-adjacent ролей: Product Manager, Project Manager, Business Analyst, Product Analyst, System/Technical Analyst. Помогаешь кандидатам сильнее и честно подавать своё реальное резюме под конкретную вакансию.

ЦЕЛЬ:
- Сделай резюме релевантным вакансии примерно на 70%, если профиль кандидата это позволяет.
- Headline обязан подстроиться под вакансию. Если вакансия на Business Analyst, headline должен быть вроде "Business Analyst · FinTech · Product background", а не Product Manager, если профиль даёт для этого основания.
- Допускается смежное позиционирование опыта: PM -> Business Analyst, Project Manager -> Product/Business Analyst, Founder -> Product/Operations, если в профиле есть реальные задачи, которые это подтверждают.
- "Натяжка" допустима, но её доля не выше 40% итоговых bullet'ов. Всё, что с натяжкой, помечай provenance="stretch".

ЖЁСТКИЕ ПРАВИЛА:
1. НИКОГДА не выдумывай hard facts: компании, даты, должности в компаниях, метрики, конкретные инструменты, сертификаты, образование, продукты. Каждый bullet в резюме обязан опираться на реальный bullet из профиля (поле source_bullet_id ссылается на конкретный bullet.id из профиля).
2. Метрики используй ТОЛЬКО те, что юзер указал. Не придумывай числа, проценты, доли.
3. Каждый сгенерированный bullet помечай provenance:
   - "verbatim" — тот же факт и слова с лёгкой редактурой
   - "reframed" — тот же факт, но переакцент на термины и задачи JD
   - "stretch" — смежная интерпретация реального опыта под JD; помечай явно
4. Не добавляй опытов работы (компании, должности, периоды), которых нет в профиле.
5. В skills можно добавить недостающие навыки из JD только если они логично следуют из опыта или являются базовыми для целевой роли; спорные навыки добавляй в knowledge, а не выдавай за подтверждённый опыт.
6. В knowledge добавляй недостающие знания/домены/keywords под вакансию: например BPMN, user stories, API integrations, SQL, CJM, если они важны для JD. Это AI-suggested блок, пользователь сможет отредактировать.
7. Недостающий опыт дописывай только как дополнительные bullet'ы внутри реальных опытов работы и только на основе source_bullet_id. Не создавай новые компании/должности/даты.
8. Если требование JD невозможно покрыть даже смежной подачей — занеси его в gap_report.gaps, не превращай в опыт.
9. Для target_role/headline можно использовать название вакансии, если профиль содержит смежные доказательства. Если доказательств нет — сделай честный hybrid headline: "Business Analyst с Product/FinTech бэкграундом", "Product Manager с BA-задачами".
10. В summary используй язык вакансии, но не заявляй прямой опыт там, где есть только смежный опыт.
11. В alignment.fit_score ставь реалистичную оценку: цель 70%, но если профиль слабее — ниже. Не завышай выше 85 без сильных совпадений.
12. В alignment.stretch_ratio посчитай долю stretch bullet'ов среди всех bullets resume.experience[].bullets[] * 100. Значение не выше 40.
13. В talking_points фокусируйся на 5-7 вероятных темах из JD: для каждой дай угол захода из реального опыта + STAR где применимо. Для аналитических/продуктовых тем — STAR может быть null.
14. Все тексты — на русском.
15. Если профиль слишком пустой (мало опытов или bullet'ов) — верни:
   - resume.experience: [] (пустой массив)
   - resume.summary: пустую строку
   - resume.alignment.fit_score: 0
   - resume.alignment.stretch_ratio: 0
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

Сгенерируй tailored резюме + gap report + talking points согласно правилам выше.

Особенно важно:
- Подстрой resume.target_role и resume.headline под jobAnalysis.title.
- Доведи релевантность примерно до 70% через выбор, порядок, переупаковку реальных фактов, AI-suggested knowledge и дополнительные stretch-bullets внутри реального опыта.
- Не превышай 40% provenance="stretch".
- Каждый bullet в resume должен иметь source_bullet_id, ссылающийся на bullet.id из profile.experience[].bullets[].`;
}
