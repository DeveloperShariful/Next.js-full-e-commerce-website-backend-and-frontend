// app/admin/attributes/_components/attribute-form.tsx

"use client";

import { useState, useEffect, useTransition } from "react";
import { createAttribute, updateAttribute, AttributeState } from "@/app/actions/admin/attribute";
import { Save, X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

interface AttributeFormProps {
  editingData: any | null;
  onCancelEdit: () => void;
  onSuccess: () => void;
}

export function AttributeForm({ editingData, onCancelEdit, onSuccess }: AttributeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "TEXT",
    values: "",
  });

  useEffect(() => {
    if (editingData) {
      setFormData({
        name: editingData.name,
        slug: editingData.slug,
        type: editingData.type || "TEXT",
        values: editingData.values.join(", ")
      });
      setErrors({});
    } else {
      setFormData({ name: "", slug: "", type: "TEXT", values: "" });
    }
  }, [editingData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: ["Name is required"] });
      return;
    }

    const toastId = toast.loading(editingData ? "Updating..." : "Creating...");
    const payload = new FormData();
    
    if (editingData) payload.append("id", editingData.id);
    payload.append("name", formData.name);
    payload.append("slug", formData.slug);
    payload.append("type", formData.type);
    payload.append("values", formData.values);

    startTransition(async () => {
      const res: AttributeState = editingData 
        ? await updateAttribute(null, payload) 
        : await createAttribute(null, payload);

      if (res.success) {
        toast.success(res.message || "Operation successful!", { id: toastId });
        setFormData({ name: "", slug: "", type: "TEXT", values: "" });
        onSuccess();
      } else {
        toast.dismiss(toastId);
        if (res.errors) {
          setErrors(res.errors);
          toast.error("Please fix form errors");
        } else {
          toast.error(res.message || "Failed");
        }
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
          <h3 className="font-bold text-lg text-slate-800">
            {editingData ? "Edit Attribute" : "Add Attribute"}
          </h3>
          {editingData && (
            <button onClick={onCancelEdit} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition flex items-center gap-1">
              <X size={14}/> Cancel
            </button>
          )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition ${errors.name ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-blue-500"}`}
            placeholder="e.g. Color"
          />
          {errors.name && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> {errors.name[0]}</p>}
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Slug</label>
          <input 
            type="text" 
            value={formData.slug} 
            onChange={(e) => setFormData({...formData, slug: e.target.value})} 
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="e.g. color"
          />
          {errors.slug && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> {errors.slug[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Type</label>
          <select 
            value={formData.type} 
            onChange={(e) => setFormData({...formData, type: e.target.value})} 
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="TEXT">Text / Label</option>
            <option value="COLOR">Color</option>
            <option value="BUTTON">Button / Image</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">Values <span className="text-red-500">*</span></label>
          <textarea 
            rows={5}
            value={formData.values}
            onChange={(e) => setFormData({...formData, values: e.target.value})}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition resize-none ${errors.values ? "border-red-500 focus:ring-red-200" : "border-slate-300 focus:ring-blue-500"}`}
            placeholder="Red, Blue, Green"
          />
          {errors.values && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> {errors.values[0]}</p>}
          <p className="text-[11px] text-slate-500">Comma separated (e.g. S, M, L).</p>
        </div>

        <button 
          type="submit" 
          disabled={isPending} 
          className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
        >
          {isPending ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
          {editingData ? "Update Attribute" : "Add Attribute"}
        </button>
      </form>
    </div>
  );
}