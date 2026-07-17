"use client";

import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/Primitives";
import { Card } from "@/components/ui/Card";
import { Badge, PriorityBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/lib/icons";
import {
  TIME_RANGES,
  useFilters,
} from "@/components/providers/FilterProvider";
import { jarvisPrompts, jarvisFallback } from "@/lib/data/jarvis";
import { locationName } from "@/lib/data/locations";
import type { JarvisAnswer } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  text?: string;
  answer?: JarvisAnswer;
}

function answerFor(text: string): JarvisAnswer {
  const query = text.toLowerCase();

  const exactMatch = jarvisPrompts.find(
    (prompt) => prompt.question.toLowerCase() === query
  );

  if (exactMatch) {
    return exactMatch.answer;
  }

  const keywordMatch = jarvisPrompts.find((prompt) => {
    const words = prompt.question
      .toLowerCase()
      .replace(/[?.,]/g, "")
      .split(" ")
      .filter((word) => word.length > 4);

    return words.some((word) => query.includes(word));
  });

  return keywordMatch?.answer ?? jarvisFallback;
}

export default function JarvisPage() {
  const {
    locationId,
    setLocationId,
    timeRange,
    setTimeRange,
    locationOptions,
  } = useFilters();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      answer: {
        headline: "Guten Morgen. Ich habe deine Standorte im Blick.",
        body:
          "Frag mich nach der aktuellen Lage, kritischen Problemen oder empfohlenen Maßnahmen. Nutze eine der Vorschlagsfragen oder tippe frei.",
        actions: [],
        sources: [
          {
            label: "Datenbasis",
            detail: "Aktuell noch Beispielauswertung",
          },
        ],
        focusLocationIds: [],
      },
    },
  ]);

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  function send(text: string) {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    const answer = answerFor(trimmed);

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `u-${currentMessages.length}`,
        role: "user",
        text: trimmed,
      },
      {
        id: `a-${currentMessages.length}`,
        role: "assistant",
        answer,
      },
    ]);

    setInput("");
  }

  const unusedPrompts = jarvisPrompts.filter(
    (prompt) =>
      !messages.some(
        (message) => message.text === prompt.question
      )
  );

  return (
    <div>
      <SectionHeading
        eyebrow="KI-Assistent der Geschäftsführung"
        title="Jarvis"
        description="Fragen zu deinen Standorten, Aufgaben und Feedbacks."
        action={
          <div className="flex items-center gap-2">
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

      <Card className="flex h-[calc(100vh-13rem)] flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {messages.map((message) =>
            message.role === "user" ? (
              <div
                key={message.id}
                className="flex justify-end"
              >
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {message.text}
                </div>
              </div>
            ) : (
              <div
                key={message.id}
                className="flex gap-3"
              >
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon name="jarvis" size={16} />
                </span>

                <div className="min-w-0 flex-1">
                  <AnswerBlock answer={message.answer!} />
                </div>
              </div>
            )
          )}

          <div ref={endRef} />
        </div>

        {unusedPrompts.length > 0 ? (
          <div className="border-t border-border px-5 py-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              Vorschläge
            </div>

            <div className="flex flex-wrap gap-2">
              {unusedPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => send(prompt.question)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  {prompt.question}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring">
            <input
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  send(input);
                }
              }}
              placeholder="Frag Jarvis etwas zu deinen Standorten…"
              className="h-9 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />

            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim()}
              aria-label="Senden"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Icon name="send" size={16} />
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Aktuell noch mit Beispielantworten.
          </p>
        </div>
      </Card>
    </div>
  );
}

function AnswerBlock({
  answer,
}: {
  answer: JarvisAnswer;
}) {
  return (
    <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/40 p-4">
      <p className="text-sm font-semibold text-foreground">
        {answer.headline}
      </p>

      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {answer.body}
      </p>

      {answer.focusLocationIds.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Fokus:
          </span>

          {answer.focusLocationIds.map((id) => (
            <Badge key={id} tone="accent">
              {locationName(id)}
            </Badge>
          ))}
        </div>
      ) : null}

      {answer.actions.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
            Priorisierte Maßnahmen
          </div>

          <div className="space-y-2">
            {answer.actions.map((action, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {action.title}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {action.owner}
                    {action.locationId
                      ? ` · ${locationName(
                          action.locationId
                        )}`
                      : ""}
                  </p>
                </div>

                <PriorityBadge
                  priority={action.priority}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {answer.sources.length > 0 ? (
        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Icon name="reports" size={13} />
            Quellen &amp; Datenbasis
          </div>

          <div className="flex flex-wrap gap-1.5">
            {answer.sources.map((source, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                <span className="font-medium text-foreground">
                  {source.label}:
                </span>
                {source.detail}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}