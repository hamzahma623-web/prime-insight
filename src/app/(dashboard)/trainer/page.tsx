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

      <Card className="overflow-hidden p-8 sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          {/* Ruhiger AI-/Team-Kern statt flacher Kachel */}
          <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full opacity-60 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%)",
              }}
            />
            <span className="surface relative flex h-14 w-14 items-center justify-center rounded-[var(--radius-card)] text-muted-foreground">
              <Icon name="trainer" size={24} />
            </span>
          </span>

          <h2 className="mt-6 font-display text-xl font-semibold tracking-[var(--tracking-tight)] text-foreground">
            Noch keine Trainer angelegt
          </h2>

          <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
            Sobald die Trainerdaten vollständig vorliegen, werden hier Namen,
            Standorte, Bewertungen und Zuständigkeiten angezeigt.
          </p>

          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            {[
              {
                icon: "trainer" as const,
                title: "Trainerprofile",
                text: "Name, Standort und Zuständigkeit auf einen Blick.",
              },
              {
                icon: "star" as const,
                title: "Bewertungen",
                text: "Rückmeldungen werden später verständlich je Trainer zusammengefasst.",
              },
              {
                icon: "trend" as const,
                title: "Entwicklung",
                text: "Positive Entwicklungen und Handlungsbedarf werden klar dargestellt.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="surface interactive rounded-[var(--radius-card)] p-4"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border bg-muted text-muted-foreground">
                  <Icon name={feature.icon} size={16} />
                </span>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {feature.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>

          <div className="surface mt-6 rounded-[var(--radius-card)] px-5 py-4 text-left">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-accent/20 bg-accent-soft text-accent">
                <Icon name="sparkle" size={15} />
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