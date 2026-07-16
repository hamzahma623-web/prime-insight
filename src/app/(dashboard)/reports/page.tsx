import { SectionHeading } from "@/components/ui/Primitives";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/lib/icons";
import { formatDate } from "@/lib/format";
import { reports } from "@/lib/data/reports";
import type { Report } from "@/lib/types";

const TYPE_LABEL: Record<Report["type"], string> = {
  executive: "Executive",
  location: "Standort",
  trainer: "Trainer",
  compliance: "Compliance",
};

const STATUS: Record<Report["status"], { label: string; tone: "success" | "info" | "warning" }> = {
  ready: { label: "Bereit", tone: "success" },
  generating: { label: "Wird erstellt", tone: "info" },
  scheduled: { label: "Geplant", tone: "warning" },
};

export default function ReportsPage() {
  return (
    <div>
      <SectionHeading
        eyebrow="Auswertungen"
        title="Reports"
        description="Automatisch generierte Executive-, Standort- und Trainer-Reports."
        action={
          <Button variant="primary">
            <Icon name="plus" size={16} />
            Report erstellen
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((r) => {
          const status = STATUS[r.status];
          return (
            <Card key={r.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon name="reports" size={18} />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {r.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone="neutral">{TYPE_LABEL[r.type]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {r.period}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>

              <p className="mt-4 flex-1 text-sm text-muted-foreground">
                {r.summary}
              </p>

              {r.metrics.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {r.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl border border-border p-3"
                    >
                      <div className="text-[11px] text-muted-foreground">
                        {m.label}
                      </div>
                      <div className="mt-1 font-display text-lg font-semibold tabular-nums text-foreground">
                        {m.value}
                      </div>
                      {m.delta ? (
                        <div className="mt-1 text-xs font-medium text-muted-foreground">
                          {m.delta}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">
                  {formatDate(r.createdAt)}
                </span>
                <Button size="sm" disabled={r.status !== "ready"}>
                  <Icon name="download" size={14} />
                  {r.status === "ready" ? "Herunterladen" : "Nicht verfügbar"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
