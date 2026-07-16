"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/format";
import { useTheme } from "@/components/providers/ThemeProvider";
import { locations } from "@/lib/data/locations";

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-accent" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function Setting({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {description ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function EinstellungenPage() {
  const { theme, toggleTheme } = useTheme();
  const [notifCritical, setNotifCritical] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifTrainer, setNotifTrainer] = useState(false);
  const [jarvisProactive, setJarvisProactive] = useState(true);
  const [autoTasks, setAutoTasks] = useState(true);

  return (
    <div>
      <SectionHeading
        eyebrow="Konfiguration"
        title="Einstellungen"
        description="Darstellung, Benachrichtigungen, KI-Verhalten und Standortverwaltung."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Darstellung */}
        <Card>
          <CardHeader title="Darstellung" subtitle="Oberfläche und Theme" />
          <CardBody className="divide-y divide-border pt-1">
            <Setting title="Dunkler Modus" description="Zwischen hell und dunkel wechseln">
              <div className="flex items-center gap-2">
                <Icon
                  name={theme === "dark" ? "moon" : "sun"}
                  size={16}
                  className="text-muted-foreground"
                />
                <Switch
                  checked={theme === "dark"}
                  onChange={toggleTheme}
                  label="Dunklen Modus umschalten"
                />
              </div>
            </Setting>
            <Setting title="Sprache" description="Oberflächensprache">
              <span className="text-sm text-muted-foreground">Deutsch</span>
            </Setting>
            <Setting title="Standard-Zeitraum" description="Vorauswahl beim Öffnen">
              <span className="text-sm text-muted-foreground">Letzte 30 Tage</span>
            </Setting>
          </CardBody>
        </Card>

        {/* Benachrichtigungen */}
        <Card>
          <CardHeader title="Benachrichtigungen" subtitle="Wann Jarvis dich informiert" />
          <CardBody className="divide-y divide-border pt-1">
            <Setting
              title="Kritische Probleme"
              description="Sofort bei neuen kritischen Themen"
            >
              <Switch checked={notifCritical} onChange={setNotifCritical} label="Kritische Probleme" />
            </Setting>
            <Setting
              title="Wöchentliche Executive Summary"
              description="Montags 06:00 Uhr"
            >
              <Switch checked={notifWeekly} onChange={setNotifWeekly} label="Wöchentliche Summary" />
            </Setting>
            <Setting
              title="Trainer unter Zielbewertung"
              description="Wenn ein Trainer unter 3,6 fällt"
            >
              <Switch checked={notifTrainer} onChange={setNotifTrainer} label="Trainer-Warnungen" />
            </Setting>
          </CardBody>
        </Card>

        {/* KI / Jarvis */}
        <Card>
          <CardHeader title="Jarvis & KI" subtitle="Verhalten des Assistenten" />
          <CardBody className="divide-y divide-border pt-1">
            <Setting
              title="Proaktive Hinweise"
              description="Jarvis meldet sich bei Auffälligkeiten von selbst"
            >
              <Switch checked={jarvisProactive} onChange={setJarvisProactive} label="Proaktive Hinweise" />
            </Setting>
            <Setting
              title="Maßnahmen automatisch anlegen"
              description="Empfohlene Maßnahmen als Aufgaben übernehmen"
            >
              <Switch checked={autoTasks} onChange={setAutoTasks} label="Automatische Aufgaben" />
            </Setting>
            <Setting
              title="Kritischer Schwellenwert"
              description="Quality Score, ab dem ein Standort als kritisch gilt"
            >
              <span className="text-sm font-semibold tabular-nums text-foreground">
                &lt; 65
              </span>
            </Setting>
          </CardBody>
        </Card>

        {/* Standorte */}
        <Card>
          <CardHeader
            title="Standortverwaltung"
            subtitle={`${locations.length} aktive Standorte`}
            action={
              <Button size="sm" variant="secondary">
                <Icon name="plus" size={14} />
                Hinzufügen
              </Button>
            }
          />
          <CardBody className="pt-1">
            <div className="divide-y divide-border">
              {locations.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {l.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {l.manager}
                    </div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
            <button className="mt-2 text-sm font-medium text-accent hover:underline">
              Alle {locations.length} Standorte anzeigen
            </button>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost">Zurücksetzen</Button>
        <Button variant="primary">Änderungen speichern</Button>
      </div>
    </div>
  );
}
