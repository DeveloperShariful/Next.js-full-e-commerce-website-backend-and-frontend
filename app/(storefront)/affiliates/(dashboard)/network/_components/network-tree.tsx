//app/(storefront)/affiliates/network/_components/network-tree.tsx

"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, User, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { NetworkNode } from "@/app/actions/storefront/affiliates/_services/network-service";

interface Props {
  nodes: NetworkNode[];
}

// Recursive Node Component
function TreeNode({ node }: { node: NetworkNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children.length > 0;

  return (
    <div className="ml-4 md:ml-6 border-l border-gray-200 pl-4 md:pl-6 relative">
      {/* Connector Line Horizontal */}
      <div className="absolute top-8 left-0 w-4 md:w-6 h-px bg-gray-200" />
      
      <div className="py-2">
        <div 
          onClick={() => hasChildren && setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border bg-white transition-all w-full md:w-fit min-w-[300px]",
            hasChildren ? "cursor-pointer hover:shadow-md hover:border-indigo-200" : "opacity-90"
          )}
        >
          {/* Avatar / Icon */}
          <div className="relative">
             <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
               {node.avatar ? (
                 // eslint-disable-next-line @next/next/no-img-element
                 <img src={node.avatar} alt="" className="w-full h-full object-cover" />
               ) : (
                 <User className="w-5 h-5 text-gray-400" />
               )}
             </div>
             <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
               {node.level}
             </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">{node.name}</h4>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1">
                 <DollarSign className="w-3 h-3" /> {node.totalSales.toFixed(0)} Earned
              </span>
              <span>•</span>
              <span>{new Date(node.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Expand Icon */}
          {hasChildren && (
            <div className="p-1 rounded-full bg-gray-50">
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </div>
          )}
        </div>
      </div>

      {/* Children Container */}
      {isOpen && hasChildren && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NetworkTree({ nodes }: Props) {
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Your Team is Empty</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Start inviting people using your referral link. When they join, they will appear here as Level 1 partners.
        </p>
      </div>
    );
  }

  return (
    <div className="-ml-4 md:-ml-6">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </div>
  );
}