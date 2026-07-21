import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;

    const { data: organization, error: organizationError } =
      await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("slug", "fitness-level")
        .maybeSingle();

    if (organizationError) {
      console.error(
        "Public organization lookup failed:",
        organizationError
      );

      return NextResponse.json(
        {
          ok: false,
          error: "Standort konnte nicht geladen werden.",
        },
        { status: 500 }
      );
    }

    if (!organization) {
      return NextResponse.json(
        {
          ok: false,
          error: "Organisation nicht gefunden.",
        },
        { status: 404 }
      );
    }

    const { data: location, error: locationError } =
      await supabaseAdmin
        .from("locations")
        .select("id, name, slug, city")
        .eq("organization_id", organization.id)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

    if (locationError) {
      console.error(
        "Public location lookup failed:",
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

    return NextResponse.json({
      ok: true,
      location,
    });
  } catch (error) {
    console.error("Public location API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Interner Serverfehler.",
      },
      { status: 500 }
    );
  }
}