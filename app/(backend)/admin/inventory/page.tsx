// app/admin/inventory/page.tsx

"use client";

import { useState } from "react";
import { Box, Package, Users, MapPin, ArrowRightLeft, History, FileText } from "lucide-react";

// Importing all tab views
import { StockView } from "./_components/stock-view";
import { SuppliersView } from "./_components/suppliers-view";
import { LocationsView } from "./_components/locations-view";
// Import the new views (we will create these next)
import { PurchaseOrdersView } from "./_components/purchase-orders-view";
import { TransfersView } from "./_components/transfers-view";
import { HistoryView } from "./_components/history-view";

type TabType = "stock" | "purchase_orders" | "transfers" | "history" | "suppliers" | "locations";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("stock");

  return (
    <div className="font-sans text-[#3c434a] max-w-full">
      
      {/* 🚀 WP Style Header */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[23px] font-normal text-[#1d2327]">Inventory Management</h1>
          </div>
        </div>
        <div className="text-[13px] text-[#50575e] max-w-4xl leading-relaxed">
          Manage your multi-warehouse stock levels, keep track of suppliers, create purchase orders, and monitor stock history.
        </div>
      </div>

      {/* 🚀 WP Style Horizontal Sub-menu Tabs */}
      <div className="mb-4 border-b border-[#c3c4c7]">
        <ul className="flex flex-wrap items-center text-[13px]">
          {[
            { id: "stock", label: "Stock Central", icon: Package },
            { id: "purchase_orders", label: "Purchase Orders", icon: FileText },
            { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
            { id: "history", label: "History", icon: History },
            { id: "suppliers", label: "Suppliers", icon: Users },
            { id: "locations", label: "Locations", icon: MapPin },
          ].map((tab) => (
            <li key={tab.id} className="mr-0.5">
              <button
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-2 border border-b-0 rounded-t-[3px] transition-colors ${
                  activeTab === tab.id 
                    ? "bg-[#f0f0f1] border-[#c3c4c7] text-[#1d2327] font-semibold relative top-[1px]" 
                    : "border-transparent text-[#2271b1] hover:text-[#0a4b78] bg-transparent"
                }`}
              >
                <tab.icon size={14} className={activeTab === tab.id ? "text-[#1d2327]" : "opacity-70"} /> 
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 🚀 CONTENT AREA */}
      <div className="mt-4">
        {activeTab === "stock" && <StockView />}
        {activeTab === "purchase_orders" && <PurchaseOrdersView />}
        {activeTab === "transfers" && <TransfersView />}
        {activeTab === "history" && <HistoryView />}
        {activeTab === "suppliers" && <SuppliersView />}
        {activeTab === "locations" && <LocationsView />}
      </div>
      
    </div>
  );
}