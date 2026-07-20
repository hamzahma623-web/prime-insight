"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/lib/icons";
import {
  TIME_RANGES,
  useFilters,
} from "@/components/providers/FilterProvider";

type JarvisStatus =
  | "good"
  | "attention"
  | "critical"
  | "neutral";

type JarvisPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

type JarvisRecommendation = {
  title: string;
  description: string;
  priority: JarvisPriority;
  reason: string;
};

type JarvisTaskDraft = {
  title: string;
  description: string;
  priority: JarvisPriority;
  category: string;
  reason: string;
  feedbackId: string | null;
  locationId: string | null;
};

type JarvisAnswer = {
  message: string;
  status: JarvisStatus;
  summary: string;
  keyFacts: string[];
  risks: string[];
  recommendations: JarvisRecommendation[];
  taskDrafts: JarvisTaskDraft[];
};

type JarvisApiResponse = {
  ok: boolean;
  answer?: JarvisAnswer;
  error?: string;
};

type CreateTaskApiResponse = {
  ok: boolean;
  task?: {
    id: string;
    title: string;
  };
  error?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  answer?: JarvisAnswer;
};

const INITIAL_BRIEFING_PROMPT = `
Erstelle ein kurzes persönliches Startbriefing zur aktuellen Lage.

Fasse nur die wichtigsten Erkenntnisse zusammen.

Sage klar:
- wie das Studio insgesamt läuft
- was heute Aufmerksamkeit verdient
- welche maximal drei Maßnahmen sinnvoll sind

Erfinde keine Entwicklungen oder Vergleiche.
Erstelle keine Aufgabenentwürfe, außer eine Aufgabe ist eindeutig notwendig.
Antworte wie ein persönlicher Management-Assistent.
`.trim();

const SUGGESTIONS = [
  "Wie läuft mein Studio aktuell?",
  "Was verdient heute meine Aufmerksamkeit?",
  "Was sollte ich heute priorisieren?",
  "Was sagen unsere Mitglieder?",
  "Welche Aufgaben sollte ich erstellen?",
];

function createMessageId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function isTaskConfirmation(message: string) {
  const normalized = message
    .trim()
    .toLowerCase()
    .replace(/[.!?,]/g, "")
    .replace(/\s+/g, " ");

  return [
    "ja",
    "ja bitte",
    "ja bitte erstellen",
    "ja bitte anlegen",
    "bitte erstellen",
    "bitte anlegen",
    "erstelle die aufgabe",
    "erstelle sie",
    "leg die aufgabe an",
    "leg sie an",
    "mach das",
    "mach sie",
  ].includes(normalized);
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Guten Morgen Jessica";
  }

  if (hour < 18) {
    return "Guten Tag Jessica";
  }

  return "Guten Abend Jessica";
}

function getIntroMessage() {
  return `${getGreeting()}

Ich habe mir die aktuelle Lage angesehen. Hier ist dein persönliches Briefing.`;
}

function getStatusLabel(status: JarvisStatus) {
  const labels: Record<JarvisStatus, string> = {
    good: "Alles im grünen Bereich",
    attention: "Bitte im Blick behalten",
    critical: "Handlungsbedarf",
    neutral: "Aktuelle Einschätzung",
  };

  return labels[status];
}

function getStatusClass(status: JarvisStatus) {
  const classes: Record<JarvisStatus, string> = {
    good: "border-accent/25 bg-accent-soft text-accent",
    attention:
      "border-warning/25 bg-warning-soft text-warning",
    critical:
      "border-danger/30 bg-danger-soft text-danger",
    neutral:
      "border-border bg-muted text-muted-foreground",
  };

  return classes[status];
}

function getStatusDot(status: JarvisStatus) {
  const classes: Record<JarvisStatus, string> = {
    good: "bg-accent",
    attention: "bg-warning",
    critical: "bg-danger",
    neutral: "bg-muted-foreground",
  };

  return classes[status];
}

