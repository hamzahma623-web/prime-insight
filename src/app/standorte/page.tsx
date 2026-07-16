"use client";

import { useMemo } from "react";
import { SectionHeading, StatusDot } from "@/components/ui/Primitives";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { RadialGauge } from "@/components/charts/RadialGauge";
import { Sparkline } from "@/components/charts/Sparkline";
import { StatusBadge } from "@/components/ui/Badge";
import { Delta } from "@/components/ui/Delta";
import { Stars } from "@/components/ui/Stars";
import { Icon } from "@/lib/icons";
import { useFilters } from "@/components/providers/FilterProvider";
import { locations } from "@/lib/data/locations";

export default function StandortePage() {
  const { locationId } = useFilters();

  const shown = useMemo(
    () =>
      locationId === "all"
        ? locations
        : locations.filter((l) => l.id === locationId),
    [locationId],
  );

  return (
    <div>
      <SectionHeading
        eyebrow={`${locations.length} Standorte`}
        title="Standorte"
        description="Qualitäts- und Betriebskennzahlen je Standort im direkten Vergleich."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((l) => (
          <Card key={l.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <StatusDot status={l.status} pulse={l.status === "critical"} />
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {l.name}
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {l.city} · {l.region}
                </p>
              </div>
              <StatusBadge status={l.status} />
            </div>

            <div className="mt-4 flex items-center gap-4">
              <RadialGauge value={l.qualityScore} size={96} label="Quality" />
              <div className="flex-1 space-y-2">
                <Row label="Ø-Bewertung">
                  <Stars value={l.avgRating} size={12} />
                </Row>
                <Row label="NPS">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {l.nps > 0 ? `+${l.nps}` : l.nps}
                  </span>
                </Row>
                <Row label="Mitglieder">
                  <Delta value={l.memberChangePct} invert />
                </Row>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <Stat label="Feedbacks" value={String(l.feedbackCount)} />
              <Stat label="Offen" value={String(l.openTasks)} />
              <Stat
                label="Kritisch"
                value={String(l.criticalIssues)}
                tone={l.criticalIssues > 0 ? "danger" : "default"}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="trainer" size={14} />
                {l.manager}
              </div>
              <Sparkline
                values={l.ratingTrend}
                color={l.status === "critical" ? "var(--danger)" : "var(--accent)"}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div>
      <div
        className={
          "font-display text-lg font-semibold tabular-nums " +
          (tone === "danger" ? "text-danger" : "text-foreground")
        }
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
