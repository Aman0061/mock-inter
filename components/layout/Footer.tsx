import Link from "next/link";

const SECTIONS: Array<{
  title: string;
  links: Array<{ label: string; href: string }>;
}> = [
  {
    title: "Продукт",
    links: [
      { label: "AI-интервью", href: "/interview/new" },
      { label: "Дашборд", href: "/dashboard" },
      { label: "Waitlist", href: "/#waitlist" },
    ],
  },
  {
    title: "Аккаунт",
    links: [
      { label: "Войти", href: "/sign-in" },
      { label: "Регистрация", href: "/sign-up" },
    ],
  },
  {
    title: "Узнать",
    links: [
      { label: "Как работает", href: "/#how" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-12 sm:grid-cols-4">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-[#FF6B35] to-[#FFA94D] text-[11px] font-bold text-background">
                M
              </span>
              MockBuddy
            </Link>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Mock-интервью для PM-ов в СНГ. AI-тренажёр и живые интервьюеры из
              топ-компаний.
            </p>
          </div>
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                {section.title}
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 font-mono text-[10px] uppercase tracking-widest text-muted sm:flex-row sm:items-center">
          <p>© 2026 MockBuddy</p>
          <p>Сделано для PM-ов в СНГ</p>
        </div>
      </div>
    </footer>
  );
}
