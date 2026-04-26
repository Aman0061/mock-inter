"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { localInterviewStorage } from "./interviews-local";
import { remoteInterviewStorage } from "./interviews-remote";
import type { InterviewStorage } from "./types";

const StorageContext = createContext<InterviewStorage>(localInterviewStorage);

export function InterviewStorageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useAuth();

  const value = useMemo<InterviewStorage>(() => {
    // Until Clerk has loaded, default to local — avoids hitting the API
    // before we know who the user is. Once known, switch.
    if (isLoaded && isSignedIn) return remoteInterviewStorage;
    return localInterviewStorage;
  }, [isLoaded, isSignedIn]);

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  );
}

export function useInterviewStorage(): InterviewStorage {
  return useContext(StorageContext);
}
