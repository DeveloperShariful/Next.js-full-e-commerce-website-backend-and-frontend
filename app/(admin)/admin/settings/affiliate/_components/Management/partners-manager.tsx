//app/(admin)/admin/settings/affiliate/_components/Management/partners-manager.tsx

"use client";

import { useState } from "react";
import { Users, Layers, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import AffiliateUsersTable from "./users-table";
import GroupManager from "./group-manager";

interface Props {
  usersData: any[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  groupsData: any[];
  tags: any[];
  defaultRate?: number;
  defaultType?: "PERCENTAGE" | "FIXED";
}

export default function PartnersManager({ 
  usersData, 
  totalEntries, 
  totalPages, 
  currentPage, 
  groupsData, 
  tags ,
  defaultRate ,
  defaultType 
}: Props) {
  const [activeTab, setActiveTab] = useState<"AFFILIATES" | "GROUPS">("AFFILIATES");

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Tab Switcher */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10">
        <div>
           <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
             <LayoutGrid className="w-6 h-6 text-indigo-600" />
             Partner Management
           </h2>
           <p className="text-sm text-gray-500 mt-1">Manage your affiliates and their group assignments in one place.</p>
        </div>

        <div className="flex p-1 bg-gray-100/80 rounded-xl border border-gray-200">
           <button
             onClick={() => setActiveTab("AFFILIATES")}
             className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "AFFILIATES" 
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
             )}
           >
             <Users className="w-4 h-4" /> Affiliate List
           </button>
           <button
             onClick={() => setActiveTab("GROUPS")}
             className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeTab === "GROUPS" 
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
             )}
           >
             <Layers className="w-4 h-4" /> Group Settings
           </button>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="px-1">
        {activeTab === "AFFILIATES" ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                <AffiliateUsersTable 
                    data={usersData}
                    totalEntries={totalEntries}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    groups={groupsData} // Passing groups for dropdowns
                    tags={tags}
                    defaultRate={defaultRate}
                    defaultType={defaultType}
                />
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <GroupManager 
                    initialGroups={groupsData} 
                />
            </div>
        )}
      </div>

    </div>
  );
}