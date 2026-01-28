//app/(storefront)/affiliates/_components/network-browser.tsx

"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, User, DollarSign, Users, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { NetworkNode } from "@/app/actions/storefront/affiliates/_services/network-service";

interface Props {
  data: {
    sponsor: any;
    tree: NetworkNode[];
    stats: any;
  };
}

export default function NetworkBrowser({ data }: Props) {
  const { sponsor, tree, stats } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* 1. Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sponsor */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-3 opacity-5">
             <ShieldCheck className="w-24 h-24" />
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 relative z-10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Sponsor</p>
            {sponsor ? (
              <div className="mt-1">
                <p className="font-bold text-gray-900 text-lg">{sponsor.user.name}</p>
                <p className="text-xs text-gray-500">@{sponsor.slug}</p>
              </div>
            ) : (
              <div className="mt-1">
                <p className="font-bold text-gray-900 text-lg">GoBike Official</p>
                <p className="text-xs text-gray-500 italic">Root Partner</p>
              </div>
            )}
          </div>
        </div>

        {/* Direct Team */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Direct Recruits</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.directRecruits}</p>
            <p className="text-xs text-gray-500">Level 1 Partners</p>
          </div>
        </div>

        {/* Network Volume */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl border border-green-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Partners</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activePartners}</p>
            <p className="text-xs text-gray-500">Total Downline</p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Tree */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm min-h-[500px] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Organization Hierarchy</h3>
        </div>
        
        <div className="p-6 overflow-auto custom-scrollbar flex-1">
           {tree.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Your Team is Empty</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                  Start inviting people using your referral link. When they join, they will appear here as your downline.
                </p>
              </div>
           ) : (
              <div className="min-w-[600px]">
                 {tree.map((node) => (
                    <TreeNode key={node.id} node={node} />
                 ))}
              </div>
           )}
        </div>
      </div>
    </div>
  );
}

// Recursive Node Component (Visual Style Updated)
function TreeNode({ node }: { node: NetworkNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div className="pl-6 relative border-l border-gray-200 ml-4 my-2">
      {/* Connector */}
      <div className="absolute top-6 left-0 w-6 h-px bg-gray-200" />
      
      <div className="py-1">
        <div 
          onClick={() => hasChildren && setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-4 p-3 rounded-xl border bg-white transition-all w-full md:w-fit min-w-[320px]",
            hasChildren ? "cursor-pointer hover:shadow-md hover:border-indigo-300" : "border-gray-200",
            isOpen ? "ring-2 ring-indigo-50 border-indigo-200" : ""
          )}
        >
          {/* Avatar */}
          <div className="relative">
             <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 text-gray-500 text-xs font-bold">
               {node.avatar ? (
                 <img src={node.avatar} alt="" className="w-full h-full object-cover" />
               ) : (
                 node.name.charAt(0)
               )}
             </div>
             <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold ring-2 ring-white">
               L{node.level}
             </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 truncate">{node.name}</h4>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1 font-medium text-green-600 bg-green-50 px-1.5 rounded">
                 <DollarSign className="w-3 h-3" /> {node.totalSales.toLocaleString()}
              </span>
              <span>{new Date(node.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Expander */}
          {hasChildren && (
            <div className={cn("p-1 rounded-full bg-gray-50 transition-transform", isOpen && "rotate-90 bg-indigo-50 text-indigo-600")}>
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Children Container */}
      {isOpen && hasChildren && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}