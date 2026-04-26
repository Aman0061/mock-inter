import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { NAV_ITEMS } from "./nav-config";
import { SidebarNav } from "./SidebarNav";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background-elevated lg:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-base font-semibold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FFA94D] text-sm font-bold text-background shadow-[0_0_24px_rgba(255,107,53,0.3)]">
            M
          </span>
          MockBuddy
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-8 px-3 py-6">
        <div>
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Меню
          </p>
          <SidebarNav items={NAV_ITEMS} />
        </div>

        <div>
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Совет дня
          </p>
          <div className="mx-1 rounded-xl border border-border bg-background p-4">
            <p className="font-display text-sm italic leading-snug text-foreground">
              «Лучше плохое интервью с AI, чем плохое с реальным интервьюером.»
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
              правило MockBuddy
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-medium text-foreground">
                Аккаунт
              </span>
              <span className="truncate font-mono text-[10px] uppercase tracking-wider text-muted">
                закрытая бета
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
