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
      {/* Marke */}
      <div className="relative flex min-h-[76px] items-center px-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="focus-ring group flex w-full items-center gap-3 rounded-[var(--radius-control)]"
        >
          <span className="surface relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] transition-transform duration-500 ease-out group-hover:scale-[1.04]">
            <Image
              src="/brand/fitness-level-logo.png"
              alt="Fitness Level"
              width={40}
              height={28}
              priority
              className="h-auto w-9 object-contain"
            />
          </span>

          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-sm font-semibold tracking-[var(--tracking-tight)] text-foreground">
              Fitness Level
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[var(--tracking-label)] text-accent">
              Prime Insight
            </span>
          </span>
        </Link>
      </div>

      <div className="mx-5 h-px bg-border" />

      {/* Navigation */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-eyebrow text-muted-foreground/60">
          Workspace
        </p>

        <div className="space-y-0.5">
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
                  "focus-ring group relative flex min-h-[42px] items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm font-medium",
                  "transition-[background-color,color,transform] duration-200 ease-out",
                  active
                    ? "bg-foreground text-background shadow-[var(--shadow-card)] dark:bg-white dark:text-[#0a0b0d]"
                    : "text-muted-foreground hover:translate-x-[2px] hover:bg-muted hover:text-foreground"
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-[9px] left-0 w-[3px] rounded-r-full bg-accent"
                  />
                ) : null}

                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105",
                    active ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <Icon name={item.icon} size={18} />
                </span>

                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Statuskarte */}
      <div className="relative p-3 pt-0">
        <div className="surface flex items-center gap-3 rounded-[var(--radius-card)] p-3.5">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inline-flex h-2.5 w-2.5 animate-ping-slow rounded-full bg-accent/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              System bereit
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Live-Daten aktiv
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}