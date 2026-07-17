import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
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
          error: "Nicht angemeldet.",
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
          error: "Profil nicht gefunden oder inaktiv.",
        },
        { status: 403 }
      );
    }

    const requestedLocation =
      request.nextUrl.searchParams.get("locationId") ?? "all";

    const hasOrganizationWideAccess = [
      "super_admin",
      "owner",
      "regional_manager",
    ].includes(profile.role);

    let allowedLocationIds: string[] | null = null;

    if (!hasOrganizationWideAccess) {
      const { data: accessRows, error: accessError } =
        await supabaseAdmin
          .from("user_location_access")
          .select("location_id")
          .eq("user_id", user.id);

      if (accessError) {
        console.error(
          "Dashboard location access failed:",
          accessError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "Standortzugriffe konnten nicht geladen werden.",
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
        const { data: location, error: locationError } =
          await supabaseAdmin
            .from("locations")
            .select("id")
            .eq(
              "organization_id",
              profile.organization_id
            )
            .eq("slug", requestedLocation)
            .maybeSingle();

        if (locationError) {
          console.error(
            "Dashboard location lookup failed:",
            locationError
          );

          return NextResponse.json(
            {
              ok: false,
              error: "Standort konnte nicht geladen werden.",
            },
            { status: 500 }
          );
        }

        if (!location) {
          return NextResponse.json(
            {
              ok: false,
              error: "Standort nicht gefunden.",
            },
            { status: 404 }
          );
        }

        selectedLocationId = location.id;
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

    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.display_name ||
      user.user_metadata?.first_name ||
      user.email?.split("@")[0] ||
      "Willkommen";

    if (
      allowedLocationIds &&
      allowedLocationIds.length === 0
    ) {
      return NextResponse.json({
        ok: true,
        user: {
          name: userName,
          role: profile.role,
        },
        summary: {
          feedbackCount: 0,
          avgRating: 0,
          positiveCount: 0,
          negativeCount: 0,
          criticalIssues: 0,
          openTaskCount: 0,
          criticalTaskCount: 0,
          overdueTaskCount: 0,
        },
        recentTasks: [],
        recentFeedback: [],
      });
    }

    let feedbackQuery = supabaseAdmin
      .from("feedback")
      .select(`
        id,
        location_id,
        overall_rating,
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
      .eq(
        "organization_id",
        profile.organization_id
      )
      .order("created_at", { ascending: false });

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
        created_at,
        locations (
          id,
          name,
          slug,
          city
        )
      `)
      .eq(
        "organization_id",
        profile.organization_id
      )
      .order("created_at", { ascending: false });

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

    const [
      {
        data: feedbackRows,
        error: feedbackError,
      },
      {
        data: taskRows,
        error: taskError,
      },
    ] = await Promise.all([
      feedbackQuery,
      tasksQuery,
    ]);

    if (feedbackError) {
      console.error(
        "Dashboard feedback query failed:",
        feedbackError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Feedback-Daten konnten nicht geladen werden.",
        },
        { status: 500 }
      );
    }

    if (taskError) {
      console.error(
        "Dashboard task query failed:",
        taskError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Aufgaben konnten nicht geladen werden.",
        },
        { status: 500 }
      );
    }

    const feedback = feedbackRows ?? [];
    const tasks = taskRows ?? [];

    const feedbackCount = feedback.length;

    const avgRating =
      feedbackCount > 0
        ? feedback.reduce(
            (sum, item) =>
              sum + Number(item.overall_rating ?? 0),
            0
          ) / feedbackCount
        : 0;

    const positiveCount = feedback.filter(
      (item) =>
        Number(item.overall_rating) >= 4
    ).length;

    const negativeCount = feedback.filter(
      (item) =>
        Number(item.overall_rating) <= 2
    ).length;

    const criticalIssues = feedback.filter(
      (item) =>
        Number(item.overall_rating) <= 2 &&
        item.status !== "resolved"
    ).length;

    const openTasks = tasks.filter(
      (task) => task.status !== "done"
    );

    const openTaskCount = openTasks.length;

    const criticalTaskCount = openTasks.filter(
      (task) => task.priority === "critical"
    ).length;

    const now = Date.now();

    const overdueTaskCount = openTasks.filter(
      (task) =>
        Boolean(task.due_at) &&
        new Date(task.due_at as string).getTime() < now
    ).length;

    const priorityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const recentTasks = [...openTasks]
      .sort((a, b) => {
        const priorityDifference =
          (priorityOrder[a.priority] ?? 99) -
          (priorityOrder[b.priority] ?? 99);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        if (a.due_at && b.due_at) {
          return (
            new Date(a.due_at).getTime() -
            new Date(b.due_at).getTime()
          );
        }

        if (a.due_at) {
          return -1;
        }

        if (b.due_at) {
          return 1;
        }

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      })
      .slice(0, 5);

    const recentFeedback = feedback
      .slice(0, 5)
      .map((item) => ({
        ...item,
        message:
          item.comment ||
          item.improvement_suggestion ||
          "Keine schriftliche Rückmeldung.",
      }));

    return NextResponse.json({
      ok: true,
      user: {
        name: userName,
        role: profile.role,
      },
      summary: {
        feedbackCount,
        avgRating,
        positiveCount,
        negativeCount,
        criticalIssues,
        openTaskCount,
        criticalTaskCount,
        overdueTaskCount,
      },
      recentTasks,
      recentFeedback,
    });
  } catch (error) {
    console.error(
      "Dashboard summary API failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "Interner Serverfehler.",
      },
      { status: 500 }
    );
  }
}