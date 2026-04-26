import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { getInterviewerModel, isOpenAIConfigured } from "@/lib/ai/model";
import {
  JOB_ANALYSIS_SYSTEM_PROMPT,
  jobAnalysisSchema,
} from "@/lib/ai/job-analysis";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured())
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, title, company, seniority, status, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[jobs:list]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data ?? [] });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured())
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  if (!isOpenAIConfigured())
    return NextResponse.json(
      { error: "OpenAI is not configured" },
      { status: 503 }
    );

  let body: { raw_text?: unknown };
  try {
    body = (await req.json()) as { raw_text?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawText =
    typeof body.raw_text === "string" ? body.raw_text.trim() : "";

  if (rawText.length < 100) {
    return NextResponse.json(
      {
        error:
          "Текст вакансии слишком короткий — нужно минимум 100 символов.",
      },
      { status: 400 }
    );
  }
  if (rawText.length > 20000) {
    return NextResponse.json(
      { error: "Текст слишком длинный — максимум 20 000 символов." },
      { status: 400 }
    );
  }

  let analysis;
  try {
    const result = await generateObject({
      model: getInterviewerModel(),
      schema: jobAnalysisSchema,
      system: JOB_ANALYSIS_SYSTEM_PROMPT,
      prompt: `Вот текст вакансии:\n\n${rawText}\n\nИзвлеки структурированные данные.`,
    });
    analysis = result.object;
  } catch (err) {
    console.error("[jobs:analyze]", err);
    return NextResponse.json(
      {
        error:
          "AI не смог проанализировать эту вакансию. Проверь текст и попробуй ещё раз.",
      },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      user_id: userId,
      raw_text: rawText,
      title: analysis.title,
      company: analysis.company,
      seniority: analysis.seniority,
      analysis,
      status: "ready",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[jobs:insert]", error);
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id });
}
