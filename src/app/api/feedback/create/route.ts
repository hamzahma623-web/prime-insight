import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type FeedbackRequest = {
  locationId?: string;
  overallRating?: number;
  cleanlinessRating?: number;
  equipmentRating?: number;
  atmosphereRating?: number;
  staffRating?: number;
  comment?: string;
  improvementSuggestion?: string;
};

function validOptionalRating(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5)
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackRequest;

    if (!body.locationId) {
      return NextResponse.json(
        {
          ok: false,
          error: "locationId is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(body.overallRating) ||
      Number(body.overallRating) < 1 ||
      Number(body.overallRating) > 5
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "overallRating must be between 1 and 5.",
        },
        { status: 400 }
      );
    }

    if (
      !validOptionalRating(body.cleanlinessRating) ||
      !validOptionalRating(body.equipmentRating) ||
      !validOptionalRating(body.atmosphereRating) ||
      !validOptionalRating(body.staffRating)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Category ratings must be between 1 and 5.",
        },
        { status: 400 }
      );
    }

    const { data: location, error: locationError } = await supabaseAdmin
      .from("locations")
      .select("id, organization_id")
      .eq("id", body.locationId)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        {
          ok: false,
          error: "Location not found.",
        },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("feedback")
      .insert({
        organization_id: location.organization_id,
        location_id: location.id,
        overall_rating: body.overallRating,
        cleanliness_rating: body.cleanlinessRating ?? null,
        equipment_rating: body.equipmentRating ?? null,
        atmosphere_rating: body.atmosphereRating ?? null,
        staff_rating: body.staffRating ?? null,
        comment: body.comment?.trim() || null,
        improvement_suggestion:
          body.improvementSuggestion?.trim() || null,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Feedback insert failed:", error);

      return NextResponse.json(
        {
          ok: false,
          error: "Feedback could not be saved.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        feedback: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Feedback API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}