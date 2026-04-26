import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { getInterviewerModel, isOpenAIConfigured } from "@/lib/ai/model";
import {
  buildFeedbackSystemPrompt,
  type InterviewType,
} from "@/lib/ai/prompts";

export const maxDuration = 60;

type FeedbackRequestBody = {
  messages: UIMessage[];
  type: InterviewType;
  company?: string;
};

export async function POST(req: Request) {
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
