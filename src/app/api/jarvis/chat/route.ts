import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { JARVIS_SYSTEM_PROMPT } from "@/lib/jarvis/system-prompt";
import type {
  JarvisAnswer,
  JarvisChatMessage,
} from "@/lib/jarvis/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ORGANIZATION_WIDE_ROLES = [
  "super_admin",
  "owner",
  "regional_manager",
];

type RequestBody = {
  message?: string;
  locationId?: string;
  timeRange?: string;
  messages?: JarvisChatMessage[];
};

type FeedbackRow = {
  id: string;
  location_id: string;
  overall_rating: number;
  cleanliness_rating: number | null;
  equipment_rating: number | null;
  atmosphere_rating: number | null;
  staff_rating: number | null;
  comment: string | null;
  improvement_suggestion: string | null;
  status: string;
  created_at: string;
  locations:
    | {
        id: string;
        name: string;
        slug: string;
        city: string | null;
      }
    | {
        id: string;
        name: string;
        slug: string;
        city: string | null;
      }[]
    | null;
};

type TaskRow = {
  id: string;
  location_id: string;
  feedback_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string | null;
  assignee_name: string | null;
  source: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  locations:
    | {
        id: string;
        name: string;
        slug: string;
        city: string | null;
      }
    | {
        id: string;
        name: string;
        slug: string;
        city: string | null;
      }[]
    | null;
};

function getStartDate(timeRange: string) {
  const rangeDays: Record<string, number> = {
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "90d": 90,
    "180d": 180,
    "365d": 365,
  };

  const days = rangeDays[timeRange];

  if (!days) {
    return null;
  }

  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);

  return date;
}

function getPeriodLabel(timeRange: string) {
  const labels: Record<string, string> = {
    "7d": "letzte 7 Tage",
    "14d": "letzte 14 Tage",
    "30d": "letzte 30 Tage",
    "90d": "letzte 90 Tage",
    "180d": "letzte 6 Monate",
    "365d": "letzte 12 Monate",
    all: "gesamter verfügbarer Zeitraum",
  };

  return labels[timeRange] ?? "ausgewählter Zeitraum";
}

function getLocationName(
  location:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null
) {
  if (!location) {
    return "Unbekannter Standort";
  }

  if (Array.isArray(location)) {
    return location[0]?.name ?? "Unbekannter Standort";
  }

  return location.name;
}

