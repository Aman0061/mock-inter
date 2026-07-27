import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getInterviewerModel, isOpenAIConfigured } from "@/lib/ai/model";
import {
  buildInterviewerSystemPrompt,
  type InterviewType,
} from "@/lib/ai/prompts";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

export const maxDuration = 60;

const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

type ChatRequestBody = {
  messages: UIMessage[];
  type: InterviewType;
  company?: string;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(
    `interview-chat:${getRequestIp(req)}`,
    RATE_LIMIT,
    RATE_LIMIT_WINDOW_MS
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуй через минуту." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 }
    );
  }

  const body = (await req.json()) as ChatRequestBody;
  const { messages, type, company } = body;

  const result = streamText({
    model: getInterviewerModel(),
    system: buildInterviewerSystemPrompt({ type, company }),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
