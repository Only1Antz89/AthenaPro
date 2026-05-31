import { generateId } from "@/lib/utils";
import type {
  Notification,
  NotificationEmailJob,
  NotificationType
} from "@/types/domain";

export function buildNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  createdAt?: string;
}): Notification {
  return {
    id: generateId("notification"),
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    isRead: false,
    createdAt: input.createdAt ?? new Date().toISOString(),
    emailStatus: "queued"
  };
}

export function buildNotificationEmailJob(
  notification: Notification,
  payload: Record<string, string>
): NotificationEmailJob {
  const now = new Date().toISOString();

  return {
    id: generateId("email_job"),
    notificationId: notification.id,
    userId: notification.userId,
    templateKey: notification.type,
    status: "queued",
    payload: JSON.stringify(payload),
    createdAt: now,
    updatedAt: now
  };
}
