import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const messageSchema = z.object({
  organizationId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  body: z.string().min(1).max(1200)
});

async function getProfile(supabase: ReturnType<typeof createAdminSupabaseClient>, userId: string) {
  const { data, error } = await supabase.from("profiles").select("id, role, full_name").eq("id", userId).single();

  if (error || !data) {
    throw new Error("Profile not found.");
  }

  return data as { id: string; role: "staff" | "organiser"; full_name: string };
}

async function isOrganizationMember(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  organizationId: string,
  profileId: string
) {
  const { data } = await supabase
    .from("organization_memberships")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("profile_id", profileId)
    .maybeSingle();

  return Boolean(data);
}

export async function POST(request: Request) {
  try {
    const serverSupabase = createServerSupabaseClient();
    const {
      data: { user }
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthenticated." }, { status: 401 });
    }

    const payload = messageSchema.parse(await request.json());
    const adminSupabase = createAdminSupabaseClient();
    const profile = await getProfile(adminSupabase, user.id);
    const { data: organization, error: organizationError } = await adminSupabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .eq("id", payload.organizationId)
      .maybeSingle();

    if (organizationError || !organization) {
      return NextResponse.json({ ok: false, error: "Organization not found." }, { status: 404 });
    }

    const jobResult = payload.jobId
      ? await adminSupabase
          .from("jobs")
          .select("id, event_id, title, organization_id")
          .eq("id", payload.jobId)
          .maybeSingle()
      : { data: null, error: null };

    if (jobResult.error) {
      return NextResponse.json({ ok: false, error: jobResult.error.message }, { status: 400 });
    }

    if (jobResult.data && jobResult.data.organization_id !== payload.organizationId) {
      return NextResponse.json({ ok: false, error: "Job does not belong to this company." }, { status: 400 });
    }

    let staffId = user.id;

    if (profile.role === "organiser") {
      if (!payload.staffId) {
        return NextResponse.json({ ok: false, error: "Organiser messages require a staffId." }, { status: 400 });
      }

      if (!(await isOrganizationMember(adminSupabase, payload.organizationId, user.id))) {
        return NextResponse.json({ ok: false, error: "You do not manage this company." }, { status: 403 });
      }

      const { data: staffProfile } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("id", payload.staffId)
        .eq("role", "staff")
        .maybeSingle();

      if (!staffProfile) {
        return NextResponse.json({ ok: false, error: "Staff profile not found." }, { status: 404 });
      }

      staffId = payload.staffId;
    }

    let threadQuery = adminSupabase
      .from("conversation_threads")
      .select("*")
      .eq("organization_id", payload.organizationId)
      .eq("staff_id", staffId);
    threadQuery = payload.jobId ? threadQuery.eq("job_id", payload.jobId) : threadQuery.is("job_id", null);
    const { data: existingThread } = await threadQuery.maybeSingle();
    const now = new Date().toISOString();
    const thread =
      existingThread ??
      (
        await adminSupabase
          .from("conversation_threads")
          .insert({
            organization_id: payload.organizationId,
            staff_id: staffId,
            job_id: payload.jobId ?? null,
            event_id: jobResult.data?.event_id ?? null,
            subject: jobResult.data?.title ? `${jobResult.data.title} conversation` : "Company conversation",
            last_message_at: now
          })
          .select("*")
          .single()
      ).data;

    if (!thread) {
      return NextResponse.json({ ok: false, error: "Unable to create conversation." }, { status: 400 });
    }

    const { error: messageError } = await adminSupabase.from("conversation_messages").insert({
      thread_id: thread.id,
      sender_id: user.id,
      body: payload.body
    });

    if (messageError) {
      return NextResponse.json({ ok: false, error: messageError.message }, { status: 400 });
    }

    await adminSupabase
      .from("conversation_threads")
      .update({ last_message_at: now })
      .eq("id", thread.id);

    const recipientId =
      profile.role === "staff"
        ? (
            await adminSupabase
              .from("organization_memberships")
              .select("profile_id")
              .eq("organization_id", payload.organizationId)
              .limit(1)
              .maybeSingle()
          ).data?.profile_id
        : staffId;

    if (recipientId) {
      await adminSupabase.from("notifications").insert({
        user_id: recipientId,
        type: "company_message",
        title: profile.role === "staff" ? "New field-team message" : "Company message",
        body: payload.body,
        href: profile.role === "staff" ? "/dashboard/organiser" : "/dashboard/staff/profile"
      });
    }

    return NextResponse.json({
      ok: true,
      thread: {
        id: String(thread.id),
        organizationId: String(thread.organization_id),
        staffId: String(thread.staff_id),
        jobId: thread.job_id ? String(thread.job_id) : undefined,
        eventId: thread.event_id ? String(thread.event_id) : undefined,
        applicationId: thread.application_id ? String(thread.application_id) : undefined,
        subject: String(thread.subject),
        lastMessageAt: now,
        createdAt: String(thread.created_at),
        organization: {
          id: String(organization.id),
          name: String(organization.name),
          slug: String(organization.slug),
          createdAt: String(organization.created_at)
        },
        messages: [{ id: "new", threadId: String(thread.id), senderId: user.id, body: payload.body, createdAt: now }],
        unreadCount: 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to send message." },
      { status: 400 }
    );
  }
}
