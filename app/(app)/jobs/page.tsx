import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { JobList } from "@/components/jobs/JobList";
import { buttonClassName } from "@/components/ui/Button";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = {
  title: "Вакансии — MockBuddy",
};

type JobRow = {
  id: string;
  title: string | null;
  company: string | null;
  seniority: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

async function getJobs(userId: string): Promise<JobRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, company, seniority, status, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[jobs:list-page]", error);
    return [];
  }
  return (data ?? []) as JobRow[];
}

export default async function JobsPage() {
  const { userId } = await auth();
  const jobs = userId ? await getJobs(userId) : [];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-10">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            Архив
          </p>
          <h1 className="mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Все <span className="font-display italic text-primary">вакансии</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Разборы вакансий с компетенциями, вероятными вопросами и планом
            подготовки.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className={buttonClassName("primary", "h-11 px-5 text-sm")}
        >
          Разобрать новую →
        </Link>
      </header>

      <div className="mt-10">
        <JobList jobs={jobs} />
      </div>
    </div>
  );
}
