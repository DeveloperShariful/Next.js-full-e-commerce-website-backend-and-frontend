// File: app/(backend)/admin/categories/_components/category-list.tsx

"use client";

import { useState } from "react";
import { CategoryData } from "../types";
import CategoryRow from "./category-row";
import { Loader2 } from "lucide-react";

interface ListProps {
  categories: CategoryData[];
  loading: boolean;
  handleEdit: (cat: CategoryData) => void;
  handleDelete: (id: string) => void;
  handleRestore: (id: string) => void;
  handleForceDelete: (id: string) => void;
  handleBulkAction: (ids: string[], action: "delete" | "restore" | "force_delete") => Promise<boolean>;
  searchQuery: string;
  currentFilter: "active" | "trash";
  setCurrentFilter: (f: "active" | "trash") => void;
  counts: { active: number; trash: number; all: number };
}

export default function CategoryList({ 
  categories, loading, handleEdit, handleDelete, handleRestore, handleForceDelete, handleBulkAction, searchQuery, currentFilter, setCurrentFilter, counts 
}: ListProps) {
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const extractAllIds = (cats: CategoryData[]): string[] => {
    let ids: string[] = [];
    cats.forEach(cat => {
      ids.push(cat.id);
      if (cat.children && cat.children.length > 0) {
        ids = [...ids, ...extractAllIds(cat.children)];
      }
    });
    return ids;
  };

  const allCategoryIds = extractAllIds(categories);
  const totalItems = allCategoryIds.length;
  const isAllSelected = totalItems > 0 && selectedIds.length === totalItems;

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(allCategoryIds);
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) setSelectedIds(prev => [...prev, id]);
    else setSelectedIds(prev => prev.filter(item => item !== id));
  };

  const executeBulkAction = async () => {
    if (bulkAction === "" || selectedIds.length === 0) return;
    
    setIsProcessing(true);
    const finished = await handleBulkAction(selectedIds, bulkAction as any);
    if (finished) {
      setSelectedIds([]); 
      setBulkAction("");
    }
    setIsProcessing(false);
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* 🚀 WP Style Filter Links (All | Trash) */}
      <ul className="flex items-center gap-1 text-[13px] mb-3 text-[#646970]">
        <li>
          <button 
            onClick={() => { setCurrentFilter("active"); setSelectedIds([]); }} 
            className={`${currentFilter === "active" ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:text-[#0a4b78]"}`}
          >
            All <span className="text-[#646970] font-normal">({counts.all})</span>
          </button>
        </li>
        {counts.trash > 0 && (
          <>
            <li className="text-[#c3c4c7]">|</li>
            <li>
              <button 
                onClick={() => { setCurrentFilter("trash"); setSelectedIds([]); }} 
                className={`${currentFilter === "trash" ? "font-semibold text-[#1d2327]" : "text-[#2271b1] hover:text-[#0a4b78]"}`}
              >
                Trash <span className="text-[#646970] font-normal">({counts.trash})</span>
              </button>
            </li>
          </>
        )}
      </ul>

      {/* 🚀 WP Style Top Actions Bar */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <select 
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            disabled={isProcessing || categories.length === 0}
            className="px-2 py-[3px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
          >
            <option value="">Bulk actions</option>
            {currentFilter === "active" ? (
              <option value="delete">Delete</option>
            ) : (
              <>
                <option value="restore">Restore</option>
                <option value="force_delete">Delete permanently</option>
              </>
            )}
          </select>
          <button 
            onClick={executeBulkAction}
            disabled={bulkAction === "" || selectedIds.length === 0 || isProcessing}
            className="px-2.5 py-[3px] border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] rounded-[3px] text-[13px] hover:bg-[#f0f6fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
        <div className="text-[13px] text-[#646970]">
          {loading ? "Loading..." : `${totalItems} items`}
        </div>
      </div>

      {/* WP List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse min-w-[600px]">
            
            <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
              <tr>
                <th className="p-2 w-8 text-center border-r border-[#e2e4e7]">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={loading || totalItems === 0}
                    className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] focus:ring-[#2271b1] cursor-pointer" 
                  />
                </th>
                <th className="p-2 w-14 border-r border-[#e2e4e7]">Image</th>
                <th className="p-2 font-medium">Name</th>
                <th className="p-2 w-64">Description</th>
                <th className="p-2 w-32">Slug</th>
                <th className="p-2 w-16 text-center">Count</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#f0f0f1]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#50575e]">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-[#2271b1]" size={20}/>
                      <span>Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#50575e] italic">
                    No categories found.
                  </td>
                </tr>
              ) : (
                <CategoryRow 
                  categories={categories} 
                  handleEdit={handleEdit} 
                  handleDelete={handleDelete} 
                  handleRestore={handleRestore} // 🚀 Pass down
                  handleForceDelete={handleForceDelete} // 🚀 Pass down
                  searchQuery={searchQuery}
                  selectedIds={selectedIds} 
                  handleSelectOne={handleSelectOne} 
                  currentFilter={currentFilter} // 🚀 Pass down
                />
              )}
            </tbody>

            {/* Footer */}
            <tfoot className="bg-[#f6f7f7] border-t border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
              <tr>
                <th className="p-2 w-8 text-center border-r border-[#e2e4e7]">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={loading || totalItems === 0}
                    className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] focus:ring-[#2271b1] cursor-pointer" 
                  />
                </th>
                <th className="p-2 w-14 border-r border-[#e2e4e7]">Image</th>
                <th className="p-2 font-medium">Name</th>
                <th className="p-2">Description</th>
                <th className="p-2">Slug</th>
                <th className="p-2 text-center">Count</th>
              </tr>
            </tfoot>

          </table>
        </div>
      </div>
      
    </div>
  );
}