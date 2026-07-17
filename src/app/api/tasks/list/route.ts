import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
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

    const url = new URL(request.url);

    const requestedLocation =
      url.searchParams.get("locationId") ?? "all";

    const canAccessAllOrganizationLocations = [
      "super_admin",
      "owner",
      "regional_manager",
    ].includes(profile.role);

    let allowedLocationIds: string[] | null = null;

    if (!canAccessAllOrganizationLocations) {
      const { data: accessRows, error: accessError } =
        await supabaseAdmin
          .from("user_location_access")
          .select("location_id")
          .eq("user_id", user.id);

      if (accessError) {
        console.error(
          "Task location access query failed:",
          accessError
        );

        return NextResponse.json(
          {
            ok: false,
            error: "Location access could not be loaded.",
          },
          { status: 500 }
        );
      }

      allowedLocationIds =
        accessRows?.map((row) => row.location_id) ?? [];

      if (allowedLocationIds.length === 0) {
        return NextResponse.json({
          ok: true,
          tasks: [],
        });
      }
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
            .eq("organization_id", profile.organization_id)
            .eq("slug", requestedLocation)
            .maybeSingle();

        if (locationError) {
          console.error(
            "Task location lookup failed:",
            locationError
          );

          return NextResponse.json(
            {
              ok: false,
              error: "Location could not be loaded.",
            },
            { status: 500 }
          );
        }

        if (!location) {
          return NextResponse.json(
            {
              ok: false,
              error: "Location not found.",
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
          error: "Access to this location is not allowed.",
        },
        { status: 403 }
      );
    }

    let query = supabaseAdmin
      .from("tasks")
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
        updated_at,
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
      query = query.eq("location_id", selectedLocationId);
    } else if (allowedLocationIds) {
      query = query.in("location_id", allowedLocationIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Task list query failed:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Tasks could not be loaded.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tasks: data ?? [],
    });
  } catch (error) {
    console.error("Task list API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}