function createFallbackAnswer(message: string): JarvisAnswer {
  return {
    message,
    status: "neutral",
    summary: message,
    keyFacts: [],
    risks: [],
    recommendations: [],
    taskDrafts: [],
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "OPENAI_API_KEY fehlt in der Serverkonfiguration.",
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as RequestBody;

    const userMessage = body.message?.trim();
    const requestedLocation = body.locationId ?? "all";
    const timeRange = body.timeRange ?? "30d";

    if (!userMessage) {
      return NextResponse.json(
        {
          ok: false,
          error: "Bitte gib eine Frage ein.",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Nicht angemeldet.",
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, organization_id, role, is_active")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      !profile.is_active
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Profil nicht gefunden oder inaktiv.",
        },
        { status: 403 }
      );
    }

    const hasOrganizationWideAccess =
      ORGANIZATION_WIDE_ROLES.includes(profile.role);

    let allowedLocationIds: string[] | null = null;

    if (!hasOrganizationWideAccess) {
      const { data: accessRows, error: accessError } =
        await supabaseAdmin
          .from("user_location_access")
          .select("location_id")
          .eq("user_id", user.id);

      if (accessError) {
        console.error(
          "Jarvis location access failed:",
          accessError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "Standortberechtigungen konnten nicht geladen werden.",
          },
          { status: 500 }
        );
      }

      allowedLocationIds =
        accessRows?.map((row) => row.location_id) ?? [];
    }

    let selectedLocationId: string | null = null;

    if (requestedLocation !== "all") {
      if (UUID_PATTERN.test(requestedLocation)) {
        selectedLocationId = requestedLocation;
      } else {
        const {
          data: selectedLocation,
          error: locationError,
        } = await supabaseAdmin
          .from("locations")
          .select("id")
          .eq(
            "organization_id",
            profile.organization_id
          )
          .eq("slug", requestedLocation)
          .eq("is_active", true)
          .maybeSingle();

        if (locationError) {
          console.error(
            "Jarvis location lookup failed:",
            locationError
          );

          return NextResponse.json(
            {
              ok: false,
              error:
                "Standort konnte nicht geladen werden.",
            },
            { status: 500 }
          );
        }

        if (!selectedLocation) {
          return NextResponse.json(
            {
              ok: false,
              error: "Standort nicht gefunden.",
            },
            { status: 404 }
          );
        }

        selectedLocationId = selectedLocation.id;
      }
    }

    if (
      selectedLocationId &&
      allowedLocationIds &&
      !allowedLocationIds.includes(selectedLocationId)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Keine Berechtigung für diesen Standort.",
        },
        { status: 403 }
      );
    }

    if (
      allowedLocationIds &&
      allowedLocationIds.length === 0
    ) {
      return NextResponse.json({
        ok: true,
        answer: createFallbackAnswer(
          "Dir sind aktuell keine Standorte zugewiesen."
        ),
      });
    }

    let locationsQuery = supabaseAdmin
      .from("locations")
      .select("id, name, slug, city")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (selectedLocationId) {
      locationsQuery = locationsQuery.eq(
        "id",
        selectedLocationId
      );
    } else if (allowedLocationIds) {
      locationsQuery = locationsQuery.in(
        "id",
        allowedLocationIds
      );
    }

    let feedbackQuery = supabaseAdmin
      .from("feedback")
      .select(`
        id,
        location_id,
        overall_rating,
        cleanliness_rating,
        equipment_rating,
        atmosphere_rating,
        staff_rating,
        comment,
        improvement_suggestion,
        status,
        created_at,
        locations (
          id,
          name,
          slug,
          city
        )
      `)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(250);

    let tasksQuery = supabaseAdmin
      .from("tasks")
      .select(`
        id,
        location_id,
        feedback_id,
        title,
        description,
        priority,
        status,
        category,
        assignee_name,
        source,
        due_at,
        completed_at,
        created_at,
        locations (
          id,
          name,
          slug,
          city
        )
      `)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(250);

    if (selectedLocationId) {
      feedbackQuery = feedbackQuery.eq(
        "location_id",
        selectedLocationId
      );

      tasksQuery = tasksQuery.eq(
        "location_id",
        selectedLocationId
      );
    } else if (allowedLocationIds) {
      feedbackQuery = feedbackQuery.in(
        "location_id",
        allowedLocationIds
      );

      tasksQuery = tasksQuery.in(
        "location_id",
        allowedLocationIds
      );
    }

    const periodStart = getStartDate(timeRange);

    if (periodStart) {
      feedbackQuery = feedbackQuery.gte(
        "created_at",
        periodStart.toISOString()
      );

      tasksQuery = tasksQuery.gte(
        "created_at",
        periodStart.toISOString()
      );
    }

    const [
      { data: locations, error: locationsError },
      { data: feedbackData, error: feedbackError },
      { data: taskData, error: tasksError },
    ] = await Promise.all([
      locationsQuery,
      feedbackQuery,
      tasksQuery,
    ]);

    if (locationsError) {
      console.error(
        "Jarvis locations query failed:",
        locationsError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Standorte konnten nicht geladen werden.",
        },
        { status: 500 }
      );
    }

    if (feedbackError) {
      console.error(
        "Jarvis feedback query failed:",
        feedbackError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Feedbacks konnten nicht geladen werden.",
        },
        { status: 500 }
      );
    }

    if (tasksError) {
      console.error(
        "Jarvis tasks query failed:",
        tasksError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Aufgaben konnten nicht geladen werden.",
        },
        { status: 500 }
      );
    }

    const feedback =
      (feedbackData ?? []) as FeedbackRow[];

    const tasks = (taskData ?? []) as TaskRow[];

    const openTasks = tasks.filter(
      (task) => task.status !== "done"
    );

    const completedTasks = tasks.filter(
      (task) => task.status === "done"
    );

    const now = Date.now();

    const overdueTasks = openTasks.filter(
      (task) =>
        Boolean(task.due_at) &&
        new Date(task.due_at as string).getTime() < now
    );

    const criticalTasks = openTasks.filter(
      (task) => task.priority === "critical"
    );

    const negativeFeedback = feedback.filter(
      (item) => Number(item.overall_rating) <= 2
    );

    const positiveFeedback = feedback.filter(
      (item) => Number(item.overall_rating) >= 4
    );

    const averageRating =
      feedback.length > 0
        ? feedback.reduce(
            (sum, item) =>
              sum +
              Number(item.overall_rating ?? 0),
            0
          ) / feedback.length
        : 0;

    const feedbackWithLinkedTaskIds = new Set(
      tasks
        .map((task) => task.feedback_id)
        .filter(
          (feedbackId): feedbackId is string =>
            Boolean(feedbackId)
        )
    );

    const negativeFeedbackWithoutTask =
      negativeFeedback.filter(
        (item) =>
          !feedbackWithLinkedTaskIds.has(item.id)
      );

    /*
     * Es werden nur maximal 25 relevante Feedbacktexte
     * an OpenAI gesendet. Die vollständigen Kennzahlen
     * werden weiterhin über summary bereitgestellt.
     */
    const safeFeedback = feedback
      .filter(
        (item) =>
          Boolean(item.comment?.trim()) ||
          Boolean(
            item.improvement_suggestion?.trim()
          ) ||
          Number(item.overall_rating) <= 3
      )
      .slice(0, 25)
      .map((item) => ({
        id: item.id,
        locationId: item.location_id,
        locationName: getLocationName(
          item.locations
        ),
        overallRating: Number(
          item.overall_rating
        ),
        comment:
          item.comment?.slice(0, 300) ?? null,
        improvementSuggestion:
          item.improvement_suggestion?.slice(
            0,
            300
          ) ?? null,
        createdAt: item.created_at,
        hasLinkedTask:
          feedbackWithLinkedTaskIds.has(item.id),
      }));

    /*
     * Nur offene Aufgaben sind für aktuelle
     * Management-Empfehlungen relevant.
     */
    const safeTasks = tasks
      .filter((task) => task.status !== "done")
      .slice(0, 20)
      .map((task) => ({
        id: task.id,
        locationId: task.location_id,
        locationName: getLocationName(
          task.locations
        ),
        feedbackId: task.feedback_id,
        title: task.title.slice(0, 150),
        priority: task.priority,
        status: task.status,
        category: task.category,
        dueAt: task.due_at,
      }));

    const managementContext = {
      user: {
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.display_name ||
          user.user_metadata?.first_name ||
          "Jessica",
        role: profile.role,
      },
      selectedPeriod: getPeriodLabel(timeRange),
      locations: locations ?? [],
      summary: {
        feedbackCount: feedback.length,
        averageRating:
          Math.round(averageRating * 10) / 10,
        positiveFeedbackCount:
          positiveFeedback.length,
        negativeFeedbackCount:
          negativeFeedback.length,
        negativeFeedbackWithoutTaskCount:
          negativeFeedbackWithoutTask.length,
        openTaskCount: openTasks.length,
        completedTaskCount:
          completedTasks.length,
        criticalTaskCount: criticalTasks.length,
        overdueTaskCount: overdueTasks.length,
      },
      relevantFeedbackExamples: safeFeedback,
      openTaskExamples: safeTasks,
    };

    /*
     * Nur die letzten sechs Nachrichten werden
     * für Rückfragen mitgesendet.
     */
    const previousMessages = (body.messages ?? [])
      .filter(
        (message) =>
          message.role === "user" ||
          message.role === "assistant"
      )
      .slice(-6)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 1200),
      }));

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
  model:
    process.env.OPENAI_MODEL || "gpt-5.6-terra",
  instructions: JARVIS_SYSTEM_PROMPT,
  reasoning: {
    effort: "low",
  },
  max_output_tokens: 3000,
      input: [
        {
          role: "user",
          content: `
AKTUELLE MANAGEMENT-DATEN:

${JSON.stringify(managementContext)}

BISHERIGER GESPRÄCHSVERLAUF:

${JSON.stringify(previousMessages)}

AKTUELLE FRAGE:

${userMessage}

Beantworte nur die konkrete Frage.
Halte die Antwort kurz und leicht verständlich.
Nutze maximal 3 Fakten, 3 Risiken, 3 Empfehlungen und 2 Aufgabenentwürfe.
Liefere ausschließlich das geforderte JSON-Format.
`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "jarvis_management_answer",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              message: {
                type: "string",
                maxLength: 500,
              },
              status: {
                type: "string",
                enum: [
                  "good",
                  "attention",
                  "critical",
                  "neutral",
                ],
              },
              summary: {
                type: "string",
                maxLength: 250,
              },
              keyFacts: {
                type: "array",
                maxItems: 3,
                items: {
                  type: "string",
                  maxLength: 180,
                },
              },
              risks: {
                type: "array",
                maxItems: 3,
                items: {
                  type: "string",
                  maxLength: 180,
                },
              },
              recommendations: {
                type: "array",
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: {
                      type: "string",
                      maxLength: 100,
                    },
                    description: {
                      type: "string",
                      maxLength: 220,
                    },
                    priority: {
                      type: "string",
                      enum: [
                        "critical",
                        "high",
                        "medium",
                        "low",
                      ],
                    },
                    reason: {
                      type: "string",
                      maxLength: 180,
                    },
                  },
                  required: [
                    "title",
                    "description",
                    "priority",
                    "reason",
                  ],
                },
              },
              taskDrafts: {
                type: "array",
                maxItems: 2,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    title: {
                      type: "string",
                      maxLength: 100,
                    },
                    description: {
                      type: "string",
                      maxLength: 220,
                    },
                    priority: {
                      type: "string",
                      enum: [
                        "critical",
                        "high",
                        "medium",
                        "low",
                      ],
                    },
                    category: {
                      type: "string",
                      maxLength: 80,
                    },
                    reason: {
                      type: "string",
                      maxLength: 180,
                    },
                    feedbackId: {
                      type: ["string", "null"],
                    },
                    locationId: {
                      type: ["string", "null"],
                    },
                  },
                  required: [
                    "title",
                    "description",
                    "priority",
                    "category",
                    "reason",
                    "feedbackId",
                    "locationId",
                  ],
                },
              },
            },
            required: [
              "message",
              "status",
              "summary",
              "keyFacts",
              "risks",
              "recommendations",
              "taskDrafts",
            ],
          },
        },
      },
    });

    if (
  response.status === "incomplete" ||
  !response.output_text
) {
  console.error("Jarvis OpenAI response incomplete:", {
    status: response.status,
    incompleteDetails: response.incomplete_details,
    outputTextLength: response.output_text?.length ?? 0,
    output: response.output,
  });

  throw new Error(
    `OpenAI-Antwort wurde vorzeitig beendet: ${
      response.incomplete_details?.reason ??
      "unbekannter Grund"
    }`
  );
}

