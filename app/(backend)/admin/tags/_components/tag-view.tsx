//app/(backend)/admin/tags/_components/tag-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TagData } from "../types";

// 🚀 Importing from our new unified actions file
import { 
  getTags, 
  deleteTag, 
  restoreTag, 
  forceDeleteTag 
} from "@/app/actions/backend/tags/tag-actions";

import TagHeader from "./header";
import TagList from "./tag-list";
import TagForm from "./tag-form";

export default function TagView() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editingTag, setEditingTag] = useState<Partial<TagData> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // States for Trash filtering and Counts
  const [currentFilter, setCurrentFilter] = useState<"active" | "trash">("active");
  const [counts, setCounts] = useState({ active: 0, trash: 0, all: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTags(currentFilter, searchQuery);
      if (res.success) {
        setTags(res.data);
        setCounts(res.counts); 
      }
    } catch (error) {
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, [currentFilter, searchQuery]); 

  // Adding debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleEdit = (tag: TagData) => {
    setEditingTag(tag);
    setViewMode("form"); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // --- INDIVIDUAL ACTIONS ---
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to move "${name}" to trash?`)) return;
    const toastId = toast.loading("Processing...");
    try {
      const res = await deleteTag(id);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        fetchData();
      } else {
        toast.error(res.error as string, { id: toastId });
      }
    } catch (error) {
      toast.error("Error deleting tag", { id: toastId });
    }
  };

  const handleRestore = async (id: string) => {
    const toastId = toast.loading("Restoring...");
    try {
      const res = await restoreTag(id);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        fetchData();
      } else toast.error(res.error as string, { id: toastId });
    } catch (error) {
      toast.error("Error restoring tag", { id: toastId });
    }
  };

  const handleForceDelete = async (id: string) => {
    if (!confirm("You are about to permanently delete this item from your site. This action cannot be undone. \n\n'Cancel' to stop, 'OK' to delete.")) return;
    const toastId = toast.loading("Deleting permanently...");
    try {
      const res = await forceDeleteTag(id);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        fetchData();
      } else toast.error(res.error as string, { id: toastId });
    } catch (error) {
      toast.error("Error permanently deleting tag", { id: toastId });
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
        if (action === "delete") res = await deleteTag(id);
        else if (action === "restore") res = await restoreTag(id);
        else res = await forceDeleteTag(id);

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
    setEditingTag(null);
    setViewMode("list");
    fetchData(); 
  };

  return (
    <div className="font-sans text-[#3c434a] max-w-full">
      
      {editingTag ? (
        <div className="animate-in fade-in duration-300">
          <div className="mb-6 flex items-center gap-4">
            <h1 className="text-[23px] font-normal text-[#1d2327]">Edit tag</h1>
            <button 
              onClick={resetForm} 
              className="px-2.5 py-1 text-[13px] border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#2271b1] hover:text-white rounded-[3px] transition-colors shadow-sm"
            >
              Back to Tags
            </button>
          </div>
          
          <div className="max-w-3xl bg-transparent">
            <TagForm 
              initialData={editingTag} 
              onSuccess={resetForm}
              isEditing={true}
            />
          </div>
        </div>
      ) : (
        <>
          <TagHeader 
            viewMode={viewMode} 
            setViewMode={setViewMode} 
            resetForm={resetForm} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <div className="flex flex-col lg:flex-row items-start mt-4 lg:gap-8">
            
            {/* Left Column (Add Form) */}
            <div className={`w-full lg:w-[32%] xl:w-[28%] shrink-0 ${viewMode === "list" ? "hidden lg:block" : "block"}`}>
              <TagForm 
                initialData={{}} 
                onSuccess={resetForm}
                isEditing={false}
              />
            </div>

            {/* Right Column (Tag List) */}
            <div className={`flex-1 w-full overflow-hidden ${viewMode === "form" ? "hidden lg:block" : "block"}`}>
              <TagList 
                tags={tags} 
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