// app/(admin)/Header-Sideber/sidebar/user-nav.tsx

"use client";

import { useSession, signOut } from "next-auth/react"; // <-- NextAuth
import { Loader2, LogOut, User } from "lucide-react";
import Image from "next/image";

export function UserNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="animate-spin text-slate-400" size={20} />
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-slate-700 bg-[#0f172a] pb-6 md:pb-4">
      <div className="flex items-center gap-3">
        
        {/* NextAuth User Avatar */}
        <div className="w-9 h-9 border border-slate-500 rounded-full bg-slate-800 flex items-center justify-center text-white overflow-hidden shrink-0">
           {session?.user?.image ? (
             <Image 
               src={session.user.image} 
               alt="avatar" 
               width={36} 
               height={36} 
               className="w-full h-full object-cover" 
             />
           ) : (
             <User size={18} />
           )}
        </div>
        
        {/* User Details */}
        <div className="text-left overflow-hidden flex-1">
            <p className="text-sm font-bold text-white truncate">
              {session?.user?.name || "Admin"}
            </p>
            <p className="text-[10px] text-slate-400 truncate uppercase">
              {session?.user?.email}
            </p>
        </div>

        {/* Custom Logout Button for NextAuth */}
        <button 
          onClick={() => signOut({ callbackUrl: "/sign-in" })} 
          className="text-slate-400 hover:text-red-400 transition-colors shrink-0"
          title="Sign Out"
        >
            <LogOut size={18} />
        </button>
        
      </div>
    </div>
  );
}