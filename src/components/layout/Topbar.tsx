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
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/65">
      <div className="flex min-h-16 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Navigation öffnen"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:text-foreground hover:shadow-md active:translate-y-0 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
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
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 shadow-sm backdrop-blur-md xl:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                locationsLoading
                  ? "animate-pulse bg-muted-foreground"
                  : "bg-accent shadow-[0_0_8px_hsl(var(--accent))]"
              }`}
            />

            <span className="text-[11px] font-semibold text-muted-foreground">
              {locationsLoading ? "Synchronisierung" : "Live"}
            </span>
          </div>

          <ThemeToggle />

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="hidden h-10 items-center justify-center rounded-xl border border-border/70 bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted hover:text-foreground hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex"
            >
              Abmelden
            </button>
          </form>

          <div className="ml-1 hidden items-center gap-3 rounded-2xl border border-transparent px-2 py-1.5 transition-colors duration-200 hover:border-border/60 hover:bg-muted/40 sm:flex">
            <div className="relative">
              <Avatar initials="GF" />

              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent" />
            </div>

            <div className="max-w-40 leading-tight">
              <div className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">
                Geschäftsführung
              </div>

              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {activeLocationLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </header>
  );
}