"use client";

import { SectionHeading } from "@/components/ui/Primitives";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/lib/icons";
import { useFilters } from "@/components/providers/FilterProvider";

export default function TrainerPage() {
  const { locationId, locationOptions } = useFilters();

  const selectedLocation =
    locationId === "all"
      ? "Alle Standorte"
      : locationOptions.find(
  (location) => location.value === locationId
)?.label ?? "Ausgewählter Standort";

  return (
    <div>
      <SectionHeading
        eyebrow="Teamübersicht"
        title="Trainer"
        description={`${selectedLocation} · Hier werden später alle Trainer übersichtlich dargestellt.`}
      />

      <Card className="p-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Icon name="trainer" size={24} />
          </span>

          <h2 className="mt-5 font-display text-xl font-semibold text-foreground">
            Noch keine Trainer angelegt
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sobald die Trainerdaten vollständig vorliegen, werden hier Namen,
            Standorte, Bewertungen und Zuständigkeiten angezeigt.
          </p>

          <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">
                Trainerprofile
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Name, Standort und Zuständigkeit auf einen Blick.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">
                Bewertungen
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Rückmeldungen werden später verständlich je Trainer
                zusammengefasst.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">
                Entwicklung
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Positive Entwicklungen und Handlungsbedarf werden klar
                dargestellt.
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-xl border border-border bg-muted/20 px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon name="trainer" size={16} />
              </span>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Für die Präsentation vorbereitet
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Es werden bewusst keine Beispielnamen oder erfundenen
                  Leistungsdaten angezeigt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}