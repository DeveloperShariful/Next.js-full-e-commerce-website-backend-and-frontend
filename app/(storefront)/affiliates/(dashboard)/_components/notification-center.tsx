// File: app/(storefront)/affiliates/(dashboard)/_components/notification-center.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Notification Type (Replace with real DB schema later)
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

// Temporary Mock Data
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", title: "Payout Approved", message: "Your withdrawal of $150 has been processed.", time: "2 hours ago", read: false, type: "success" },
  { id: "2", title: "New Feature", message: "Check out the new Creative Gallery!", time: "1 day ago", read: false, type: "info" },
  { id: "3", title: "Profile Incomplete", message: "Please add your bank details to receive payouts.", time: "2 days ago", read: true, type: "warning" },
];

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={wrapperRef}>
      
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-indigo-600 focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      <div className={cn(
        "absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden origin-top-right transition-all duration-200 z-50",
        isOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible"
      )}>
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h4 className="font-bold text-sm text-gray-900">Notifications</h4>
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead} 
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No notifications yet.</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group relative",
                    !n.read ? "bg-indigo-50/30" : "opacity-70 hover:opacity-100"
                  )}
                >
                  {!n.read && <span className="absolute left-2 top-5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                  <div className="pl-2">
                    <div className="flex justify-between items-start mb-1">
                      <h5 className={cn("text-sm", !n.read ? "font-bold text-gray-900" : "font-medium text-gray-700")}>
                        {n.title}
                      </h5>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{n.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}