function getPriorityLabel(priority: JarvisPriority) {
  const labels: Record<JarvisPriority, string> = {
    critical: "Kritisch",
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
  };

  return labels[priority];
}

function getPriorityClass(priority: JarvisPriority) {
  const classes: Record<JarvisPriority, string> = {
    critical:
      "border-danger/30 bg-danger-soft text-danger",
    high: "border-warning/30 bg-warning-soft text-warning",
    medium:
      "border-warning/25 bg-warning-soft text-warning",
    low: "border-border bg-muted text-muted-foreground",
  };

  return classes[priority];
}

export default function JarvisPage() {
  const {
    locationId,
    setLocationId,
    timeRange,
    setTimeRange,
    locationOptions,
  } = useFilters();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(
    []
  );
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const createdDraftMessageIdsRef = useRef<Set<string>>(
    new Set()
  );

  /*
   * Verhindert doppelte Startbriefings, zum Beispiel
   * durch React Strict Mode in der lokalen Entwicklung.
   */
  const requestedBriefingKeyRef = useRef<string | null>(
    null
  );

  /*
   * Enthält immer den aktuell ausgewählten Filter-Key.
   * Dadurch werden Antworten alter Requests ignoriert,
   * wenn Standort oder Zeitraum gewechselt wurden.
   */
  const activeBriefingKeyRef = useRef<string | null>(
    null
  );

  useEffect(() => {
    const briefingKey = `${locationId}:${timeRange}`;

    activeBriefingKeyRef.current = briefingKey;

    setMessages([
      {
        id: "jarvis-intro",
        role: "assistant",
        content: getIntroMessage(),
      },
    ]);

    setInput("");
    setErrorMessage("");

    if (
      requestedBriefingKeyRef.current === briefingKey
    ) {
      return;
    }

    requestedBriefingKeyRef.current = briefingKey;

    async function loadInitialBriefing() {
      setIsThinking(true);

      try {
        const response = await fetch("/api/jarvis/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: INITIAL_BRIEFING_PROMPT,
            locationId,
            timeRange,
            messages: [],
          }),
        });

        const result =
          (await response.json()) as JarvisApiResponse;

        if (
          !response.ok ||
          !result.ok ||
          !result.answer
        ) {
          throw new Error(
            result.error ||
              "Jarvis konnte das Startbriefing nicht erstellen."
          );
        }

        /*
         * Falls während des Requests der Filter
         * gewechselt wurde, wird die alte Antwort
         * nicht mehr angezeigt.
         */
        if (
          activeBriefingKeyRef.current !== briefingKey
        ) {
          return;
        }

        const briefingMessage: ChatMessage = {
          id: createMessageId(),
          role: "assistant",
          content: result.answer.message,
          answer: result.answer,
        };

        setMessages((current) => [
          ...current,
          briefingMessage,
        ]);
      } catch (error) {
        console.error(
          "Jarvis initial briefing failed:",
          error
        );

        if (
          activeBriefingKeyRef.current !== briefingKey
        ) {
          return;
        }

        /*
         * Bei einem Fehler darf ein erneuter Versuch
         * durch einen späteren Filterwechsel oder
         * erneuten Seitenaufruf möglich sein.
         */
        requestedBriefingKeyRef.current = null;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Jarvis konnte das Startbriefing nicht laden."
        );
      } finally {
        if (
          activeBriefingKeyRef.current === briefingKey
        ) {
          setIsThinking(false);
        }
      }
    }

    void loadInitialBriefing();
  }, [locationId, timeRange]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isThinking]);

  async function createTaskFromDraft(
    task: JarvisTaskDraft
  ) {
    const taskLocationId =
      task.locationId ||
      (locationId !== "all" ? locationId : null);

    if (!taskLocationId) {
      throw new Error(
        "Bitte wähle zuerst einen konkreten Standort aus, bevor Jarvis die Aufgabe erstellt."
      );
    }

    const response = await fetch("/api/tasks/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId: taskLocationId,
        feedbackId: task.feedbackId,
        title: task.title,
        description: task.description || null,
        priority: task.priority,
        status: "open",
        category: task.category || "Allgemein",
        assigneeName: null,
        source: "Jarvis",
        dueAt: null,
      }),
    });

    const result =
      (await response.json()) as CreateTaskApiResponse;

    if (!response.ok || !result.ok || !result.task) {
      throw new Error(
        result.error ||
          "Die Aufgabe konnte nicht erstellt werden."
      );
    }

    return result.task;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setErrorMessage("");
    setIsThinking(true);

    const latestDraftMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === "assistant" &&
          Boolean(message.answer?.taskDrafts.length) &&
          !createdDraftMessageIdsRef.current.has(
            message.id
          )
      );

    if (
      isTaskConfirmation(trimmed) &&
      latestDraftMessage?.answer?.taskDrafts.length
    ) {
      try {
        const createdTasks = [];

        for (const taskDraft of latestDraftMessage.answer
          .taskDrafts) {
          const createdTask =
            await createTaskFromDraft(taskDraft);

          createdTasks.push(createdTask);
        }

        createdDraftMessageIdsRef.current.add(
          latestDraftMessage.id
        );

        const createdTitles = createdTasks
          .map((task) => `„${task.title}“`)
          .join(", ");

        const confirmationMessage: ChatMessage = {
          id: createMessageId(),
          role: "assistant",
          content:
            createdTasks.length === 1
              ? `Die Aufgabe ${createdTitles} wurde erstellt und ist jetzt im Bereich „Aufgaben“ sichtbar.`
              : `Die Aufgaben ${createdTitles} wurden erstellt und sind jetzt im Bereich „Aufgaben“ sichtbar.`,
        };

        setMessages((current) => [
          ...current,
          confirmationMessage,
        ]);
      } catch (error) {
        console.error(
          "Jarvis task creation failed:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Die Aufgabe konnte nicht erstellt werden."
        );
      } finally {
        setIsThinking(false);

        window.setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }

      return;
    }

    try {
      const response = await fetch("/api/jarvis/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          locationId,
          timeRange,
          messages: messages
            .filter(
              (message) =>
                message.id !== "jarvis-intro"
            )
            .slice(-6)
            .map((message) => ({
              role: message.role,
              content: message.content,
            })),
        }),
      });

      const result =
        (await response.json()) as JarvisApiResponse;

      if (!response.ok || !result.ok || !result.answer) {
        throw new Error(
          result.error ||
            "Jarvis konnte keine Antwort erstellen."
        );
      }

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: result.answer.message,
        answer: result.answer,
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Jarvis request failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Jarvis konnte die Anfrage nicht bearbeiten."
      );
    } finally {
      setIsThinking(false);

      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }

  function handleSubmit() {
    void sendMessage(input);
  }

  const activeLocationLabel =
    locationId === "all"
      ? "Alle Standorte"
      : locationOptions.find(
          (option) => option.value === locationId
        )?.label ?? "Standort";

  const activeTimeLabel =
    TIME_RANGES.find((range) => range.value === timeRange)
      ?.label ?? "Zeitraum";

  const showSuggestions =
    !isThinking && messages.length <= 2;

  return (
    <div>
      <SectionHeading
        eyebrow="Assistent der Geschäftsführung"
        title="Jarvis"
        description="Dein persönlicher Copilot für Feedbacks, Aufgaben und die Entwicklung deines Studios."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              ariaLabel="Standort für Jarvis"
              icon="location"
              value={locationId}
              options={locationOptions}
              onChange={setLocationId}
            />

            <Select
              ariaLabel="Zeitraum für Jarvis"
              icon="clock"
              value={timeRange}
              options={TIME_RANGES}
              onChange={(value) =>
                setTimeRange(value as typeof timeRange)
              }
            />
          </div>
        }
      />

      {errorMessage ? (
        <div className="animate-fade mb-5 flex items-start justify-between gap-4 rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <span>{errorMessage}</span>

          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="focus-ring shrink-0 rounded font-medium hover:opacity-70"
          >
            Schließen
          </button>
        </div>
      ) : null}

      <div className="animate-scale-in relative flex h-[calc(100vh-13rem)] min-h-[640px] flex-col overflow-hidden rounded-[var(--radius-surface)] border border-border bg-card shadow-[var(--shadow-card)]">
        {/* Volumetrischer Hintergrund */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="grid-texture absolute inset-0 opacity-70" />
          <div
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)",
            }}
          />
          <div
            className="absolute -right-16 top-1/3 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--foreground) 8%, transparent), transparent 70%)",
            }}
          />
        </div>

        {/* Kopf: AI-Präsenz + Kontext */}
        <div className="relative flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3.5">
            <JarvisCore size={46} active={isThinking} />

            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-sm font-semibold tracking-[var(--tracking-tight)] text-foreground">
                  Jarvis
                </p>

                <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-accent/20 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                  <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                    <span className="absolute inline-flex h-1.5 w-1.5 animate-ping-slow rounded-full bg-accent/60" />
                    <span className="relative inline-flex h-1 w-1 rounded-full bg-accent" />
                  </span>
                  {isThinking ? "Analysiert" : "Online"}
                </span>
              </div>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Interner Management-Copilot · Live-Daten
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <ContextChip icon="location" label={activeLocationLabel} />
            <ContextChip icon="clock" label={activeTimeLabel} />
          </div>
        </div>

        {/* Verlauf */}
        <div className="relative flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.map((message) =>
            message.role === "user" ? (
              <UserMessage
                key={message.id}
                content={message.content}
              />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
              />
            )
          )}

          {isThinking ? <ThinkingIndicator /> : null}

          <div ref={endRef} />
        </div>

        {/* Vorschläge */}
        {showSuggestions ? (
          <SuggestionArea
            onSelect={(suggestion) =>
              void sendMessage(suggestion)
            }
          />
        ) : null}

        {/* Eingabe */}
        <div className="relative border-t border-border/70 bg-card/60 p-4 backdrop-blur-md">
          <div className="group flex items-end gap-2 rounded-[var(--radius-card)] border border-border bg-background px-3 py-2 transition-all duration-200 focus-within:border-accent/50 focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_14%,transparent)]">
            <span className="flex h-10 w-8 items-center justify-center text-accent">
              <Icon name="sparkle" size={16} />
            </span>

            <input
              ref={inputRef}
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isThinking}
              placeholder={
                isThinking
                  ? "Jarvis sieht sich die Daten an …"
                  : "Frag Jarvis etwas zu deinem Studio …"
              }
              className="h-10 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isThinking}
              aria-label="Nachricht senden"
              className="focus-ring interactive inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-foreground text-background shadow-[var(--shadow-flat)] hover:shadow-[var(--shadow-raised)] disabled:pointer-events-none disabled:opacity-40 dark:bg-white dark:text-[#0a0b0d]"
            >
              <Icon name="send" size={16} />
            </button>
          </div>

          <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
            Jarvis berücksichtigt ausschließlich deine
            freigegebenen Standortdaten.
          </p>
        </div>
      </div>
    </div>
  );
}

