// File: app/(backend)/admin/affiliate/_components/Configuration/mlm-network-manager.tsx

"use client";

import { useState } from "react";
import { NetworkNode } from "@/app/actions/backend/affiliate/types";
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
      <div className="p-12 text-center text-[#50575e] bg-white border border-[#c3c4c7] flex flex-col items-center justify-center font-sans">
        <Users className="w-10 h-10 text-[#c3c4c7] mb-3" />
        <h3 className="font-semibold text-[#1d2327] text-[14px]">Network Empty</h3>
        <p className="text-[13px] text-[#8c8f94] mt-1 max-w-sm">
            Once affiliates start referring other sub-affiliates, the MLM genealogy tree will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm flex flex-col h-[700px] font-sans text-[#1d2327]">
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#c3c4c7] bg-white shrink-0">
        <div>
            <h3 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2271b1]" />
                Network Genealogy
            </h3>
        </div>
        <div className="flex gap-3 text-[11px] text-[#50575e]">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#2271b1]"></span> Lvl 1</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#00a32a]"></span> Lvl 2</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#d63638]"></span> Lvl 3+</div>
        </div>
      </div>
      
      <div className="overflow-auto custom-scrollbar flex-1 bg-[#f0f0f1] p-4">
        <div className="min-w-[700px] space-y-2">
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

  // WP Style Level Colors
  const levelColors = ["border-l-[#2271b1]", "border-l-[#00a32a]", "border-l-[#d63638]", "border-l-[#f0b849]"];
  const borderColor = levelColors[level % levelColors.length];

  return (
    <div className="select-none">
      <div 
        className={cn(
          "relative flex items-center justify-between p-2 bg-white border border-[#c3c4c7] shadow-sm mb-1 group cursor-default hover:bg-[#f6f7f7]",
          "border-l-[4px]", borderColor
        )}
        style={{ marginLeft: level > 0 ? `${level * 24}px` : '0px' }}
      >
        {/* WP Style Connector */}
        {level > 0 && (
            <div className="absolute -left-[24px] top-1/2 w-[24px] h-[1px] bg-[#c3c4c7] -z-10" />
        )}
        
        <div className="flex items-center gap-3">
          <div className="w-5 flex justify-center">
            {hasChildren ? (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className="text-[#50575e] hover:text-[#2271b1] focus:outline-none"
                >
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            ) : <span className="w-4 h-4 block" />}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-sm bg-[#f0f0f1] border border-[#c3c4c7] flex items-center justify-center overflow-hidden shrink-0">
              {node.avatar ? (
                <img src={node.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[13px] font-bold text-[#50575e]">{node.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[#2271b1]">{node.name}</span>
                <span className="text-[10px] px-1 bg-[#f0f0f1] text-[#50575e] border border-[#c3c4c7] uppercase">
                  {node.tier}
                </span>
              </div>
              <div className="text-[11px] text-[#8c8f94] flex gap-2">
                <span>Direct: {node.directReferrals}</span>
                <span>Team: {node.teamSize}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right pr-2">
          <p className="text-[10px] text-[#8c8f94] uppercase m-0">Earnings</p>
          <p className="text-[13px] font-mono font-medium text-[#1d2327] m-0">
            {formatPrice(node.totalEarnings)}
          </p>
        </div>
      </div>

      {isOpen && hasChildren && (
        <div className="relative">
          <div className="absolute left-[12px] top-0 bottom-2 w-[1px] bg-[#c3c4c7]" style={{ left: `${(level + 1) * 24 - 8}px` }}></div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} formatPrice={formatPrice} />
          ))}
        </div>
      )}
    </div>
  );
}