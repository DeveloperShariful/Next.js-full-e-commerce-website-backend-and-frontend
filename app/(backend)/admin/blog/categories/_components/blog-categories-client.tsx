"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
} from "@/app/actions/backend/blog/blog-actions";
import { BackButton } from "@/app/(backend)/admin/_components/back-button";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  color: string | null;
  isActive: boolean;
  menuOrder: number;
  metaTitle: string | null;
  metaDesc: string | null;
  _count: { posts: number };
}

const COLORS = [
  { hex: "#2271b1", label: "Blue" },
  { hex: "#e63946", label: "Red" },
  { hex: "#2a9d8f", label: "Teal" },
  { hex: "#e9c46a", label: "Yellow" },
  { hex: "#f4a261", label: "Orange" },
  { hex: "#8338ec", label: "Purple" },
  { hex: "#06d6a0", label: "Green" },
  { hex: "#fb5607", label: "Coral" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  color: "",
  isActive: true,
  menuOrder: 0,
  metaTitle: "",
  metaDesc: "",
};

export function BlogCategoriesClient({ categories: initialCategories }: { categories: BlogCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const set = (k: keyof typeof EMPTY_FORM, v: unknown) =>
    setForm((p) => ({ ...p, [k]: v }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setTimeout(() => document.getElementById("cat-name-input")?.focus(), 50);
  };

  const openEdit = (cat: BlogCategory) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      color: cat.color ?? "",
      isActive: cat.isActive,
      menuOrder: cat.menuOrder,
      metaTitle: cat.metaTitle ?? "",
      metaDesc: cat.metaDesc ?? "",
    });
    setShowForm(true);
    setTimeout(() => document.getElementById("cat-name-input")?.focus(), 50);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const res = editingId
      ? await updateBlogCategory(editingId, form)
      : await createBlogCategory(form);
    setSaving(false);
    if (res.success) {
      toast.success(editingId ? "Category updated" : "Category created");
      closeForm();
      window.location.reload();
    } else {
      toast.error(res.error || "Failed");
    }
  };

  const handleDelete = async (id: string, name: string, postCount: number) => {
    if (postCount > 0) {
      return toast.error(`Cannot delete "${name}" — it has ${postCount} post(s). Move posts first.`);
    }
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await deleteBlogCategory(id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Category deleted");
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } else {
      toast.error(res.error || "Failed to delete");
    }
  };

  return (
    <div className="max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">
      <div className="mb-4">
        <BackButton storageKey="blog-return-url" fallbackUrl="/admin/blog" label="Back to posts" />
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-[23px] font-normal text-[#1d2327] m-0 leading-tight">Blog Categories</h1>
        {!showForm && (
          <button
            onClick={openCreate}
            className="px-4 py-2 text-[13px] bg-[#2271b1] text-white rounded hover:bg-[#135e96] font-medium transition-colors"
          >
            + Add New Category
          </button>
        )}
      </div>

      {/* Inline form panel (shows above table) */}
      {showForm && (
        <div className="bg-white border border-[#c3c4c7] rounded mb-5 overflow-hidden">
          {/* Form header */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#f6f7f7] border-b border-[#c3c4c7]">
            <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">
              {editingId ? "Edit Category" : "Add New Category"}
            </h2>
            <button
              onClick={closeForm}
              className="text-[#646970] hover:text-[#1d2327] text-[20px] leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Form body */}
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

              {/* Name */}
              <div>
                <label className="block text-[12px] font-semibold text-[#1d2327] mb-1.5 uppercase tracking-wide">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="cat-name-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="e.g. Electric Bikes"
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1]"
                />
                <p className="text-[11px] text-[#646970] mt-1">
                  The slug will be auto-generated from the name.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12px] font-semibold text-[#1d2327] mb-1.5 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="Short description (optional)"
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] resize-none"
                />
              </div>

              {/* Color + Order + Active */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#1d2327] mb-1.5 uppercase tracking-wide">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        title={c.label}
                        onClick={() => set("color", form.color === c.hex ? "" : c.hex)}
                        className="w-7 h-7 rounded-full border-[3px] transition-all hover:scale-110 focus:outline-none"
                        style={{
                          backgroundColor: c.hex,
                          borderColor: form.color === c.hex ? "#1d2327" : "transparent",
                          boxShadow: form.color === c.hex ? "0 0 0 1px #1d2327" : "none",
                        }}
                      />
                    ))}
                    {form.color && (
                      <button
                        type="button"
                        onClick={() => set("color", "")}
                        className="w-7 h-7 rounded-full border border-[#c3c4c7] bg-white text-[#646970] text-[14px] flex items-center justify-center hover:border-[#1d2327]"
                        title="Clear color"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1d2327] mb-1.5 uppercase tracking-wide">
                      Order
                    </label>
                    <input
                      type="number"
                      value={form.menuOrder}
                      onChange={(e) => set("menuOrder", Number(e.target.value))}
                      className="w-20 px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1]"
                    />
                  </div>
                  <div className="pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => set("isActive", e.target.checked)}
                        className="w-4 h-4 rounded border-[#c3c4c7]"
                      />
                      <span className="text-[13px] font-medium text-[#1d2327]">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Meta Title */}
              <div>
                <label className="block text-[12px] font-semibold text-[#1d2327] mb-1.5 uppercase tracking-wide">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={form.metaTitle}
                  onChange={(e) => set("metaTitle", e.target.value)}
                  placeholder="SEO title..."
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1]"
                />
              </div>

              {/* Meta Desc */}
              <div className="md:col-span-2">
                <label className="block text-[12px] font-semibold text-[#1d2327] mb-1.5 uppercase tracking-wide">
                  Meta Description
                </label>
                <textarea
                  value={form.metaDesc}
                  onChange={(e) => set("metaDesc", e.target.value)}
                  rows={2}
                  placeholder="SEO description..."
                  className="w-full px-3 py-2 text-[13px] border border-[#c3c4c7] rounded focus:outline-none focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] resize-none"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#f0f0f1]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-[13px] bg-[#2271b1] text-white rounded hover:bg-[#135e96] disabled:opacity-50 font-medium transition-colors"
              >
                {saving ? "Saving..." : editingId ? "Update Category" : "Add Category"}
              </button>
              <button
                onClick={closeForm}
                className="px-4 py-2 text-[13px] border border-[#c3c4c7] bg-white text-[#646970] rounded hover:bg-[#f6f7f7] hover:text-[#1d2327] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories table */}
      <div className="bg-white border border-[#c3c4c7] rounded overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-[#646970] text-[14px] mb-3">No categories yet.</p>
            <button
              onClick={openCreate}
              className="px-4 py-2 text-[13px] bg-[#2271b1] text-white rounded hover:bg-[#135e96]"
            >
              + Add First Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* table-auto: browser distributes remaining space to Name column naturally */}
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                  {/* Name + Slug share remaining space equally */}
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327] w-30">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327] hidden sm:table-cell w-20">Slug</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327]" style={{ width: 70 }}>Posts</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327] hidden sm:table-cell" style={{ width: 70 }}>Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1d2327]" style={{ width: 100 }}>Status</th>
                  <th className="px-4 py-3 hidden sm:table-cell" style={{ width: 130 }}></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7] align-middle">

                    {/* Name */}
                    <td className="px-4 py-3 w-1/2">
                      <div className="flex items-center gap-2 min-w-0">
                        {cat.color ? (
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10 shadow-sm"
                            style={{ backgroundColor: cat.color }}
                          />
                        ) : (
                          <span className="w-3 h-3 rounded-full flex-shrink-0 bg-[#c3c4c7]" />
                        )}
                        <span className="font-semibold text-[#1d2327] truncate">{cat.name}</span>
                      </div>
                      {/* Row actions — mobile only */}
                      <div className="flex items-center gap-2 mt-1 sm:hidden">
                        <button
                          onClick={() => openEdit(cat)}
                          className="text-[#2271b1] hover:underline text-[12px] font-medium"
                        >
                          Edit
                        </button>
                        <span className="text-[#c3c4c7]">|</span>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name, cat._count.posts)}
                          disabled={deletingId === cat.id}
                          className="text-red-500 hover:text-red-700 text-[12px] disabled:opacity-50"
                        >
                          {deletingId === cat.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3 hidden sm:table-cell w-1/2">
                      <span className="text-[#646970] font-mono text-[12px] bg-[#f6f7f7] px-1.5 py-0.5 rounded border border-[#f0f0f1] block truncate">
                        {cat.slug}
                      </span>
                    </td>

                    {/* Posts — fixed 70px */}
                    <td className="px-4 py-3" style={{ width: 70 }}>
                      <span className="font-semibold text-[#1d2327]">{cat._count.posts}</span>
                    </td>

                    {/* Order — fixed 70px */}
                    <td className="px-4 py-3 hidden sm:table-cell text-[#646970]" style={{ width: 70 }}>
                      {cat.menuOrder}
                    </td>

                    {/* Status — fixed 100px */}
                    <td className="px-4 py-3" style={{ width: 100 }}>
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${
                        cat.isActive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions — fixed 130px, desktop only */}
                    <td className="px-4 py-3 hidden sm:table-cell" style={{ width: 130 }}>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(cat)}
                          className="text-[#2271b1] hover:text-[#135e96] hover:underline text-[12px] font-medium"
                        >
                          Edit
                        </button>
                        <span className="text-[#c3c4c7] text-[11px]">|</span>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name, cat._count.posts)}
                          disabled={deletingId === cat.id}
                          className="text-red-500 hover:text-red-700 text-[12px] disabled:opacity-50"
                        >
                          {deletingId === cat.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom add button */}
      {categories.length > 0 && !showForm && (
        <div className="mt-4">
          <button
            onClick={openCreate}
            className="text-[13px] text-[#2271b1] hover:underline font-medium"
          >
            + Add New Category
          </button>
        </div>
      )}
    </div>
  );
}
