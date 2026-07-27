import type { UIMessage } from "ai";
import type { InterviewSession } from "@/types/interview";
import type { InterviewStorage } from "./types";

type ApiInterviewRow = {
  id: string;
  type: InterviewSession["type"];
  company: string | null;
  status: InterviewSession["status"];
  message_count: number;
  created_at: string;
  updated_at: string;
  messages?: UIMessage[];
  feedback?: string | null;
};

function rowToSession(row: ApiInterviewRow): InterviewSession {
  return {
    id: row.id,
    type: row.type,
    company: row.company ?? undefined,
    status: row.status,
    messageCount: row.message_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function request<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }
  return response.json() as Promise<T>;
}

export const remoteInterviewStorage: InterviewStorage = {
  listSessions: async () => {
    const data = await request<{ interviews: ApiInterviewRow[] }>(
      "/api/interviews"
    );
    return data.interviews.map(rowToSession);
  },

  getSession: async (id) => {
    try {
      const data = await request<{ interview: ApiInterviewRow }>(
        `/api/interviews/${id}`
      );
      return rowToSession(data.interview);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("404")) {
        return undefined;
      }
      throw err;
    }
  },

  createSession: async ({ type, company }) => {
    const data = await request<{ interview: ApiInterviewRow }>(
      "/api/interviews",
      {
        method: "POST",
        body: JSON.stringify({ type, company }),
      }
    );
    return rowToSession(data.interview);
  },

  updateSessionMeta: async (id, updates) => {
    const body: Record<string, unknown> = {};
    if (updates.status) body.status = updates.status;
    // message_count is updated automatically when messages are saved;
    // we still send status changes explicitly here.
    if (Object.keys(body).length === 0) return;
    await request(`/api/interviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  deleteSession: async (id) => {
    await request(`/api/interviews/${id}`, { method: "DELETE" });
  },

  loadMessages: async (id) => {
    const data = await request<{ interview: ApiInterviewRow }>(
      `/api/interviews/${id}`
    );
    return Array.isArray(data.interview.messages)
      ? data.interview.messages
      : [];
  },

  saveMessages: async (id, messages) => {
    await request(`/api/interviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ messages }),
    });
  },

  loadFeedback: async (id) => {
    const data = await request<{ interview: ApiInterviewRow }>(
      `/api/interviews/${id}`
    );
    return data.interview.feedback ?? null;
  },

  saveFeedback: async (id, markdown) => {
    await request(`/api/interviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ feedback: markdown }),
    });
  },
};
