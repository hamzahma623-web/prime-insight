"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TimeRange = "7d" | "30d" | "90d" | "ytd";

type ApiLocation = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
};

type LocationOption = {
  value: string;
  label: string;
};

type LocationsApiResponse = {
  ok: boolean;
  locations?: ApiLocation[];
  error?: string;
};

export const TIME_RANGES: {
  value: TimeRange;
  label: string;
}[] = [
  { value: "7d", label: "Letzte 7 Tage" },
  { value: "30d", label: "Letzte 30 Tage" },
  { value: "90d", label: "Letzte 90 Tage" },
  { value: "ytd", label: "Jahr bis heute" },
];

interface FilterContextValue {
  locationId: string;
  timeRange: TimeRange;
  setLocationId: (id: string) => void;
  setTimeRange: (range: TimeRange) => void;
  locationLabel: string;
  timeRangeLabel: string;
  locationOptions: LocationOption[];
  locationsLoading: boolean;
  locationsError: string;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [locationId, setLocationId] = useState("all");
  const [timeRange, setTimeRange] =
    useState<TimeRange>("30d");

  const [locations, setLocations] = useState<ApiLocation[]>([]);
  const [locationsLoading, setLocationsLoading] =
    useState(true);
  const [locationsError, setLocationsError] =
    useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLocations() {
      setLocationsLoading(true);
      setLocationsError("");

      try {
        const response = await fetch("/api/locations/list", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const result =
          (await response.json()) as LocationsApiResponse;

        if (!response.ok || !result.ok) {
          throw new Error(
            result.error ||
              "Standorte konnten nicht geladen werden."
          );
        }

        const loadedLocations = result.locations ?? [];

        setLocations(loadedLocations);

        setLocationId((currentLocationId) => {
          if (currentLocationId === "all") {
            return "all";
          }

          const stillExists = loadedLocations.some(
            (location) =>
              location.slug === currentLocationId ||
              location.id === currentLocationId
          );

          return stillExists ? currentLocationId : "all";
        });
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Locations loading failed:", error);

        setLocations([]);
        setLocationId("all");

        setLocationsError(
          error instanceof Error
            ? error.message
            : "Standorte konnten nicht geladen werden."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLocationsLoading(false);
        }
      }
    }

    void loadLocations();

    return () => {
      controller.abort();
    };
  }, []);

  const locationOptions = useMemo<LocationOption[]>(
    () => [
      {
        value: "all",
        label: "Alle Standorte",
      },
      ...locations.map((location) => ({
        value: location.slug,
        label: location.name,
      })),
    ],
    [locations]
  );

  const value = useMemo<FilterContextValue>(() => {
    const locationLabel =
      locationOptions.find(
        (option) => option.value === locationId
      )?.label ?? "Alle Standorte";

    const timeRangeLabel =
      TIME_RANGES.find(
        (option) => option.value === timeRange
      )?.label ?? "Letzte 30 Tage";

    return {
      locationId,
      timeRange,
      setLocationId,
      setTimeRange,
      locationLabel,
      timeRangeLabel,
      locationOptions,
      locationsLoading,
      locationsError,
    };
  }, [
    locationId,
    timeRange,
    locationOptions,
    locationsLoading,
    locationsError,
  ]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error(
      "useFilters muss innerhalb des FilterProvider liegen."
    );
  }

  return context;
}