"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/format";
import { networkStats } from "@/lib/data/dashboard";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/feedback", label: "Feedback", icon: "feedback" },
  { href: "/standorte", label: "Standorte", icon: "location" },
  { href: "/trainer", label: "Trainer", icon: "trainer" },
  { href: "/aufgaben", label: "Aufgaben", icon: "tasks", badge: networkStats.openTasks },
  { href: "/reports", label: "Reports", icon: "reports" },
  { href: "/jarvis", label: "Jarvis", icon: "jarvis" },
  { href: "/einstellungen", label: "Einstellungen", icon: "settings" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Marke */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon name="sparkle" size={17} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-card" />
        </span>
        <div className="leading-tight">
          <div className="font-display text-sm font-semibold tracking-tight text-foreground">
            PrimeSolutions
          </div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-accent">
            Insight
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-3">
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
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {active ? (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
              ) : null}
              <Icon
                name={item.icon}
                size={18}
                className={cn(active ? "text-accent" : "text-current")}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-danger-soft px-1.5 py-0.5 text-[11px] font-semibold text-danger">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Netzwerk-Status */}
      <div className="m-3 rounded-xl border border-border bg-muted/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Netzwerk-Status
          </span>
          <span className="text-xs font-semibold tabular-nums text-accent">
            {networkStats.qualityScore}/100
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${networkStats.qualityScore}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {networkStats.criticalIssues} kritische Themen ·{" "}
          {networkStats.openTasks} offene Aufgaben
        </p>
      </div>
    </div>
  );
}
