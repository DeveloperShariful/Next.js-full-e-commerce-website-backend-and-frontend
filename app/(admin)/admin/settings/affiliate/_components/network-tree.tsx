// File: app/(admin)/admin/settings/affiliate/_components/network-tree.tsx

"use client";

import { useState } from "react";
import { NetworkNode } from "@/app/actions/admin/settings/affiliates/types";
import { ChevronRight, ChevronDown, User, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface Props {
  nodes: NetworkNode[];
}

export default function NetworkTree({ nodes }: Props) {
  const { formatPrice } = useGlobalStore();

  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-16 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center animate-in fade-in">
        <Users className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="font-bold text-gray-900">Network Empty</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-sm">
            Once affiliates start referring other sub-affiliates, the MLM genealogy tree will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[700px] animate-in fade-in">
      <div className="flex justify-between items-center mb-6 shrink-0 border-b pb-4">
        <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Network Genealogy
            </h3>
            <p className="text-xs text-gray-500 mt-1">Visual representation of your affiliate downlines.</p>
        </div>
        <div className="flex gap-4 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm"></span> Level 1</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500 border border-white shadow-sm"></span> Level 2</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500 border border-white shadow-sm"></span> Level 3+</div>
        </div>
      </div>
      
      <div className="overflow-auto custom-scrollbar flex-1 pb-10">
        <div className="min-w-[700px] space-y-3 px-2">
            {nodes.map((node) => (
                <TreeNode key={node.id} node={node} level={0} formatPrice={formatPrice} />
            ))}
        </div>
      </div>
    </div>
  );
}

function TreeNode({ node, level, formatPrice }: { node: NetworkNode; level: number; formatPrice: (p: number) => string }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  // Level Styling Logic
  const levelColors = ["border-l-blue-500", "border-l-indigo-500", "border-l-purple-500", "border-l-pink-500"];
  const borderColor = levelColors[level % levelColors.length];
  const bgHover = level === 0 ? "hover:bg-gray-50" : "hover:bg-gray-50/80";

  return (
    <div className="select-none transition-all duration-300">
      <div 
        className={cn(
          "relative flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm transition-all mb-2 group cursor-default",
          "border-l-[4px]", borderColor,
          bgHover
        )}
        style={{ marginLeft: level > 0 ? `${level * 32}px` : '0px' }}
      >
        {/* Visual Connector Line for Nested Items */}
        {level > 0 && (
            <div className="absolute -left-[34px] top-1/2 w-[34px] h-[2px] bg-gray-200 -z-10 rounded-l-full" />
        )}
        
        <div className="flex items-center gap-4">
          {/* Expander Button */}
          <div className="w-6 flex justify-center">
            {hasChildren ? (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-transform focus:outline-none active:scale-95"
                >
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            ) : (
                <span className="w-4 h-4 block" />
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0 shadow-sm relative">
              {node.avatar ? (
                <img src={node.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-gray-500">{node.name.charAt(0)}</span>
              )}
              {/* Level Badge on Avatar */}
              <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white", borderColor.replace("border-l-", "bg-"))}></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{node.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border uppercase font-bold tracking-wider">
                  {node.tier}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 flex gap-2 mt-0.5">
                <span className="flex items-center gap-1 font-medium bg-gray-50 px-1.5 rounded"><User className="w-3 h-3"/> Direct: {node.directReferrals}</span>
                <span className="flex items-center gap-1 font-medium bg-gray-50 px-1.5 rounded"><Users className="w-3 h-3"/> Team: {node.teamSize}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 pr-4">
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Earnings</p>
            <p className="text-sm font-mono font-bold text-emerald-600 bg-emerald-50 px-2 rounded-md">
              {formatPrice(node.totalEarnings)}
            </p>
          </div>
        </div>
      </div>

      {/* Recursive Children Container */}
      {isOpen && hasChildren && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 ease-out relative">
          {/* Vertical Guide Line */}
          <div className="absolute left-[19px] top-0 bottom-4 w-[2px] bg-gray-200" style={{ left: `${(level + 1) * 32 - 13}px` }}></div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} formatPrice={formatPrice} />
          ))}
        </div>
      )}
    </div>
  );
}