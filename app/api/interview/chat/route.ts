import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { getInterviewerModel, isOpenAIConfigured } from "@/lib/ai/model";
import {
  buildInterviewerSystemPrompt,
  type InterviewType,
} from "@/lib/ai/prompts";

export const maxDuration = 60;

type ChatRequestBody = {
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

  const body = (await req.json()) as ChatRequestBody;
  const { messages, type, company } = body;

  const result = streamText({
    model: getInterviewerModel(),
    system: buildInterviewerSystemPrompt({ type, company }),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
