// File: app/(admin)/admin/categories/_components/category-row.tsx
"use client";
import React from "react";
import { CategoryData } from "../types";
import { Pencil, Trash2, ImageIcon } from "lucide-react";

interface RowProps {
  categories: CategoryData[];
  depth?: number;
  handleEdit: (cat: CategoryData) => void;
  handleDelete: (id: string) => void;
  searchQuery: string;
}

export default function CategoryRow({ categories, depth = 0, handleEdit, handleDelete, searchQuery }: RowProps) {
  return (
    <>
      {categories.map((cat) => {
        const matchesSearch = !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Hide row if search is active and it doesn't match (and doesn't have matching children)
        if (!matchesSearch && (!cat.children || cat.children.length === 0)) return null;

        return (
          <React.Fragment key={cat.id}>
             {matchesSearch && (
                <tr className="hover:bg-blue-50/30 transition group border-b border-slate-100 last:border-0">
                  <td className="p-4 w-10 text-center text-xs text-slate-400 font-mono">
                    {cat.menuOrder}
                  </td>
                  <td className="p-4 w-20">
                    <div className="w-10 h-10 rounded-md bg-gray-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-gray-300" size={16} />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
                      {depth > 0 && <span className="text-slate-300 mr-2">└─</span>}
                      <div className="flex flex-col">
                        <span className={`text-slate-800 ${depth === 0 ? 'font-bold' : 'font-medium'}`}>{cat.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">{cat.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                      {cat._count?.products || 0}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {cat.isActive ? (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Hidden</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
             )}
            {cat.children && (
              <CategoryRow 
                categories={cat.children} 
                depth={depth + 1} 
                handleEdit={handleEdit} 
                handleDelete={handleDelete}
                searchQuery={searchQuery}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}