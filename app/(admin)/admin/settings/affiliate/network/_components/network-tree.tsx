//app/(admin)/admin/settings/affiliate/network/_components/network-tree.tsx

"use client";

import { NetworkNode } from "@/app/actions/admin/settings/affiliates/types";
import { ChevronRight, ChevronDown, User, DollarSign, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  nodes: NetworkNode[];
}

export default function NetworkTree({ nodes }: Props) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
        No network data available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} level={0} />
      ))}
    </div>
  );
}

// Recursive Node Component
function TreeNode({ node, level }: { node: NetworkNode; level: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  // Determine indentation color based on level
  const levelColors = ["border-l-blue-500", "border-l-green-500", "border-l-purple-500", "border-l-orange-500"];
  const borderColor = levelColors[level % levelColors.length];

  return (
    <div className="select-none">
      {/* Node Card */}
      <div 
        className={cn(
          "relative flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-all mb-2",
          "border-l-4", borderColor
        )}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-3">
          {/* Toggle Button */}
          {hasChildren ? (
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-transform"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6 h-6" /> // Spacer
          )}

          {/* Avatar & Name */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border overflow-hidden">
              {node.avatar ? (
                <img src={node.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                {node.name}
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border">
                  {node.tier}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Direct: {node.directReferrals} • Team: {node.teamSize}
              </div>
            </div>
          </div>
        </div>

        {/* Stats (Right Side) */}
        <div className="flex items-center gap-6 pr-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 uppercase font-medium">Earnings</p>
            <p className="text-sm font-mono font-medium text-green-600 flex items-center justify-end gap-1">
              <DollarSign className="w-3 h-3" />
              {node.totalEarnings.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Children (Recursive Render) */}
      {isOpen && hasChildren && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}