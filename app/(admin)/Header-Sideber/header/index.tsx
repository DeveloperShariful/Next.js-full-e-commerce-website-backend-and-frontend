"use client";

import { usePathname } from "next/navigation";
import { Search } from "./search";
import { Notifications } from "./notification";
import { MobileSidebar } from "./mobile-sidebar";

interface AdminHeaderProps {
  user: any;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();

  // পাথনেম থেকে টাইটেল জেনারেট করা (যেমন: /admin/products -> Products)
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    
    if (!lastSegment || lastSegment === "admin") return "Dashboard";
    
    // হাইফেন সরিয়ে ক্যাপিটালাইজ করা
    return lastSegment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm">
      
      {/* Left Side: Mobile Trigger & Title */}
      <div className="flex items-center gap-4">
        <MobileSidebar user={user} />
        
        <div className="flex flex-col">
           <h1 className="text-lg font-bold text-slate-800 leading-none">
             {getPageTitle()}
           </h1>
           {/* Breadcrumb Hint */}
           <p className="text-[10px] text-slate-500 hidden md:block mt-1 font-medium tracking-wide">
              ADMIN PANEL / {getPageTitle().toUpperCase()}
           </p>
        </div>
      </div>

      {/* Right Side: Search & Actions */}
      <div className="flex items-center gap-3 sm:gap-6 w-full max-w-xl justify-end">
        <div className="flex-1 flex justify-end">
           <Search />
        </div>
        
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
        
        <div className="flex items-center gap-2">
            <Notifications />
            {/* এখানে ভবিষ্যতে Theme Switcher যোগ করা যেতে পারে */}
        </div>
      </div>
    </header>
  );
}