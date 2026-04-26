import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button, buttonClassName } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-base font-semibold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FFA94D] text-sm font-bold text-background shadow-[0_0_24px_rgba(255,107,53,0.25)]">
            M
          </span>
          MockBuddy
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/interview"
            className="hidden px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
          >
            Попробовать AI
          </Link>
          <Link
            href="/#faq"
            className="hidden px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
          >
            FAQ
          </Link>
          <Show when="signed-out">
            <SignInButton>
              <Button variant="ghost" className="h-9 px-3 text-sm">
                Войти
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="h-9 px-3 text-sm">Регистрация</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className={buttonClassName("ghost", "h-9 px-3 text-sm")}
            >
              Дашборд
            </Link>
            <UserButton />
          </Show>
        </nav>
      </div>
    </header>
  );
}
