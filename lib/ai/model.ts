import { openai } from "@ai-sdk/openai";

// The OpenAI provider reads OPENAI_API_KEY from process.env automatically.
// Override the model id via OPENAI_MODEL if needed (defaults to gpt-4o).

export function getInterviewerModel() {
  const modelId = process.env.OPENAI_MODEL ?? "gpt-4o";
  return openai(modelId);
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
