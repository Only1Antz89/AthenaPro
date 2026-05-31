import { NextResponse } from "next/server";
import webPush from "web-push";
import { z } from "zod";
import { env } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const dispatchSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  href: z.string().optional()
});

export async function POST(request: Request) {
  if (!env.hasWebPush) {
    return NextResponse.json({ ok: false, error: "Web push is not configured." }, { status: 501 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!env.supabaseServiceRoleKey || token !== env.supabaseServiceRoleKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = dispatchSchema.parse(await request.json());
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", payload.userId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    webPush.setVapidDetails(env.webPushContact, env.vapidPublicKey, env.vapidPrivateKey);

    const results = await Promise.allSettled(
      (data ?? []).map((subscription: Record<string, unknown>) =>
        webPush.sendNotification(
          {
            endpoint: String(subscription.endpoint),
            keys: {
              p256dh: String(subscription.p256dh),
              auth: String(subscription.auth)
            }
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            href: payload.href ?? "/dashboard/staff/profile"
          })
        )
      )
    );

    return NextResponse.json({
      ok: true,
      sent: results.filter((result) => result.status === "fulfilled").length,
      failed: results.filter((result) => result.status === "rejected").length
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to dispatch push notification." },
      { status: 400 }
    );
  }
}
