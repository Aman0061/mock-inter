import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Sparkles } from "lucide-react";
import { TalkingPointsView } from "@/components/resumes/TalkingPointsView";
import { buttonClassName } from "@/components/ui/Button";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { TalkingPoint } from "@/lib/ai/resume";

export const metadata = {
  title: "Talking points — MockBuddy",
};

type ResumeMeta = {
  id: string;
  job_id: string;
  talking_points: TalkingPoint[];
};

type JobMeta = {
  title: string | null;
  company: string | null;
};

async function getData(
  userId: string,
  id: string
): Promise<{ resume: ResumeMeta; job: JobMeta } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, job_id, talking_points")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[talking-points:get-page]", error);
    return null;
  }

  const { data: job } = await supabase
    .from("jobs")
    .select("title, company")
    .eq("id", data.job_id)
    .maybeSingle();

  return {
    resume: data as ResumeMeta,
    job: (job as JobMeta) ?? { title: null, company: null },
  };
}

export default async function TalkingPointsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return notFound();
  const { id } = await params;
  const result = await getData(userId, id);
  if (!result) return notFound();

  const { resume, job } = result;
  const company = job.company ?? "";
  const interviewHref = company
    ? `/interview/new?company=${encodeURIComponent(company)}`
    : "/interview/new";

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <header className="border-b border-border pb-10">
        <Link
          href={`/resumes/${resume.id}`}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.75} />
          К резюме
        </Link>
        <h1 className="mt-5 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          Talking{" "}
          <span className="font-display italic text-primary">points</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Готовые ракурсы для самых вероятных вопросов на собесе по этой
          вакансии — каждый из реального опыта в твоём профиле. Прогони их
          через AI mock-интервью, чтобы отшлифовать формулировки.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={interviewHref}
            className={buttonClassName("primary", "h-11 px-5 text-sm")}
          >
            <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Запустить mock-интервью
          </Link>
        </div>
      </header>

      <div className="mt-10">
        <TalkingPointsView points={resume.talking_points} />
      </div>
    </div>
  );
}
