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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Navigation öffnen"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground lg:hidden"
      >
        <Icon name="menu" size={18} />
      </button>

      <div className="flex items-center gap-2">
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
        <div className="relative hidden md:block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon name="search" size={15} />
          </span>

          <input
            type="search"
            placeholder="Suchen…"
            className="h-9 w-52 rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <button
          type="button"
          aria-label="Benachrichtigungen"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon name="bell" size={17} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
        </button>

        <ThemeToggle />

        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="hidden h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            Abmelden
          </button>
        </form>

        <div className="ml-1 hidden items-center gap-2.5 sm:flex">
          <Avatar initials="GF" />

          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">
              Geschäftsführung
            </div>

            <div className="text-xs text-muted-foreground">
              {locationId === "all"
                ? "Alle Standorte"
                : locationOptions.find(
                    (option) => option.value === locationId
                  )?.label ?? "Standort"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}