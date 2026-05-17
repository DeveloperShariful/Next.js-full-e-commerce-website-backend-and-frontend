// File: app/(backend)/admin/categories/_components/category-row.tsx

"use client";

import React from "react";
import { CategoryData } from "../types";
import { ImageIcon } from "lucide-react";

interface RowProps {
  categories: CategoryData[];
  depth?: number;
  handleEdit: (cat: CategoryData) => void;
  handleDelete: (id: string) => void;
  // 🚀 New Props for Trash actions
  handleRestore: (id: string) => void;
  handleForceDelete: (id: string) => void;
  searchQuery: string;
  selectedIds: string[];
  handleSelectOne: (id: string, checked: boolean) => void;
  // 🚀 To check if we are in trash view
  currentFilter: "active" | "trash";
}

export default function CategoryRow({ 
  categories, 
  depth = 0, 
  handleEdit, 
  handleDelete, 
  handleRestore,
  handleForceDelete,
  searchQuery,
  selectedIds,
  handleSelectOne,
  currentFilter
}: RowProps) {
  
  return (
    <>
      {categories.map((cat, index) => {
        const matchesSearch = !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Hide row if search is active and it doesn't match (and doesn't have matching children)
        if (!matchesSearch && (!cat.children || cat.children.length === 0)) return null;

        // Striped rows & Selection Check
        const isEven = index % 2 === 0;
        const isSelected = selectedIds.includes(cat.id);

        return (
          <React.Fragment key={cat.id}>
             <tr className={`group border-b border-[#f0f0f1] transition-colors ${isSelected ? 'bg-[#fff8e5]' : isEven ? 'bg-[#f9f9f9]' : 'bg-white'} hover:bg-[#f0f6fc]`}>
               
               {/* Checkbox */}
               <td className="p-2 text-center border-r border-[#f0f0f1]">
                 <input 
                   type="checkbox" 
                   checked={isSelected}
                   onChange={(e) => handleSelectOne(cat.id, e.target.checked)}
                   className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] cursor-pointer focus:ring-[#2271b1]" 
                 />
               </td>
               
               {/* Image/Thumbnail */}
               <td className="p-2 border-r border-[#f0f0f1]">
                 <div className="w-[32px] h-[32px] rounded-[2px] bg-[#f0f0f1] border border-[#c3c4c7] flex items-center justify-center overflow-hidden mx-auto">
                   {cat.image ? (
                     <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                   ) : (
                     <ImageIcon className="text-[#8c8f94]" size={14} />
                   )}
                 </div>
               </td>
               
               {/* Name & Row Actions */}
               <td className="p-2 align-top pt-[10px]">
                 <div className="flex items-start" style={{ paddingLeft: `${depth * 20}px` }}>
                   {depth > 0 && <span className="text-[#8c8f94] mr-1 select-none">—</span>}
                   <div className="flex flex-col">
                     <span className={`text-[#2271b1] font-semibold hover:text-[#0a4b78] ${currentFilter === "trash" ? "cursor-default" : "cursor-pointer"}`} onClick={() => currentFilter === "active" && handleEdit(cat)}>
                       {cat.name}
                     </span>
                     
                     {/* 🚀 WP Style Row Actions (Dynamic based on Tab) */}
                     <div className="text-[12px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                       
                       {currentFilter === "active" ? (
                         // --- ACTIVE (ALL) TAB ACTIONS ---
                         <>
                           <button onClick={() => handleEdit(cat)} className="text-[#2271b1] hover:underline">Edit</button>
                           <span className="text-[#c3c4c7]">|</span>
                           <button onClick={() => handleDelete(cat.id)} className="text-[#d63638] hover:underline">Trash</button>
                           <span className="text-[#c3c4c7]">|</span>
                           <span className="text-[#8c8f94] text-[10px]">Order: {cat.menuOrder}</span>
                         </>
                       ) : (
                         // --- TRASH TAB ACTIONS ---
                         <>
                           <button onClick={() => handleRestore(cat.id)} className="text-[#2271b1] hover:underline">Restore</button>
                           <span className="text-[#c3c4c7]">|</span>
                           <button onClick={() => handleForceDelete(cat.id)} className="text-[#d63638] hover:underline">Delete permanently</button>
                         </>
                       )}

                     </div>
                   </div>
                 </div>
               </td>
               
               {/* Description */}
               <td className="p-2 text-[13px] text-[#50575e] align-top pt-[10px]">
                  {cat.description ? (
                    <p className="line-clamp-2 leading-relaxed max-w-[300px]">{cat.description}</p>
                  ) : "—"}
               </td>

               {/* Slug */}
               <td className="p-2 text-[13px] text-[#50575e] align-top pt-[10px]">
                 {cat.slug}
               </td>
               
               {/* Count */}
               <td className="p-2 text-center align-top pt-[10px]">
                 <span className={`text-[#2271b1] font-medium ${currentFilter === "active" ? "hover:text-[#0a4b78] cursor-pointer" : ""}`}>
                   {cat._count?.products || 0}
                 </span>
               </td>
             </tr>
             
            {/* Render Children Recursively */}
            {cat.children && (
              <CategoryRow 
                categories={cat.children} 
                depth={depth + 1} 
                handleEdit={handleEdit} 
                handleDelete={handleDelete}
                handleRestore={handleRestore}
                handleForceDelete={handleForceDelete}
                searchQuery={searchQuery}
                selectedIds={selectedIds} 
                handleSelectOne={handleSelectOne} 
                currentFilter={currentFilter}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}