import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Briefcase } from "lucide-react";
import { GapReport } from "@/components/resumes/GapReport";
import { ResumeView } from "@/components/resumes/ResumeView";
import { buttonClassName } from "@/components/ui/Button";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  GapReport as GapReportType,
  Resume,
  TalkingPoint,
} from "@/lib/ai/resume";

export const metadata = {
  title: "Резюме — MockBuddy",
};

type ResumeRow = {
  id: string;
  job_id: string;
  resume: Resume;
  gap_report: GapReportType;
  talking_points: TalkingPoint[];
  created_at: string;
};

type JobMeta = {
  id: string;
  title: string | null;
  company: string | null;
};

async function getResume(
  userId: string,
  id: string
): Promise<{ resume: ResumeRow; job: JobMeta } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[resume:get-page]", error);
    return null;
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, company")
    .eq("id", data.job_id)
    .maybeSingle();

  return {
    resume: data as ResumeRow,
    job: (job as JobMeta) ?? { id: data.job_id, title: null, company: null },
  };
}

export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return notFound();
  const { id } = await params;
  const result = await getResume(userId, id);
  if (!result) return notFound();
  const { resume, job } = result;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <header className="border-b border-border pb-10">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          <Briefcase className="h-3 w-3" strokeWidth={1.75} />
          <span>под вакансию:</span>
          <Link
            href={`/jobs/${job.id}`}
            className="text-foreground transition hover:text-primary"
          >
            {job.title ?? "—"}
            {job.company && ` · ${job.company}`}
          </Link>
        </div>
        <h1 className="mt-5 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          Твоё <span className="font-display italic text-primary">резюме</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Собрано из твоего профиля под эту вакансию. Включи «Честный режим»,
          чтобы увидеть какие bullet&apos;ы AI оставил как есть, а какие
          переформулировал.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/resumes/${resume.id}/talking-points`}
            className={buttonClassName("primary", "h-11 px-5 text-sm")}
          >
            Talking points для интервью
            <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={1.75} />
          </Link>
          <Link
            href="/profile"
            className={buttonClassName("ghost", "h-11 px-4 text-sm")}
          >
            Редактировать профиль
          </Link>
        </div>
      </header>

      <ResumeView resume={resume.resume} />

      <GapReport report={resume.gap_report} />

      <section className="mt-14">
        <div className="flex flex-col items-stretch gap-4 rounded-3xl border border-border bg-accent-soft p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <p className="font-display text-xl italic text-foreground">
              Готов к собесу под эту вакансию?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Прогони talking points через mock-интервью с AI — отшлифуешь
              ответы.
            </p>
          </div>
          <Link
            href={`/resumes/${resume.id}/talking-points`}
            className={buttonClassName("primary", "h-12 px-6 text-sm")}
          >
            Перейти к talking points →
          </Link>
        </div>
      </section>
    </div>
  );
}
