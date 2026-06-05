// File: app/(backend)/admin/affiliate/_components/notification-center.tsx

"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock Data
const MOCK_NOTIFICATIONS = [
    { id: 1, title: "New Affiliate Signup", desc: "John Doe registered as a partner.", time: "2m ago", read: false },
    { id: 2, title: "Payout Requested", desc: "Request for $500 from Sarah.", time: "1h ago", read: false },
    { id: 3, title: "High Risk Activity", desc: "Suspicious click pattern detected.", time: "3h ago", read: true },
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* WP Topbar Icon Style */}
        <button className="relative flex items-center justify-center p-2 text-[#c3c4c7] hover:text-[#72aee6] transition-colors focus:outline-none">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d63638] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d63638]"></span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      {/* WP Dropdown Menu Style */}
      <PopoverContent align="end" className="w-[300px] p-0 shadow-lg border border-[#c3c4c7] rounded-none bg-white font-sans">
        <div className="p-3 border-b border-[#c3c4c7] bg-[#f0f0f1] flex justify-between items-center">
            <h4 className="font-semibold text-[13px] text-[#1d2327] m-0">Notifications</h4>
            {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[12px] text-[#2271b1] hover:underline flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                </button>
            )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-4 text-center text-[#50575e] text-[13px] italic">No new notifications</div>
            ) : (
                notifications.map((item) => (
                    <div key={item.id} className={cn("p-3 border-b border-[#f0f0f1] last:border-0 hover:bg-[#f6f7f7] transition-colors cursor-pointer", !item.read && "bg-[#f0f6fc]")}>
                        <div className="flex justify-between items-start mb-1">
                            <span className={cn("text-[13px] leading-tight", !item.read ? "font-semibold text-[#1d2327]" : "font-normal text-[#2c3338]")}>{item.title}</span>
                            <span className="text-[11px] text-[#8c8f94] whitespace-nowrap ml-2">{item.time}</span>
                        </div>
                        <p className="text-[12px] text-[#50575e] leading-snug line-clamp-2 m-0">{item.desc}</p>
                    </div>
                ))
            )}
        </div>
        
        <div className="border-t border-[#c3c4c7] bg-[#f0f0f1]">
            <button className="w-full py-2 text-[13px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:bg-[#e6e6e6] transition-colors">
                View All Activity
            </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}