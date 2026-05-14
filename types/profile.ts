import { z } from "zod";

const plainText = (max: number) => z.string().trim().max(max);

const coerceText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    plainText(max)
  );

export const experienceBulletFormSchema = z.object({
  id: z.string().min(1),
  raw_input: plainText(2000),
  text: plainText(2000),
  metric: plainText(180),
});

export const experienceFormSchema = z.object({
  id: z.string().min(1),
  company: plainText(140),
  title: plainText(140),
  start_date: plainText(16), // YYYY-MM
  end_date: plainText(16).nullable(), // null = current
  location: plainText(140),
  context: plainText(220),
  bullets: z.array(experienceBulletFormSchema),
});

export const educationFormSchema = z.object({
  id: z.string().min(1),
  institution: plainText(180),
  degree: plainText(140),
  field: plainText(140),
  start_date: plainText(16),
  end_date: plainText(16),
  details: plainText(240),
});

export const profileFormSchema = z.object({
  full_name: plainText(120),
  headline: plainText(160),
  location: plainText(120),
  email: plainText(160),
  phone: plainText(60),
  linkedin: plainText(220),
  github: plainText(220),
  summary: plainText(1200),
  experience: z.array(experienceFormSchema),
  skills: z.array(z.string().trim().min(1).max(80)),
  education: z.array(educationFormSchema),
});

const experienceBulletSchema = z.object({
  id: z.string().min(1),
  raw_input: coerceText(2000),
  text: coerceText(2000),
  metric: coerceText(180),
});

const experienceSchema = z.object({
  id: z.string().min(1),
  company: coerceText(140),
  title: coerceText(140),
  start_date: coerceText(16),
  end_date: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return null;
      return typeof value === "string" ? value : "";
    },
    plainText(16).nullable()
  ),
  location: coerceText(140),
  context: coerceText(220),
  bullets: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(experienceBulletSchema)
  ),
});

const educationSchema = z.object({
  id: z.string().min(1),
  institution: coerceText(180),
  degree: coerceText(140),
  field: coerceText(140),
  start_date: coerceText(16),
  end_date: coerceText(16),
  details: coerceText(240),
});

export const profileSchema = z.object({
  full_name: coerceText(120),
  headline: coerceText(160),
  location: coerceText(120),
  email: coerceText(160),
  phone: coerceText(60),
  linkedin: coerceText(220),
  github: coerceText(220),
  summary: coerceText(1200),
  experience: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(experienceSchema)
  ),
  skills: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(
      z.preprocess(
        (item) => (typeof item === "string" ? item : ""),
        z.string().trim().min(1).max(80)
      )
    )
  ),
  education: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(educationSchema)
  ),
});

export type ExperienceBullet = z.infer<typeof experienceBulletFormSchema>;
export type Experience = z.infer<typeof experienceFormSchema>;
export type Education = z.infer<typeof educationFormSchema>;
export type Profile = z.infer<typeof profileFormSchema>;

export const EMPTY_PROFILE: Profile = {
  full_name: "",
  headline: "",
  location: "",
  email: "",
  phone: "",
  linkedin: "",
  github: "",
  summary: "",
  experience: [],
  skills: [],
  education: [],
};

export function normalizeProfile(input: unknown): Profile {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return EMPTY_PROFILE;
  }

  return {
    ...EMPTY_PROFILE,
    ...parsed.data,
    experience: parsed.data.experience.map((experience) => ({
      ...experience,
      end_date: experience.end_date ?? null,
      bullets: experience.bullets.map((bullet) => ({
        ...bullet,
        raw_input: bullet.raw_input || bullet.text,
      })),
    })),
    skills: [...new Set(parsed.data.skills.map((skill) => skill.trim()).filter(Boolean))],
  };
}

export function isProfileFilled(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (!profile.full_name.trim() || !profile.headline.trim()) return false;
  if (profile.experience.length === 0) return false;
  const totalBullets = profile.experience.reduce(
    (sum, exp) =>
      sum +
      exp.bullets.filter(
        (bullet) => bullet.text.trim() || bullet.raw_input.trim()
      ).length,
    0
  );
  return totalBullets >= 2;
}
