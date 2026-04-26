import type { UIMessage } from "ai";
import type { InterviewType } from "@/lib/ai/prompts";
import type { InterviewSession } from "@/types/interview";

export type CreateSessionInput = {
  type: InterviewType;
  company?: string;
};

export type SessionMetaUpdate = Partial<{
  status: "active" | "completed";
  messageCount: number;
}>;

export type InterviewStorage = {
  isRemote: boolean;

  listSessions: () => Promise<InterviewSession[]>;
  getSession: (id: string) => Promise<InterviewSession | undefined>;
  createSession: (input: CreateSessionInput) => Promise<InterviewSession>;
  updateSessionMeta: (id: string, updates: SessionMetaUpdate) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  loadMessages: (id: string) => Promise<UIMessage[]>;
  saveMessages: (id: string, messages: UIMessage[]) => Promise<void>;

  loadFeedback: (id: string) => Promise<string | null>;
  saveFeedback: (id: string, markdown: string) => Promise<void>;
};