/* --- Animierter AI-Core (reines CSS/SVG, keine Dependency) --- */
function JarvisCore({
  size = 46,
  active = false,
}: {
  size?: number;
  active?: boolean;
}) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* weiches Glühen */}
      <span
        className={active ? "animate-breathe absolute inset-0" : "absolute inset-0"}
        style={{
          borderRadius: "9999px",
          background:
            "radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--accent) 55%, transparent), transparent 62%)",
          filter: "blur(7px)",
          opacity: active ? 0.95 : 0.65,
        }}
      />

      {/* äußerer rotierender Lichtbogen */}
      <span
        className="animate-spin-slow absolute inset-0"
        style={{
          borderRadius: "9999px",
          background:
            "conic-gradient(from 90deg, transparent, var(--accent), transparent 55%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 58%, #000 60%)",
          maskImage:
            "radial-gradient(circle, transparent 58%, #000 60%)",
          opacity: 0.8,
        }}
      />

      {/* gegenläufiger, feiner Bogen */}
      <span
        className="animate-spin-slow absolute inset-[3px]"
        style={{
          borderRadius: "9999px",
          background:
            "conic-gradient(from 270deg, transparent, color-mix(in srgb, var(--foreground) 30%, transparent), transparent 40%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 60%, #000 62%)",
          maskImage:
            "radial-gradient(circle, transparent 60%, #000 62%)",
          animationDirection: "reverse",
          animationDuration: "9s",
          opacity: 0.6,
        }}
      />

      {/* Orbit-Partikel */}
      <span
        className="orbit"
        style={{ animationDuration: active ? "4.5s" : "7s" }}
      />

      {/* Kern */}
      <span
        className="relative flex items-center justify-center rounded-full border border-border bg-card text-accent shadow-[var(--shadow-flat)]"
        style={{ width: size * 0.62, height: size * 0.62 }}
      >
        <Icon name="jarvis" size={Math.round(size * 0.36)} />
      </span>
    </span>
  );
}

