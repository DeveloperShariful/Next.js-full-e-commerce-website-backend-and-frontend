import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import NotificationsClient from "../_components/NotificationsClient";
import CommunityTopNav from "../_components/CommunityTopNav";
import { getNotifications } from "@/app/actions/frontend/community/community-notifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Notifications | GoBike Community" };

export default async function NotificationsPage() {
  const result = await getNotifications();

  return (
    <div className="min-h-screen pb-[54px] md:pb-0" style={{ backgroundColor: "#F0F2F5", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <Breadcrumbs className="max-w-[1600px] mx-auto mt-1.5 mb-1.5 px-6 font-sans" />
      <CommunityTopNav />

      <div className="max-w-[680px] mx-auto pt-4 px-3 sm:px-0">
        <Link href="/community" className="text-[13px] text-[#65676B] hover:underline">← GoBike Community</Link>
        <h1 className="text-[20px] font-bold text-[#050505]">🔔 Notifications</h1>
      </div>

      <div className="py-4 px-3 sm:px-0">
        <NotificationsClient
          initialNotifications={result.notifications || []}
          initialCursor={result.nextCursor ?? null}
        />
      </div>
    </div>
  );
}
