"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar } from "./PostCard";
import { getUnreadNotificationCount, getCommunityTimezone } from "@/app/actions/frontend/community/community-notifications";
import { msUntilNextDailyFire } from "@/lib/store-time";

const FB_BLUE = "#1877F2";
const DAILY_FIRE_HOURS = [10, 18]; // 10am and 6pm, in the store's timezone

function TabIcon({ href, emoji, label, active }: { href: string; emoji: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      title={label}
      className="relative flex items-center justify-center w-24 h-[52px] hover:bg-[#F0F2F5] rounded-lg transition-colors"
    >
      <span className="text-[22px]" style={{ opacity: active ? 1 : 0.65, filter: active ? "none" : "grayscale(20%)" }}>
        {emoji}
      </span>
      {active && <span className="absolute left-2 right-2 -bottom-[1px] h-[3px] rounded-full" style={{ backgroundColor: FB_BLUE }} />}
    </Link>
  );
}

function BottomTabIcon({ href, emoji, label, active, badge }: { href: string; emoji: string; label: string; active: boolean; badge?: number }) {
  return (
    <Link href={href} title={label} className="relative flex-1 flex flex-col items-center justify-center h-full">
      {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full" style={{ backgroundColor: FB_BLUE }} />}
      <span className="relative text-[22px] leading-none" style={{ opacity: active ? 1 : 0.6, filter: active ? "none" : "grayscale(20%)" }}>
        {emoji}
        {!!badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
    </Link>
  );
}

export default function CommunityTopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);
  const [navTop, setNavTop] = useState(0);
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  useEffect(() => {
    if (!session?.user) return;
    const fetchCount = () => getUnreadNotificationCount().then(res => { if (res.success) setUnread(res.count); });

    // No interval, no polling loop — just an initial read on arrival, plus two fixed
    // daily checks (10am / 6pm, store timezone) for as long as this stays mounted.
    // Everything else (likes/comments/follows/shares happening elsewhere) simply
    // won't be reflected until the next of those two checkpoints.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const scheduleNext = (timezone: string) => {
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        fetchCount();
        scheduleNext(timezone);
      }, msUntilNextDailyFire(timezone, DAILY_FIRE_HOURS));
    };

    fetchCount();
    getCommunityTimezone().then(tz => { if (!cancelled) scheduleNext(tz); });

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [session?.user]);

  // The site's own header (promo bar + logo/nav/search) is itself sticky and its
  // pinned height changes by breakpoint (the search row only exists at lg+), so we
  // track its live bottom edge and stick this bar directly beneath it instead of
  // guessing a fixed offset that would drift out of sync.
  useEffect(() => {
    const headerEl = document.querySelector("header");
    if (!headerEl) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      setNavTop(Math.max(0, Math.round(headerEl.getBoundingClientRect().bottom)));
    };
    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const isHome = pathname === "/community";
  const isSearch = pathname.startsWith("/community/search");
  const isSaved = pathname.startsWith("/community/saved");
  const isNotifications = pathname.startsWith("/community/notifications");
  const isProfile = !!currentUserId && pathname === `/community/profile/${currentUserId}`;

  return (
    <>
      {/* Desktop — sticky bar pinned directly beneath the site's own sticky header */}
      <div className="hidden md:block bg-white border-b border-[#DADDE1] sticky z-30" style={{ top: navTop }}>
        <div className="max-w-[1600px] mx-auto px-6 h-[52px] flex items-center justify-between gap-2">
          <Link href="/community" className="flex items-center gap-1.5 text-[16px] font-bold text-[#050505] shrink-0">
            <span className="text-lg leading-none" aria-hidden="true">🚴</span>
            GoBike Community
          </Link>

          <div className="flex items-center gap-1">
            <TabIcon href="/community" emoji="🏠" label="Home" active={isHome} />
            <form action="/community/search" method="GET" className="mx-1">
              <input
                type="text"
                name="q"
                placeholder="Search Community"
                className={`w-80 lg:w-[420px] rounded-full px-4 py-2 text-[14px] outline-none transition-colors ${isSearch ? "bg-white border border-[#DADDE1]" : "bg-[#F0F2F5] focus:bg-white focus:border focus:border-[#DADDE1]"}`}
              />
            </form>
            <TabIcon href="/community/saved" emoji="🔖" label="Saved" active={isSaved} />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {session?.user ? (
              <>
                <Link href="/community/notifications" className="relative w-9 h-9 rounded-full bg-[#F0F2F5] hover:bg-[#E4E6EB] flex items-center justify-center text-lg" title="Notifications">
                  🔔
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
                {currentUserId && (
                  <Link href={`/community/profile/${currentUserId}`} title="My profile">
                    <Avatar name={session.user?.name} image={session.user?.image} size={36} />
                  </Link>
                )}
              </>
            ) : (
              <Link href="/sign-in" className="text-[14px] font-bold text-white px-4 py-1.5 rounded-md" style={{ backgroundColor: FB_BLUE }}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile — fixed bottom tab bar, matches Facebook's mobile app/web nav placement */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#DADDE1] h-[54px] flex items-stretch shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
        <BottomTabIcon href="/community" emoji="🏠" label="Home" active={isHome} />
        <BottomTabIcon href="/community/search" emoji="🔍" label="Search" active={isSearch} />
        {session?.user ? (
          <>
            <BottomTabIcon href="/community/saved" emoji="🔖" label="Saved" active={isSaved} />
            <BottomTabIcon href="/community/notifications" emoji="🔔" label="Notifications" active={isNotifications} badge={unread} />
            {currentUserId ? (
              <Link href={`/community/profile/${currentUserId}`} title="My profile" className="relative flex-1 flex items-center justify-center h-full">
                {isProfile && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full" style={{ backgroundColor: FB_BLUE }} />}
                <Avatar name={session.user?.name} image={session.user?.image} size={28} />
              </Link>
            ) : (
              <span className="flex-1" />
            )}
          </>
        ) : (
          <Link href="/sign-in" className="flex-1 flex items-center justify-center text-[14px] font-bold" style={{ color: FB_BLUE }}>
            Sign in
          </Link>
        )}
      </div>
    </>
  );
}