let parsedAnswer: JarvisAnswer;

try {
  parsedAnswer = JSON.parse(
    response.output_text
  ) as JarvisAnswer;
} catch (parseError) {
  console.error("Jarvis JSON parsing failed:", {
    parseError,
    outputText: response.output_text,
  });

  throw new Error(
    "Die KI-Antwort war unvollständig formatiert. Bitte erneut versuchen."
  );
}

    /*
     * Zusätzliche serverseitige Begrenzung.
     * Dadurch kann das Frontend niemals eine
     * übermäßig lange Antwort erhalten.
     */
    const answer: JarvisAnswer = {
      ...parsedAnswer,
      message: parsedAnswer.message.slice(0, 500),
      summary: parsedAnswer.summary.slice(0, 250),
      keyFacts: parsedAnswer.keyFacts
        .slice(0, 3)
        .map((item) => item.slice(0, 180)),
      risks: parsedAnswer.risks
        .slice(0, 3)
        .map((item) => item.slice(0, 180)),
      recommendations:
        parsedAnswer.recommendations
          .slice(0, 3)
          .map((item) => ({
            ...item,
            title: item.title.slice(0, 100),
            description:
              item.description.slice(0, 220),
            reason: item.reason.slice(0, 180),
          })),
      taskDrafts: parsedAnswer.taskDrafts
        .slice(0, 2)
        .map((item) => ({
          ...item,
          title: item.title.slice(0, 100),
          description:
            item.description.slice(0, 220),
          reason: item.reason.slice(0, 180),
        })),
    };

    return NextResponse.json({
      ok: true,
      answer,
    });
  } catch (error) {
    console.error(
      "Jarvis chat API failed:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unbekannter Fehler.";

    return NextResponse.json(
      {
        ok: false,
        error:
          process.env.NODE_ENV === "development"
            ? `Jarvis-Fehler: ${message}`
            : "Jarvis konnte die Anfrage nicht bearbeiten.",
      },
      { status: 500 }
    );
  }
}