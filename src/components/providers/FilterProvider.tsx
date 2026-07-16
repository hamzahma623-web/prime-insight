"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { locations } from "@/lib/data/locations";

export type TimeRange = "7d" | "30d" | "90d" | "ytd";

export const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "Letzte 7 Tage" },
  { value: "30d", label: "Letzte 30 Tage" },
  { value: "90d", label: "Letzte 90 Tage" },
  { value: "ytd", label: "Jahr bis heute" },
];

export const LOCATION_OPTIONS = [
  { value: "all", label: "Alle Standorte" },
  ...locations.map((l) => ({ value: l.id, label: l.name })),
];

interface FilterContextValue {
  locationId: string; // "all" oder Standort-ID
  timeRange: TimeRange;
  setLocationId: (id: string) => void;
  setTimeRange: (r: TimeRange) => void;
  locationLabel: string;
  timeRangeLabel: string;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [locationId, setLocationId] = useState("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const value = useMemo<FilterContextValue>(() => {
    const locationLabel =
      LOCATION_OPTIONS.find((o) => o.value === locationId)?.label ??
      "Alle Standorte";
    const timeRangeLabel =
      TIME_RANGES.find((o) => o.value === timeRange)?.label ?? "Letzte 30 Tage";
    return {
      locationId,
      timeRange,
      setLocationId,
      setTimeRange,
      locationLabel,
      timeRangeLabel,
    };
  }, [locationId, timeRange]);

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx)
    throw new Error("useFilters muss innerhalb des FilterProvider liegen.");
  return ctx;
}
