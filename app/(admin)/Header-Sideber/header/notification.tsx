// File: app/(admin)/admin/Header-Sideber/header/notification.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, CheckSquare, Square, ShoppingBag, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getSystemNotifications } from "@/app/actions/admin/header-sideber/get-notifications";

// লোকাল স্টেট এর জন্য ইন্টারফেস (সার্ভার ডাটার সাথে UI স্টেট মিক্স করা)
interface NotificationState {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "ORDER" | "STOCK" | "USER";
  isRead: boolean;
  isSelected: boolean; // UI এর জন্য দরকারি
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. সার্ভার থেকে ডাটা আনা এবং লোকাল স্টেটে সেট করা
  useEffect(() => {
    async function fetchNotes() {
      const serverNotes = await getSystemNotifications();
      
      // সার্ভার ডাটার সাথে isSelected ডিফল্ট false যোগ করা
      const formattedNotes: NotificationState[] = serverNotes.map(note => ({
        ...note,
        isSelected: false,
        isRead: false // ডিফল্ট আনরিড রাখা হচ্ছে
      }));

      // যদি নোটিফিকেশন লিস্ট খালি থাকে তবেই নতুন ডাটা লোড হবে (যাতে ইউজার ডিলিট করলে আবার চলে না আসে)
      setNotifications(prev => {
        if (prev.length === 0) return formattedNotes;
        return prev; 
      });
    }
    fetchNotes();
  }, []);

  // ক্যালকুলেশন
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const selectedCount = notifications.filter(n => n.isSelected).length;
  const isAllSelected = notifications.length > 0 && selectedCount === notifications.length;

  // ড্রপডাউন বন্ধ করার লজিক
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ACTIONS (আগের লজিকগুলো) ---

  // 1. Toggle Single Selection
  const toggleSelect = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isSelected: !n.isSelected } : n
    ));
  };

  // 2. Toggle Select All
  const toggleSelectAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isSelected: !isAllSelected })));
  };

  // 3. Delete Selected (Local UI remove)
  const deleteSelected = () => {
    setNotifications(prev => prev.filter(n => !n.isSelected));
  };

  // 4. Mark Selected as Read
  const markSelectedRead = () => {
    setNotifications(prev => prev.map(n => 
      n.isSelected ? { ...n, isRead: true, isSelected: false } : n
    ));
  };

  // 5. Mark Single as Read
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition text-slate-600 focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          
          {/* Header Area */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center h-12">
            {selectedCount > 0 ? (
               // --- ACTION MODE ---
               <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <button onClick={toggleSelectAll} className="text-slate-600 hover:text-blue-600">
                        {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <span className="text-xs font-semibold text-slate-600">{selectedCount} Selected</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={markSelectedRead} className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-blue-600 transition" title="Mark Read"><Check size={16}/></button>
                    <button onClick={deleteSelected} className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-red-500 transition" title="Delete"><Trash2 size={16}/></button>
                  </div>
               </div>
            ) : (
               // --- NORMAL MODE ---
               <>
                 <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-800">Notifications</h3>
                    {unreadCount > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                 </div>
                 {notifications.length > 0 && (
                    <button onClick={toggleSelectAll} className="text-xs text-slate-500 hover:text-blue-600 font-medium">Select All</button>
                 )}
               </>
            )}
          </div>
          
          {/* List Area */}
          <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No new notifications</p>
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
                             onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                             className={`w-4 h-4 rounded border flex items-center justify-center transition ${item.isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 hover:border-blue-400 text-transparent"}`}
                           >
                             <Check size={10} strokeWidth={3} />
                           </button>
                        </div>

                        {/* Icon based on Type */}
                        <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${item.type === 'ORDER' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                            {item.type === 'ORDER' ? <ShoppingBag size={14}/> : <AlertTriangle size={14}/>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 cursor-pointer" onClick={() => markAsRead(item.id)}>
                            <div className="flex justify-between items-start">
                                <p className={`text-sm ${!item.isRead ? "font-bold text-slate-800" : "font-medium text-slate-600"}`}>{item.title}</p>
                                {!item.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1"></span>}
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
             <Link href="/admin/logs" className="block w-full py-1.5 text-xs font-medium text-center text-blue-600 hover:underline">
               View All Activity
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}