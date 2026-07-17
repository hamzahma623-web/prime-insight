import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    const requestedLocationId = url.searchParams.get("locationId");

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
        console.error("Task location access query failed:", accessError);

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

    if (
      requestedLocationId &&
      requestedLocationId !== "all" &&
      allowedLocationIds &&
      !allowedLocationIds.includes(requestedLocationId)
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

    if (requestedLocationId && requestedLocationId !== "all") {
      query = query.eq("location_id", requestedLocationId);
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