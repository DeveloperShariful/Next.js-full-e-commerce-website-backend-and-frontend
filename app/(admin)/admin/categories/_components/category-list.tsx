// File: app/(admin)/admin/categories/_components/category-list.tsx
"use client";
import { CategoryData } from "../types";
import CategoryRow from "./category-row";
import { Loader2, FolderTree } from "lucide-react";

interface ListProps {
  categories: CategoryData[];
  loading: boolean;
  handleEdit: (cat: CategoryData) => void;
  handleDelete: (id: string) => void;
  searchQuery: string;
}

export default function CategoryList({ categories, loading, handleEdit, handleDelete, searchQuery }: ListProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
            <tr>
              <th className="p-4 w-10 text-center">Order</th>
              <th className="p-4 w-24">Image</th>
              <th className="p-4">Name & Hierarchy</th>
              <th className="p-4 text-center">Products</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="p-20 text-center"><div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin text-blue-500" size={24}/><span>Loading...</span></div></td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={6} className="p-20 text-center text-slate-500"><FolderTree size={40} className="mx-auto mb-2 opacity-50"/>No categories found</td></tr>
            ) : (
              <CategoryRow categories={categories} handleEdit={handleEdit} handleDelete={handleDelete} searchQuery={searchQuery} />
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-200 bg-gray-50 text-xs text-slate-500 flex justify-between items-center">
         <span>Soft Delete Enabled</span>
         <span>Drag & Drop Not Implemented (Use Menu Order)</span>
      </div>
    </div>
  );
}