//app/(admin)/admin/tags/_components/tag-row.tsx

"use client";

import React from "react";
import { TagData } from "../types";

interface RowProps {
  tags: TagData[];
  handleEdit: (tag: TagData) => void;
  handleDelete: (id: string, name: string) => void;
  handleRestore: (id: string) => void;
  handleForceDelete: (id: string) => void;
  searchQuery: string;
  selectedIds: string[];
  handleSelectOne: (id: string, checked: boolean) => void;
  currentFilter: "active" | "trash";
}

export default function TagRow({ 
  tags, 
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
      {tags.map((tag, index) => {
        const matchesSearch = !searchQuery || tag.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return null;

        const isEven = index % 2 === 0;
        const isSelected = selectedIds.includes(tag.id);

        return (
          <tr key={tag.id} className={`group border-b border-[#f0f0f1] transition-colors ${isSelected ? 'bg-[#fff8e5]' : isEven ? 'bg-[#f9f9f9]' : 'bg-white'} hover:bg-[#f0f6fc]`}>
            
            {/* Checkbox */}
            <td className="p-2 text-center border-r border-[#f0f0f1]">
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={(e) => handleSelectOne(tag.id, e.target.checked)}
                className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] cursor-pointer focus:ring-[#2271b1]" 
              />
            </td>
            
            {/* Name & Row Actions */}
            <td className="p-2 align-top pt-[10px]">
              <div className="flex flex-col">
                <span className={`text-[#2271b1] font-semibold hover:text-[#0a4b78] ${currentFilter === "trash" ? "cursor-default" : "cursor-pointer"}`} onClick={() => currentFilter === "active" && handleEdit(tag)}>
                  {tag.name}
                </span>
                
                {/* 🚀 WP Style Row Actions */}
                <div className="text-[12px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                  {currentFilter === "active" ? (
                    <>
                      <button onClick={() => handleEdit(tag)} className="text-[#2271b1] hover:underline">Edit</button>
                      <span className="text-[#c3c4c7]">|</span>
                      <button onClick={() => handleDelete(tag.id, tag.name)} className="text-[#d63638] hover:underline">Trash</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleRestore(tag.id)} className="text-[#2271b1] hover:underline">Restore</button>
                      <span className="text-[#c3c4c7]">|</span>
                      <button onClick={() => handleForceDelete(tag.id)} className="text-[#d63638] hover:underline">Delete permanently</button>
                    </>
                  )}
                </div>
              </div>
            </td>
            
            {/* Description */}
            <td className="p-2 text-[13px] text-[#50575e] align-top pt-[10px]">
               {tag.description ? (
                 <p className="line-clamp-2 leading-relaxed max-w-[200px]">{tag.description}</p>
               ) : "—"}
            </td>

            {/* Slug */}
            <td className="p-2 text-[13px] text-[#50575e] align-top pt-[10px]">
              {tag.slug}
            </td>

            {/* Color Badge */}
            <td className="p-2 text-center align-top pt-[10px]">
              {tag.color ? (
                <span 
                  className="px-2 py-0.5 rounded-[2px] text-white text-[11px] font-semibold font-mono shadow-sm"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.color}
                </span>
              ) : "—"}
            </td>
            
            {/* Count */}
            <td className="p-2 text-center align-top pt-[10px]">
              <span className={`text-[#2271b1] font-medium ${currentFilter === "active" ? "hover:text-[#0a4b78] cursor-pointer" : ""}`}>
                {tag._count?.products || 0}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}