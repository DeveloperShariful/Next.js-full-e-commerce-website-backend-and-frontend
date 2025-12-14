"use client";
import { Attribute, Variation } from "../types";

export const AttributeTab = ({ attributes, setAttributes, addAttribute }: any) => (
  <div className="space-y-4 animate-in fade-in">
    <div className="flex justify-between border-b border-gray-200 pb-2">
      <select className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"><option>Custom product attribute</option></select>
      <button type="button" onClick={addAttribute} className="bg-[#f0f0f1] border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-200 text-[#2271b1] font-medium">Add</button>
    </div>
    {attributes.map((attr: Attribute, idx: number) => (
      <div key={attr.id} className="border border-gray-300 rounded p-3 bg-white">
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className="font-bold text-gray-700">Name</div>
          <div className="col-span-2 font-bold text-gray-700">Value(s)</div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input value={attr.name} onChange={(e) => {const n=[...attributes]; n[idx].name=e.target.value; setAttributes(n)}} className="border border-gray-300 rounded px-2 py-1 focus:border-[#2271b1] outline-none" placeholder="e.g. Color" />
          <textarea value={attr.values.join(" | ")} onChange={(e) => {const n=[...attributes]; n[idx].values=e.target.value.split("|").map((s: string)=>s.trim()); setAttributes(n)}} className="col-span-2 border border-gray-300 rounded px-2 py-1 focus:border-[#2271b1] outline-none" placeholder="Values separated by |" />
        </div>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-1 text-gray-600"><input type="checkbox" checked={attr.visible} onChange={() => {const n=[...attributes]; n[idx].visible=!n[idx].visible; setAttributes(n)}} /> Visible on product page</label>
          <label className="flex items-center gap-1 text-gray-600"><input type="checkbox" checked={attr.variation} onChange={() => {const n=[...attributes]; n[idx].variation=!n[idx].variation; setAttributes(n)}} /> Used for variations</label>
          <button type="button" onClick={() => setAttributes(attributes.filter((a: Attribute) => a.id !== attr.id))} className="text-[#a00] hover:underline ml-auto">Remove</button>
        </div>
      </div>
    ))}
  </div>
);

export const VariationTab = ({ variations, setVariations, generateVariations }: any) => (
  <div className="space-y-4 animate-in fade-in">
    <div className="flex gap-2">
      <select className="border border-gray-300 rounded px-3 py-1.5 flex-1 bg-white text-sm"><option>Add variation</option><option>Create variations from all attributes</option></select>
      <button type="button" onClick={generateVariations} className="bg-[#f0f0f1] border border-gray-300 px-3 py-1.5 rounded text-[#2271b1] font-medium hover:bg-gray-200">Go</button>
    </div>
    {variations.map((v: Variation, i: number) => (
      <div key={v.id} className="border border-gray-300 rounded p-3 bg-white mb-2">
        <div className="font-bold mb-2 flex justify-between text-gray-700">
          <span>#{i+1} - {v.name}</span>
          <button type="button" onClick={() => setVariations(variations.filter((varItem: Variation) => varItem.id !== v.id))} className="text-[#a00] text-xs underline">Remove</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input value={v.sku} placeholder="SKU" className="border border-gray-300 px-2 py-1 rounded focus:border-[#2271b1] outline-none" />
          <input value={v.price} type="number" placeholder="Price" className="border border-gray-300 px-2 py-1 rounded focus:border-[#2271b1] outline-none" />
          <input value={v.stock} type="number" placeholder="Stock" className="border border-gray-300 px-2 py-1 rounded focus:border-[#2271b1] outline-none" />
        </div>
      </div>
    ))}
  </div>
);