"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, CheckSquare, Square, X } from "lucide-react";
import Link from "next/link";

// 1. ডামি ডাটা টাইপ এবং ইনিশিয়াল স্টেট
interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  isSelected: boolean;
}

const initialNotifications: Notification[] = [
  { id: 1, title: "New Order Received", message: "Order #1020 has been placed.", time: "2 mins ago", isRead: false, isSelected: false },
  { id: 2, title: "Stock Alert", message: "Product XYZ is low on stock.", time: "1 hour ago", isRead: false, isSelected: false },
  { id: 3, title: "New Customer", message: "John Doe registered an account.", time: "3 hours ago", isRead: true, isSelected: false },
  { id: 4, title: "Payment Failed", message: "Order #1019 payment was declined.", time: "5 hours ago", isRead: false, isSelected: false },
];

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Unread Count বের করা
  const unreadCount = notifications.filter(n => !n.isRead).length;
  // Selected Count বের করা
  const selectedCount = notifications.filter(n => n.isSelected).length;
  const isAllSelected = notifications.length > 0 && selectedCount === notifications.length;

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ACTIONS ---

  // 1. Toggle Selection (Single)
  const toggleSelect = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isSelected: !n.isSelected } : n
    ));
  };

  // 2. Toggle Select All
  const toggleSelectAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isSelected: !isAllSelected })));
  };

  // 3. Delete Selected
  const deleteSelected = () => {
    setNotifications(prev => prev.filter(n => !n.isSelected));
  };

  // 4. Mark Selected as Read
  const markSelectedRead = () => {
    setNotifications(prev => prev.map(n => 
      n.isSelected ? { ...n, isRead: true, isSelected: false } : n
    ));
  };

  // 5. Mark Single as Read (Clicking on item)
  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header Area */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center h-12">
            
            {selectedCount > 0 ? (
               // --- ACTION MODE HEADER (When items selected) ---
               <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <button onClick={toggleSelectAll} className="text-slate-600 hover:text-blue-600">
                        {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <span className="text-xs font-semibold text-slate-600">{selectedCount} Selected</span>
                  </div>
                  
                  <div className="ml-auto flex items-center gap-2">
                    <button 
                        onClick={markSelectedRead}
                        className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-blue-600 transition" 
                        title="Mark as Read"
                    >
                        <Check size={16} />
                    </button>
                    <button 
                        onClick={deleteSelected}
                        className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-red-500 transition" 
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
               </div>
            ) : (
               // --- NORMAL HEADER ---
               <>
                 <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} New
                        </span>
                    )}
                 </div>
                 {notifications.length > 0 && (
                    <button onClick={toggleSelectAll} className="text-xs text-slate-500 hover:text-blue-600 font-medium">
                        Select All
                    </button>
                 )}
               </>
            )}
          </div>
          
          {/* List Area */}
          <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No notifications found</p>
                </div>
            ) : (
                notifications.map((item) => (
                    <div 
                        key={item.id} 
                        className={`
                           relative group px-4 py-3 border-b border-slate-50 last:border-0 flex gap-3 items-start transition-colors
                           ${item.isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"}
                           ${!item.isRead && !item.isSelected ? "bg-slate-50/30" : ""}
                        `}
                    >
                        {/* Checkbox */}
                        <div className="pt-1">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelect(item.id);
                                }}
                                className={`
                                    w-4 h-4 rounded border flex items-center justify-center transition
                                    ${item.isSelected 
                                        ? "bg-blue-600 border-blue-600 text-white" 
                                        : "border-slate-300 hover:border-blue-400 text-transparent"
                                    }
                                `}
                            >
                                <Check size={10} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Content */}
                        <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => markAsRead(item.id)}
                        >
                            <div className="flex justify-between items-start">
                                <p className={`text-sm ${!item.isRead ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>
                                    {item.title}
                                </p>
                                {/* Unread Dot */}
                                {!item.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"></span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{item.time}</p>
                        </div>
                    </div>
                ))
            )}
          </div>
          
          {/* Footer */}
          <div className="p-2 border-t border-slate-100 bg-slate-50/50">
             <Link 
                href="/admin/logs"
                onClick={() => setIsOpen(false)}
                className="block w-full py-1.5 text-xs font-medium text-center text-blue-600 hover:text-blue-700 hover:underline transition"
             >
                View All Activity
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}