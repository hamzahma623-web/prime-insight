export type JarvisChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type JarvisStatus =
  | "good"
  | "attention"
  | "critical"
  | "neutral";

export type JarvisPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type JarvisRecommendation = {
  title: string;
  description: string;
  priority: JarvisPriority;
  reason: string;
};

export type JarvisTaskDraft = {
  title: string;
  description: string;
  priority: JarvisPriority;
  category: string;
  reason: string;
  feedbackId: string | null;
  locationId: string | null;
};

export type JarvisAnswer = {
  message: string;
  status: JarvisStatus;
  summary: string;
  keyFacts: string[];
  risks: string[];
  recommendations: JarvisRecommendation[];
  taskDrafts: JarvisTaskDraft[];
};