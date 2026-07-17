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
          "Location access query failed:",
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

      if (allowedLocationIds.length === 0) {
        return NextResponse.json({
          ok: true,
          locations: [],
        });
      }
    }

    let query = supabaseAdmin
      .from("locations")
      .select(`
        id,
        organization_id,
        name,
        slug,
        city,
        address,
        is_active,
        created_at
      `)
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (allowedLocationIds) {
      query = query.in("id", allowedLocationIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Locations query failed:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Standorte konnten nicht geladen werden.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      locations: data ?? [],
    });
  } catch (error) {
    console.error("Locations API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Interner Serverfehler.",
      },
      { status: 500 }
    );
  }
}