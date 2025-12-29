// File: app/(admin)/admin/categories/_components/category-view.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { CategoryData } from "../types";

// Importing from the 4 specific files
import { getCategories } from "@/app/actions/admin/categories/fetch";
import { deleteCategory } from "@/app/actions/admin/categories/delete";

import CategoryHeader from "../_components/header";
import CategoryList from "../_components/category-list";
import CategoryForm from "../_components/category-form";

export default function CategoryView() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingCat, setEditingCat] = useState<Partial<CategoryData> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      if (res.success) {
        setCategories(buildTree(res.data));
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recursively build tree structure for the table
  const buildTree = (items: CategoryData[], parentId: string | null = null): CategoryData[] => {
    return items
      .filter((item) => item.parentId === parentId)
      // Sort by menuOrder locally as well just in case
      .sort((a, b) => a.menuOrder - b.menuOrder)
      .map((item) => ({
        ...item,
        children: buildTree(items, item.id),
      }));
  };

  const handleEdit = (cat: CategoryData) => {
    setEditingCat(cat);
    setViewMode("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to move this category to trash?")) return;
    const toastId = toast.loading("Processing...");
    try {
      const res = await deleteCategory(id);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        fetchData();
      } else {
        toast.error(res.error as string, { id: toastId });
      }
    } catch (error) {
      toast.error("Error deleting category", { id: toastId });
    }
  };

  const resetForm = () => {
    setEditingCat(null);
    setViewMode("list");
    fetchData(); 
  };

  return (
    <div className="p-5 mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      <CategoryHeader 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        resetForm={resetForm} 
        loading={loading}
        fetchData={fetchData}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {viewMode === "list" ? (
        <CategoryList 
          categories={categories} 
          loading={loading} 
          handleEdit={handleEdit} 
          handleDelete={handleDelete}
          searchQuery={searchQuery}
        />
      ) : (
        <CategoryForm 
          initialData={editingCat || {}} 
          categories={categories}
          onSuccess={resetForm}
          isEditing={!!editingCat}
        />
      )}
    </div>
  );
}