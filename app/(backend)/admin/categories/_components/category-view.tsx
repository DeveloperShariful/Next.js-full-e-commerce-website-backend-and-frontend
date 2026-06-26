// File: app/(backend)/admin/categories/_components/category-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CategoryData } from "../types";

import {
  getCategories,
  deleteCategory,
  restoreCategory,
  forceDeleteCategory,
  updateCategoryOrder,
} from "@/app/actions/backend/product/product-category";

import CategoryHeader from "./header";
import CategoryList from "./category-list";
import CategoryForm from "./category-form";

export default function CategoryView() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  // Always active categories for parent dropdowns in forms
  const [activeCategories, setActiveCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingCat, setEditingCat] = useState<Partial<CategoryData> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentFilter, setCurrentFilter] = useState<"active" | "trash">("active");
  const [counts, setCounts] = useState({ active: 0, trash: 0, all: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [filteredRes, activeRes] = await Promise.all([
        getCategories(currentFilter),
        // Always fetch active categories for the parent dropdown in forms
        currentFilter === "trash" ? getCategories("active") : Promise.resolve(null),
      ]);

      if (filteredRes.success) {
        setCategories(buildTree(filteredRes.data));
        setCounts(filteredRes.counts);
      }
      if (activeRes?.success) {
        setActiveCategories(buildTree(activeRes.data));
      } else if (currentFilter === "active" && filteredRes.success) {
        setActiveCategories(buildTree(filteredRes.data));
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildTree = (items: CategoryData[], parentId: string | null = null): CategoryData[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .sort((a, b) => a.menuOrder - b.menuOrder)
      .map((item) => ({
        ...item,
        children: buildTree(items, item.id),
      }));
  };

  const handleEdit = (cat: CategoryData) => {
    setEditingCat(cat);
    setViewMode("form"); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // --- INDIVIDUAL ACTIONS ---
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

  const handleRestore = async (id: string) => {
    const toastId = toast.loading("Restoring...");
    try {
      const res = await restoreCategory(id);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        fetchData();
      } else toast.error(res.error as string, { id: toastId });
    } catch (error) {
      toast.error("Error restoring category", { id: toastId });
    }
  };

  const handleForceDelete = async (id: string) => {
    if (!confirm("You are about to permanently delete this item from your site. This action cannot be undone. \n\n'Cancel' to stop, 'OK' to delete.")) return;
    const toastId = toast.loading("Deleting permanently...");
    try {
      const res = await forceDeleteCategory(id);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        fetchData();
      } else toast.error(res.error as string, { id: toastId });
    } catch (error) {
      toast.error("Error permanently deleting category", { id: toastId });
    }
  };

  // --- BULK ACTIONS ---
  const handleBulkAction = async (ids: string[], action: "delete" | "restore" | "force_delete") => {
    if (action === "force_delete" && !confirm(`You are about to permanently delete ${ids.length} items. This action cannot be undone.`)) return false;
    
    const toastId = toast.loading(`Processing bulk ${action}...`);
    let successCount = 0;
    let errorCount = 0;

    for (const id of ids) {
      try {
        let res;
        if (action === "delete") res = await deleteCategory(id);
        else if (action === "restore") res = await restoreCategory(id);
        else res = await forceDeleteCategory(id);

        if (res.success) successCount++;
        else errorCount++;
      } catch (error) {
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} items processed successfully.`, { id: toastId });
      fetchData();
    }
    if (errorCount > 0) {
      toast.error(`Failed to process ${errorCount} items.`);
    }

    return true; 
  };

  const handleReorder = async (items: { id: string; menuOrder: number }[]) => {
    const res = await updateCategoryOrder(items);
    if (res.success) {
      fetchData();
    } else {
      toast.error("Failed to save order.");
    }
  };

  const resetForm = () => {
    setEditingCat(null);
    setViewMode("list");
    fetchData();
  };

  return (
    <div className="font-sans text-[#3c434a] max-w-full">
      
      {editingCat ? (
        <div className="animate-in fade-in duration-300">
          <div className="mb-6 flex items-center gap-4">
            <h1 className="text-[23px] font-normal text-[#1d2327]">Edit category</h1>
            <button 
              onClick={resetForm} 
              className="px-2.5 py-1 text-[13px] border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#2271b1] hover:text-white rounded-[3px] transition-colors shadow-sm"
            >
              Back to Categories
            </button>
          </div>
          
          <div className="max-w-3xl bg-transparent">
            <CategoryForm
              initialData={editingCat}
              categories={activeCategories}
              onSuccess={resetForm}
              isEditing={true}
            />
          </div>
        </div>
      ) : (
        <>
          <CategoryHeader 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            resetForm={resetForm} 
            loading={loading}
            fetchData={fetchData}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <div className="flex flex-col lg:flex-row items-start mt-4 lg:gap-8">
            
            {/* Left Column (Add Form) */}
            <div className={`w-full lg:w-[32%] xl:w-[28%] shrink-0 ${viewMode === "list" ? "hidden lg:block" : "block"}`}>
              <CategoryForm
                initialData={{}}
                categories={activeCategories}
                onSuccess={resetForm}
                isEditing={false}
              />
            </div>

            {/* Right Column (Category List) */}
            <div className={`flex-1 w-full overflow-hidden ${viewMode === "form" ? "hidden lg:block" : "block"}`}>
              <CategoryList
                categories={categories}
                loading={loading}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleRestore={handleRestore}
                handleForceDelete={handleForceDelete}
                handleBulkAction={handleBulkAction}
                handleReorder={handleReorder}
                searchQuery={searchQuery}
                currentFilter={currentFilter}
                setCurrentFilter={setCurrentFilter}
                counts={counts}
              />
            </div>

          </div>
        </>
      )}
    </div>
  );
}