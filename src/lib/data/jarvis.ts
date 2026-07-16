import type { JarvisPrompt } from "../types";

// Vorschlagsfragen der Geschäftsführung mit vorbereiteten Dummy-Antworten.
// Antworten enthalten Standortbezug, priorisierte Maßnahmen und Quellenhinweise.
export const jarvisPrompts: JarvisPrompt[] = [
  {
    id: "q-lage",
    question: "Wie ist die aktuelle Lage im Netzwerk?",
    answer: {
      headline: "Insgesamt stabil, ein kritischer Ausreißer.",
      body: "Der netzweite Quality Score liegt bei 79 (-1,4 ggü. Vorwoche). Sechs von acht Standorten sind stabil oder nur leicht rückläufig. Frankfurt Zeil (91) und München Zentrum (88) führen. Köln Ring (62) drückt den Schnitt spürbar und ist der einzige Standort im kritischen Bereich; Berlin Mitte (74) rutscht Richtung Beobachten. Die Ø-Bewertung fiel netzweit leicht von 4,3 auf 4,2, der NPS von 41 auf 38.",
      actions: [
        { title: "Sofortmaßnahmen Köln Ring bündeln und nachverfolgen", priority: "critical", owner: "Sarah Klein", locationId: "loc-cgn" },
        { title: "Berlin Mitte präventiv gegensteuern (Wartezeiten, Gerätesicherheit)", priority: "high", owner: "Melis Aydın", locationId: "loc-ber" },
      ],
      sources: [
        { label: "Standort-Kennzahlen", detail: "8 Standorte · KW29" },
        { label: "Feedback", detail: "1.506 Bewertungen · letzte 30 Tage" },
        { label: "Aufgaben", detail: "10 offen, davon 2 kritisch" },
      ],
      focusLocationIds: ["loc-cgn", "loc-ber"],
    },
  },
  {
    id: "q-attention",
    question: "Welcher Standort braucht am dringendsten Aufmerksamkeit?",
    answer: {
      headline: "Köln Ring – mit Abstand.",
      body: "Köln Ring hat den niedrigsten Quality Score (62) und die stärkste Negativdynamik: -0,5 Sterne in sechs Wochen, Mitgliederschwund -4,7 %, 14 offene Aufgaben und 4 kritische Themen. Zwei Trainer liegen unter der Zielbewertung von 3,6. Am zweitwichtigsten ist Berlin Mitte: noch im grünen Bereich, aber mit steigenden Wartezeiten und einem Gerätesicherheits-Thema.",
      actions: [
        { title: "Reinigungsintervalle Umkleide/Dusche (Abendschicht) erhöhen", priority: "critical", owner: "Sarah Klein", locationId: "loc-cgn" },
        { title: "3 defekte Laufbänder reparieren / ersetzen", priority: "critical", owner: "Facility DE", locationId: "loc-cgn" },
        { title: "1:1 mit den zwei Trainern unter Zielbewertung", priority: "high", owner: "Sarah Klein", locationId: "loc-cgn" },
      ],
      sources: [
        { label: "Standort Köln Ring", detail: "Quality 62 · Ø 3,8 · NPS 12" },
        { label: "Trainer-Ranking", detail: "2 Trainer < 3,6" },
        { label: "Feedback-Cluster", detail: "Sauberkeit 23 · Geräte 14" },
      ],
      focusLocationIds: ["loc-cgn"],
    },
  },
  {
    id: "q-ratings",
    question: "Warum sind die Bewertungen gesunken?",
    answer: {
      headline: "Zwei Themen tragen ~60 % des Rückgangs.",
      body: "Der netzweite Bewertungsrückgang (4,3 → 4,2) wird vor allem durch Köln Ring verursacht. Dort dominieren zwei Cluster: Sauberkeit (23 Nennungen, +61 %) und defekte Geräte (14 Nennungen, +40 %), beide vor allem in der Abendschicht. Ergänzend nehmen netzweit Wartezeiten zur Stoßzeit zu (+12 %), sichtbar in Berlin Mitte. Positiv: App-Kritik und Kurskritik gehen leicht zurück.",
      actions: [
        { title: "Ursachenanalyse Abendschicht Köln (Reinigung + Wartung)", priority: "critical", owner: "Sarah Klein", locationId: "loc-cgn" },
        { title: "Kapazitätssteuerung Stoßzeit Berlin prüfen", priority: "medium", owner: "Melis Aydın", locationId: "loc-ber" },
      ],
      sources: [
        { label: "Bewertungsentwicklung", detail: "6 Perioden · Netzwerk vs. Köln" },
        { label: "Kritikpunkt-Cluster", detail: "Sauberkeit, Gerätezustand, Wartezeiten" },
        { label: "Sentiment-Analyse", detail: "1.506 Feedbacks klassifiziert" },
      ],
      focusLocationIds: ["loc-cgn", "loc-ber"],
    },
  },
  {
    id: "q-critical",
    question: "Welche Probleme sind aktuell kritisch?",
    answer: {
      headline: "Fünf Themen, konzentriert auf Köln und Berlin.",
      body: "Kritisch (sofort handeln): Sauberkeit Umkleiden/Duschen in Köln (23, +61 %) und defekte Cardio-Geräte in Köln (14, +40 %). Hoch: Wartezeiten zur Stoßzeit in Berlin (19, +22 %), Gerätesicherheit in Berlin (8, +33 %) sowie unfreundliche Rezeption in Köln (11, +18 %). Alle fünf sind bereits als Aufgaben angelegt; zwei davon sind in Bearbeitung.",
      actions: [
        { title: "Kritische Köln-Themen als Task-Bündel mit Deadline diese Woche", priority: "critical", owner: "Sarah Klein", locationId: "loc-cgn" },
        { title: "Gerätesicherheits-Check Berlin (Kabelzüge, Racks)", priority: "high", owner: "Facility DE", locationId: "loc-ber" },
      ],
      sources: [
        { label: "Kritische Themen", detail: "5 aktiv · 2 kritisch, 3 hoch" },
        { label: "Aufgabenstatus", detail: "2 in Bearbeitung, 3 offen" },
      ],
      focusLocationIds: ["loc-cgn", "loc-ber"],
    },
  },
  {
    id: "q-actions",
    question: "Welche Maßnahmen empfiehlst du priorisiert?",
    answer: {
      headline: "Drei Prioritäten für diese Woche.",
      body: "1) Köln stabilisieren: Reinigungsintervalle Abendschicht erhöhen und defekte Geräte reparieren – das adressiert ~60 % der aktuellen Negativbewertungen. 2) Personal Köln: Rezeptionsschulung und 1:1 mit den zwei Trainern unter Zielbewertung. 3) Berlin präventiv: Kapazitätssteuerung zur Stoßzeit und Gerätesicherheits-Check, bevor der Standort in den kritischen Bereich rutscht. Erwarteter Effekt: +5–7 Punkte Quality Score in Köln über 3–4 Wochen.",
      actions: [
        { title: "Reinigung + Gerätereparatur Köln (Deadline diese Woche)", priority: "critical", owner: "Sarah Klein", locationId: "loc-cgn" },
        { title: "Rezeptionsschulung + Trainer-1:1 Köln", priority: "high", owner: "Sarah Klein", locationId: "loc-cgn" },
        { title: "Kapazitäts- & Sicherheitscheck Berlin", priority: "medium", owner: "Melis Aydın", locationId: "loc-ber" },
      ],
      sources: [
        { label: "Wirkungsabschätzung", detail: "Modell auf Basis Cluster-Gewichte" },
        { label: "Aufgabenverknüpfung", detail: "6 Aufgaben betroffen" },
      ],
      focusLocationIds: ["loc-cgn", "loc-ber"],
    },
  },
];

export const jarvisFallback: JarvisPrompt["answer"] = {
  headline: "Dazu liegen mir Netzwerkdaten vor.",
  body: "In diesem Prototyp arbeitet Jarvis mit hinterlegten Beispielantworten. Wähle eine der Vorschlagsfragen, um eine vollständige Auswertung mit Standortbezug, priorisierten Maßnahmen und Quellenhinweisen zu sehen. In der späteren Version beantwortet Jarvis freie Fragen live über alle Standorte.",
  actions: [],
  sources: [{ label: "Hinweis", detail: "Prototyp mit Dummy-Daten" }],
  focusLocationIds: [],
};
