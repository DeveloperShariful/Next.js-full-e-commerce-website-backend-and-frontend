// File: app/(backend)/Header-Sideber/header/notification.tsx

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell, Check, Trash2, CheckSquare, Square,
  ShoppingBag, AlertTriangle, Star, MessageSquare, ShieldCheck, UserPlus,
} from "lucide-react";
import Link from "next/link";
import { getSystemNotifications, SystemNotification, NotificationType } from "@/app/actions/backend/header-sideber/get-notifications";

// --- Relative time helper ---
function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// --- Icon + color per type ---
function NotifIcon({ type }: { type: NotificationType }) {
  const map: Record<NotificationType, { icon: React.ReactNode; color: string }> = {
    ORDER:    { icon: <ShoppingBag size={14} />,   color: "text-[#2271b1]" },
    STOCK:    { icon: <AlertTriangle size={14} />,  color: "text-[#d63638]" },
    REVIEW:   { icon: <Star size={14} />,           color: "text-[#f0b429]" },
    SUPPORT:  { icon: <MessageSquare size={14} />,  color: "text-[#00a32a]" },
    WARRANTY: { icon: <ShieldCheck size={14} />,    color: "text-[#8c5e00]" },
    USER:     { icon: <UserPlus size={14} />,       color: "text-[#9333ea]" },
  };
  const { icon, color } = map[type];
  return <span className={`mt-0.5 shrink-0 ${color}`}>{icon}</span>;
}

interface NotifState extends SystemNotification {
  isRead: boolean;
  isSelected: boolean;
}

const STORAGE_KEY = "admin-read-notifications";

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])); } catch { /* noop */ }
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifState[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const data = await getSystemNotifications();
    const readIds = getReadIds();
    setNotifications(
      data.map((n) => ({ ...n, isRead: readIds.has(n.id), isSelected: false }))
    );
  }, []);

  // Initial load
  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Auto-refresh every 2 hours
  useEffect(() => {
    const interval = setInterval(loadNotifications, 7_200_000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const unreadCount  = notifications.filter((n) => !n.isRead).length;
  const selectedCount = notifications.filter((n) => n.isSelected).length;
  const isAllSelected = notifications.length > 0 && selectedCount === notifications.length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    const ids = getReadIds();
    ids.add(id);
    saveReadIds(ids);
  };

  const toggleSelect = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isSelected: !n.isSelected } : n))
    );

  const toggleSelectAll = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, isSelected: !isAllSelected })));

  const deleteSelected = () =>
    setNotifications((prev) => prev.filter((n) => !n.isSelected));

  const markSelectedRead = () => {
    const ids = getReadIds();
    setNotifications((prev) =>
      prev.map((n) => {
        if (!n.isSelected) return n;
        ids.add(n.id);
        return { ...n, isRead: true, isSelected: false };
      })
    );
    saveReadIds(ids);
  };

  return (
    <div className="relative h-full flex items-center" ref={dropdownRef}>

      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-full px-3 flex items-center justify-center hover:bg-[#2c3338] transition-colors text-[#c3c4c7] focus:outline-none"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-[8px] right-[6px] w-3.5 h-3.5 bg-[#d63638] text-white flex items-center justify-center rounded-full text-[9px] font-bold border-2 border-[#1d2327]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[46px] right-0 w-80 sm:w-96 bg-white border border-[#c3c4c7] shadow-lg z-50 rounded-b-[3px]">

          {/* Header */}
          <div className="px-3 py-2 border-b border-[#c3c4c7] bg-[#f0f0f1] flex justify-between items-center min-h-[40px]">
            {selectedCount > 0 ? (
              <div className="flex items-center gap-3 w-full">
                <button onClick={toggleSelectAll} className="text-[#8c8f94] hover:text-[#2271b1]">
                  {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
                <span className="text-[13px] font-semibold text-[#3c434a]">{selectedCount} selected</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={markSelectedRead} title="Mark read" className="p-1.5 hover:bg-white border border-transparent hover:border-[#c3c4c7] text-[#8c8f94] hover:text-[#2271b1] rounded-[3px] transition">
                    <Check size={13} />
                  </button>
                  <button onClick={deleteSelected} title="Delete" className="p-1.5 hover:bg-white border border-transparent hover:border-[#c3c4c7] text-[#8c8f94] hover:text-[#d63638] rounded-[3px] transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[13px] text-[#3c434a]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-[#2271b1] text-white rounded-full px-1.5 py-0.5">{unreadCount}</span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button onClick={toggleSelectAll} className="text-[12px] text-[#2271b1] hover:underline">
                    Select all
                  </button>
                )}
              </>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto scrollbar-none">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-[#8c8f94]">
                <Bell size={24} className="mx-auto mb-2 opacity-25" />
                <p className="text-[13px] italic">All caught up!</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`relative flex gap-3 px-3 py-3 border-b border-[#f0f0f1] last:border-0 transition-colors
                    ${item.isSelected ? "bg-[#f0f6fc]" : item.isRead ? "bg-white" : "bg-[#f6f7f7]"}
                  `}
                >
                  {/* Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                    className={`mt-0.5 w-[14px] h-[14px] shrink-0 rounded-[2px] border flex items-center justify-center transition
                      ${item.isSelected ? "bg-[#2271b1] border-[#2271b1] text-white" : "border-[#8c8f94] hover:border-[#2271b1] text-transparent"}`}
                  >
                    <Check size={10} strokeWidth={3} />
                  </button>

                  {/* Type icon */}
                  <NotifIcon type={item.type} />

                  {/* Content */}
                  <Link
                    href={item.link}
                    onClick={() => { markAsRead(item.id); setIsOpen(false); }}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-[13px] leading-tight ${!item.isRead ? "font-semibold text-[#1d2327]" : "font-normal text-[#3c434a]"}`}>
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="w-[6px] h-[6px] rounded-full bg-[#2271b1] shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[12px] text-[#50575e] mt-0.5 line-clamp-2 leading-relaxed">{item.message}</p>
                    <p className="text-[11px] text-[#a7aaad] mt-1">{timeAgo(item.createdAt)}</p>
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-[#c3c4c7] bg-[#f0f0f1] flex items-center justify-between">
            <Link
              href="/admin/logs"
              onClick={() => setIsOpen(false)}
              className="text-[12px] text-[#2271b1] hover:underline"
            >
              View all activity logs
            </Link>
            {unreadCount > 0 && (
              <button
                onClick={markSelectedRead}
                className="text-[11px] text-[#646970] hover:text-[#2271b1]"
              >
                Mark all read
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
