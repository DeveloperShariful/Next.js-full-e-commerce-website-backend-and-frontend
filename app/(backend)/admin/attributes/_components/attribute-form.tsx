// app/admin/attributes/_components/attribute-form.tsx

"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { AttributeData } from "../types";
import { toast } from "sonner";
import { Loader2, X, Plus, GripVertical } from "lucide-react";

import { createAttribute, updateAttribute, AttributeState } from "@/app/actions/backend/attribute/attribute";

interface FormProps {
  initialData: Partial<AttributeData>;
  onSuccess: () => void;
  isEditing: boolean;
}

export function AttributeForm({ initialData, onSuccess, isEditing }: FormProps) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const termInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    id: initialData.id || "",
    name: initialData.name || "",
    slug: initialData.slug || "",
    type: (initialData.type || "TEXT") as "TEXT" | "COLOR" | "BUTTON",
  });

  const [terms, setTerms] = useState<string[]>(initialData.values || []);
  const [termInput, setTermInput] = useState("");
  const [colorInput, setColorInput] = useState("#000000");
  const [draggedTerm, setDraggedTerm] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      id: initialData.id || "",
      name: initialData.name || "",
      slug: initialData.slug || "",
      type: (initialData.type || "TEXT") as "TEXT" | "COLOR" | "BUTTON",
    });
    setTerms(initialData.values || []);
    setTermInput("");
    setErrors({});
  }, [initialData]);

  const addTerm = () => {
    const value = formData.type === "COLOR" ? colorInput.trim() : termInput.trim();
    if (!value) return;
    if (terms.includes(value)) {
      toast.error("Term already exists.");
      return;
    }
    setTerms(prev => [...prev, value]);
    setTermInput("");
  };

  const removeTerm = (term: string) => {
    setTerms(prev => prev.filter(t => t !== term));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addTerm(); }
    if (e.key === "Backspace" && termInput === "" && terms.length > 0) {
      setTerms(prev => prev.slice(0, -1));
    }
  };

  const isValidHex = (v: string) => /^#[0-9A-Fa-f]{3,8}$/.test(v);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (terms.length === 0) {
      setErrors({ values: ["Add at least one term."] });
      termInputRef.current?.focus();
      return;
    }

    const toastId = toast.loading(isEditing ? "Updating..." : "Creating...");
    const payload = new FormData();

    if (isEditing) payload.append("id", formData.id);
    payload.append("name", formData.name);
    payload.append("slug", formData.slug);
    payload.append("type", formData.type);
    payload.append("values", terms.join(", "));

    startTransition(async () => {
      const res: AttributeState = isEditing
        ? await updateAttribute(payload)
        : await createAttribute(payload);

      if (res.success) {
        toast.success(res.message || "Operation successful!", { id: toastId });
        if (!isEditing) {
          setFormData({ id: "", name: "", slug: "", type: "TEXT" });
          setTerms([]);
          setTermInput("");
        }
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
    <div className="bg-transparent pr-0 lg:pr-4 animate-in fade-in duration-300">
      <h2 className="text-[18px] font-normal text-[#1d2327] mb-4">
        {isEditing ? "Edit attribute" : "Add new attribute"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Name */}
        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-2 py-[5px] bg-white border rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] outline-none transition-shadow ${errors.name ? "border-[#d63638] focus:ring-1 focus:ring-[#d63638]" : "border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"}`}
          />
          {errors.name && <p className="text-[12px] text-[#d63638] mt-1">{errors.name[0]}</p>}
          <p className="text-[13px] text-[#646970] mt-1.5">Name for the attribute (shown on the front-end).</p>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className={`w-full px-2 py-[5px] bg-white border rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] outline-none transition-shadow ${errors.slug ? "border-[#d63638] focus:ring-1 focus:ring-[#d63638]" : "border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"}`}
          />
          {errors.slug && <p className="text-[12px] text-[#d63638] mt-1">{errors.slug[0]}</p>}
          <p className="text-[13px] text-[#646970] mt-1.5">Unique slug; must be no more than 28 characters.</p>
        </div>

        {/* Type */}
        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as "TEXT" | "COLOR" | "BUTTON" })}
            className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[14px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
          >
            <option value="TEXT">Text / Label</option>
            <option value="COLOR">Color</option>
            <option value="BUTTON">Button / Image</option>
          </select>
          <p className="text-[13px] text-[#646970] mt-1.5">Determines how this attribute&apos;s values are displayed.</p>
        </div>

        {/* Terms / Values — individual manager */}
        <div>
          <label className="block text-[14px] text-[#2c3338] mb-1">
            Terms / Values
            <span className="text-[12px] text-[#8c8f94] font-normal ml-1">({terms.length})</span>
          </label>

          {/* Existing terms as chips */}
          {terms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 border border-[#c3c4c7] rounded-[3px] bg-[#f6f7f7] mb-2 min-h-[38px]">
              {terms.map((term) => (
                <span
                  key={term}
                  draggable
                  onDragStart={() => setDraggedTerm(term)}
                  onDragEnd={() => setDraggedTerm(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!draggedTerm || draggedTerm === term) return;
                    setTerms(prev => {
                      const next = [...prev];
                      const fromIdx = next.indexOf(draggedTerm);
                      const toIdx = next.indexOf(term);
                      next.splice(fromIdx, 1);
                      next.splice(toIdx, 0, draggedTerm);
                      return next;
                    });
                  }}
                  className={`inline-flex items-center gap-1 pl-1 pr-1 py-0.5 bg-white border border-[#c3c4c7] rounded-[3px] text-[12px] text-[#3c434a] shadow-sm cursor-grab active:cursor-grabbing select-none
                    ${draggedTerm === term ? "opacity-40" : ""}`}
                >
                  <GripVertical size={10} className="text-[#c3c4c7] shrink-0" />
                  {formData.type === "COLOR" && (
                    <span
                      className="w-3 h-3 rounded-[2px] border border-[#c3c4c7] shrink-0"
                      style={{ backgroundColor: term }}
                    />
                  )}
                  {term}
                  <button
                    type="button"
                    onClick={() => removeTerm(term)}
                    className="ml-0.5 text-[#8c8f94] hover:text-[#d63638] transition-colors"
                    title="Remove"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add new term */}
          {formData.type === "COLOR" ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                className="w-9 h-8 rounded-[3px] border border-[#8c8f94] cursor-pointer p-0.5 bg-white"
                title="Pick color"
              />
              <input
                ref={termInputRef}
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="#hex or color name"
                className="flex-1 px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTerm(); } }}
              />
              <button
                type="button"
                onClick={addTerm}
                className="px-2.5 py-[5px] bg-[#f6f7f7] border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] hover:bg-[#f0f0f1] flex items-center gap-1 transition-colors"
              >
                <Plus size={13} /> Add
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={termInputRef}
                type="text"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={formData.type === "BUTTON" ? "e.g. XS, S, M, L, XL" : "e.g. Small, Medium, Large"}
                className="flex-1 px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
              />
              <button
                type="button"
                onClick={addTerm}
                className="px-2.5 py-[5px] bg-[#f6f7f7] border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] hover:bg-[#f0f0f1] flex items-center gap-1 transition-colors"
              >
                <Plus size={13} /> Add
              </button>
            </div>
          )}

          {errors.values && <p className="text-[12px] text-[#d63638] mt-1">{errors.values[0]}</p>}
          <p className="text-[13px] text-[#646970] mt-1.5">
            {formData.type === "COLOR"
              ? "Add hex codes (e.g. #FF0000) or CSS color names."
              : "Type a value and press Enter or click Add. Backspace removes the last term."}
          </p>
        </div>

        {/* Submit */}
        <div className="pt-4 flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-[#2271b1] text-white text-[13px] font-normal rounded-[3px] border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] transition-colors disabled:opacity-70 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isPending && <Loader2 className="animate-spin" size={14} />}
            {isEditing ? "Update attribute" : "Add attribute"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onSuccess}
              className="px-3 py-1.5 text-[#d63638] text-[13px] hover:underline"
            >
              Cancel
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
