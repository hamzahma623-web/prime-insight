"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/format";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    href: "/feedback",
    label: "Feedback",
    icon: "feedback",
  },
  {
    href: "/standorte",
    label: "Standorte",
    icon: "location",
  },
  {
    href: "/trainer",
    label: "Trainer",
    icon: "trainer",
  },
  {
    href: "/aufgaben",
    label: "Aufgaben",
    icon: "tasks",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: "reports",
  },
  {
    href: "/jarvis",
    label: "Jarvis",
    icon: "jarvis",
  },
  {
    href: "/einstellungen",
    label: "Einstellungen",
    icon: "settings",
  },
];

export function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="animate-fade relative flex h-full flex-col overflow-hidden bg-background">
      <div className="relative flex min-h-[88px] items-center border-b border-border/60 px-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="focus-ring group flex w-full items-center gap-3 rounded-[var(--radius-control)] transition-colors duration-200 ease-out"
        >
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-white/10 bg-black shadow-[var(--shadow-flat)]">
            <Image
              src="/brand/fitness-level-logo.png"
              alt="Fitness Level"
              width={42}
              height={30}
              priority
              className="h-auto w-10 object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />

            <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-accent" />
          </span>

          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-sm font-semibold tracking-[var(--tracking-tight)] text-foreground">
              Fitness Level
            </span>

            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[var(--tracking-label)] text-accent">
              Prime Insight
            </span>
          </span>
        </Link>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-eyebrow text-muted-foreground/70">
          Workspace
        </p>

        <div className="space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-[var(--radius-control)] px-3.5 text-sm font-medium",
                  "transition-colors duration-200 ease-out",
                  active
                    ? "bg-foreground text-background shadow-[var(--shadow-flat)] dark:bg-white dark:text-black"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-accent"
                  />
                ) : null}

                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                    active
                      ? "bg-background/10 text-accent dark:bg-black/5"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <Icon name={item.icon} size={17} />
                </span>

                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="relative p-3 pt-0">
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-[var(--shadow-flat)]">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon name="sparkle" size={15} />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                System bereit
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Live-Daten aktiv
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}