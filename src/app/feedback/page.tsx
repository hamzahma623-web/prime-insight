"use client";

import { useMemo, useState } from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Stars } from "@/components/ui/Stars";
import { Badge, SentimentBadge } from "@/components/ui/Badge";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/Table";
import { cn, formatDateTime } from "@/lib/format";
import { useFilters } from "@/components/providers/FilterProvider";
import { recentFeedback } from "@/lib/data/feedback";
import { locationName } from "@/lib/data/locations";
import type { Channel, Sentiment } from "@/lib/types";

const CHANNEL_LABEL: Record<Channel, string> = {
  app: "App",
  google: "Google",
  email: "E-Mail",
  front_desk: "Rezeption",
  survey: "Umfrage",
};

const SENTIMENT_FILTERS: { value: Sentiment | "all"; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "negative", label: "Negativ" },
  { value: "neutral", label: "Neutral" },
  { value: "positive", label: "Positiv" },
];

export default function FeedbackPage() {
  const { locationId } = useFilters();
  const [sentiment, setSentiment] = useState<Sentiment | "all">("all");

  const filtered = useMemo(() => {
    return recentFeedback.filter((f) => {
      if (locationId !== "all" && f.locationId !== locationId) return false;
      if (sentiment !== "all" && f.sentiment !== sentiment) return false;
      return true;
    });
  }, [locationId, sentiment]);

  const counts = useMemo(() => {
    const base = recentFeedback.filter(
      (f) => locationId === "all" || f.locationId === locationId,
    );
    return {
      total: base.length,
      negative: base.filter((f) => f.sentiment === "negative").length,
      positive: base.filter((f) => f.sentiment === "positive").length,
      avg:
        base.reduce((s, f) => s + f.rating, 0) / (base.length || 1),
    };
  }, [locationId]);

  return (
    <div>
      <SectionHeading
        eyebrow="Stimmen der Mitglieder"
        title="Feedback"
        description="Alle Bewertungen und Kommentare, KI-kategorisiert nach Thema und Stimmung."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Feedbacks" value={String(counts.total)} icon="feedback" />
        <KpiCard
          label="Ø-Bewertung"
          value={counts.avg.toFixed(1).replace(".", ",")}
          unit="/ 5"
          icon="star"
        />
        <KpiCard
          label="Negativ"
          value={String(counts.negative)}
          icon="alert"
          tone="danger"
        />
        <KpiCard
          label="Positiv"
          value={String(counts.positive)}
          icon="trend"
          tone="accent"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Feedback-Eingang"
          subtitle={`${filtered.length} Einträge`}
          action={
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {SENTIMENT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setSentiment(f.value)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    sentiment === f.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          }
        />
        <div className="mt-2">
          {filtered.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="feedback"
                title="Kein Feedback gefunden"
                description="Für die aktuelle Auswahl liegen keine Einträge vor. Filter anpassen."
              />
            </div>
          ) : (
            <Table>
              <THead>
                <TH>Datum</TH>
                <TH>Standort</TH>
                <TH>Bewertung</TH>
                <TH>Kommentar</TH>
                <TH>Kategorie</TH>
                <TH>Kanal</TH>
                <TH>Stimmung</TH>
              </THead>
              <TBody>
                {filtered.map((f) => (
                  <TR key={f.id}>
                    <TD className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(f.date)}
                    </TD>
                    <TD className="whitespace-nowrap text-sm">
                      {locationName(f.locationId)}
                    </TD>
                    <TD>
                      <Stars value={f.rating} showValue={false} size={13} />
                    </TD>
                    <TD className="max-w-xs">
                      <p className="line-clamp-2 text-sm text-foreground">
                        {f.text}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {f.aiTags.slice(0, 3).map((tag) => (
                          <Badge key={tag} tone="neutral">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TD>
                    <TD className="whitespace-nowrap text-sm">{f.category}</TD>
                    <TD className="whitespace-nowrap text-sm text-muted-foreground">
                      {CHANNEL_LABEL[f.channel]}
                    </TD>
                    <TD>
                      <SentimentBadge sentiment={f.sentiment} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
