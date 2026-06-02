"use client";

import Link from "next/link";
import { Bell, Bookmark, BriefcaseBusiness, CalendarDays, Heart, MapPin, MessageCircle, PlusCircle, Send, UserCircle, UserPlus, WalletCards, X } from "lucide-react";
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
  const unreadMessages = board.conversations.reduce((total, thread) => total + thread.unreadCount, 0);
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
      <div className="-mx-4 bg-black px-4 pb-24 pt-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-semibold tracking-[0.14em]">
              <span className="text-lime-300">ATHENA</span> PRO
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={registerPush}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white"
              aria-label="Enable push notifications"
            >
              <Bell className="h-7 w-7" />
              {unreadMessages ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {Math.min(unreadMessages, 9)}
                </span>
              ) : null}
            </button>
            <Link
              href="/dashboard/staff/profile"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white"
              aria-label="Open messages"
            >
              <MessageCircle className="h-7 w-7" />
              {unreadMessages ? (
                <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-rose-500 text-[10px] font-bold leading-4 text-white">
                  {unreadMessages}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          <Link href="/dashboard/staff/profile" className="shrink-0 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-fuchsia-400/70 bg-black text-4xl font-semibold text-lime-300 shadow-[0_0_22px_rgba(217,70,239,0.35)] sm:h-20 sm:w-20 sm:text-5xl">
              A
            </span>
            <span className="mt-2 block max-w-[82px] truncate text-sm text-white">Your Feed</span>
          </Link>
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
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[conic-gradient(from_120deg,#bef264,#22d3ee,#fb3d72,#bef264)] p-[3px] sm:h-20 sm:w-20 sm:p-[4px]">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#05070a] text-2xl font-semibold text-lime-200">
                  {company.name.slice(0, 1)}
                </span>
              </span>
              <span className="mt-2 block max-w-[82px] truncate text-sm text-white/85">{company.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-6">
          {visibleItems.map((item) => {
            const media = item.mediaSlides[0]?.imageUrl;
            const slideCount = Math.max(item.mediaSlides.length, 1);

            return (
              <article
                key={item.job.id}
                className="relative overflow-hidden rounded-[22px] border border-white/12 bg-[#090d10] shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:rounded-[28px]"
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
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-lime-300 bg-black text-base font-bold text-lime-300 sm:h-16 sm:w-16 sm:text-xl">
                      {item.job.organization.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-white sm:text-xl">{item.job.organization.name}</p>
                      <p className="text-sm text-white/62">Festival Producer</p>
                    </div>
                  </div>
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
                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-lime-300 px-3 py-2 text-sm font-semibold text-lime-300 sm:px-4"
                  >
                    <UserPlus className="h-4 w-4" />
                    {item.isFollowingCompany ? "Following" : "Follow"}
                  </button>
                </div>

                <div
                  className="relative flex min-h-[300px] flex-col justify-end bg-cover bg-center p-4 sm:min-h-[360px] sm:p-5"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(8,11,16,0.05),rgba(8,11,16,0.12) 35%,rgba(8,11,16,0.72)), url(${media ?? "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80"})`
                  }}
                >
                  <span className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
                    1 / {slideCount}
                  </span>
                  {likedPulseJobId === item.job.id ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Heart className="h-24 w-24 fill-rose-300 text-rose-300 drop-shadow-2xl" />
                    </div>
                  ) : null}
                  <div className="max-w-[92%]">
                    <h3 className="text-3xl font-semibold leading-tight text-white drop-shadow-xl sm:text-5xl sm:leading-[0.95]">{item.job.title}</h3>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-md border border-lime-300 bg-black/45 px-3 py-1 text-sm font-semibold text-lime-300 backdrop-blur">
                      <span>★</span>
                      {item.job.roleType}
                    </span>
                  </div>
                </div>

                <div className="border-b border-white/10 bg-[#090d10]">
                  <div className="grid grid-cols-3 divide-x divide-white/10 text-sm text-white">
                    <div className="flex flex-col gap-1 px-3 py-4 sm:px-4">
                      <CalendarDays className="h-5 w-5 text-rose-400" />
                      <span>{formatDate(item.job.event.eventDate)}</span>
                      <span className="text-white/58">
                        {new Date(item.job.shiftStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(item.job.shiftEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-4 sm:px-4">
                      <MapPin className="h-5 w-5 text-rose-400" />
                      <span>{item.job.event.location}</span>
                    </div>
                    <div className="flex flex-col gap-1 px-3 py-4 sm:px-4">
                      <WalletCards className="h-5 w-5 text-cyan-300" />
                      <span>{formatCurrency(item.job.payRate)} / hr</span>
                      <span className="text-white/58">+ event perks</span>
                    </div>
                  </div>
                  <div className="px-4 py-4 sm:px-5 sm:py-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/70">{item.job.roleType}</span>
                      <span className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/70">{item.job.minimumAge ?? 18}+</span>
                      <span className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/70">{item.job.positionsNeeded} Positions</span>
                    </div>
                    <p className="mt-4 text-base leading-7 text-white/72">{item.job.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-[52px_1fr_52px_84px] items-center gap-2 px-4 py-4 sm:grid-cols-[56px_1fr_56px_92px] sm:gap-3 sm:px-5 sm:py-5">
                    <button
                      type="button"
                      onClick={() => handleSwipe(item, "left")}
                      className={cn(
                        "inline-flex h-[52px] min-h-12 w-[52px] min-w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-rose-400 sm:h-14 sm:w-14"
                      )}
                      aria-label="Discard job"
                    >
                      <X className="h-7 w-7" />
                    </button>
                    <button
                      type="button"
                      onClick={() => like(item)}
                      className="flex flex-col items-center justify-center text-rose-300"
                      aria-label="Like job"
                    >
                      <Heart className={cn("h-12 w-12 drop-shadow-[0_0_18px_rgba(251,113,133,0.55)] sm:h-16 sm:w-16", item.isLiked ? "fill-current" : "")} />
                      <span className="text-[11px] text-rose-300 sm:text-xs">Double tap</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => messageCompany(item)}
                      className="inline-flex h-[52px] min-h-12 w-[52px] min-w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-cyan-300 sm:h-14 sm:w-14"
                      aria-label="Message company"
                    >
                      <Send className="h-7 w-7" />
                    </button>
                    <Link href={`/jobs/${item.job.id}`} className="block">
                      <Button variant="accent" className="flex h-[72px] min-h-[72px] w-[72px] flex-col gap-1 rounded-full bg-lime-300 p-0 text-center text-black hover:bg-lime-200 sm:h-20 sm:w-20">
                        <BriefcaseBusiness className="h-4 w-4" />
                        <span className="text-xs leading-4">Apply<br />for Role</span>
                      </Button>
                    </Link>
                </div>
                <div className="flex justify-between px-5 pb-5 text-sm text-white/75">
                  <button type="button" onClick={() => handleSwipe(item, "left")} className="text-rose-400">
                    ← Swipe left to pass
                  </button>
                  <button type="button" onClick={() => handleSwipe(item, "right")} className="text-lime-300">
                    Swipe right to save →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/88 px-6 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 text-white backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 text-center text-xs text-white/58">
          <Link href="/jobs" className="flex flex-col items-center gap-1 text-lime-300">
            <Bookmark className="h-6 w-6" />
            Feed
          </Link>
          <Link href="/dashboard/staff/jobs" className="flex flex-col items-center gap-1">
            <Heart className="h-6 w-6" />
            Saved
          </Link>
          <Link href="/dashboard/staff/jobs" className="flex flex-col items-center gap-1">
            <PlusCircle className="h-6 w-6" />
            Applications
          </Link>
          <Link href="/dashboard/staff/profile" className="flex flex-col items-center gap-1">
            <MessageCircle className="h-6 w-6" />
            Messages
          </Link>
          <Link href="/dashboard/staff/profile" className="flex flex-col items-center gap-1">
            <UserCircle className="h-6 w-6" />
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
