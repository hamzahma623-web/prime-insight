import type { Trainer } from "../types";

export const trainers: Trainer[] = [
  { id: "tr-01", name: "Marco Fischer", locationId: "loc-fra", rating: 4.9, sessions: 312, retentionPct: 94, npsContribution: 18, status: "healthy", trend: "up", initials: "MF" },
  { id: "tr-02", name: "Aylin Demir", locationId: "loc-muc", rating: 4.8, sessions: 288, retentionPct: 92, npsContribution: 16, status: "healthy", trend: "up", initials: "AD" },
  { id: "tr-03", name: "Kevin Braun", locationId: "loc-dus", rating: 4.8, sessions: 265, retentionPct: 91, npsContribution: 15, status: "healthy", trend: "flat", initials: "KB" },
  { id: "tr-04", name: "Sophie Wagner", locationId: "loc-ham", rating: 4.7, sessions: 241, retentionPct: 89, npsContribution: 13, status: "healthy", trend: "up", initials: "SW" },
  { id: "tr-05", name: "Elena Popov", locationId: "loc-fra", rating: 4.7, sessions: 229, retentionPct: 88, npsContribution: 12, status: "healthy", trend: "flat", initials: "EP" },
  { id: "tr-06", name: "David Krüger", locationId: "loc-stg", rating: 4.5, sessions: 204, retentionPct: 85, npsContribution: 9, status: "healthy", trend: "up", initials: "DK" },
  { id: "tr-07", name: "Lisa Hartmann", locationId: "loc-ber", rating: 4.2, sessions: 187, retentionPct: 79, npsContribution: 4, status: "watch", trend: "down", initials: "LH" },
  { id: "tr-08", name: "Tim Berger", locationId: "loc-lpz", rating: 4.0, sessions: 156, retentionPct: 74, npsContribution: 1, status: "watch", trend: "down", initials: "TB" },
  { id: "tr-09", name: "Jana Wolf", locationId: "loc-cgn", rating: 3.6, sessions: 142, retentionPct: 68, npsContribution: -6, status: "critical", trend: "down", initials: "JW" },
  { id: "tr-10", name: "Ömer Kaya", locationId: "loc-cgn", rating: 3.4, sessions: 128, retentionPct: 64, npsContribution: -9, status: "critical", trend: "down", initials: "ÖK" },
];

export const topTrainers = [...trainers].sort((a, b) => b.rating - a.rating);
