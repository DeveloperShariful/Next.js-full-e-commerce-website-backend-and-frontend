"use client";

import { Attribute, Variation } from "../types";

// --- GENERAL TAB ---
export const GeneralTab = ({ price, setPrice, salePrice, setSalePrice, cost, setCost, taxStatus, setTaxStatus }: any) => (
  <div className="space-y-4 max-w-lg animate-in fade-in">
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Regular price ($)</label>
      <div className="col-span-2"><input type="number" required value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    </div>
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Sale price ($)</label>
      <div className="col-span-2"><input type="number" value={salePrice} onChange={(e) => setSalePrice(parseFloat(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    </div>
    <div className="grid grid-cols-3 gap-4 items-center border-t pt-4">
      <label className="font-medium text-right text-gray-700">Cost per item</label>
      <div className="col-span-2"><input type="number" value={cost} onChange={(e) => setCost(parseFloat(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    </div>
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Tax status</label>
      <div className="col-span-2">
        <select value={taxStatus} onChange={(e) => setTaxStatus(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 bg-white focus:border-[#2271b1] outline-none">
          <option value="taxable">Taxable</option>
          <option value="none">None</option>
        </select>
      </div>
    </div>
  </div>
);

// --- INVENTORY TAB ---
export const InventoryTab = ({ sku, setSku, barcode, setBarcode, trackQuantity, setTrackQuantity, stock, setStock, lowStockThreshold, setLowStockThreshold, backorders, setBackorders }: any) => (
  <div className="space-y-4 max-w-lg animate-in fade-in">
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">SKU</label>
      <div className="col-span-2"><input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    </div>
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Barcode</label>
      <div className="col-span-2"><input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    </div>
    <div className="grid grid-cols-3 gap-4 items-center">
      <div className="col-start-2 col-span-2"><label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={trackQuantity} onChange={(e) => setTrackQuantity(e.target.checked)} /> Track stock quantity</label></div>
    </div>
    {trackQuantity && (
      <>
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="font-medium text-right text-gray-700">Quantity</label>
          <div className="col-span-2"><input type="number" value={stock} onChange={(e) => setStock(parseInt(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4 items-center">
          <label className="font-medium text-right text-gray-700">Low stock threshold</label>
          <div className="col-span-2"><input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(parseInt(e.target.value))} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
        </div>
      </>
    )}
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Allow backorders?</label>
      <div className="col-span-2">
        <select value={backorders} onChange={(e) => setBackorders(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 bg-white focus:border-[#2271b1] outline-none">
          <option value="no">Do not allow</option>
          <option value="notify">Allow, but notify customer</option>
          <option value="yes">Allow</option>
        </select>
      </div>
    </div>
  </div>
);

// --- SHIPPING TAB ---
export const ShippingTab = ({ weight, setWeight, length, setLength, width, setWidth, height, setHeight, shippingClass, setShippingClass }: any) => (
  <div className="space-y-4 max-w-lg animate-in fade-in">
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Weight (kg)</label>
      <div className="col-span-2"><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    </div>
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Dimensions (cm)</label>
      <div className="col-span-2 flex gap-2">
        <input placeholder="L" value={length} onChange={(e) => setLength(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 focus:border-[#2271b1] outline-none" />
        <input placeholder="W" value={width} onChange={(e) => setWidth(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 focus:border-[#2271b1] outline-none" />
        <input placeholder="H" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 focus:border-[#2271b1] outline-none" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Shipping class</label>
      <div className="col-span-2">
        <select value={shippingClass} onChange={(e) => setShippingClass(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 bg-white focus:border-[#2271b1] outline-none">
          <option value="standard">Standard Shipping</option>
          <option value="free">Free Shipping</option>
        </select>
      </div>
    </div>
  </div>
);

// --- LINKED PRODUCTS ---
export const LinkedTab = ({ upsells, setUpsells, crossSells, setCrossSells }: any) => (
  <div className="space-y-4 max-w-lg animate-in fade-in">
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Upsells</label>
      <div className="col-span-2"><input placeholder="Search product..." className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    </div>
    <div className="grid grid-cols-3 gap-4 items-center">
      <label className="font-medium text-right text-gray-700">Cross-sells</label>
      <div className="col-span-2"><input placeholder="Search product..." className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    </div>
  </div>
);

// --- SEO TAB ---
export const SeoTab = ({ metaTitle, setMetaTitle, metaDesc, setMetaDesc }: any) => (
  <div className="space-y-4 animate-in fade-in">
    <div className="bg-white border p-3 rounded text-sm mb-4">
      <div className="text-blue-800 text-lg">{metaTitle || "Product Title"}</div>
      <div className="text-green-700 text-xs">http://yoursite.com/product/slug</div>
      <div className="text-gray-600 text-xs">{metaDesc || "Product description..."}</div>
    </div>
    <div><label className="block font-medium mb-1 text-gray-700">SEO Title</label><input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    <div><label className="block font-medium mb-1 text-gray-700">Meta Description</label><textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={3} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none"></textarea></div>
  </div>
);

// --- ADVANCED TAB ---
export const AdvancedTab = ({ purchaseNote, setPurchaseNote, menuOrder, setMenuOrder, enableReviews, setEnableReviews }: any) => (
  <div className="space-y-4 max-w-lg animate-in fade-in">
    <div><label className="block font-medium mb-1 text-gray-700">Purchase note</label><textarea value={purchaseNote} onChange={(e) => setPurchaseNote(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" rows={3}></textarea></div>
    <div><label className="block font-medium mb-1 text-gray-700">Menu order</label><input type="number" value={menuOrder} onChange={(e) => setMenuOrder(parseInt(e.target.value))} className="w-24 border border-gray-300 rounded px-3 py-1.5 focus:border-[#2271b1] outline-none" /></div>
    <div><label className="flex items-center gap-2 text-gray-700"><input type="checkbox" checked={enableReviews} onChange={(e) => setEnableReviews(e.target.checked)} /> Enable reviews</label></div>
  </div>
);