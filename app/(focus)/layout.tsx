import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/85 px-5 backdrop-blur-md sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="font-mono uppercase tracking-widest">
            Дашборд
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="ml-auto flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-[#FF6B35] to-[#FFA94D] text-xs font-bold text-background">
            M
          </span>
          <span className="hidden sm:inline">MockBuddy</span>
        </Link>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
