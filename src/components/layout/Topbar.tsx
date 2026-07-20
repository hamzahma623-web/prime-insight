"use client";

import {
  TIME_RANGES,
  useFilters,
} from "@/components/providers/FilterProvider";
import { Select } from "@/components/ui/Select";
import { ThemeToggle } from "./ThemeToggle";
import { Icon } from "@/lib/icons";
import { Avatar } from "@/components/ui/Primitives";

export function Topbar({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  const {
    locationId,
    setLocationId,
    timeRange,
    setTimeRange,
    locationOptions,
    locationsLoading,
  } = useFilters();

  const activeLocationLabel =
    locationId === "all"
      ? "Alle Standorte"
      : locationOptions.find(
          (option) => option.value === locationId
        )?.label ?? "Standort";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex min-h-16 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Navigation öffnen"
          className="focus-ring interactive inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Icon name="menu" size={18} />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <Select
            ariaLabel="Standort filtern"
            icon="location"
            value={locationId}
            options={locationOptions}
            onChange={setLocationId}
          />

          <Select
            ariaLabel="Zeitraum filtern"
            icon="clock"
            value={timeRange}
            options={TIME_RANGES}
            onChange={(value) =>
              setTimeRange(value as typeof timeRange)
            }
            className="hidden sm:inline-flex"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card px-3 py-1.5 xl:flex">
            <span className="relative flex h-2 w-2 items-center justify-center">
              {locationsLoading ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
              ) : (
                <>
                  <span className="absolute inline-flex h-2 w-2 animate-ping-slow rounded-full bg-accent/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </>
              )}
            </span>

            <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
              {locationsLoading ? "Synchronisierung" : "Live"}
            </span>
          </div>

          <ThemeToggle />

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="focus-ring interactive hidden h-10 items-center justify-center rounded-[var(--radius-control)] border border-border bg-card px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Abmelden
            </button>
          </form>

          <div className="focus-ring ml-1 hidden items-center gap-3 rounded-[var(--radius-control)] border border-transparent px-2 py-1.5 transition-colors duration-200 hover:border-border hover:bg-muted/50 sm:flex">
            <div className="relative">
              <Avatar initials="GF" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent" />
            </div>

            <div className="max-w-40 leading-tight">
              <div className="truncate text-sm font-semibold tracking-[var(--tracking-tight)] text-foreground">
                Geschäftsführung
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {activeLocationLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}