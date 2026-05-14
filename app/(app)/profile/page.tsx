import { ProfileEditor } from "@/components/profile/ProfileEditor";

export const metadata = {
  title: "Профиль — MockBuddy",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <header className="border-b border-border pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Профиль
        </p>
        <h1 className="mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          Твой <span className="font-display italic text-primary">опыт</span>,
          как он есть
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Заполни честно — компании, роли, что реально делал, какие метрики
          трекал. Это база, по которой AI собирает резюме под каждую вакансию.
          Никаких выдумок.
        </p>
      </header>

      <div className="mt-10">
        <ProfileEditor />
      </div>
    </div>
  );
}
