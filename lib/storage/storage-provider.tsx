"use client";

import { createContext, useContext } from "react";
import { remoteInterviewStorage } from "./interviews-remote";
import type { InterviewStorage } from "./types";

// Interview pages are auth-protected (see middleware.ts), so storage is
// always the remote (Supabase) implementation — no anonymous/local mode.
const StorageContext = createContext<InterviewStorage>(remoteInterviewStorage);

export function InterviewStorageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorageContext.Provider value={remoteInterviewStorage}>
      {children}
    </StorageContext.Provider>
  );
}

export function useInterviewStorage(): InterviewStorage {
  return useContext(StorageContext);
}
