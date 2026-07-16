"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/ui/Primitives";
import { KpiCard } from "@/components/ui/KpiCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { RadialGauge } from "@/components/charts/RadialGauge";
import { Sparkline } from "@/components/charts/Sparkline";
import { Stars } from "@/components/ui/Stars";
import { Delta } from "@/components/ui/Delta";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { StatusDot, Avatar } from "@/components/ui/Primitives";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Icon } from "@/lib/icons";
import { formatNumber } from "@/lib/format";
import { useFilters } from "@/components/providers/FilterProvider";
import {
  networkStats,
  ratingDevelopment,
  criticalIssues,
  topCritiques,
  executiveSummary,
} from "@/lib/data/dashboard";
import { locations, locationName } from "@/lib/data/locations";
import { topTrainers } from "@/lib/data/trainers";

export default function DashboardPage() {
  const { locationLabel, timeRangeLabel } = useFilters();
  const sortedLocations = [...locations].sort(
    (a, b) => b.qualityScore - a.qualityScore,
  );

  return (
    <div>
      <SectionHeading
        eyebrow="Übersicht"
        title="Executive Dashboard"
        description={`${locationLabel} · ${timeRangeLabel}`}
        action={
          <Link
            href="/jarvis"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Icon name="jarvis" size={16} />
            Jarvis fragen
          </Link>
        }
      />

      {/* Hero: Quality-Gauge + KPI-Strip */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="flex flex-col items-center justify-center p-6 lg:col-span-1">
          <RadialGauge value={networkStats.qualityScore} label="Quality Score" size={150} />
          <div className="mt-4 flex items-center gap-2">
            <Delta value={networkStats.qualityDelta} suffix="" />
            <span className="text-xs text-muted-foreground">ggü. Vorwoche</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Netzweiter Qualitätsindex über 8 Standorte
          </p>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 lg:col-span-3">
          <KpiCard
            label="Ø-Bewertung"
            value={networkStats.avgRating.toFixed(1).replace(".", ",")}
            unit="/ 5"
            delta={networkStats.avgRatingDelta}
            deltaSuffix=""
            icon="star"
            visual={<Stars value={networkStats.avgRating} showValue={false} size={13} />}
          />
          <KpiCard
            label="NPS"
            value={`+${networkStats.nps}`}
            delta={networkStats.npsDelta}
            deltaSuffix=""
            icon="trend"
            tone="accent"
          />
          <KpiCard
            label="Feedbacks"
            value={formatNumber(networkStats.feedbackCount)}
            delta={networkStats.feedbackDelta}
            icon="feedback"
          />
          <KpiCard
            label="Offene Aufgaben"
            value={String(networkStats.openTasks)}
            icon="tasks"
          />
          <KpiCard
            label="Kritische Probleme"
            value={String(networkStats.criticalIssues)}
            icon="alert"
            tone="danger"
          />
          <KpiCard
            label="Mitglieder-Trend"
            value="-0,8"
            unit="%"
            delta={-0.8}
            deltaInvert
            icon="users"
          />
        </div>
      </div>

      {/* Bewertungsentwicklung + KI Executive Summary */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Bewertungsentwicklung"
            subtitle="Netzwerk vs. kritischer Standort (Köln Ring)"
            action={
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Netzwerk
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-danger" /> Köln Ring
                </span>
              </div>
            }
          />
          <CardBody>
            <LineChart
              labels={ratingDevelopment.labels}
              min={3.6}
              max={4.6}
              series={[
                { name: "Netzwerk", values: ratingDevelopment.network, color: "var(--accent)", area: true },
                { name: "Köln Ring", values: ratingDevelopment.koeln, color: "var(--danger)" },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <Icon name="sparkle" size={15} className="text-accent" />
                KI Executive Summary
              </span>
            }
            subtitle="Automatisch generiert · KW29"
          />
          <CardBody className="pt-2">
            <p className="text-sm font-semibold text-foreground">
              {executiveSummary.headline}
            </p>
            <ul className="mt-3 space-y-2.5">
              {executiveSummary.points.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/jarvis"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Details mit Jarvis vertiefen
              <Icon name="chevronRight" size={14} />
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Standortvergleich + Trainer-Ranking */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Standortvergleich" subtitle="Sortiert nach Quality Score" />
          <div className="mt-2">
            <Table>
              <THead>
                <TH>Standort</TH>
                <TH>Status</TH>
                <TH align="right">Quality</TH>
                <TH align="right">Ø</TH>
                <TH align="right">NPS</TH>
                <TH align="right">Offen</TH>
                <TH align="right">Trend</TH>
              </THead>
              <TBody>
                {sortedLocations.map((l) => (
                  <TR key={l.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <StatusDot status={l.status} pulse={l.status === "critical"} />
                        <div>
                          <div className="font-medium text-foreground">{l.name}</div>
                          <div className="text-xs text-muted-foreground">{l.city}</div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <StatusBadge status={l.status} />
                    </TD>
                    <TD align="right" className="font-semibold tabular-nums">
                      {l.qualityScore}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {l.avgRating.toFixed(1).replace(".", ",")}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {l.nps > 0 ? `+${l.nps}` : l.nps}
                    </TD>
                    <TD align="right" className="tabular-nums">
                      {l.openTasks}
                    </TD>
                    <TD align="right">
                      <div className="flex justify-end">
                        <Sparkline
                          values={l.ratingTrend}
                          color={l.status === "critical" ? "var(--danger)" : "var(--accent)"}
                        />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Trainer-Ranking" subtitle="Top 5 nach Bewertung" />
          <CardBody className="space-y-3 pt-2">
            {topTrainers.slice(0, 5).map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="w-4 text-sm font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <Avatar initials={t.initials} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {t.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {locationName(t.locationId)}
                  </div>
                </div>
                <Stars value={t.rating} size={12} />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Häufigste Kritikpunkte + Kritische Probleme */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Häufigste Kritikpunkte"
            subtitle="Netzweit nach Nennungen · Veränderung ggü. Vorperiode"
          />
          <CardBody>
            <BarChart
              data={topCritiques.map((c) => ({
                label: c.category,
                value: c.mentions,
                color:
                  c.changePct > 20
                    ? "var(--danger)"
                    : c.changePct > 0
                      ? "var(--warning)"
                      : "var(--accent)",
                caption: `${c.changePct > 0 ? "+" : ""}${c.changePct}% ggü. Vorperiode`,
              }))}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Kritische Probleme" subtitle="Sofortige Aufmerksamkeit" />
          <CardBody className="space-y-3 pt-2">
            {criticalIssues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-xl border border-border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {issue.label}
                  </span>
                  <PriorityBadge priority={issue.severity} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{locationName(issue.locationId)}</span>
                  <span className="inline-flex items-center gap-2">
                    <span className="tabular-nums">{issue.count} Nennungen</span>
                    <Delta value={issue.changePct} invert />
                  </span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
