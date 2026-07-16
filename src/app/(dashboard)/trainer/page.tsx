"use client";

import { useMemo } from "react";
import { SectionHeading, Avatar, ProgressBar } from "@/components/ui/Primitives";
import { Card, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Stars } from "@/components/ui/Stars";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/format";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { useFilters } from "@/components/providers/FilterProvider";
import { trainers } from "@/lib/data/trainers";
import { locationName } from "@/lib/data/locations";
import type { Trend } from "@/lib/types";

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "flat")
    return <span className="text-muted-foreground">–</span>;
  return (
    <Icon
      name={trend === "up" ? "arrowUp" : "arrowDown"}
      size={15}
      className={cn(trend === "up" ? "text-success" : "text-danger")}
    />
  );
}

export default function TrainerPage() {
  const { locationId } = useFilters();

  const rows = useMemo(() => {
    const list =
      locationId === "all"
        ? trainers
        : trainers.filter((t) => t.locationId === locationId);
    return [...list].sort((a, b) => b.rating - a.rating);
  }, [locationId]);

  const stats = useMemo(() => {
    const avg = rows.reduce((s, t) => s + t.rating, 0) / (rows.length || 1);
    const underTarget = rows.filter((t) => t.rating < 3.6).length;
    const avgRetention =
      rows.reduce((s, t) => s + t.retentionPct, 0) / (rows.length || 1);
    return { avg, underTarget, avgRetention, top: rows[0] };
  }, [rows]);

  return (
    <div>
      <SectionHeading
        eyebrow="Betreuungsqualität"
        title="Trainer"
        description="Leistung, Bindung und Bewertungen aller Trainer im Netzwerk."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ø-Trainerbewertung"
          value={stats.avg.toFixed(1).replace(".", ",")}
          unit="/ 5"
          icon="star"
        />
        <KpiCard
          label="Ø-Retention"
          value={`${Math.round(stats.avgRetention)}`}
          unit="%"
          icon="trend"
          tone="accent"
        />
        <KpiCard
          label="Unter Zielbewertung"
          value={String(stats.underTarget)}
          icon="alert"
          tone={stats.underTarget > 0 ? "danger" : "neutral"}
        />
        <KpiCard
          label="Top-Performer"
          value={stats.top ? stats.top.rating.toFixed(1).replace(".", ",") : "–"}
          icon="trainer"
        />
      </div>

      <Card className="mt-6">
        <CardHeader title="Trainer-Ranking" subtitle={`${rows.length} Trainer`} />
        <div className="mt-2">
          <Table>
            <THead>
              <TH>#</TH>
              <TH>Trainer</TH>
              <TH>Standort</TH>
              <TH>Bewertung</TH>
              <TH align="right">Einheiten</TH>
              <TH>Retention</TH>
              <TH align="right">NPS-Beitrag</TH>
              <TH align="center">Trend</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              {rows.map((t, i) => (
                <TR key={t.id}>
                  <TD className="tabular-nums text-muted-foreground">{i + 1}</TD>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={t.initials} />
                      <span className="font-medium text-foreground">{t.name}</span>
                    </div>
                  </TD>
                  <TD className="text-sm text-muted-foreground">
                    {locationName(t.locationId)}
                  </TD>
                  <TD>
                    <Stars value={t.rating} size={12} />
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {t.sessions}
                  </TD>
                  <TD className="w-40">
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        value={t.retentionPct}
                        tone={
                          t.retentionPct >= 85
                            ? "success"
                            : t.retentionPct >= 75
                              ? "warning"
                              : "danger"
                        }
                      />
                      <span className="w-9 text-right text-xs font-medium tabular-nums text-muted-foreground">
                        {t.retentionPct}%
                      </span>
                    </div>
                  </TD>
                  <TD align="right" className="tabular-nums">
                    <span
                      className={cn(
                        "font-semibold",
                        t.npsContribution < 0 ? "text-danger" : "text-foreground",
                      )}
                    >
                      {t.npsContribution > 0 ? `+${t.npsContribution}` : t.npsContribution}
                    </span>
                  </TD>
                  <TD align="center">
                    <div className="flex justify-center">
                      <TrendIcon trend={t.trend} />
                    </div>
                  </TD>
                  <TD>
                    <StatusBadge status={t.status} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
