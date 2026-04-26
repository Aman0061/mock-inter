"use client";

import { InterviewList } from "@/components/interview/InterviewList";

// Dashboard shows only the 5 most recent — full list lives at /interview.
export function DashboardInterviewList() {
  return <InterviewList limit={5} />;
}
