import { InterviewChat } from "@/components/interview/InterviewChat";

export const metadata = {
  title: "Интервью — MockBuddy",
};

export default async function InterviewChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InterviewChat sessionId={id} />;
}
