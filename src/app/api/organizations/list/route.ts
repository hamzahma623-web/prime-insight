import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Organizations query failed:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Organizations could not be loaded.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      organizations: data,
    });
  } catch (error) {
    console.error("Organizations API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}