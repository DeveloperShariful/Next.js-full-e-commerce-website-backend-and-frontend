// app/(backend)/admin/attributes/_components/attribute-row.tsx

"use client";

import React from "react";
import { AttributeData } from "../types";

interface RowProps {
  attributes: AttributeData[];
  handleEdit: (attr: AttributeData) => void;
  handleDelete: (id: string, name: string) => void;
  handleRestore: (id: string) => void;
  handleForceDelete: (id: string) => void;
  selectedIds: string[];
  handleSelectOne: (id: string, checked: boolean) => void;
  currentFilter: "active" | "trash";
}

export default function AttributeRow({ 
  attributes, 
  handleEdit, 
  handleDelete, 
  handleRestore,
  handleForceDelete,
  selectedIds,
  handleSelectOne,
  currentFilter
}: RowProps) {
  
  return (
    <>
      {attributes.map((attr, index) => {
        const isEven = index % 2 === 0;
        const isSelected = selectedIds.includes(attr.id);

        return (
          <tr key={attr.id} className={`group border-b border-[#f0f0f1] transition-colors ${isSelected ? 'bg-[#fff8e5]' : isEven ? 'bg-[#f9f9f9]' : 'bg-white'} hover:bg-[#f0f6fc]`}>
            
            {/* Checkbox */}
            <td className="p-2 text-center border-r border-[#f0f0f1]">
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={(e) => handleSelectOne(attr.id, e.target.checked)}
                className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] cursor-pointer focus:ring-[#2271b1]" 
              />
            </td>
            
            {/* Name & Row Actions */}
            <td className="p-2 align-top pt-[10px]">
              <div className="flex flex-col">
                <span className={`text-[#2271b1] font-semibold hover:text-[#0a4b78] ${currentFilter === "trash" ? "cursor-default" : "cursor-pointer"}`} onClick={() => currentFilter === "active" && handleEdit(attr)}>
                  {attr.name}
                </span>
                
                {/* 🚀 WP Style Row Actions */}
                <div className="text-[12px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                  {currentFilter === "active" ? (
                    <>
                      <button onClick={() => handleEdit(attr)} className="text-[#2271b1] hover:underline">Edit</button>
                      <span className="text-[#c3c4c7]">|</span>
                      <button onClick={() => handleDelete(attr.id, attr.name)} className="text-[#d63638] hover:underline">Trash</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleRestore(attr.id)} className="text-[#2271b1] hover:underline">Restore</button>
                      <span className="text-[#c3c4c7]">|</span>
                      <button onClick={() => handleForceDelete(attr.id)} className="text-[#d63638] hover:underline">Delete permanently</button>
                    </>
                  )}
                </div>
              </div>
            </td>

            {/* Slug */}
            <td className="p-2 text-[13px] text-[#50575e] align-top pt-[10px]">
              {attr.slug}
            </td>

            {/* Type */}
            <td className="p-2 align-top pt-[10px]">
               <span className={`px-1.5 py-0.5 rounded-[2px] border text-[11px] font-semibold tracking-wide ${attr.type === 'COLOR' ? 'bg-[#f4f1fa] text-[#8224e3] border-[#e0c8f6]' : 'bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7]'}`}>
                 {attr.type}
               </span>
            </td>
            
            {/* Terms / Values */}
            <td className="p-2 text-[13px] text-[#50575e] align-top pt-[10px]">
               <div className="flex flex-wrap gap-1">
                  {attr.values?.map((val: string, i: number) => (
                     <span key={i} className="after:content-[','] last:after:content-[''] mr-1">
                       {val}
                     </span>
                  ))}
               </div>
            </td>
            
            {/* Count (In Use) */}
            <td className="p-2 text-center align-top pt-[10px]">
              <span className={`text-[#2271b1] font-medium ${currentFilter === "active" ? "hover:text-[#0a4b78] cursor-pointer" : ""}`}>
                {attr.count || 0}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}