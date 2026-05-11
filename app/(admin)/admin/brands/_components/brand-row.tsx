//app/(admin)/admin/brands/_components/brand-row.tsx

"use client";

import React from "react";
import { BrandData } from "../types";
import { ImageIcon, ExternalLink } from "lucide-react";

interface RowProps {
  brands: BrandData[];
  handleEdit: (brand: BrandData) => void;
  handleDelete: (id: string) => void;
  handleRestore: (id: string) => void;
  handleForceDelete: (id: string) => void;
  searchQuery: string;
  selectedIds: string[];
  handleSelectOne: (id: string, checked: boolean) => void;
  currentFilter: "active" | "trash";
}

export default function BrandRow({ 
  brands, 
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
      {brands.map((brand, index) => {
        const matchesSearch = !searchQuery || brand.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return null;

        const isEven = index % 2 === 0;
        const isSelected = selectedIds.includes(brand.id);

        return (
          <tr key={brand.id} className={`group border-b border-[#f0f0f1] transition-colors ${isSelected ? 'bg-[#fff8e5]' : isEven ? 'bg-[#f9f9f9]' : 'bg-white'} hover:bg-[#f0f6fc]`}>
            
            {/* Checkbox */}
            <td className="p-2 text-center border-r border-[#f0f0f1]">
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={(e) => handleSelectOne(brand.id, e.target.checked)}
                className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] cursor-pointer focus:ring-[#2271b1]" 
              />
            </td>
            
            {/* Logo */}
            <td className="p-2 border-r border-[#f0f0f1]">
              <div className="w-[32px] h-[32px] rounded-[2px] bg-[#f0f0f1] border border-[#c3c4c7] flex items-center justify-center overflow-hidden mx-auto">
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-[#8c8f94]" size={14} />
                )}
              </div>
            </td>
            
            {/* Name & Row Actions */}
            <td className="p-2 align-top pt-[10px]">
              <div className="flex flex-col">
                <span className={`text-[#2271b1] font-semibold hover:text-[#0a4b78] ${currentFilter === "trash" ? "cursor-default" : "cursor-pointer"}`} onClick={() => currentFilter === "active" && handleEdit(brand)}>
                  {brand.name}
                </span>
                
                {/* 🚀 WP Style Row Actions */}
                <div className="text-[12px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                  {currentFilter === "active" ? (
                    <>
                      <button onClick={() => handleEdit(brand)} className="text-[#2271b1] hover:underline">Edit</button>
                      <span className="text-[#c3c4c7]">|</span>
                      <button onClick={() => handleDelete(brand.id)} className="text-[#d63638] hover:underline">Trash</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleRestore(brand.id)} className="text-[#2271b1] hover:underline">Restore</button>
                      <span className="text-[#c3c4c7]">|</span>
                      <button onClick={() => handleForceDelete(brand.id)} className="text-[#d63638] hover:underline">Delete permanently</button>
                    </>
                  )}
                </div>
              </div>
            </td>
            
            {/* Description */}
            <td className="p-2 text-[13px] text-[#50575e] align-top pt-[10px]">
               {brand.description ? (
                 <p className="line-clamp-2 leading-relaxed max-w-[200px]">{brand.description}</p>
               ) : "—"}
            </td>

            {/* Website */}
            <td className="p-2 text-[13px] text-[#50575e] align-top pt-[10px]">
              {brand.website ? (
                <a href={brand.website} target="_blank" rel="noreferrer" className="text-[#2271b1] hover:underline flex items-center gap-1 w-max">
                  <ExternalLink size={12}/> Visit Site
                </a>
              ) : "—"}
            </td>

            {/* Country */}
            <td className="p-2 text-[13px] text-[#50575e] align-top pt-[10px]">
              {brand.countryOfOrigin || "—"}
            </td>
            
            {/* Count */}
            <td className="p-2 text-center align-top pt-[10px]">
              <span className={`text-[#2271b1] font-medium ${currentFilter === "active" ? "hover:text-[#0a4b78] cursor-pointer" : ""}`}>
                {brand._count?.products || 0}
              </span>
            </td>
          </tr>
        );
      })}
    </>
  );
}