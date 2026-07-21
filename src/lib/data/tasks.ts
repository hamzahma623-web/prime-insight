import type { Task } from "../types";
export const tasks: Task[] = [
  { id: "t-501", title: "Reinigungsintervalle Umkleide/Dusche erhöhen (Abendschicht)", locationId: "loc-cgn", priority: "critical", status: "open", assignee: "Sarah Klein", due: "2026-07-16T00:00:00Z", category: "Sauberkeit", source: "Prime" },
  { id: "t-502", title: "3 defekte Laufbänder reparieren / Ersatz beschaffen", locationId: "loc-cgn", priority: "critical", status: "in_progress", assignee: "Facility DE", due: "2026-07-17T00:00:00Z", category: "Gerätezustand", source: "Feedback #fb-2290" },
  { id: "t-503", title: "Rezeptions-Schulung Freundlichkeit & Reaktionszeit", locationId: "loc-cgn", priority: "high", status: "open", assignee: "Sarah Klein", due: "2026-07-22T00:00:00Z", category: "Personal", source: "Prime" },
  { id: "t-504", title: "Kabelzüge tauschen, Rack sichern", locationId: "loc-ber", priority: "high", status: "open", assignee: "Facility DE", due: "2026-07-18T00:00:00Z", category: "Gerätezustand", source: "Feedback #fb-2283" },
  { id: "t-505", title: "Kapazitätssteuerung zur Stoßzeit prüfen", locationId: "loc-ber", priority: "medium", status: "open", assignee: "Melis Aydın", due: "2026-07-25T00:00:00Z", category: "Wartezeiten", source: "Feedback #fb-2289" },
  { id: "t-506", title: "App-Kursbuchung Bug an Produkt melden", locationId: "loc-muc", priority: "medium", status: "in_progress", assignee: "Tobias Reinhardt", due: "2026-07-20T00:00:00Z", category: "App", source: "Feedback #fb-2287" },
  { id: "t-507", title: "Cardio-Bereich Modernisierungsplan erstellen", locationId: "loc-lpz", priority: "medium", status: "open", assignee: "Nina Schäfer", due: "2026-07-30T00:00:00Z", category: "Gerätezustand", source: "Feedback #fb-2278" },
  { id: "t-508", title: "1:1 mit Trainer J. Wolf (Bewertung < 3,6)", locationId: "loc-cgn", priority: "high", status: "open", assignee: "Sarah Klein", due: "2026-07-19T00:00:00Z", category: "Personal", source: "Trainer-Ranking" },
  { id: "t-509", title: "Wochenend-Öffnung Leipzig evaluieren", locationId: "loc-lpz", priority: "low", status: "open", assignee: "Nina Schäfer", due: "2026-08-05T00:00:00Z", category: "Öffnungszeiten", source: "Feedback #fb-2285" },
  { id: "t-510", title: "Seifenspender-Nachfüllplan dokumentieren", locationId: "loc-cgn", priority: "high", status: "done", assignee: "Facility DE", due: "2026-07-12T00:00:00Z", category: "Sauberkeit", source: "Feedback #fb-2280" },
  { id: "t-511", title: "Abendkurse-Angebot Stuttgart erweitern", locationId: "loc-stg", priority: "low", status: "open", assignee: "Deniz Yılmaz", due: "2026-08-01T00:00:00Z", category: "Kurse", source: "Feedback #fb-2281" },
  { id: "t-512", title: "Best-Practice Sauberkeit Hamburg dokumentieren", locationId: "loc-ham", priority: "low", status: "done", assignee: "Jonas Bruhn", due: "2026-07-10T00:00:00Z", category: "Wissenstransfer", source: "Prime" },
];
export const openTasks = tasks.filter((t) => t.status !== "done");