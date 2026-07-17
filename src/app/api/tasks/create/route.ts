import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TaskPriority = "critical" | "high" | "medium" | "low";

type TaskStatus = "open" | "in_progress" | "done";

type CreateTaskRequest = {
  locationId?: string;
  feedbackId?: string | null;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: string;
  assigneeName?: string | null;
  source?: string;
  dueAt?: string | null;
};

const ALLOWED_PRIORITIES: TaskPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
];

const ALLOWED_STATUSES: TaskStatus[] = [
  "open",
  "in_progress",
  "done",
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, organization_id, role, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
      return NextResponse.json(
        {
          ok: false,
          error: "Profile not found or inactive.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as CreateTaskRequest;

    const locationId = body.locationId?.trim();
    const feedbackId = body.feedbackId?.trim() || null;
    const title = body.title?.trim();
    const description = body.description?.trim() || null;
    const priority = body.priority ?? "medium";
    const status = body.status ?? "open";
    const category = body.category?.trim() || "Allgemein";
    const assigneeName = body.assigneeName?.trim() || null;
    const source = body.source?.trim() || "Manuell";
    const dueAt = body.dueAt?.trim() || null;

    if (!locationId) {
      return NextResponse.json(
        {
          ok: false,
          error: "locationId is required.",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          error: "title is required.",
        },
        { status: 400 }
      );
    }

    if (title.length > 250) {
      return NextResponse.json(
        {
          ok: false,
          error: "title must not exceed 250 characters.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "priority must be critical, high, medium or low.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          ok: false,
          error: "status must be open, in_progress or done.",
        },
        { status: 400 }
      );
    }

    if (dueAt && Number.isNaN(new Date(dueAt).getTime())) {
      return NextResponse.json(
        {
          ok: false,
          error: "dueAt must be a valid date.",
        },
        { status: 400 }
      );
    }

    const { data: location, error: locationError } =
      await supabaseAdmin
        .from("locations")
        .select("id, organization_id")
        .eq("id", locationId)
        .eq("organization_id", profile.organization_id)
        .single();

    if (locationError || !location) {
      return NextResponse.json(
        {
          ok: false,
          error: "Location not found or access denied.",
        },
        { status: 404 }
      );
    }

    const canAccessAllOrganizationLocations = [
      "super_admin",
      "owner",
      "regional_manager",
    ].includes(profile.role);

    if (!canAccessAllOrganizationLocations) {
      const { data: locationAccess, error: locationAccessError } =
        await supabaseAdmin
          .from("user_location_access")
          .select("location_id")
          .eq("user_id", user.id)
          .eq("location_id", locationId)
          .maybeSingle();

      if (locationAccessError) {
        console.error(
          "Task location access query failed:",
          locationAccessError
        );

        return NextResponse.json(
          {
            ok: false,
            error: "Location access could not be checked.",
          },
          { status: 500 }
        );
      }

      if (!locationAccess) {
        return NextResponse.json(
          {
            ok: false,
            error: "Access to this location is not allowed.",
          },
          { status: 403 }
        );
      }
    }

    if (feedbackId) {
      const { data: feedback, error: feedbackError } =
        await supabaseAdmin
          .from("feedback")
          .select("id, organization_id, location_id")
          .eq("id", feedbackId)
          .eq("organization_id", profile.organization_id)
          .single();

      if (feedbackError || !feedback) {
        return NextResponse.json(
          {
            ok: false,
            error: "Feedback not found.",
          },
          { status: 404 }
        );
      }

      if (feedback.location_id !== locationId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Feedback and task must belong to the same location.",
          },
          { status: 400 }
        );
      }
    }

    const completedAt =
      status === "done" ? new Date().toISOString() : null;

    const { data: task, error: taskError } = await supabaseAdmin
      .from("tasks")
      .insert({
        organization_id: profile.organization_id,
        location_id: locationId,
        feedback_id: feedbackId,
        title,
        description,
        priority,
        status,
        category,
        assignee_name: assigneeName,
        source,
        due_at: dueAt,
        created_by: profile.id,
        completed_at: completedAt,
      })
      .select(`
        id,
        organization_id,
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
        created_by,
        completed_at,
        created_at,
        updated_at
      `)
      .single();

    if (taskError) {
      console.error("Task insert failed:", taskError);

      return NextResponse.json(
        {
          ok: false,
          error: "Task could not be created.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Task create API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}