import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resumeSchema } from "@/lib/ai/resume";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Сервис временно недоступен" },
      { status: 503 }
    );
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[resumes:get]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ resume: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Сервис временно недоступен" },
      { status: 503 }
    );
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[resumes:delete]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Сервис временно недоступен" },
      { status: 503 }
    );
  }

  let body: { resume?: unknown };
  try {
    body = (await req.json()) as { resume?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = resumeSchema.safeParse(body.resume);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректная структура резюме" },
      { status: 400 }
    );
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("resumes")
    .update({ resume: parsed.data })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[resumes:update]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ resume: parsed.data });
}
