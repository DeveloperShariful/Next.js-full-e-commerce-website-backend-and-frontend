// app/admin/attributes/page.tsx

"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { 
  getAttributes, 
  createAttribute, 
  updateAttribute, 
  deleteAttribute,
  type AttributeState // অ্যাকশন ফাইল থেকে টাইপ ইমপোর্ট
} from "@/app/actions/attribute";
import { toast } from "react-hot-toast";
import { 
  Search, Save, X, RefreshCcw, Loader2, 
  Layers, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle 
} from "lucide-react";

// --- TYPES ---
interface AttributeData {
  id: string;
  name: string;
  slug: string;
  type?: "TEXT" | "COLOR" | "BUTTON"; // নতুন টাইপ ফিল্ড
  count: number;
  values: string[];
}

export default function AttributesPage() {
  // --- STATE MANAGEMENT ---
  const [attributes, setAttributes] = useState<AttributeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition(); // Server Action state handling
  
  // Pagination & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({}); // ফিল্ড স্পেসিফিক এরর
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "TEXT",
    values: "", // Comma separated string
  });

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Debounce logic could be added here for search
      const res = await getAttributes(searchQuery, currentPage, itemsPerPage);
      if (res.success && res.data) {
        setAttributes(res.data as unknown as AttributeData[]);
        if (res.meta) {
          setTotalPages(res.meta.totalPages);
        }
      } else {
        toast.error(res.message || "Failed to load attributes");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500); // 500ms debounce for search
    return () => clearTimeout(timer);
  }, [fetchData]);

  // --- HANDLERS ---
  const resetForm = () => {
    setFormData({ name: "", slug: "", type: "TEXT", values: "" });
    setEditingId(null);
    setFormErrors({});
  };

  const handleEdit = (attr: AttributeData) => {
    setEditingId(attr.id);
    setFormErrors({});
    setFormData({
      name: attr.name,
      slug: attr.slug,
      type: attr.type || "TEXT",
      values: attr.values.join(", ") 
    });
    // Scroll to form on mobile/tablet
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    const toastId = toast.loading("Deleting...");
    try {
      const res = await deleteAttribute(id);
      if (res.success) {
        toast.success(res.message || "Deleted successfully", { id: toastId });
        fetchData(); // Refresh list
        if (editingId === id) resetForm(); // If currently editing, reset form
      } else {
        toast.error(res.message || "Delete failed", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side basic validation
    if (!formData.name.trim()) {
      setFormErrors({ name: ["Name is required"] });
      return;
    }

    const toastId = toast.loading(editingId ? "Updating..." : "Creating...");

    const payload = new FormData();
    if (editingId) payload.append("id", editingId);
    payload.append("name", formData.name);
    payload.append("slug", formData.slug);
    payload.append("type", formData.type);
    payload.append("values", formData.values);

    startTransition(async () => {
      try {
        const res: AttributeState = editingId 
          ? await updateAttribute(null, payload) 
          : await createAttribute(null, payload);

        if (res.success) {
          toast.success(res.message || "Success!", { id: toastId });
          resetForm();
          fetchData();
        } else {
          toast.dismiss(toastId);
          if (res.errors) {
            setFormErrors(res.errors); // Show validation errors under fields
            toast.error("Please fix the errors in the form.");
          } else {
            toast.error(res.message || "Operation failed");
          }
        }
      } catch (error) {
        toast.error("Unexpected error occurred", { id: toastId });
      }
    });
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-blue-600" /> Attributes
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage global product attributes like Size, Color, Material.</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition disabled:opacity-50"
        >
           <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> 
           {loading ? "Syncing..." : "Sync Attributes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
               <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                 {editingId ? "Edit Attribute" : "Add New Attribute"}
               </h3>
               {editingId && (
                 <button onClick={resetForm} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition flex items-center gap-1">
                   <X size={14}/> Cancel
                 </button>
               )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition ${formErrors.name ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-blue-500"}`}
                  placeholder="e.g. Color"
                />
                {formErrors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> {formErrors.name[0]}</p>}
                <p className="text-[11px] text-slate-400">Name of the attribute (shown in frontend).</p>
              </div>
              
              {/* Slug Input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Slug</label>
                <input 
                  type="text" 
                  value={formData.slug} 
                  onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. color"
                />
                {formErrors.slug && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> {formErrors.slug[0]}</p>}
                <p className="text-[11px] text-slate-400">Unique identifier (auto-generated if empty).</p>
              </div>

              {/* Type Select (New Feature) */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Type</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})} 
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="TEXT">Text / Label</option>
                  <option value="COLOR">Color</option>
                  <option value="BUTTON">Button / Image</option>
                </select>
                <p className="text-[11px] text-slate-400">How this attribute will be displayed on product page.</p>
              </div>

              {/* Values Textarea */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Values (Terms) <span className="text-red-500">*</span></label>
                <textarea 
                  rows={5}
                  value={formData.values}
                  onChange={(e) => setFormData({...formData, values: e.target.value})}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition resize-none ${formErrors.values ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-blue-500"}`}
                  placeholder="Red, Blue, Green"
                />
                {formErrors.values && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> {formErrors.values[0]}</p>}
                <p className="text-[11px] text-slate-500 leading-tight">
                  Separate terms with commas (e.g. <span className="font-mono bg-slate-100 px-1">S, M, L, XL</span>).
                </p>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isPending} 
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
              >
                {isPending ? (<> <Loader2 className="animate-spin" size={18}/> Saving... </>) : (<> <Save size={18}/> {editingId ? "Update Attribute" : "Add Attribute"} </>)}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: LIST TABLE */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or slug..." 
                  value={searchQuery} 
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
                />
             </div>
             <div className="text-sm text-slate-500">
               Page <b>{currentPage}</b> of <b>{totalPages}</b>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                  <tr>
                    <th className="p-4 w-1/4">Name</th>
                    <th className="p-4 w-1/5">Slug</th>
                    <th className="p-4 w-1/6">Type</th>
                    <th className="p-4">Terms</th>
                    <th className="p-4 text-center">In Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center"><div className="flex flex-col justify-center items-center gap-3 text-slate-500"><Loader2 className="animate-spin text-blue-500" size={32} /> <span className="font-medium">Loading data...</span></div></td></tr>
                  ) : attributes.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><Layers size={48} className="mb-4 opacity-50"/><p className="text-lg font-medium text-slate-600">No attributes found</p><p className="text-sm">Create your first attribute from the left panel.</p></div></td></tr>
                  ) : (
                    attributes.map((attr) => (
                      <tr key={attr.id} className="hover:bg-blue-50/30 transition group border-b border-slate-100 last:border-0 align-top">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-base mb-1">{attr.name}</div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-2 group-hover:translate-y-0">
                            <button onClick={() => handleEdit(attr)} className="text-blue-600 hover:underline font-bold">Edit</button>
                            <span className="text-slate-300">|</span>
                            <button onClick={() => handleDelete(attr.id, attr.name)} className="text-red-600 hover:underline font-bold">Delete</button>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-500">{attr.slug}</td>
                        <td className="p-4">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${attr.type === 'COLOR' ? 'bg-purple-50 text-purple-600 border-purple-100' : attr.type === 'BUTTON' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                             {attr.type || "TEXT"}
                           </span>
                        </td>
                        <td className="p-4">
                           <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {attr.values && attr.values.length > 0 ? (
                                attr.values.slice(0, 8).map((val, vIdx) => (
                                 <span key={vIdx} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs text-slate-600 shadow-sm">{val}</span>
                                ))
                              ) : <span className="text-slate-400 text-xs italic">No terms</span>}
                              {attr.values && attr.values.length > 8 && <span className="text-xs text-slate-400 font-medium">+{attr.values.length - 8} more</span>}
                           </div>
                        </td>
                        <td className="p-4 text-center">
                           {attr.count > 0 ? (
                             <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold border border-green-100">
                               <CheckCircle size={10}/> {attr.count} products
                             </span>
                           ) : (
                             <span className="text-slate-400 text-xs">-</span>
                           )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-gray-50 flex items-center justify-end gap-2">
                 <button 
                   onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                   disabled={currentPage === 1}
                   className="p-2 bg-white border border-slate-300 rounded hover:bg-gray-100 disabled:opacity-50 transition"
                 >
                   <ChevronLeft size={16}/>
                 </button>
                 <span className="text-sm font-medium text-slate-600">Page {currentPage} of {totalPages}</span>
                 <button 
                   onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                   disabled={currentPage === totalPages}
                   className="p-2 bg-white border border-slate-300 rounded hover:bg-gray-100 disabled:opacity-50 transition"
                 >
                   <ChevronRight size={16}/>
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}