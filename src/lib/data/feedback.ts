import type { Feedback } from "../types";

export const feedback: Feedback[] = [
  { id: "fb-2291", locationId: "loc-cgn", date: "2026-07-14T18:22:00Z", rating: 2, channel: "google", category: "Sauberkeit", sentiment: "negative", member: "M. Schulz", text: "Umkleiden und Duschen waren am Abend in einem katastrophalen Zustand. Das war früher anders.", aiTags: ["Sauberkeit", "Umkleiden", "Abendschicht"] },
  { id: "fb-2290", locationId: "loc-cgn", date: "2026-07-14T12:05:00Z", rating: 1, channel: "app", category: "Gerätezustand", sentiment: "negative", member: "K. Öztürk", text: "Drei Laufbänder seit Wochen defekt, keine Reaktion vom Studio.", aiTags: ["Gerätezustand", "Wartung", "Reaktionszeit"] },
  { id: "fb-2289", locationId: "loc-ber", date: "2026-07-14T09:41:00Z", rating: 3, channel: "survey", category: "Wartezeiten", sentiment: "neutral", member: "A. Neumann", text: "Zur Stoßzeit sehr voll, Warten an den Geräten. Personal freundlich.", aiTags: ["Wartezeiten", "Auslastung"] },
  { id: "fb-2288", locationId: "loc-fra", date: "2026-07-13T20:10:00Z", rating: 5, channel: "google", category: "Personal", sentiment: "positive", member: "R. Bauer", text: "Marco ist ein Top-Trainer, super Betreuung und immer motivierend.", aiTags: ["Personal", "Trainer", "Betreuung"] },
  { id: "fb-2287", locationId: "loc-muc", date: "2026-07-13T17:33:00Z", rating: 4, channel: "app", category: "Kurse", sentiment: "positive", member: "S. Lang", text: "Kursangebot ist stark, nur die Buchung in der App hakt manchmal.", aiTags: ["Kurse", "App", "Buchung"] },
  { id: "fb-2286", locationId: "loc-cgn", date: "2026-07-13T14:20:00Z", rating: 2, channel: "email", category: "Personal", sentiment: "negative", member: "P. Richter", text: "An der Rezeption lange gewartet, unfreundlicher Ton. Trainerbetreuung fehlt.", aiTags: ["Personal", "Freundlichkeit", "Rezeption"] },
  { id: "fb-2285", locationId: "loc-lpz", date: "2026-07-13T11:02:00Z", rating: 3, channel: "front_desk", category: "Öffnungszeiten", sentiment: "neutral", member: "J. Frank", text: "Frühere Öffnung am Wochenende wäre gut.", aiTags: ["Öffnungszeiten", "Wochenende"] },
  { id: "fb-2284", locationId: "loc-ham", date: "2026-07-12T19:48:00Z", rating: 5, channel: "google", category: "Sauberkeit", sentiment: "positive", member: "C. Meyer", text: "Immer top gepflegt, moderne Geräte, angenehme Atmosphäre.", aiTags: ["Sauberkeit", "Ausstattung"] },
  { id: "fb-2283", locationId: "loc-ber", date: "2026-07-12T16:15:00Z", rating: 2, channel: "app", category: "Gerätezustand", sentiment: "negative", member: "D. Weber", text: "Kabelzüge ausgeleiert, ein Rack wackelt. Sicherheitsgefühl leidet.", aiTags: ["Gerätezustand", "Sicherheit"] },
  { id: "fb-2282", locationId: "loc-dus", date: "2026-07-12T10:30:00Z", rating: 5, channel: "survey", category: "Personal", sentiment: "positive", member: "F. Koch", text: "Kevin nimmt sich echt Zeit für Technik-Korrekturen. Klasse.", aiTags: ["Personal", "Trainer"] },
  { id: "fb-2281", locationId: "loc-stg", date: "2026-07-11T18:55:00Z", rating: 4, channel: "google", category: "Preis-Leistung", sentiment: "positive", member: "N. Schmitt", text: "Fairer Preis für das Gebotene, könnte mehr Kurse am Abend geben.", aiTags: ["Preis-Leistung", "Kurse"] },
  { id: "fb-2280", locationId: "loc-cgn", date: "2026-07-11T13:40:00Z", rating: 1, channel: "google", category: "Sauberkeit", sentiment: "negative", member: "L. Vogel", text: "Böden klebrig, Mülleimer voll, Seifenspender leer. Nicht akzeptabel.", aiTags: ["Sauberkeit", "Hygiene"] },
  { id: "fb-2279", locationId: "loc-muc", date: "2026-07-11T08:12:00Z", rating: 5, channel: "app", category: "Kurse", sentiment: "positive", member: "H. Berg", text: "Aylins Kurse sind der Grund, warum ich Mitglied bleibe.", aiTags: ["Kurse", "Trainer", "Bindung"] },
  { id: "fb-2278", locationId: "loc-lpz", date: "2026-07-10T20:05:00Z", rating: 3, channel: "email", category: "Gerätezustand", sentiment: "neutral", member: "B. Krause", text: "Ausstattung okay, aber Cardio-Bereich wirkt in die Jahre gekommen.", aiTags: ["Gerätezustand", "Modernisierung"] },
  { id: "fb-2277", locationId: "loc-ber", date: "2026-07-10T15:27:00Z", rating: 4, channel: "google", category: "Personal", sentiment: "positive", member: "T. Sommer", text: "Team bemüht sich sichtbar, trotz hoher Auslastung.", aiTags: ["Personal", "Auslastung"] },
];

export const recentFeedback = [...feedback].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);
