import type { Report } from "../types";

export const reports: Report[] = [
  {
    id: "rep-001",
    title: "Executive Summary – KW 29",
    period: "13.–19. Juli 2026",
    type: "executive",
    createdAt: "2026-07-15T06:00:00Z",
    status: "ready",
    summary:
      "Netzweit stabil bei leicht rückläufigem NPS. Köln Ring bleibt kritisch (Sauberkeit, Gerätezustand). Frankfurt und Düsseldorf über Zielkorridor.",
    metrics: [
      { label: "Quality Score", value: "79", delta: "-1,4", trend: "down" },
      { label: "Ø-Bewertung", value: "4,2", delta: "-0,1", trend: "down" },
      { label: "NPS", value: "38", delta: "-3", trend: "down" },
      { label: "Kritische Themen", value: "10", delta: "+2", trend: "up" },
    ],
  },
  {
    id: "rep-002",
    title: "Standortreport – Köln Ring",
    period: "Juli 2026 (MTD)",
    type: "location",
    createdAt: "2026-07-14T07:30:00Z",
    status: "ready",
    summary:
      "Deutlicher Rückgang bei Sauberkeit und Gerätezustand. Mitgliederschwund -4,7 %. Zwei Trainer unter Zielbewertung. Sofortmaßnahmen eingeleitet.",
    metrics: [
      { label: "Quality Score", value: "62", delta: "-9", trend: "down" },
      { label: "Ø-Bewertung", value: "3,8", delta: "-0,5", trend: "down" },
      { label: "Offene Aufgaben", value: "14", delta: "+5", trend: "up" },
    ],
  },
  {
    id: "rep-003",
    title: "Trainer-Performance – Netzwerk",
    period: "Q3 2026 (laufend)",
    type: "trainer",
    createdAt: "2026-07-12T09:00:00Z",
    status: "ready",
    summary:
      "Top-Quartil stabil über 4,7. Handlungsbedarf bei zwei Trainern in Köln (< 3,6). Retention korreliert stark mit Trainerbewertung.",
    metrics: [
      { label: "Ø-Trainerbewertung", value: "4,4", delta: "±0", trend: "flat" },
      { label: "Retention (Top 5)", value: "91 %", delta: "+2", trend: "up" },
    ],
  },
  {
    id: "rep-004",
    title: "Executive Summary – KW 30",
    period: "20.–26. Juli 2026",
    type: "executive",
    createdAt: "2026-07-16T05:00:00Z",
    status: "generating",
    summary: "Wird nach Abschluss der Woche automatisch aus allen Standortdaten erzeugt.",
    metrics: [],
  },
  {
    id: "rep-005",
    title: "Compliance & Hygiene-Audit",
    period: "August 2026",
    type: "compliance",
    createdAt: "2026-08-01T05:00:00Z",
    status: "scheduled",
    summary: "Geplanter netzweiter Hygiene- und Sicherheits-Audit-Report.",
    metrics: [],
  },
];
