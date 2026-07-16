import type { CategoryCritique, CriticalIssue } from "../types";
import { locations } from "./locations";
import { openTasks } from "./tasks";

// Netzwerkweite Kennzahlen aus den aktuellen Demo-Daten.
export const networkStats = {
  qualityScore: 78,
  qualityDelta: -1.2,
  avgRating: 4.2,
  avgRatingDelta: -0.1,
  nps: 39,
  npsDelta: -2,
  feedbackCount: locations.reduce(
    (sum, location) => sum + location.feedbackCount,
    0
  ),
  feedbackDelta: 5.8,
  openTasks: openTasks.length,
  criticalIssues: locations.reduce(
    (sum, location) => sum + location.criticalIssues,
    0
  ),
};

// Bewertungsentwicklung der letzten sechs Perioden.
// "koeln" bleibt vorerst als technischer Property-Name bestehen,
// damit bestehende Chart-Komponenten nicht angepasst werden müssen.
// Inhaltlich repräsentiert die Serie Fitness Level Demo West.
export const ratingDevelopment: {
  labels: string[];
  network: number[];
  koeln: number[];
} = {
  labels: ["KW24", "KW25", "KW26", "KW27", "KW28", "KW29"],
  network: [4.35, 4.33, 4.3, 4.27, 4.24, 4.2],
  koeln: [4.2, 4.1, 4.0, 3.9, 3.8, 3.8],
};

export const criticalIssues: CriticalIssue[] = [
  {
    id: "ci-1",
    label: "Sauberkeit Umkleiden/Duschen",
    locationId: "demo-west",
    count: 23,
    changePct: 61,
    severity: "critical",
  },
  {
    id: "ci-2",
    label: "Defekte Cardio-Geräte",
    locationId: "demo-west",
    count: 14,
    changePct: 40,
    severity: "critical",
  },
  {
    id: "ci-3",
    label: "Wartezeiten zu Stoßzeiten",
    locationId: "demo-ost",
    count: 19,
    changePct: 22,
    severity: "high",
  },
  {
    id: "ci-4",
    label: "Gerätesicherheit (Kabelzüge/Racks)",
    locationId: "demo-ost",
    count: 8,
    changePct: 33,
    severity: "high",
  },
  {
    id: "ci-5",
    label: "Freundlichkeit an der Rezeption",
    locationId: "demo-west",
    count: 11,
    changePct: 18,
    severity: "high",
  },
];

// Häufigste Kritikpunkte im gesamten Standortnetz.
export const topCritiques: CategoryCritique[] = [
  {
    category: "Sauberkeit",
    mentions: 48,
    changePct: 34,
    sentiment: "negative",
  },
  {
    category: "Gerätezustand",
    mentions: 41,
    changePct: 27,
    sentiment: "negative",
  },
  {
    category: "Wartezeiten",
    mentions: 33,
    changePct: 12,
    sentiment: "negative",
  },
  {
    category: "Personal / Freundlichkeit",
    mentions: 26,
    changePct: 9,
    sentiment: "negative",
  },
  {
    category: "App / Buchung",
    mentions: 18,
    changePct: -4,
    sentiment: "neutral",
  },
  {
    category: "Kurse",
    mentions: 15,
    changePct: -8,
    sentiment: "positive",
  },
];

// KI Executive Summary – Demo-Ausgabe für die Geschäftsführung.
export const executiveSummary = {
  generatedAt: "2026-07-16T06:00:00Z",
  headline:
    "Standortnetz insgesamt stabil – ein Demo-Standort benötigt Aufmerksamkeit",
  points: [
    "Der netzwerkweite Quality Score liegt bei 78 Punkten. Fitness Level Langen führt mit 91 Punkten und einer durchschnittlichen Bewertung von 4,7 Sternen.",
    "Fitness Level Demo West ist der klare Ausreißer: Quality Score 64, durchschnittliche Bewertung 3,8 Sterne und Mitgliederschwund von 3,9 %. Haupttreiber sind Sauberkeit und defekte Geräte.",
    "Fitness Level Demo Ost entwickelt sich in Richtung Beobachten. Dort nehmen Wartezeiten zu Stoßzeiten und Hinweise zur Gerätesicherheit zu.",
    "Empfehlung: Sofortmaßnahmen in Demo West priorisieren und die Entwicklung in Demo Ost präventiv überwachen. Die positiven Prozesse aus Fitness Level Langen sollten als interner Benchmark verwendet werden.",
  ],
};