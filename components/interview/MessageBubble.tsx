import type { UIMessage } from "ai";

export function getMessageText(message: UIMessage): string {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}

export function MessageBubble({ message }: { message: UIMessage }) {
  const text = getMessageText(message);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[88%] flex-col gap-1.5 sm:max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {isUser ? "Ты" : "AI-PM"}
        </p>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background-elevated text-foreground"
          }`}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  );
}
