import type { JarvisPrompt } from "../types";

// Vorschlagsfragen der Geschäftsführung mit vorbereiteten Demo-Antworten.
// Antworten enthalten Standortbezug, priorisierte Maßnahmen und Quellenhinweise.
export const jarvisPrompts: JarvisPrompt[] = [
  {
    id: "q-lage",
    question: "Wie ist die aktuelle Lage im Standortnetz?",
    answer: {
      headline: "Insgesamt stabil, ein Demo-Standort braucht Aufmerksamkeit.",
      body:
        "Der netzwerkweite Quality Score liegt bei 78 Punkten. Fitness Level Langen führt mit 91 Punkten, einer durchschnittlichen Bewertung von 4,7 Sternen und einem NPS von 62. Fitness Level Demo West liegt mit 64 Punkten im kritischen Bereich und zieht den Gesamtschnitt nach unten. Fitness Level Demo Ost entwickelt sich in Richtung Beobachten. Die durchschnittliche Bewertung im Standortnetz liegt aktuell bei 4,2 Sternen.",
      actions: [
        {
          title:
            "Sofortmaßnahmen in Fitness Level Demo West bündeln und nachverfolgen",
          priority: "critical",
          owner: "Demo Studioleitung West",
          locationId: "demo-west",
        },
        {
          title:
            "Fitness Level Demo Ost präventiv gegensteuern",
          priority: "high",
          owner: "Demo Studioleitung Ost",
          locationId: "demo-ost",
        },
      ],
      sources: [
        {
          label: "Standort-Kennzahlen",
          detail: "5 Standorte · aktuelle Demo-Periode",
        },
        {
          label: "Feedback",
          detail: "992 Bewertungen · letzte 30 Tage",
        },
        {
          label: "Aufgaben",
          detail: "38 offen · mehrere kritische Themen",
        },
      ],
      focusLocationIds: ["demo-west", "demo-ost"],
    },
  },
  {
    id: "q-attention",
    question: "Welcher Standort braucht am dringendsten Aufmerksamkeit?",
    answer: {
      headline: "Fitness Level Demo West – mit deutlichem Abstand.",
      body:
        "Fitness Level Demo West hat mit 64 Punkten den niedrigsten Quality Score und die stärkste negative Entwicklung im Standortnetz. Die durchschnittliche Bewertung liegt bei 3,8 Sternen, der NPS bei 15 und der Mitgliederschwund bei 3,9 %. Zusätzlich bestehen 13 offene Aufgaben und 4 kritische Themen. Die größten Treiber sind Sauberkeit, defekte Geräte und Beschwerden zur Rezeption.",
      actions: [
        {
          title:
            "Reinigungsintervalle in Umkleiden und Duschen am Abend erhöhen",
          priority: "critical",
          owner: "Demo Studioleitung West",
          locationId: "demo-west",
        },
        {
          title: "Defekte Cardio-Geräte kurzfristig reparieren oder ersetzen",
          priority: "critical",
          owner: "Facility Management",
          locationId: "demo-west",
        },
        {
          title:
            "Rezeptionsteam schulen und Ursachen der Beschwerden prüfen",
          priority: "high",
          owner: "Demo Studioleitung West",
          locationId: "demo-west",
        },
      ],
      sources: [
        {
          label: "Fitness Level Demo West",
          detail: "Quality 64 · Ø 3,8 · NPS 15",
        },
        {
          label: "Aufgaben",
          detail: "13 offen · 4 kritisch",
        },
        {
          label: "Feedback-Cluster",
          detail: "Sauberkeit 23 · Geräte 14 · Rezeption 11",
        },
      ],
      focusLocationIds: ["demo-west"],
    },
  },
  {
    id: "q-ratings",
    question: "Warum sind die Bewertungen gesunken?",
    answer: {
      headline: "Drei Themen erklären den größten Teil des Rückgangs.",
      body:
        "Der leichte Rückgang der netzwerkweiten Bewertung wird vor allem durch Fitness Level Demo West verursacht. Dort häufen sich Beschwerden zu Sauberkeit und defekten Geräten. Zusätzlich nehmen in Fitness Level Demo Ost die Wartezeiten während der Stoßzeiten zu. Fitness Level Langen entwickelt sich dagegen stabil positiv und gleicht einen Teil der negativen Entwicklung aus.",
      actions: [
        {
          title:
            "Ursachenanalyse für die Abendschicht in Demo West durchführen",
          priority: "critical",
          owner: "Demo Studioleitung West",
          locationId: "demo-west",
        },
        {
          title:
            "Stoßzeiten und Geräteauslastung in Demo Ost analysieren",
          priority: "medium",
          owner: "Demo Studioleitung Ost",
          locationId: "demo-ost",
        },
      ],
      sources: [
        {
          label: "Bewertungsentwicklung",
          detail: "6 Perioden · Standortnetz vs. Demo West",
        },
        {
          label: "Kritikpunkt-Cluster",
          detail: "Sauberkeit, Gerätezustand, Wartezeiten",
        },
        {
          label: "Sentiment-Analyse",
          detail: "992 Feedbacks klassifiziert",
        },
      ],
      focusLocationIds: ["demo-west", "demo-ost"],
    },
  },
  {
    id: "q-critical",
    question: "Welche Probleme sind aktuell kritisch?",
    answer: {
      headline: "Fünf relevante Themen, konzentriert auf zwei Demo-Standorte.",
      body:
        "Sofortiger Handlungsbedarf besteht bei der Sauberkeit in Umkleiden und Duschen sowie bei defekten Cardio-Geräten in Fitness Level Demo West. Zusätzlich werden dort Beschwerden zur Freundlichkeit an der Rezeption häufiger. In Fitness Level Demo Ost steigen Wartezeiten während der Stoßzeiten und Hinweise zur Gerätesicherheit. Die Themen sollten priorisiert und mit klaren Verantwortlichkeiten versehen werden.",
      actions: [
        {
          title:
            "Kritische Themen in Demo West als Task-Bündel mit Deadline anlegen",
          priority: "critical",
          owner: "Demo Studioleitung West",
          locationId: "demo-west",
        },
        {
          title:
            "Gerätesicherheits-Check in Demo Ost durchführen",
          priority: "high",
          owner: "Facility Management",
          locationId: "demo-ost",
        },
      ],
      sources: [
        {
          label: "Kritische Themen",
          detail: "5 aktiv · 2 kritisch · 3 hoch",
        },
        {
          label: "Aufgabenstatus",
          detail: "mehrere Aufgaben offen oder in Bearbeitung",
        },
      ],
      focusLocationIds: ["demo-west", "demo-ost"],
    },
  },
  {
    id: "q-actions",
    question: "Welche Maßnahmen empfiehlst du priorisiert?",
    answer: {
      headline: "Drei Prioritäten für die nächsten sieben Tage.",
      body:
        "Erstens sollte Fitness Level Demo West stabilisiert werden: Reinigungsintervalle erhöhen, defekte Geräte reparieren und Beschwerden zur Rezeption gezielt bearbeiten. Zweitens sollte Fitness Level Demo Ost präventiv geprüft werden, insbesondere bei Stoßzeiten und Gerätesicherheit. Drittens sollten die positiven Prozesse aus Fitness Level Langen als interner Benchmark dokumentiert und auf andere Standorte übertragen werden.",
      actions: [
        {
          title:
            "Reinigung und Gerätereparatur in Demo West priorisieren",
          priority: "critical",
          owner: "Demo Studioleitung West",
          locationId: "demo-west",
        },
        {
          title:
            "Kapazitäts- und Sicherheitscheck in Demo Ost durchführen",
          priority: "high",
          owner: "Demo Studioleitung Ost",
          locationId: "demo-ost",
        },
        {
          title:
            "Best Practices aus Fitness Level Langen dokumentieren",
          priority: "medium",
          owner: "Studioleitung Langen",
          locationId: "langen",
        },
      ],
      sources: [
        {
          label: "Wirkungsabschätzung",
          detail: "Demo-Modell auf Basis der Feedback-Cluster",
        },
        {
          label: "Standortvergleich",
          detail: "Langen als aktueller Benchmark",
        },
      ],
      focusLocationIds: ["demo-west", "demo-ost", "langen"],
    },
  },
];

export const jarvisFallback: JarvisPrompt["answer"] = {
  headline: "Dazu liegen mir Standortdaten vor.",
  body:
    "In diesem Prototyp arbeitet Jarvis mit vorbereiteten Beispielantworten. Wähle eine der Vorschlagsfragen, um eine vollständige Auswertung mit Standortbezug, priorisierten Maßnahmen und Quellenhinweisen zu sehen. In der späteren Version beantwortet Jarvis freie Fragen live auf Basis der freigegebenen Daten aller Standorte.",
  actions: [],
  sources: [
    {
      label: "Hinweis",
      detail: "Prototyp mit Demo-Daten",
    },
  ],
  focusLocationIds: [],
};