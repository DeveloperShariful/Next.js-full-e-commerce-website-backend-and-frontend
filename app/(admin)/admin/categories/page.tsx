// app/admin/categories/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import ImageUpload from "@/components/ui/image-upload";
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getCategories,
  getCategoryTree
} from "@/app/actions/admin/category";
import { toast } from "react-hot-toast";
import { 
  Search, Plus, Pencil, Trash2, 
  Image as ImageIcon, FolderTree, CheckCircle2, 
  XCircle, Save, Loader2, RefreshCcw,
  ArrowLeft, Globe, LayoutGrid, AlertCircle
} from "lucide-react";

// --- TYPES ---
interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDesc: string | null;
  _count?: { products: number };
  parent?: { name: string };
  children?: CategoryData[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [flatCategories, setFlatCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: "none",
    description: "",
    image: [] as string[],
    metaTitle: "",
    metaDesc: "",
    isActive: true
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, treeRes] = await Promise.all([
        getCategories(),
        getCategoryTree()
      ]);
      
      if (catRes.success) {
        setCategories(buildTree(catRes.data as CategoryData[]));
        setFlatCategories(catRes.data as CategoryData[]);
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

  const buildTree = (items: CategoryData[], parentId: string | null = null): CategoryData[] => {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: buildTree(items, item.id),
      }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      parentId: "none",
      description: "",
      image: [],
      metaTitle: "",
      metaDesc: "",
      isActive: true
    });
    setEditingId(null);
    setViewMode("list");
  };

  const handleEdit = (cat: CategoryData) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId || "none",
      description: cat.description || "",
      image: cat.image ? [cat.image] : [],
      metaTitle: cat.metaTitle || "",
      metaDesc: cat.metaDesc || "",
      isActive: cat.isActive
    });
    setViewMode("form");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const toastId = toast.loading("Deleting...");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading(editingId ? "Updating..." : "Creating...");

    const data = new FormData();
    if (editingId) data.append("id", editingId);
    
    data.append("name", formData.name);
    data.append("slug", formData.slug);
    data.append("parentId", formData.parentId);
    data.append("description", formData.description);
    if (formData.image.length > 0) data.append("image", formData.image[0]);
    data.append("metaTitle", formData.metaTitle);
    data.append("metaDesc", formData.metaDesc);
    data.append("isActive", String(formData.isActive));

    try {
      const res = editingId 
        ? await updateCategory(data)
        : await createCategory(data);

      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        resetForm();
        fetchData();
      } else {
        toast.error(res.error as string, { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ FIX: Return type changed to React.ReactNode[] to fix JSX Namespace Error
  const renderCategoryOptions = (items: CategoryData[], depth = 0): React.ReactNode[] => {
    return items.flatMap((cat) => [
      <option key={cat.id} value={cat.id} disabled={cat.id === editingId}>
        {"\u00A0\u00A0\u00A0\u00A0".repeat(depth)} {depth > 0 ? "↳ " : ""}{cat.name}
      </option>,
      ...(cat.children ? renderCategoryOptions(cat.children, depth + 1) : [])
    ]);
  };

  // ✅ FIX: Return type changed to React.ReactNode[] to fix JSX Namespace Error
  const renderCategoryRows = (items: CategoryData[], depth = 0): React.ReactNode[] => {
    return items.flatMap((cat) => {
      if (searchQuery && !cat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return cat.children ? renderCategoryRows(cat.children, depth) : [];
      }

      return [
        <tr key={cat.id} className="hover:bg-blue-50/30 transition group border-b border-slate-100 last:border-0">
          <td className="p-4 w-10"><input type="checkbox" className="rounded border-slate-300" /></td>
          <td className="p-4 w-20">
            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-slate-200 flex items-center justify-center overflow-hidden">
              {cat.image ? (
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="text-gray-300" size={20} />
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
          <td className="p-4 max-w-xs truncate text-slate-500 text-xs hidden md:table-cell">{cat.description || "—"}</td>
          <td className="p-4 text-center">
            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
              {cat._count?.products || 0}
            </span>
          </td>
          <td className="p-4 text-center">
            {cat.isActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                Hidden
              </span>
            )}
          </td>
          <td className="p-4 text-right">
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"><Trash2 size={16} /></button>
            </div>
          </td>
        </tr>,
        ...(cat.children ? renderCategoryRows(cat.children, depth + 1) : [])
      ];
    });
  };

  return (
    <div className="p-5 mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderTree className="text-blue-600" /> Category Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage hierarchy, images and SEO for categories.</p>
        </div>
        {viewMode === "list" ? (
          <button onClick={() => setViewMode("form")} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            <Plus size={18} /> Add New Category
          </button>
        ) : (
          <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium shadow-sm">
            <ArrowLeft size={18} /> Back to List
          </button>
        )}
      </div>

      {viewMode === "form" ? (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b pb-4">
                   <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><LayoutGrid size={20}/></div>
                   <h3 className="font-bold text-xl text-slate-800">General Information</h3>
                </div>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Category Name <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g. Men's Fashion"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Slug URL</label>
                      <input type="text" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="mens-fashion"/>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Description</label>
                    <textarea rows={6} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" placeholder="Write a description for this category..."/>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b pb-4">
                   <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Globe size={20}/></div>
                   <h3 className="font-bold text-xl text-slate-800">SEO Configuration</h3>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Meta Title</label>
                    <input type="text" value={formData.metaTitle} onChange={(e) => setFormData({...formData, metaTitle: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Title shown in search engines"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Meta Description</label>
                    <textarea rows={3} value={formData.metaDesc} onChange={(e) => setFormData({...formData, metaDesc: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Description shown in search engines"/>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-slate-800">Hierarchy</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Parent Category</label>
                    <select value={formData.parentId} onChange={(e) => setFormData({...formData, parentId: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                      <option value="none">None (Top Level)</option>
                      {renderCategoryOptions(categories)} 
                    </select>
                    <p className="text-xs text-gray-500 leading-relaxed"><AlertCircle size={12} className="inline mr-1"/>Select a parent to nest this category under it.</p>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4 mt-4">
                    <label className="font-bold text-sm text-slate-700">Active Status</label>
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"/>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-slate-800">Thumbnail</h3>
                <ImageUpload value={formData.image} disabled={isSubmitting} onChange={(url) => setFormData({...formData, image: [url]})} onRemove={() => setFormData({...formData, image: []})}/>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
                {isSubmitting ? (<> <Loader2 className="animate-spin" size={20}/> Processing... </>) : (<> <Save size={20}/> {editingId ? "Update Category" : "Save Category"} </>)}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input type="text" placeholder="Search categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all bg-white"/>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition text-slate-700 shadow-sm" onClick={fetchData}>
                 <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Refresh
            </button>
          </div>
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="p-4 w-10"><input type="checkbox" className="rounded border-slate-400" /></th>
                  <th className="p-4 w-24 text-center">Image</th>
                  <th className="p-4">Name & Hierarchy</th>
                  <th className="p-4 hidden md:table-cell">Description</th>
                  <th className="p-4 text-center">Products</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-20 text-center"><div className="flex flex-col justify-center items-center gap-3 text-slate-500"><Loader2 className="animate-spin text-blue-500" size={32} /> <span className="font-medium">Loading category tree...</span></div></td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={7} className="p-20 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><FolderTree size={48} className="mb-4 opacity-50"/><p className="text-lg font-medium text-slate-600">No categories found</p></div></td></tr>
                ) : renderCategoryRows(categories)}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 bg-gray-50 text-xs text-slate-500 flex justify-between items-center">
             <span>Total Categories: <strong>{flatCategories.length}</strong></span>
             <span>Hierarchy Depth: Unlimited</span>
          </div>
        </div>
      )}
    </div>
  );
}