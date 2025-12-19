// app/admin/products/create/_components/shipping-tax.tsx

"use client";

interface ShippingTaxProps {
  formData: any;
  setFormData: (data: any) => void;
}

export function ShippingTax({ formData, setFormData }: ShippingTaxProps) {
  
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      <h3 className="font-bold text-lg text-slate-800 border-b pb-3">Shipping & Delivery</h3>

      <div className="flex gap-6 mb-4">
         <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.isVirtual} 
              onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
              className="rounded text-blue-600"
            />
            This is a digital product
         </label>
      </div>

      {!formData.isVirtual && (
        <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Weight (kg)</label>
                <input 
                    type="number" 
                    value={formData.weight} 
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="0.0"
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Length (cm)</label>
                    <input type="number" value={formData.length} onChange={(e) => setFormData({ ...formData, length: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Width (cm)</label>
                    <input type="number" value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Height (cm)</label>
                    <input type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}