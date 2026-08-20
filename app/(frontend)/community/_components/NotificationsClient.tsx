"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "./PostCard";
import { markAllNotificationsRead, getNotifications } from "@/app/actions/frontend/community/community-notifications";

interface NotificationItem {
  id: string;
  type: "REACTION" | "COMMENT" | "REPLY" | "MENTION" | "FOLLOW";
  isRead: boolean;
  createdAt: string | Date;
  actor: { id: string; name: string | null; image: string | null };
  post: { id: string; slug: string; caption: string | null } | null;
  comment: { id: string; content: string } | null;
}

function timeAgo(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function notificationText(n: NotificationItem) {
  const name = n.actor.name || "Someone";
  switch (n.type) {
    case "REACTION": return `${name} reacted to your post`;
    case "COMMENT": return `${name} commented on your post`;
    case "REPLY": return `${name} replied to your comment`;
    case "MENTION": return `${name} mentioned you`;
    case "FOLLOW": return `${name} started following you`;
    default: return `${name} interacted with your content`;
  }
}

export default function NotificationsClient({
  initialNotifications,
  initialCursor,
}: {
  initialNotifications: NotificationItem[];
  initialCursor: string | null;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  const handleLoadMore = () => {
    if (!cursor) return;
    startTransition(async () => {
      const res = await getNotifications(cursor);
      if (res.success) {
        setNotifications(prev => [...prev, ...(res.notifications as unknown as NotificationItem[])]);
        setCursor(res.nextCursor);
      }
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-lg border border-[#DADDE1] max-w-[680px] mx-auto">
        <p className="text-[17px] font-semibold text-[#050505] mb-1">No notifications yet</p>
        <p className="text-[15px] text-[#65676B]">When someone reacts, comments, or follows you, it'll show up here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto space-y-1">
      {notifications.map(n => {
        const href = n.type === "FOLLOW" ? `/community/profile/${n.actor.id}` : n.post ? `/community/${n.post.slug}` : "/community";
        return (
          <Link
            key={n.id}
            href={href}
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[#F2F2F2] transition-colors ${!n.isRead ? "bg-[#E7F3FF]" : "bg-white"}`}
          >
            <Avatar name={n.actor.name} image={n.actor.image} size={44} />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] text-[#050505]">{notificationText(n)}</p>
              <p className="text-[13px] text-[#1877F2] font-medium mt-0.5">{timeAgo(n.createdAt)}</p>
            </div>
            {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2] shrink-0" />}
          </Link>
        );
      })}

      {cursor && (
        <div className="text-center py-5">
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className="bg-white border border-[#DADDE1] rounded-full px-6 py-2 text-[14px] font-semibold text-[#050505] hover:bg-[#F2F2F2] disabled:opacity-50"
          >
            {isPending ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
