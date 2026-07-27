import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getInterviewerModel, isOpenAIConfigured } from "@/lib/ai/model";
import {
  buildFeedbackSystemPrompt,
  type InterviewType,
} from "@/lib/ai/prompts";
import { checkRateLimit, getRequestIp } from "@/lib/rate-limit";

export const maxDuration = 60;

const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

type FeedbackRequestBody = {
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
    `interview-feedback:${getRequestIp(req)}`,
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

  const body = (await req.json()) as FeedbackRequestBody;
  const { messages, type, company } = body;

  const transcript = await convertToModelMessages(messages);

  const result = streamText({
    model: getInterviewerModel(),
    system: buildFeedbackSystemPrompt({ type, company }),
    messages: [
      ...transcript,
      {
        role: "user",
        content:
          "Кандидат завершил интервью и ждёт фидбек. Дай его в указанном формате.",
      },
    ],
  });

  return result.toTextStreamResponse();
}
