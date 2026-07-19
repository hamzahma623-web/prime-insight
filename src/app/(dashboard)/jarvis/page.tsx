"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { Card } from "@/components/ui/Card";
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
    return "Guten Morgen Jessica ☀️";
  }

  if (hour < 18) {
    return "Guten Tag Jessica 👋";
  }

  return "Guten Abend Jessica 🌙";
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
    good:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-600",
    attention:
      "border-amber-500/25 bg-amber-500/10 text-amber-600",
    critical:
      "border-danger/30 bg-danger/10 text-danger",
    neutral:
      "border-border bg-muted text-muted-foreground",
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
      "border-danger/30 bg-danger/10 text-danger",
    high:
      "border-orange-500/30 bg-orange-500/10 text-orange-600",
    medium:
      "border-amber-500/30 bg-amber-500/10 text-amber-600",
    low:
      "border-border bg-muted text-muted-foreground",
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
              ? `✅ Die Aufgabe ${createdTitles} wurde erstellt und ist jetzt im Bereich „Aufgaben“ sichtbar.`
              : `✅ Die Aufgaben ${createdTitles} wurden erstellt und sind jetzt im Bereich „Aufgaben“ sichtbar.`,
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

  return (
    <div>
      <SectionHeading
        eyebrow="Assistent der Geschäftsführung"
        title="Jarvis"
        description="Dein persönlicher Assistent für Feedbacks, Aufgaben und die Entwicklung deines Studios."
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
        <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <span>{errorMessage}</span>

          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="shrink-0 font-medium hover:opacity-70"
          >
            Schließen
          </button>
        </div>
      ) : null}

      <Card className="relative flex h-[calc(100vh-13rem)] min-h-[620px] flex-col overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon name="jarvis" size={18} />
              </span>

              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                Jarvis
              </p>

              <p className="text-xs text-muted-foreground">
                Persönlicher Management-Assistent · Live-Daten
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
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

        {!isThinking && messages.length <= 2 ? (
          <SuggestionArea
            onSelect={(suggestion) =>
              void sendMessage(suggestion)
            }
          />
        ) : null}

        <div className="border-t border-border bg-card p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 shadow-sm transition-all focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-ring">
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
                  ? "Jarvis sieht sich die Daten an ..."
                  : "Was möchtest du wissen?"
              }
              className="h-10 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isThinking}
              aria-label="Nachricht senden"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="send" size={16} />
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Jarvis berücksichtigt ausschließlich deine
            freigegebenen Standortdaten.
          </p>
        </div>
      </Card>
    </div>
  );
}

function UserMessage({
  content,
}: {
  content: string;
}) {
  return (
    <div className="flex animate-[fadeIn_250ms_ease-out] justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground shadow-sm md:max-w-[70%]">
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
    <div className="flex animate-[fadeIn_300ms_ease-out] gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon name="jarvis" size={17} />
      </span>

      <div className="min-w-0 max-w-4xl flex-1">
        {message.answer ? (
          <JarvisAnswerBlock answer={message.answer} />
        ) : (
          <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/40 p-5 shadow-sm">
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
    <div className="border-t border-border bg-muted/10 px-5 py-4">
      <p className="mb-3 text-xs font-semibold text-foreground">
        Womit soll ich starten?
      </p>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent hover:shadow-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 animate-pulse items-center justify-center rounded-xl bg-accent-soft text-accent">
        <Icon name="jarvis" size={17} />
      </span>

      <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
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
    <div className="overflow-hidden rounded-2xl rounded-tl-sm border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Jarvis Briefing
          </p>

          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
              answer.status
            )}`}
          >
            {getStatusLabel(answer.status)}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-5">
        <BriefingSection
          icon="💬"
          title="Kurz gesagt"
        >
          {answer.message ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {answer.message}
            </p>
          ) : null}

          {answer.summary ? (
            <p
              className={
                answer.message
                  ? "mt-2 text-lg font-semibold leading-7 text-foreground"
                  : "text-lg font-semibold leading-7 text-foreground"
              }
            >
              {answer.summary}
            </p>
          ) : null}
        </BriefingSection>

        {hasObservations ? (
          <BriefingSection
            icon="👀"
            title="Mir ist etwas aufgefallen"
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
            icon="🎯"
            title="Das würde ich heute tun"
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
            icon="✅"
            title="Passende Aufgaben"
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

      <div className="flex items-center gap-1.5 border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
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
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden="true">{icon}</span>

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
          ? "flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5"
          : "flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5"
      }
    >
      <span
        className={
          variant === "attention"
            ? "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            : "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
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
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
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
    <div className="rounded-xl border border-accent/20 bg-accent-soft/30 p-3">
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
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClass(
        priority
      )}`}
    >
      {getPriorityLabel(priority)}
    </span>
  );
}