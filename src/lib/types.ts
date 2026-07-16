// Zentrale Domänen-Typen für PrimeSolutions Insight.
// Bewusst getrennt von UI-Komponenten und Dummy-Daten.

export type HealthStatus = "healthy" | "watch" | "critical";
export type Priority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "open" | "in_progress" | "done";
export type Sentiment = "positive" | "neutral" | "negative";
export type Channel = "app" | "google" | "email" | "front_desk" | "survey";

export type Trend = "up" | "down" | "flat";

export interface Location {
  id: string;
  name: string;
  city: string;
  region: string;
  qualityScore: number; // 0–100
  avgRating: number; // 0–5
  nps: number; // -100..100
  feedbackCount: number;
  openTasks: number;
  criticalIssues: number;
  status: HealthStatus;
  memberChangePct: number; // z.B. -3.2
  ratingTrend: number[]; // Sparkline-Werte
  manager: string;
}

export interface Trainer {
  id: string;
  name: string;
  locationId: string;
  rating: number; // 0–5
  sessions: number;
  retentionPct: number;
  npsContribution: number;
  status: HealthStatus;
  trend: Trend;
  initials: string;
}

export interface Feedback {
  id: string;
  locationId: string;
  date: string; // ISO
  rating: number; // 1–5
  channel: Channel;
  category: string;
  sentiment: Sentiment;
  member: string;
  text: string;
  aiTags: string[];
}

export interface Task {
  id: string;
  title: string;
  locationId: string;
  priority: Priority;
  status: TaskStatus;
  assignee: string;
  due: string; // ISO
  category: string;
  source: string; // z.B. "Jarvis", "Feedback #A-2201"
}

export interface Report {
  id: string;
  title: string;
  period: string;
  type: "executive" | "location" | "trainer" | "compliance";
  createdAt: string; // ISO
  status: "ready" | "generating" | "scheduled";
  summary: string;
  metrics: { label: string; value: string; delta?: string; trend?: Trend }[];
}

export interface CriticalIssue {
  id: string;
  label: string;
  locationId: string;
  count: number;
  changePct: number;
  severity: Priority;
}

export interface CategoryCritique {
  category: string;
  mentions: number;
  changePct: number;
  sentiment: Sentiment;
}

export interface JarvisSource {
  label: string;
  detail: string;
}

export interface JarvisAction {
  title: string;
  priority: Priority;
  owner: string;
  locationId?: string;
}

export interface JarvisAnswer {
  headline: string;
  body: string;
  actions: JarvisAction[];
  sources: JarvisSource[];
  focusLocationIds: string[];
}

export interface JarvisPrompt {
  id: string;
  question: string;
  answer: JarvisAnswer;
}
