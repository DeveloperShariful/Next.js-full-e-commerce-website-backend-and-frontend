// app/admin/products/create/_components/FaqBox.tsx
// 🚀 Product FAQ — blog post-এর FAQ editor-এর সাথে হুবহু একই UX (dynamic "+
// Add Question", Markdown সাপোর্ট করা answer), শুধু react-hook-form-এর
// useFieldArray দিয়ে (blog-এ plain useState ছিল, product form-এ সব field
// এমনিতেই react-hook-form দিয়ে চলে)। এই product-এর নিজস্ব FAQ ফাঁকা রাখলে,
// live সাইটে site-wide "Default Product FAQs" (Settings → General) দেখাবে।
"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { HelpCircle, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { ProductFormData } from "../types";

export default function FaqBox() {
  const { register, control, watch } = useFormContext<ProductFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: "faqs" });

  const [isExpanded, setIsExpanded] = useState(false);
  const faqs = watch("faqs") || [];

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px] mt-5">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
      >
        <HelpCircle size={15} className="text-[#8c8f94]" />
        <span className="font-semibold text-[#1d2327] text-[14px]">FAQ</span>
        <span className="text-[11px] text-[#646970] bg-[#f0f0f1] px-2 py-0.5 rounded">
          {faqs.length} question{faqs.length !== 1 ? "s" : ""}
        </span>
        {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94] ml-auto" /> : <ChevronDown size={16} className="text-[#8c8f94] ml-auto" />}
      </div>

      {isExpanded && (
      <div className="p-4 space-y-3">
        <p className="text-[11px] text-[#646970]">
          Shown as a visible &quot;Frequently Asked Questions&quot; section on the product page, and included as
          FAQPage structured data. Answers support <strong>Markdown</strong> — <code>**bold**</code>,{" "}
          <code>[link text](https://...)</code>, and blank lines between paragraphs. Leave empty to use the
          site-wide default FAQ (Settings → General).
        </p>

        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={field.id} className="border border-[#c3c4c7] rounded-[3px] p-3 space-y-2 bg-[#f9f9f9]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#646970] uppercase tracking-wide">
                  Question {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-[12px] text-[#d63638] hover:text-[#a02222] font-semibold flex items-center gap-1"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
              <input
                type="text"
                {...register(`faqs.${i}.question`)}
                placeholder="e.g. What age is this bike suitable for?"
                className="w-full px-3 py-2 text-[13px] border border-[#8c8f94] rounded-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] bg-white"
              />
              <textarea
                {...register(`faqs.${i}.answer`)}
                rows={4}
                placeholder={"Answer text — Markdown supported, e.g.\nYes, the **GoBike 16\"** is built for ages 5-9. See our [size guide](/blog/what-age-for-electric-balance-bike) for details."}
                className="w-full px-3 py-2 text-[13px] border border-[#8c8f94] rounded-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] bg-white resize-y font-mono"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => append({ question: "", answer: "" })}
          className="w-full px-3 py-2 text-[13px] font-semibold border border-dashed border-[#2271b1] text-[#2271b1] rounded-[3px] hover:bg-[#f0f8ff]"
        >
          + Add Question
        </button>
      </div>
      )}
    </div>
  );
}
