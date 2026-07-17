import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED_STATUSES = ["new", "reviewed", "resolved"] as const;

type FeedbackStatus = (typeof ALLOWED_STATUSES)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const status = body.status as FeedbackStatus;

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ungültiger Status.",
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

    if (profileError || !profile || !profile.is_active) {
      return NextResponse.json(
        {
          ok: false,
          error: "Profil nicht gefunden oder inaktiv.",
        },
        { status: 403 }
      );
    }

    const { data: existingFeedback, error: feedbackError } =
      await supabaseAdmin
        .from("feedback")
        .select("id, organization_id, location_id")
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .single();

    if (feedbackError || !existingFeedback) {
      return NextResponse.json(
        {
          ok: false,
          error: "Feedback nicht gefunden.",
        },
        { status: 404 }
      );
    }

    const hasOrganizationWideAccess = [
      "super_admin",
      "owner",
      "regional_manager",
    ].includes(profile.role);

    if (!hasOrganizationWideAccess) {
      const { data: locationAccess } = await supabaseAdmin
        .from("user_location_access")
        .select("location_id")
        .eq("user_id", user.id)
        .eq("location_id", existingFeedback.location_id)
        .maybeSingle();

      if (!locationAccess) {
        return NextResponse.json(
          {
            ok: false,
            error: "Keine Berechtigung für diesen Standort.",
          },
          { status: 403 }
        );
      }
    }

    const { data: updatedFeedback, error: updateError } =
      await supabaseAdmin
        .from("feedback")
        .update({
          status,
        })
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .select("id, status")
        .single();

    if (updateError) {
      console.error("Feedback status update failed:", updateError);

      return NextResponse.json(
        {
          ok: false,
          error: "Status konnte nicht gespeichert werden.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error("Feedback status API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Interner Serverfehler.",
      },
      { status: 500 }
    );
  }
}