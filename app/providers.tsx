"use client";

import { InterviewStorageProvider } from "@/lib/storage/storage-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <InterviewStorageProvider>{children}</InterviewStorageProvider>;
}
