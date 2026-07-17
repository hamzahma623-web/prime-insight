import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
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

    let allowedLocationIds: string[] | null = null;

    const canAccessAllOrganizationLocations = [
      "super_admin",
      "owner",
      "regional_manager",
    ].includes(profile.role);

    if (!canAccessAllOrganizationLocations) {
      const { data: accessRows, error: accessError } =
        await supabaseAdmin
          .from("user_location_access")
          .select("location_id")
          .eq("user_id", user.id);

      if (accessError) {
        console.error("Location access query failed:", accessError);

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
          feedback: [],
        });
      }
    }

    let query = supabaseAdmin
      .from("feedback")
      .select(`
        id,
        organization_id,
        location_id,
        overall_rating,
        cleanliness_rating,
        equipment_rating,
        atmosphere_rating,
        staff_rating,
        comment,
        improvement_suggestion,
        wants_contact,
        contact_email,
        contact_phone,
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

    if (allowedLocationIds) {
      query = query.in("location_id", allowedLocationIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Feedback list query failed:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Feedback could not be loaded.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      feedback: data ?? [],
    });
  } catch (error) {
    console.error("Feedback list API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}