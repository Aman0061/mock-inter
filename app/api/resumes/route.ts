import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NoObjectGeneratedError, generateObject } from "ai";
import { getInterviewerModel, isOpenAIConfigured } from "@/lib/ai/model";
import {
  RESUME_SYSTEM_PROMPT,
  buildResumeUserPrompt,
  enforceResumeTruthBudget,
  tailoredOutputSchema,
  type TailoredOutput,
} from "@/lib/ai/resume";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { isProfileFilled, normalizeProfile } from "@/types/profile";

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
  const { data: profileRow, error: profileLoadError } = await supabase
    .from("profiles")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileLoadError) {
    console.error("[resumes:profile-load]", profileLoadError);
    return NextResponse.json(
      { error: profileLoadError.message },
      { status: 500 }
    );
  }

  const profile = normalizeProfile(profileRow?.data ?? null);
  if (!isProfileFilled(profile)) {
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
  let output: TailoredOutput;
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
    output = enforceResumeTruthBudget(result.object);
  } catch (err) {
    console.error("[resumes:generate]", err);
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("[resumes:generate:no-object]", {
        finishReason: err.finishReason,
        cause: err.cause,
        text: err.text?.slice(0, 2000),
      });
    }
    return NextResponse.json(
      {
        error: NoObjectGeneratedError.isInstance(err)
          ? "AI вернул резюме не в том формате. Я уже ослабил схему — попробуй ещё раз."
          : "AI не смог собрать резюме. Попробуй ещё раз, а если повторится — пришли текст ошибки.",
        code: NoObjectGeneratedError.isInstance(err)
          ? "ai_schema_error"
          : "ai_generation_error",
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
