import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistRequest = {
  email?: unknown;
  source?: unknown;
};

export async function POST(request: Request) {
  let body: WaitlistRequest;
  try {
    body = (await request.json()) as WaitlistRequest;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Невалидный JSON" },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body.source === "string" ? body.source.slice(0, 64) : null;

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Похоже, это не email. Проверь и попробуй снова." },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    console.error("[waitlist] Supabase env not configured");
    return NextResponse.json(
      { ok: false, error: "Сервис временно недоступен. Попробуй позже." },
      { status: 503 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("waitlist")
    .upsert({ email, source }, { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("[waitlist] insert failed", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось сохранить email. Попробуй позже." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
