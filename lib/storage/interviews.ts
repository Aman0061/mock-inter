import type { UIMessage } from "ai";
import type { InterviewSession } from "@/types/interview";

const SESSIONS_KEY = "mockbuddy:interviews";
const messagesKey = (id: string) => `mockbuddy:interview:${id}:messages`;
const feedbackKey = (id: string) => `mockbuddy:interview:${id}:feedback`;

function isBrowser() {
  return typeof window !== "undefined";
}

export function generateInterviewId(): string {
  // Timestamp + random suffix gives chronological hint and collision safety.
  return `iv_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function listSessions(): InterviewSession[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InterviewSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSession(id: string): InterviewSession | undefined {
  return listSessions().find((s) => s.id === id);
}

export function saveSession(session: InterviewSession): void {
  if (!isBrowser()) return;
  const sessions = listSessions().filter((s) => s.id !== session.id);
  sessions.unshift(session);
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  if (!isBrowser()) return;
  const sessions = listSessions().filter((s) => s.id !== id);
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  window.localStorage.removeItem(messagesKey(id));
  window.localStorage.removeItem(feedbackKey(id));
}

export function loadMessages(id: string): UIMessage[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(messagesKey(id));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UIMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMessages(id: string, messages: UIMessage[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(messagesKey(id), JSON.stringify(messages));
}

export function loadFeedback(id: string): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(feedbackKey(id));
}

export function saveFeedback(id: string, markdown: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(feedbackKey(id), markdown);
}
