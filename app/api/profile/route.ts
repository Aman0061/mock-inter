import { auth } from "@clerk/nextjs/server";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { EMPTY_PROFILE, normalizeProfile } from "@/types/profile";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
function configError() {
  return NextResponse.json(
    { error: "Supabase is not configured" },
    { status: 503 }
  );
}

type DbError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

function toDeterministicUuid(userId: string): string {
  const digest = createHash("sha256").update(`mockbuddy:${userId}`).digest("hex");
  const hex = digest.slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function isInvalidUuidError(error: DbError | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "22P02" ||
    error.message.toLowerCase().includes("invalid input syntax for type uuid")
  );
}

function isMissingUpdatedAtError(error: DbError | null | undefined): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return message.includes("updated_at") && message.includes("does not exist");
}

function serializeDbError(error: DbError | null | undefined) {
  if (!error) {
    return { error: "Database error" };
  }
  return {
    error: error.message,
    details: error.details ?? null,
    hint: error.hint ?? null,
    code: error.code ?? null,
  };
}

function buildUserCandidates(userId: string): string[] {
  const uuidFallback = toDeterministicUuid(userId);
  return uuidFallback === userId ? [userId] : [userId, uuidFallback];
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();
  if (!isSupabaseConfigured()) return configError();

  const supabase = getSupabaseAdmin();

  let profileData: unknown = null;
  let updatedAt: string | null = null;
  let resolved = false;
  let lastError: DbError | null = null;

  for (const candidate of buildUserCandidates(userId)) {
    const { data, error } = await supabase
      .from("profiles")
      .select("data, updated_at")
      .eq("user_id", candidate)
      .maybeSingle();

    if (!error) {
      profileData = data?.data ?? null;
      updatedAt = data?.updated_at ?? null;
      resolved = true;
      break;
    }

    if (isMissingUpdatedAtError(error)) {
      const fallback = await supabase
        .from("profiles")
        .select("data")
        .eq("user_id", candidate)
        .maybeSingle();
      if (!fallback.error) {
        profileData = fallback.data?.data ?? null;
        updatedAt = null;
        resolved = true;
        break;
      }
      lastError = fallback.error;
      continue;
    }

    if (isInvalidUuidError(error) && candidate === userId) {
      lastError = error;
      continue;
    }

    lastError = error;
    break;
  }

  if (!resolved && lastError) {
    console.error("[profile:get]", lastError);
    return NextResponse.json(serializeDbError(lastError), { status: 500 });
  }

  return NextResponse.json({
    profile: profileData ? normalizeProfile(profileData) : EMPTY_PROFILE,
    updated_at: updatedAt,
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

  const normalizedProfile = normalizeProfile(body.profile);

  const supabase = getSupabaseAdmin();
  let writeError: DbError | null = null;
  let saved = false;

  for (const candidate of buildUserCandidates(userId)) {
    const withUpdatedAt = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: candidate,
          data: normalizedProfile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (!withUpdatedAt.error) {
      saved = true;
      break;
    }

    if (isMissingUpdatedAtError(withUpdatedAt.error)) {
      const withoutUpdatedAt = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: candidate,
            data: normalizedProfile,
          },
          { onConflict: "user_id" }
        );
      if (!withoutUpdatedAt.error) {
        saved = true;
        break;
      }
      writeError = withoutUpdatedAt.error;
      continue;
    }

    if (isInvalidUuidError(withUpdatedAt.error) && candidate === userId) {
      writeError = withUpdatedAt.error;
      continue;
    }

    writeError = withUpdatedAt.error;
    break;
  }

  if (!saved) {
    console.error("[profile:upsert]", writeError);
    return NextResponse.json(serializeDbError(writeError), { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
