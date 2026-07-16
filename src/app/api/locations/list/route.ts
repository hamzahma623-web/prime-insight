import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
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
      .order("name", { ascending: true });

    if (error) {
      console.error("Locations query failed:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Locations could not be loaded.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      locations: data,
    });
  } catch (error) {
    console.error("Locations API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}