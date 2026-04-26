import {
  deleteSession as localDeleteSession,
  generateInterviewId,
  getSession as localGetSession,
  listSessions as localListSessions,
  loadFeedback as localLoadFeedback,
  loadMessages as localLoadMessages,
  saveFeedback as localSaveFeedback,
  saveMessages as localSaveMessages,
  saveSession as localSaveSession,
} from "./interviews";
import type { InterviewStorage } from "./types";

// Async facade over the synchronous localStorage helpers, so it shares the
// same interface as the remote (Supabase) implementation.

export const localInterviewStorage: InterviewStorage = {
  isRemote: false,

  listSessions: async () => localListSessions(),
  getSession: async (id) => localGetSession(id),

  createSession: async ({ type, company }) => {
    const id = generateInterviewId();
    const now = new Date().toISOString();
    const session = {
      id,
      type,
      company: company?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      status: "active" as const,
      messageCount: 0,
    };
    localSaveSession(session);
    return session;
  },

  updateSessionMeta: async (id, updates) => {
    const existing = localGetSession(id);
    if (!existing) return;
    localSaveSession({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },

  deleteSession: async (id) => localDeleteSession(id),

  loadMessages: async (id) => localLoadMessages(id),
  saveMessages: async (id, messages) => localSaveMessages(id, messages),

  loadFeedback: async (id) => localLoadFeedback(id),
  saveFeedback: async (id, markdown) => localSaveFeedback(id, markdown),
};
