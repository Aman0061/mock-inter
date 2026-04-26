import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import type { InterviewType } from "@/lib/ai/prompts";

const VALID_TYPES: readonly InterviewType[] = [
  "product_sense",
  "behavioral",
  "analytical",
  "strategy",
];

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function configError() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 }
  );
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) return configError();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interviews")
    .select("id, type, company, status, message_count, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[interviews:list]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ interviews: data ?? [] });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) return configError();

  let body: { type?: unknown; company?: unknown };
  try {
    body = (await req.json()) as { type?: unknown; company?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type as InterviewType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const company =
    typeof body.company === "string" && body.company.trim().length > 0
      ? body.company.trim().slice(0, 120)
      : null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interviews")
    .insert({ user_id: userId, type, company, messages: [] })
    .select("id, type, company, status, message_count, created_at, updated_at")
    .single();

  if (error || !data) {
    console.error("[interviews:create]", error);
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ interview: data });
}
