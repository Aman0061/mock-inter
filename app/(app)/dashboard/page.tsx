import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowUpRight, Clock, Sparkles, Target, TrendingUp } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { DashboardInterviewList } from "@/components/dashboard/DashboardInterviewList";
import { StatTile } from "@/components/dashboard/StatTile";
import { INTERVIEW_TYPE_LABELS, type InterviewType } from "@/lib/ai/prompts";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata = {
  title: "Дашборд — MockBuddy",
};

function getName(user: Awaited<ReturnType<typeof currentUser>>): string {
  if (!user) return "PM";
  if (user.firstName) return user.firstName;
  return user.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "PM";
}

const TODAY_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

type DashboardStats = {
  total: number;
  completed: number;
  favoriteType: InterviewType | null;
};

async function getStats(userId: string): Promise<DashboardStats | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interviews")
    .select("type, status")
    .eq("user_id", userId);

  if (error || !data) {
    console.error("[dashboard:stats]", error);
    return null;
  }

  const total = data.length;
  const completed = data.filter((row) => row.status === "completed").length;

  const typeCounts = new Map<InterviewType, number>();
  for (const row of data) {
    const t = row.type as InterviewType;
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  const favoriteEntry = [...typeCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0];

  return {
    total,
    completed,
    favoriteType: favoriteEntry ? favoriteEntry[0] : null,
  };
}

export default async function DashboardPage() {
  const [{ userId }, user] = await Promise.all([auth(), currentUser()]);
  const name = getName(user);
  const stats = userId ? await getStats(userId) : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-10">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
            {TODAY_FORMATTER.format(new Date())}
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            С возвращением,{" "}
            <span className="font-display italic text-primary">{name}</span>.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Готов к новой тренировке? Выбери тип интервью — и через 15 минут у
            тебя будет фидбек по 5 критериям.
          </p>
        </div>
        <Link
          href="/interview/new"
          className={buttonClassName("primary", "h-11 px-5 text-sm")}
        >
          Начать интервью
          <ArrowUpRight className="ml-1.5 h-4 w-4" strokeWidth={1.75} />
        </Link>
      </header>

      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Sparkles}
          label="Интервью"
          value={String(stats?.total ?? 0)}
          subtitle={
            stats
              ? `${stats.completed} завершено`
              : "за всё время"
          }
        />
        <StatTile
          icon={Clock}
          label="Минут практики"
          value="—"
          subtitle="скоро"
        />
        <StatTile
          icon={TrendingUp}
          label="Стрик"
          value="—"
          subtitle="скоро"
          accent
        />
        <StatTile
          icon={Target}
          label="Любимый тип"
          value={
            stats?.favoriteType
              ? INTERVIEW_TYPE_LABELS[stats.favoriteType].split(" ")[0]
              : "—"
          }
          subtitle={
            stats?.favoriteType
              ? "по числу попыток"
              : "пройди первое"
          }
        />
      </section>

      <section className="mt-14">
        <div className="flex items-baseline justify-between border-b border-border pb-3">
          <h2 className="font-display text-2xl tracking-tight">
            Последние{" "}
            <span className="italic text-muted-foreground">интервью</span>
          </h2>
          <Link
            href="/interview"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
          >
            Все →
          </Link>
        </div>
        <div className="mt-6">
          <DashboardInterviewList />
        </div>
      </section>
    </div>
  );
}
