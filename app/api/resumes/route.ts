import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getInterviewerModel, isOpenAIConfigured } from "@/lib/ai/model";
import {
  RESUME_SYSTEM_PROMPT,
  buildResumeUserPrompt,
  tailoredOutputSchema,
} from "@/lib/ai/resume";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { isProfileFilled, type Profile } from "@/types/profile";

export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured() || !isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "Сервис временно недоступен" },
      { status: 503 }
    );
  }

  let body: { jobId?: unknown };
  try {
    body = (await req.json()) as { jobId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  if (!jobId) {
    return NextResponse.json({ error: "jobId required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Load profile
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileError) {
    console.error("[resumes:profile-load]", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profile = profileRow?.data as Profile | undefined;
  if (!isProfileFilled(profile ?? null)) {
    return NextResponse.json(
      {
        error:
          "Заполни профиль сначала: имя, должность и хотя бы один опыт работы с двумя bullet'ами.",
        code: "profile_empty",
      },
      { status: 400 }
    );
  }

  // Load job + analysis
  const { data: jobRow, error: jobError } = await supabase
    .from("jobs")
    .select("id, title, company, analysis")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();
  if (jobError) {
    console.error("[resumes:job-load]", jobError);
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }
  if (!jobRow || !jobRow.analysis) {
    return NextResponse.json(
      { error: "Вакансия не найдена или ещё не разобрана." },
      { status: 404 }
    );
  }

  // Generate
  let output;
  try {
    const result = await generateObject({
      model: getInterviewerModel(),
      schema: tailoredOutputSchema,
      system: RESUME_SYSTEM_PROMPT,
      prompt: buildResumeUserPrompt({
        profile,
        jobAnalysis: jobRow.analysis,
      }),
    });
    output = result.object;
  } catch (err) {
    console.error("[resumes:generate]", err);
    return NextResponse.json(
      {
        error:
          "AI не смог собрать резюме. Возможно, профиль слишком короткий — добавь больше опыта и попробуй ещё раз.",
      },
      { status: 500 }
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      job_id: jobId,
      resume: output.resume,
      gap_report: output.gap_report,
      talking_points: output.talking_points,
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    console.error("[resumes:insert]", insertError);
    return NextResponse.json(
      { error: insertError?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: inserted.id });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Сервис временно недоступен" },
      { status: 503 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, job_id, created_at, jobs!inner(title, company)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[resumes:list]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resumes: data ?? [] });
}
