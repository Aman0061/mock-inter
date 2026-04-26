import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function configError() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 }
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) return configError();

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[interviews:get]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ interview: data });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) return configError();

  const { id } = await params;

  let body: {
    messages?: unknown;
    feedback?: unknown;
    status?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (Array.isArray(body.messages)) {
    updates.messages = body.messages;
    updates.message_count = body.messages.length;
  }
  if (typeof body.feedback === "string") {
    updates.feedback = body.feedback;
  }
  if (body.status === "active" || body.status === "completed") {
    updates.status = body.status;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interviews")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, type, company, status, message_count, created_at, updated_at")
    .maybeSingle();

  if (error) {
    console.error("[interviews:patch]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ interview: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) return configError();

  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("interviews")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[interviews:delete]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
