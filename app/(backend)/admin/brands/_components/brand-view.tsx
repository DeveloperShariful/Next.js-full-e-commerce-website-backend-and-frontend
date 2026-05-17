//app/(backend)/admin/brands/_components/brand-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { BrandData } from "../types";

// 🚀 Importing from our new unified actions file
import { 
  getBrands, 
  deleteBrand, 
  restoreBrand, 
  forceDeleteBrand 
} from "@/app/actions/backend/brands/brand-actions";

import BrandHeader from "./header";
import BrandList from "./brand-list";
import BrandForm from "./brand-form";

export default function BrandView() {
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingBrand, setEditingBrand] = useState<Partial<BrandData> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // States for Trash filtering and Counts
  const [currentFilter, setCurrentFilter] = useState<"active" | "trash">("active");
  const [counts, setCounts] = useState({ active: 0, trash: 0, all: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBrands(currentFilter);
      if (res.success) {
        setBrands(res.data);
        setCounts(res.counts); 
      }
    } catch (error) {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, [currentFilter]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (brand: BrandData) => {
    setEditingBrand(brand);
    setViewMode("form"); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // --- INDIVIDUAL ACTIONS ---
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to move this brand to trash?")) return;
    const toastId = toast.loading("Processing...");
    try {
      const res = await deleteBrand(id);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        fetchData();
      } else {
        toast.error(res.error as string, { id: toastId });
      }
    } catch (error) {
      toast.error("Error deleting brand", { id: toastId });
    }
  };

  const handleRestore = async (id: string) => {
    const toastId = toast.loading("Restoring...");
    try {
      const res = await restoreBrand(id);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        fetchData();
      } else toast.error(res.error as string, { id: toastId });
    } catch (error) {
      toast.error("Error restoring brand", { id: toastId });
    }
  };

  const handleForceDelete = async (id: string) => {
    if (!confirm("You are about to permanently delete this item from your site. This action cannot be undone. \n\n'Cancel' to stop, 'OK' to delete.")) return;
    const toastId = toast.loading("Deleting permanently...");
    try {
      const res = await forceDeleteBrand(id);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        fetchData();
      } else toast.error(res.error as string, { id: toastId });
    } catch (error) {
      toast.error("Error permanently deleting brand", { id: toastId });
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
        if (action === "delete") res = await deleteBrand(id);
        else if (action === "restore") res = await restoreBrand(id);
        else res = await forceDeleteBrand(id);

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

  const resetForm = () => {
    setEditingBrand(null);
    setViewMode("list");
    fetchData(); 
  };

  return (
    <div className="font-sans text-[#3c434a] max-w-full">
      
      {editingBrand ? (
        <div className="animate-in fade-in duration-300">
          <div className="mb-6 flex items-center gap-4">
            <h1 className="text-[23px] font-normal text-[#1d2327]">Edit brand</h1>
            <button 
              onClick={resetForm} 
              className="px-2.5 py-1 text-[13px] border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#2271b1] hover:text-white rounded-[3px] transition-colors shadow-sm"
            >
              Back to Brands
            </button>
          </div>
          
          <div className="max-w-3xl bg-transparent">
            <BrandForm 
              initialData={editingBrand} 
              onSuccess={resetForm}
              isEditing={true}
            />
          </div>
        </div>
      ) : (
        <>
          <BrandHeader 
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
              <BrandForm 
                initialData={{}} 
                onSuccess={resetForm}
                isEditing={false}
              />
            </div>

            {/* Right Column (Brand List) */}
            <div className={`flex-1 w-full overflow-hidden ${viewMode === "form" ? "hidden lg:block" : "block"}`}>
              <BrandList 
                brands={brands} 
                loading={loading} 
                handleEdit={handleEdit} 
                handleDelete={handleDelete}
                handleRestore={handleRestore} 
                handleForceDelete={handleForceDelete} 
                handleBulkAction={handleBulkAction} 
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