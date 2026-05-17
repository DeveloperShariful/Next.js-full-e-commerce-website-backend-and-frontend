// app/(backend)/Header-Sideber/sidebar/user-nav.tsx

"use client";

import { useSession, signOut } from "next-auth/react"; // <-- NextAuth
import { Loader2, LogOut, User } from "lucide-react";
import Image from "next/image";

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="px-3 h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c3c4c7]" size={16} />
      </div>
    );
  }

  return (
    // 🚀 WP Style: Header right side User Menu (Hover to open dropdown)
    <div className="relative group h-full flex items-center px-3 hover:bg-[#2c3338] hover:text-[#72aee6] transition-colors cursor-pointer text-[#c3c4c7]">
      <div className="flex items-center gap-2">
        {/* User Greeting WP Style */}
        <span className="text-[13px] hidden sm:block">
          Howdy, <span className="font-medium">{session?.user?.name || "Admin"}</span>
        </span>
        
        {/* NextAuth User Avatar */}
        <div className="w-6 h-6 rounded-sm bg-[#1e293b] flex items-center justify-center text-[#c3c4c7] overflow-hidden shrink-0 border border-[#2c3338]">
           {session?.user?.image ? (
             <Image 
               src={session.user.image} 
               alt="avatar" 
               width={24} 
               height={24} 
               className="w-full h-full object-cover" 
             />
           ) : (
             <User size={14} />
           )}
        </div>
      </div>

      {/* 🚀 WP Style Dropdown (Shows on Hover) */}
      <div className="absolute top-[46px] right-0 w-64 bg-[#1d2327] border border-[#2c3338] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col">
         
         {/* User Details Dropdown Area */}
         <div className="p-4 flex flex-col items-center justify-center border-b border-[#2c3338]">
             <div className="w-16 h-16 rounded-sm bg-[#1e293b] flex items-center justify-center text-white overflow-hidden mb-2 shadow-inner">
               {session?.user?.image ? (
                 <Image src={session.user.image} alt="avatar" width={64} height={64} className="object-cover" />
               ) : (
                 <User size={32} className="text-[#c3c4c7]" />
               )}
             </div>
             <p className="text-[14px] text-white font-medium truncate w-full text-center">
               {session?.user?.name || "Admin"}
             </p>
             <p className="text-[12px] text-[#c3c4c7] truncate w-full text-center">
               {session?.user?.email}
             </p>
         </div>

         {/* Custom Logout Button for NextAuth */}
         <div className="p-2 bg-[#1d2327]">
           <button 
             onClick={() => signOut({ callbackUrl: "/sign-in" })} 
             className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[#c3c4c7] hover:text-[#72aee6] hover:bg-[#2c3338] rounded-sm transition-colors"
           >
               <LogOut size={16} />
               Sign Out
           </button>
         </div>
      </div>
    </div>
  );
}