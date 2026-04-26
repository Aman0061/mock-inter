import type { InterviewType } from "@/lib/ai/prompts";

export type InterviewStatus = "active" | "completed";

export type InterviewSession = {
  id: string;
  type: InterviewType;
  company?: string;
  createdAt: string;
  updatedAt: string;
  status: InterviewStatus;
  messageCount: number;
};
