import type { CategoryCritique, CriticalIssue } from "../types";
import { locations } from "./locations";
import { openTasks } from "./tasks";

// Netzweite Kennzahlen (aus Dummy-Daten aggregiert).
export const networkStats = {
  qualityScore: 79,
  qualityDelta: -1.4,
  avgRating: 4.2,
  avgRatingDelta: -0.1,
  nps: 38,
  npsDelta: -3,
  feedbackCount: locations.reduce((s, l) => s + l.feedbackCount, 0),
  feedbackDelta: 6.2,
  openTasks: openTasks.length,
  criticalIssues: locations.reduce((s, l) => s + l.criticalIssues, 0),
};

// Bewertungsentwicklung (letzte 6 Perioden), Netzwerk + kritischer Standort.
export const ratingDevelopment: {
  labels: string[];
  network: number[];
  koeln: number[];
} = {
  labels: ["KW24", "KW25", "KW26", "KW27", "KW28", "KW29"],
  network: [4.36, 4.34, 4.31, 4.28, 4.24, 4.2],
  koeln: [4.3, 4.2, 4.0, 3.9, 3.8, 3.8],
};

export const criticalIssues: CriticalIssue[] = [
  { id: "ci-1", label: "Sauberkeit Umkleiden/Duschen", locationId: "loc-cgn", count: 23, changePct: 61, severity: "critical" },
  { id: "ci-2", label: "Defekte Cardio-Geräte", locationId: "loc-cgn", count: 14, changePct: 40, severity: "critical" },
  { id: "ci-3", label: "Wartezeiten Stoßzeit", locationId: "loc-ber", count: 19, changePct: 22, severity: "high" },
  { id: "ci-4", label: "Gerätesicherheit (Kabelzüge/Racks)", locationId: "loc-ber", count: 8, changePct: 33, severity: "high" },
  { id: "ci-5", label: "Rezeption unfreundlich", locationId: "loc-cgn", count: 11, changePct: 18, severity: "high" },
];

// Häufigste Kritikpunkte (netzweit, nach Nennungen).
export const topCritiques: CategoryCritique[] = [
  { category: "Sauberkeit", mentions: 48, changePct: 34, sentiment: "negative" },
  { category: "Gerätezustand", mentions: 41, changePct: 27, sentiment: "negative" },
  { category: "Wartezeiten", mentions: 33, changePct: 12, sentiment: "negative" },
  { category: "Personal / Freundlichkeit", mentions: 26, changePct: 9, sentiment: "negative" },
  { category: "App / Buchung", mentions: 18, changePct: -4, sentiment: "neutral" },
  { category: "Kurse", mentions: 15, changePct: -8, sentiment: "positive" },
];

// KI Executive Summary (Dummy-Text, wie er von Jarvis erzeugt würde).
export const executiveSummary = {
  generatedAt: "2026-07-16T06:00:00Z",
  headline: "Netzwerk stabil – ein Standort zieht die Kennzahlen nach unten",
  points: [
    "Der netzweite Quality Score liegt bei 79 (-1,4 ggü. Vorwoche), getragen von Frankfurt (91) und München (88).",
    "Köln Ring ist der klare Ausreißer: Quality Score 62, -0,5 Sterne, Mitgliederschwund -4,7 %. Treiber sind Sauberkeit und defekte Geräte.",
    "Berlin Mitte kippt Richtung Beobachten: steigende Wartezeiten und ein Gerätesicherheits-Thema.",
    "Empfehlung: Sofortmaßnahmen in Köln priorisieren (Reinigung, Gerätereparatur, Rezeptionsschulung); Berlin präventiv gegensteuern.",
  ],
};
