"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { NAV_ITEMS } from "./nav-config";
import { SidebarNav } from "./SidebarNav";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-border-strong hover:text-foreground lg:hidden"
        aria-label="Открыть меню"
      >
        <Menu className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-background-elevated">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 text-base font-semibold tracking-tight"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FFA94D] text-sm font-bold text-background">
                  M
                </span>
                MockBuddy
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-background hover:text-foreground"
                aria-label="Закрыть меню"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
            <div className="flex-1 px-3 py-6">
              <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                Меню
              </p>
              <SidebarNav items={NAV_ITEMS} />
            </div>
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-3 rounded-xl px-2 py-2">
                <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
                <span className="text-xs text-muted-foreground">Аккаунт</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
