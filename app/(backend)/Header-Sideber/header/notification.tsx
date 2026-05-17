// File: app/(backend)/admin/Header-Sideber/header/notification.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, CheckSquare, Square, ShoppingBag, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getSystemNotifications } from "@/app/actions/backend/header-sideber/get-notifications";

interface NotificationState {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "ORDER" | "STOCK" | "USER";
  isRead: boolean;
  isSelected: boolean; 
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotes() {
      const serverNotes = await getSystemNotifications();
      const formattedNotes: NotificationState[] = serverNotes.map(note => ({
        ...note,
        isSelected: false,
        isRead: false 
      }));

      setNotifications(prev => {
        if (prev.length === 0) return formattedNotes;
        return prev; 
      });
    }
    fetchNotes();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const selectedCount = notifications.filter(n => n.isSelected).length;
  const isAllSelected = notifications.length > 0 && selectedCount === notifications.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelect = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isSelected: !n.isSelected } : n
    ));
  };

  const toggleSelectAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isSelected: !isAllSelected })));
  };

  const deleteSelected = () => {
    setNotifications(prev => prev.filter(n => !n.isSelected));
  };

  const markSelectedRead = () => {
    setNotifications(prev => prev.map(n => 
      n.isSelected ? { ...n, isRead: true, isSelected: false } : n
    ));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  return (
    <div className="relative h-full flex items-center" ref={dropdownRef}>
      {/* 🚀 WP Style Bell Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-full px-3 flex items-center justify-center hover:bg-[#2c3338] transition-colors text-[#c3c4c7] focus:outline-none"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
            <span className="absolute top-[8px] right-[6px] w-3.5 h-3.5 bg-[#d63638] text-white flex items-center justify-center rounded-full text-[9px] font-bold border-2 border-[#1d2327]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
        )}
      </button>

      {/* 🚀 WP Style Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-[46px] right-0 mt-0 w-80 sm:w-96 bg-white border border-[#c3c4c7] shadow-md z-50">
          
          {/* Header Area */}
          <div className="px-3 py-2 border-b border-[#c3c4c7] bg-[#f0f0f1] flex justify-between items-center min-h-[40px]">
            {selectedCount > 0 ? (
               // --- ACTION MODE ---
               <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center gap-2">
                    <button onClick={toggleSelectAll} className="text-[#8c8f94] hover:text-[#2271b1]">
                        {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <span className="text-[13px] font-semibold text-[#3c434a]">{selectedCount} Selected</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={markSelectedRead} className="p-1 hover:bg-white border border-transparent hover:border-[#c3c4c7] text-[#8c8f94] hover:text-[#2271b1] transition" title="Mark Read"><Check size={14}/></button>
                    <button onClick={deleteSelected} className="p-1 hover:bg-white border border-transparent hover:border-[#c3c4c7] text-[#8c8f94] hover:text-[#d63638] transition" title="Delete"><Trash2 size={14}/></button>
                  </div>
               </div>
            ) : (
               // --- NORMAL MODE ---
               <>
                 <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[13px] text-[#3c434a]">Notifications</h3>
                 </div>
                 {notifications.length > 0 && (
                    <button onClick={toggleSelectAll} className="text-[12px] text-[#2271b1] hover:text-[#0a4b78] hover:underline">Select All</button>
                 )}
               </>
            )}
          </div>
          
          {/* List Area */}
          <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
                <div className="py-8 text-center text-[#8c8f94]">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-[13px] italic">No new notifications</p>
                </div>
            ) : (
                notifications.map((item) => (
                    <div 
                        key={item.id} 
                        className={`
                           relative group px-3 py-3 border-b border-[#f0f0f1] last:border-0 flex gap-3 items-start transition-colors
                           ${item.isSelected ? "bg-[#f0f6fc]" : "hover:bg-[#f6f7f7]"}
                           ${!item.isRead && !item.isSelected ? "bg-[#f6f7f7]" : ""}
                        `}
                    >
                        {/* Checkbox */}
                        <div className="pt-0.5">
                           <button 
                             onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                             className={`w-[14px] h-[14px] rounded-[2px] border flex items-center justify-center transition ${item.isSelected ? "bg-[#2271b1] border-[#2271b1] text-white" : "border-[#8c8f94] hover:border-[#2271b1] text-transparent"}`}
                           >
                             <Check size={10} strokeWidth={3} />
                           </button>
                        </div>

                        {/* Icon based on Type */}
                        <div className={`mt-0.5 shrink-0 ${item.type === 'ORDER' ? 'text-[#2271b1]' : 'text-[#d63638]'}`}>
                            {item.type === 'ORDER' ? <ShoppingBag size={14}/> : <AlertTriangle size={14}/>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 cursor-pointer" onClick={() => markAsRead(item.id)}>
                            <div className="flex justify-between items-start">
                                <p className={`text-[13px] ${!item.isRead ? "font-semibold text-[#3c434a]" : "font-normal text-[#2271b1] hover:text-[#0a4b78]"}`}>{item.title}</p>
                                {!item.isRead && <span className="w-[6px] h-[6px] rounded-full bg-[#2271b1] shrink-0 mt-1"></span>}
                            </div>
                            <p className="text-[12px] text-[#50575e] mt-1 line-clamp-2 leading-relaxed">{item.message}</p>
                            <p className="text-[11px] text-[#8c8f94] mt-1">{item.time}</p>
                        </div>
                    </div>
                ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-[#c3c4c7] bg-[#f0f0f1]">
             <Link href="/admin/logs" className="block w-full text-[13px] text-center text-[#2271b1] hover:text-[#0a4b78] hover:underline">
               View All Activity
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}