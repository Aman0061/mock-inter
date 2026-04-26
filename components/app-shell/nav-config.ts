// Plain serializable data so it can cross server → client component boundaries.
// Icon name is resolved to a Lucide component inside SidebarNav (client).

export type IconName =
  | "dashboard"
  | "interview"
  | "jobs"
  | "profile"
  | "analytics"
  | "settings";

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  shortcut?: string;
  soon?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Дашборд", href: "/dashboard", icon: "dashboard", shortcut: "1" },
  { label: "Интервью", href: "/interview", icon: "interview", shortcut: "2" },
  { label: "Вакансии", href: "/jobs", icon: "jobs", shortcut: "3" },
  { label: "Профиль", href: "/profile", icon: "profile", shortcut: "4" },
  { label: "Аналитика", href: "/analytics", icon: "analytics", soon: true },
  { label: "Настройки", href: "/settings", icon: "settings", soon: true },
];
