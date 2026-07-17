import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TaskStatus = "open" | "in_progress" | "done";

type UpdateTaskRequest = {
  status?: TaskStatus;
};

const ALLOWED_STATUSES: TaskStatus[] = [
  "open",
  "in_progress",
  "done",
];

async function getAuthenticatedProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, organization_id, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "Profile not found or inactive.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    profile,
  };
}

async function checkTaskAccess(
  taskId: string,
  userId: string,
  organizationId: string,
  role: string
) {
  const { data: task, error: taskError } = await supabaseAdmin
    .from("tasks")
    .select("id, organization_id, location_id, status")
    .eq("id", taskId)
    .eq("organization_id", organizationId)
    .single();

  if (taskError || !task) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "Task not found.",
        },
        { status: 404 }
      ),
    };
  }

  const canAccessAllOrganizationLocations = [
    "super_admin",
    "owner",
    "regional_manager",
  ].includes(role);

  if (!canAccessAllOrganizationLocations) {
    const { data: locationAccess, error: locationAccessError } =
      await supabaseAdmin
        .from("user_location_access")
        .select("location_id")
        .eq("user_id", userId)
        .eq("location_id", task.location_id)
        .maybeSingle();

    if (locationAccessError) {
      console.error(
        "Task access query failed:",
        locationAccessError
      );

      return {
        error: NextResponse.json(
          {
            ok: false,
            error: "Task access could not be checked.",
          },
          { status: 500 }
        ),
      };
    }

    if (!locationAccess) {
      return {
        error: NextResponse.json(
          {
            ok: false,
            error: "Access to this task is not allowed.",
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    task,
  };
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      taskId: string;
    }>;
  }
) {
  try {
    const { taskId } = await context.params;

    if (!taskId) {
      return NextResponse.json(
        {
          ok: false,
          error: "taskId is required.",
        },
        { status: 400 }
      );
    }

    const auth = await getAuthenticatedProfile();

    if ("error" in auth) {
      return auth.error;
    }

    const access = await checkTaskAccess(
      taskId,
      auth.user.id,
      auth.profile.organization_id,
      auth.profile.role
    );

    if ("error" in access) {
      return access.error;
    }

    const body = (await request.json()) as UpdateTaskRequest;
    const status = body.status;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          ok: false,
          error: "status must be open, in_progress or done.",
        },
        { status: 400 }
      );
    }

    const completedAt =
      status === "done" ? new Date().toISOString() : null;

    const { data: task, error: updateError } = await supabaseAdmin
      .from("tasks")
      .update({
        status,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("organization_id", auth.profile.organization_id)
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
        updated_at
      `)
      .single();

    if (updateError || !task) {
      console.error("Task update failed:", updateError);

      return NextResponse.json(
        {
          ok: false,
          error: "Task could not be updated.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      task,
    });
  } catch (error) {
    console.error("Task update API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      taskId: string;
    }>;
  }
) {
  try {
    const { taskId } = await context.params;

    if (!taskId) {
      return NextResponse.json(
        {
          ok: false,
          error: "taskId is required.",
        },
        { status: 400 }
      );
    }

    const auth = await getAuthenticatedProfile();

    if ("error" in auth) {
      return auth.error;
    }

    const access = await checkTaskAccess(
      taskId,
      auth.user.id,
      auth.profile.organization_id,
      auth.profile.role
    );

    if ("error" in access) {
      return access.error;
    }

    const { error: deleteError } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("organization_id", auth.profile.organization_id);

    if (deleteError) {
      console.error("Task delete failed:", deleteError);

      return NextResponse.json(
        {
          ok: false,
          error: "Task could not be deleted.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      deletedTaskId: taskId,
    });
  } catch (error) {
    console.error("Task delete API failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}