"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Notification } from "@/types/domain";

export function NotificationsList({
  notifications,
  title = "Notifications"
}: {
  notifications: Notification[];
  title?: string;
}) {
  return (
    <Card>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate">{title}</p>
      <div className="mt-5 space-y-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate">No alerts right now.</p>
        ) : (
          notifications.map((notification) => {
            const content = (
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-ink">{notification.title}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate">
                    {notification.type.replace(/_/g, " ")}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate">{notification.body}</p>
              </div>
            );

            return notification.href ? (
              <Link key={notification.id} href={notification.href}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })
        )}
      </div>
    </Card>
  );
}
