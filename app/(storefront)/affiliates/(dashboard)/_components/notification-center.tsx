// File: app/(storefront)/affiliates/(dashboard)/_components/notification-center.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
// ✅ Import Server Action
import { getAnnouncements } from "@/app/actions/storefront/affiliates/_services/dashboard-service";
import { formatDistanceToNow } from "date-fns";
import { getAuthAffiliate } from "@/app/actions/storefront/affiliates/auth-helper";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS";
  date: Date | string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch Real Notifications
  useEffect(() => {
    async function fetchNotifs() {
      try {
        const session = await getAuthAffiliate(); // Verify Auth
        const data = await getAnnouncements(session.id);
        setNotifications(data as any);
      } catch (error) {
        console.error("Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    }
    fetchNotifs();
  }, []);

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

  const getIcon = (type: string) => {
    switch (type) {
        case "WARNING": return <AlertTriangle className="w-4 h-4 text-orange-600" />;
        case "SUCCESS": return <CheckCircle className="w-4 h-4 text-green-600" />;
        default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-black focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      <div className={cn(
        "absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden origin-top-right transition-all duration-200 z-50",
        isOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible"
      )}>
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
          <h4 className="font-bold text-sm text-gray-900">Notifications</h4>
          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
            {notifications.length} New
          </span>
        </div>

        {/* List */}
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
          {loading ? (
             <div className="p-8 flex justify-center text-indigo-600"><Loader2 className="w-6 h-6 animate-spin"/></div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No new announcements.</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-default group relative",
                    n.type === "WARNING" ? "bg-orange-50/30" : "bg-white"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn("mt-0.5 p-1.5 rounded-full shrink-0 h-fit", 
                        n.type === "WARNING" ? "bg-orange-100" : n.type === "SUCCESS" ? "bg-green-100" : "bg-blue-100"
                    )}>
                        {getIcon(n.type)}
                    </div>
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <h5 className="text-sm font-bold text-gray-900 leading-tight pr-4">{n.title}</h5>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDistanceToNow(new Date(n.date), { addSuffix: true })}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
            <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All Updates</button>
        </div>
      </div>
    </div>
  );
}