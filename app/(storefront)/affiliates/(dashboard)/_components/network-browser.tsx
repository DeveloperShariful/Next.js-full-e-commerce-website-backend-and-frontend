//app/(storefront)/affiliates/_components/network-browser.tsx

"use client";

import { useState } from "react";
import { User, ChevronRight, ChevronDown, Network, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { NetworkNode } from "@/app/actions/storefront/affiliates/_services/network-service";
// ✅ IMPORT GLOBAL STORE
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface Props {
  data: {
    sponsor: any;
    tree: NetworkNode[];
    stats: { directRecruits: number; activePartners: number };
  };
}

// Internal Recursive Tree Component
const TreeNode = ({ node }: { node: NetworkNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  // ✅ GLOBAL STORE USAGE
  const { formatPrice } = useGlobalStore();

  return (
    <div className="pl-4 border-l border-gray-200 ml-2">
      <div 
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border mb-2 transition-all cursor-pointer hover:shadow-sm",
          isOpen ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200 hover:border-indigo-200"
        )}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-4 h-4 text-indigo-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <div className="w-4" /> 
          )}
          
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
            {node.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-gray-400" />
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{node.name}</h4>
            <p className="text-[10px] text-gray-500">Joined {format(new Date(node.joinedAt), "MMM d, yyyy")}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-xs font-bold text-gray-900">
            {formatPrice(node.totalSales)}
          </span>
          <span className="text-[10px] text-gray-500 uppercase">Sales</span>
        </div>
      </div>

      {/* Recursive Children */}
      {isOpen && hasChildren && (
        <div className="animate-in slide-in-from-top-1 fade-in duration-200">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function NetworkBrowser({ data }: Props) {
  const { sponsor, tree, stats } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Network Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <h3 className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">My Sponsor</h3>
          {sponsor ? (
            <div className="flex items-center gap-3 mt-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <span className="font-bold text-sm">{sponsor.user.name?.charAt(0)}</span>
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">{sponsor.user.name}</p>
                <p className="text-xs text-indigo-200 truncate max-w-[150px]">{sponsor.user.email}</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-indigo-100">You are a top-level partner.</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Direct Recruits</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.directRecruits}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Total Team</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.activePartners}</h3>
          </div>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Network Tree</h3>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-3 top-2.5 text-gray-400" />
            <input 
              placeholder="Search partner..." 
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="p-6">
          {tree.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Network className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>You haven't recruited anyone yet.</p>
              <p className="text-xs mt-1">Share your link to grow your team!</p>
            </div>
          ) : (
            <div className="-ml-6">
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