function ContextChip({
  icon,
  label,
}: {
  icon: "location" | "clock";
  label: string;
}) {
  return (
    <span className="inline-flex max-w-[190px] items-center gap-1.5 rounded-[var(--radius-pill)] border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
      <Icon name={icon} size={13} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function UserMessage({
  content,
}: {
  content: string;
}) {
  return (
    <div className="animate-rise flex justify-end">
      <div className="max-w-[85%] rounded-[var(--radius-card)] rounded-br-md bg-foreground px-4 py-3 text-sm leading-6 text-background shadow-[var(--shadow-flat)] md:max-w-[70%] dark:bg-white dark:text-[#0a0b0d]">
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
}: {
  message: ChatMessage;
}) {
  return (
    <div className="animate-rise flex gap-3.5">
      <JarvisCore size={38} />

      <div className="min-w-0 max-w-4xl flex-1">
        {message.answer ? (
          <JarvisAnswerBlock answer={message.answer} />
        ) : (
          <div className="ai-card rounded-tl-md p-5">
            <p className="whitespace-pre-line text-sm leading-7 text-foreground">
              {message.content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionArea({
  onSelect,
}: {
  onSelect: (suggestion: string) => void;
}) {
  return (
    <div className="relative border-t border-border/70 bg-muted/20 px-5 py-4 backdrop-blur-sm">
      <p className="text-eyebrow mb-3 text-muted-foreground/70">
        Womit soll ich starten?
      </p>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="focus-ring interactive group inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground hover:border-accent/40 hover:text-accent"
          >
            <Icon
              name="sparkle"
              size={13}
              className="text-muted-foreground transition-colors group-hover:text-accent"
            />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="animate-fade flex gap-3.5">
      <JarvisCore size={38} active />

      <div className="ai-card relative overflow-hidden rounded-tl-md px-4 py-3.5">
        <span className="scanline" aria-hidden="true" />

        <div className="relative flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
          </div>

          <p className="text-sm text-muted-foreground">
            Ich gleiche gerade Feedbacks und Aufgaben miteinander ab …
          </p>
        </div>
      </div>
    </div>
  );
}

function JarvisAnswerBlock({
  answer,
}: {
  answer: JarvisAnswer;
}) {
  const hasObservations =
    answer.keyFacts.length > 0 ||
    answer.risks.length > 0;

  return (
    <div className="ai-card overflow-hidden rounded-tl-md">
      {/* Kopf */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <p className="text-eyebrow text-muted-foreground">
          Jarvis Briefing
        </p>

        <span
          className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
            answer.status
          )}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
              answer.status
            )}`}
          />
          {getStatusLabel(answer.status)}
        </span>
      </div>

      <div className="space-y-6 p-5">
        <BriefingSection title="Kurz gesagt" icon="sparkle">
          {answer.message ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {answer.message}
            </p>
          ) : null}

          {answer.summary ? (
            <p
              className={
                answer.message
                  ? "mt-2 font-display text-lg font-semibold leading-7 tracking-[var(--tracking-tight)] text-foreground"
                  : "font-display text-lg font-semibold leading-7 tracking-[var(--tracking-tight)] text-foreground"
              }
            >
              {answer.summary}
            </p>
          ) : null}
        </BriefingSection>

        {hasObservations ? (
          <BriefingSection
            title="Mir ist etwas aufgefallen"
            icon="search"
          >
            <div className="space-y-2">
              {answer.keyFacts.map((fact) => (
                <BriefingPoint
                  key={`fact-${fact}`}
                  text={fact}
                />
              ))}

              {answer.risks.map((risk) => (
                <BriefingPoint
                  key={`risk-${risk}`}
                  text={risk}
                  variant="attention"
                />
              ))}
            </div>
          </BriefingSection>
        ) : null}

        {answer.recommendations.length > 0 ? (
          <BriefingSection
            title="Das würde ich heute tun"
            icon="trend"
          >
            <div className="space-y-3">
              {answer.recommendations.map(
                (recommendation, index) => (
                  <RecommendationItem
                    key={`${recommendation.title}-${index}`}
                    recommendation={recommendation}
                    index={index}
                  />
                )
              )}
            </div>
          </BriefingSection>
        ) : null}

        {answer.taskDrafts.length > 0 ? (
          <BriefingSection
            title="Passende Aufgaben"
            icon="check"
          >
            <div className="space-y-3">
              {answer.taskDrafts.map(
                (task, index) => (
                  <TaskDraftItem
                    key={`${task.title}-${index}`}
                    task={task}
                  />
                )
              )}
            </div>
          </BriefingSection>
        ) : null}
      </div>

      {/* Fuß */}
      <div className="flex items-center gap-1.5 border-t border-border/70 bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
        <Icon name="reports" size={13} />
        Basierend auf aktuellen Feedbacks und Aufgaben
      </div>
    </div>
  );
}

function BriefingSection({
  icon,
  title,
  children,
}: {
  icon: "sparkle" | "search" | "trend" | "check";
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
          <Icon name={icon} size={13} />
        </span>

        <h3 className="text-sm font-semibold text-foreground">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function BriefingPoint({
  text,
  variant = "default",
}: {
  text: string;
  variant?: "default" | "attention";
}) {
  return (
    <div
      className={
        variant === "attention"
          ? "flex items-start gap-3 rounded-[var(--radius-control)] border border-warning/20 bg-warning-soft/50 px-3.5 py-2.5"
          : "flex items-start gap-3 rounded-[var(--radius-control)] border border-border bg-muted/25 px-3.5 py-2.5"
      }
    >
      <span
        className={
          variant === "attention"
            ? "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
            : "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
        }
      />

      <p className="text-sm leading-5 text-foreground">
        {text}
      </p>
    </div>
  );
}

function RecommendationItem({
  recommendation,
  index,
}: {
  recommendation: JarvisRecommendation;
  index: number;
}) {
  return (
    <div className="interactive rounded-[var(--radius-control)] border border-border bg-muted/25 p-3.5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent-soft text-xs font-semibold text-accent">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              {recommendation.title}
            </p>

            <PriorityBadge
              priority={recommendation.priority}
            />
          </div>

          {recommendation.description ? (
            <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
              {recommendation.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TaskDraftItem({
  task,
}: {
  task: JarvisTaskDraft;
}) {
  return (
    <div className="rounded-[var(--radius-control)] border border-accent/20 bg-accent-soft/40 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {task.title}
          </p>

          {task.category ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {task.category}
            </p>
          ) : null}
        </div>

        <PriorityBadge priority={task.priority} />
      </div>

      {task.description ? (
        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          {task.description}
        </p>
      ) : null}
    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: JarvisPriority;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-[var(--radius-pill)] border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClass(
        priority
      )}`}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}