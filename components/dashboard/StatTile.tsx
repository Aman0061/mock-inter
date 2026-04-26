import type { LucideIcon } from "lucide-react";

type StatTileProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle: string;
  accent?: boolean;
};

export function StatTile({
  icon: Icon,
  label,
  value,
  subtitle,
  accent = false,
}: StatTileProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 transition ${
        accent
          ? "border-primary/30 bg-accent-soft"
          : "border-border bg-background-elevated hover:border-border-strong"
      }`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon
          className={`h-3.5 w-3.5 ${accent ? "text-primary" : ""}`}
          strokeWidth={1.75}
        />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]">
          {label}
        </p>
      </div>
      <p className="mt-4 font-display text-4xl tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{subtitle}</p>
    </div>
  );
}
