import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { EMPTY_PROFILE, type Profile } from "@/types/profile";

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
    .from("profiles")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profile:get]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile: (data?.data as Profile | undefined) ?? EMPTY_PROFILE,
    updated_at: data?.updated_at ?? null,
  });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) return configError();

  let body: { profile?: unknown };
  try {
    body = (await req.json()) as { profile?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.profile || typeof body.profile !== "object") {
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        data: body.profile,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[profile:upsert]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
