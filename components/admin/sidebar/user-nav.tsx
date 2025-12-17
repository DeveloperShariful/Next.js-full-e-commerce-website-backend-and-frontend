// components/admin/sidebar/user-nav.tsx

"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export function UserNav() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div className="p-4"><Loader2 className="animate-spin text-slate-400" size={20}/></div>;

  return (
    <div className="p-4 border-t border-slate-700 bg-[#0f172a] pb-6 md:pb-4">
      <div className="flex items-center gap-3">
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-9 h-9 border border-slate-500"
            }
          }}
        />
        
        <div className="text-left overflow-hidden">
            <p className="text-sm font-bold text-white truncate">
              {user?.fullName || user?.username || "Admin"}
            </p>
            <p className="text-[10px] text-slate-400 truncate uppercase">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
        </div>
      </div>
    </div>
  );
}