export type ExperienceBullet = {
  id: string;
  text: string;
  metric?: string;
};

export type Experience = {
  id: string;
  company: string;
  title: string;
  start_date: string; // YYYY-MM
  end_date: string | null; // null = current
  location?: string;
  bullets: ExperienceBullet[];
};

export type Profile = {
  full_name: string;
  headline: string;
  location?: string;
  summary?: string;
  experience: Experience[];
  skills: string[];
};

export const EMPTY_PROFILE: Profile = {
  full_name: "",
  headline: "",
  location: "",
  summary: "",
  experience: [],
  skills: [],
};

export function isProfileFilled(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (!profile.full_name || !profile.headline) return false;
  if (profile.experience.length === 0) return false;
  const totalBullets = profile.experience.reduce(
    (sum, exp) => sum + exp.bullets.filter((b) => b.text.trim()).length,
    0
  );
  return totalBullets >= 2;
}
