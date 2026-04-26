import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { JobAnalysisView } from "@/components/jobs/JobAnalysisView";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { JobAnalysis } from "@/lib/ai/job-analysis";

export const metadata = {
  title: "Анализ вакансии — MockBuddy",
};

type JobRow = {
  id: string;
  user_id: string;
  raw_text: string;
  title: string | null;
  company: string | null;
  seniority: string | null;
  analysis: JobAnalysis | null;
  status: string;
  created_at: string;
  updated_at: string;
};

async function getJob(userId: string, id: string): Promise<JobRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[jobs:get-page]", error);
    return null;
  }
  return data as JobRow | null;
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return notFound();
  const { id } = await params;
  const job = await getJob(userId, id);
  if (!job) return notFound();
  const { analysis } = job;
  if (!analysis) return notFound();

  return <JobAnalysisView job={{ ...job, analysis }} />;
}
