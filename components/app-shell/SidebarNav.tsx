"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Settings,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";
import type { IconName, NavItem } from "./nav-config";

const ICONS: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  interview: Sparkles,
  jobs: Briefcase,
  profile: User,
  analytics: BarChart3,
  settings: Settings,
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive =
          item.href === pathname || pathname.startsWith(item.href + "/");
        const Icon = ICONS[item.icon];

        if (item.soon) {
          return (
            <li key={item.href}>
              <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted opacity-60">
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                <span className="rounded border border-border px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-muted">
                  soon
                </span>
              </span>
            </li>
          );
        }

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-accent-soft text-foreground"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition ${
                  isActive ? "text-primary" : ""
                }`}
                strokeWidth={1.75}
              />
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <kbd className="hidden font-mono text-[10px] text-muted opacity-0 transition group-hover:opacity-100 sm:inline">
                  ⌘{item.shortcut}
                </kbd>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
