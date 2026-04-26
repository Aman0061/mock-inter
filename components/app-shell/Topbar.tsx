import Link from "next/link";
import { Search } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { MobileNav } from "./MobileNav";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-5 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileNav />
        <button
          type="button"
          className="hidden items-center gap-2 rounded-lg border border-border bg-background-elevated px-3 py-1.5 text-xs text-muted-foreground transition hover:border-border-strong hover:text-foreground sm:flex"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>Поиск</span>
          <kbd className="ml-3 rounded border border-border px-1.5 font-mono text-[10px] text-muted">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/interview/new"
          className={buttonClassName("primary", "h-9 px-4 text-sm")}
        >
          Новое интервью
        </Link>
      </div>
    </header>
  );
}
