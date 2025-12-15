// app/admin/inventory/page.tsx

"use client";

import { useState } from "react";
import { Box, Package, Users, MapPin } from "lucide-react";
import { StockView } from "./_components/stock-view";
import { SuppliersView } from "./_components/suppliers-view";
import { LocationsView } from "./_components/locations-view";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"stock" | "suppliers" | "locations">("stock");

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Box className="text-blue-600" /> Inventory Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track stock levels, manage suppliers and warehouses.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {[
          { id: "stock", label: "Stock Levels", icon: Package },
          { id: "suppliers", label: "Suppliers", icon: Users },
          { id: "locations", label: "Locations", icon: MapPin },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-blue-600 text-blue-600 bg-white shadow-sm rounded-t-lg" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div>
        {activeTab === "stock" && <StockView />}
        {activeTab === "suppliers" && <SuppliersView />}
        {activeTab === "locations" && <LocationsView />}
      </div>
    </div>
  );
}