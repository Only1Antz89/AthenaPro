"use client";

import Link from "next/link";
import { Bell, Bookmark, BriefcaseBusiness, Heart, MessageCircle, UserPlus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStaffBook } from "@/features/app/use-staffbook";
import { toDisplayError } from "@/lib/errors";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { StaffJobsBoardData, StaffJobsBoardItem } from "@/types/domain";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function MobileSocialJobFeed({
  board,
  items,
  onRefresh
}: {
  board: StaffJobsBoardData;
  items: StaffJobsBoardItem[];
  onRefresh: () => Promise<unknown>;
}) {
  const { provider } = useStaffBook();
  const [hiddenJobIds, setHiddenJobIds] = useState<string[]>([]);
  const [likedPulseJobId, setLikedPulseJobId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const visibleItems = items.filter((item) => !item.isDismissed && !hiddenJobIds.includes(item.job.id));
  const companies = useMemo(
    () =>
      Array.from(new Map(items.map((item) => [item.job.organization.id, item.job.organization])).values()).slice(0, 10),
    [items]
  );

  async function registerPush() {
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        toast.message("Push notifications need browser support and VAPID keys.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        toast.message("Push permission was not granted.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      const json = subscription.toJSON();

      await provider.registerPushSubscription({
        endpoint: json.endpoint!,
        keys: {
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!
        },
        userAgent: navigator.userAgent
      });
      toast.success("Push notifications enabled.");
      await onRefresh();
    } catch (error) {
      toast.error(toDisplayError(error));
    }
  }

  async function handleSwipe(item: StaffJobsBoardItem, direction: "left" | "right") {
    try {
      if (direction === "right") {
        await provider.saveJob(item.job.id);
        toast.success("Job saved.");
      } else {
        await provider.dismissJob(item.job.id);
        setHiddenJobIds((current) => [...current, item.job.id]);
        toast.success("Job discarded.");
      }
      await onRefresh();
    } catch (error) {
      toast.error(toDisplayError(error));
    }
  }

  async function like(item: StaffJobsBoardItem) {
    try {
      await provider.likeJob(item.job.id);
      setLikedPulseJobId(item.job.id);
      setTimeout(() => setLikedPulseJobId(null), 650);
      await onRefresh();
    } catch (error) {
      toast.error(toDisplayError(error));
    }
  }

  async function messageCompany(item: StaffJobsBoardItem) {
    try {
      await provider.sendConversationMessage({
        organizationId: item.job.organization.id,
        jobId: item.job.id,
        body: `Hi ${item.job.organization.name}, I have a question about ${item.job.title}.`
      });
      toast.success("Message thread opened.");
      await onRefresh();
    } catch (error) {
      toast.error(toDisplayError(error));
    }
  }

  return (
    <div className="md:hidden">
      <div className="-mx-4 border-y border-white/10 bg-[#080b10] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime-200">For you</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Live work feed</h2>
          </div>
          <button
            type="button"
            onClick={registerPush}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-cyan-300 text-canvas"
            aria-label="Enable push notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {companies.map((company) => (
            <button
              key={company.id}
              type="button"
              className="shrink-0 text-center"
              onClick={async () => {
                try {
                  await provider.followCompany(company.id);
                  toast.success(`Following ${company.name}.`);
                  await onRefresh();
                } catch (error) {
                  toast.error(toDisplayError(error));
                }
              }}
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[conic-gradient(from_120deg,#bef264,#22d3ee,#fb7185,#bef264)] p-[3px]">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#111827] text-lg font-semibold text-white">
                  {company.name.slice(0, 1)}
                </span>
              </span>
              <span className="mt-1 block max-w-[72px] truncate text-xs text-white/70">{company.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-4 bg-[#080b10] px-4 py-4">
        <div className="space-y-5">
          {visibleItems.map((item) => {
            const media = item.mediaSlides[0]?.imageUrl;

            return (
              <article
                key={item.job.id}
                className="relative overflow-hidden rounded-lg border border-white/10 bg-[#10151f]"
                onDoubleClick={() => like(item)}
                onTouchStart={(event) => {
                  touchStartX.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                  if (touchStartX.current === null) {
                    return;
                  }
                  const delta = (event.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
                  touchStartX.current = null;

                  if (delta > 70) {
                    void handleSwipe(item, "right");
                  } else if (delta < -70) {
                    void handleSwipe(item, "left");
                  }
                }}
              >
                <div
                  className="flex min-h-[560px] flex-col justify-end bg-cover bg-center p-4"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(8,11,16,0.1),rgba(8,11,16,0.34) 42%,rgba(8,11,16,0.9)), url(${media ?? "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80"})`
                  }}
                >
                  <div className="absolute right-3 top-4 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => like(item)}
                      className={cn(
                        "inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur",
                        item.isLiked ? "text-rose-300" : ""
                      )}
                      aria-label="Like job"
                    >
                      <Heart className={cn("h-5 w-5", item.isLiked ? "fill-current" : "")} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwipe(item, "right")}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-lime-200 backdrop-blur"
                      aria-label="Save job"
                    >
                      <Bookmark className={cn("h-5 w-5", item.isSaved ? "fill-current" : "")} />
                    </button>
                    <button
                      type="button"
                      onClick={() => messageCompany(item)}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-cyan-200 backdrop-blur"
                      aria-label="Message company"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (item.isFollowingCompany) {
                            await provider.unfollowCompany(item.job.organization.id);
                          } else {
                            await provider.followCompany(item.job.organization.id);
                          }
                          await onRefresh();
                        } catch (error) {
                          toast.error(toDisplayError(error));
                        }
                      }}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-yellow-200 backdrop-blur"
                      aria-label="Follow company"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwipe(item, "left")}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 text-white/75 backdrop-blur"
                      aria-label="Discard job"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {likedPulseJobId === item.job.id ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Heart className="h-24 w-24 fill-rose-300 text-rose-300 drop-shadow-2xl" />
                    </div>
                  ) : null}

                  <div className="rounded-lg bg-black/45 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-lime-200">{item.job.organization.name}</p>
                      <p className="rounded-full bg-white/15 px-3 py-1 text-xs text-white">{item.job.roleType}</p>
                    </div>
                    <h3 className="mt-3 text-3xl font-semibold text-white">{item.job.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/80">
                      {item.job.event.title} • {item.job.event.location} • {formatDate(item.job.event.eventDate)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/80">
                      <span>{formatCurrency(item.job.payRate)}/hr</span>
                      <span>{item.job.positionsNeeded} positions</span>
                      <span>{item.matchScore.toFixed(0)} match</span>
                    </div>
                    <Link href={`/jobs/${item.job.id}`} className="mt-4 block">
                      <Button variant="accent" className="w-full gap-2 bg-lime-300 text-canvas">
                        <BriefcaseBusiness className="h-4 w-4" />
                        Apply for role
                      </Button>
                    </Link>
                    <div className="mt-3 flex justify-between text-[11px] uppercase tracking-[0.16em] text-white/50">
                      <span>Swipe left discard</span>
                      <span>Double tap like</span>
                      <span>Swipe right save</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
