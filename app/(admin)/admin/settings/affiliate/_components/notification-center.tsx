// File: app/(admin)/_components/notification-center.tsx

"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock Data (Replace with real fetching logic using SWR/React Query later)
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
        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:bg-gray-100 rounded-full">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0 shadow-xl border-gray-200 rounded-xl overflow-hidden">
        <div className="p-3 border-b bg-gray-50/50 flex justify-between items-center">
            <h4 className="font-bold text-sm text-gray-800">Notifications</h4>
            {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                </button>
            )}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">No new notifications</div>
            ) : (
                notifications.map((item) => (
                    <div key={item.id} className={cn("p-3 border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer", !item.read && "bg-blue-50/30")}>
                        <div className="flex justify-between items-start">
                            <span className={cn("text-xs font-bold", !item.read ? "text-gray-900" : "text-gray-600")}>{item.title}</span>
                            <span className="text-[10px] text-gray-400">{item.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.desc}</p>
                    </div>
                ))
            )}
        </div>
        
        <div className="p-2 border-t bg-gray-50 text-center">
            <button className="text-xs font-medium text-gray-600 hover:text-black">View All Activity</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}