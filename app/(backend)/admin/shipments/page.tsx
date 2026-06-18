// File: app/admin/shipments/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getShipments } from "@/app/actions/backend/shipment/shipment";
import { 
  ShipmentWithRelations, 
  ShipmentQueryParams, 
  ShipmentCounts, 
  GetShipmentsResponse 
} from "./types";

// আমরা এই কম্পোনেন্টগুলো ধাপে ধাপে তৈরি করব
import { WcShipmentHeader } from "./_components/wc-shipment-header";
import { WcShipmentStatusLinks } from "./_components/wc-shipment-status-links";
import { WcShipmentToolbar } from "./_components/wc-shipment-toolbar";
import { WcShipmentTable } from "./_components/wc-shipment-table";
import { WcShipmentEditModal } from "./_components/wc-shipment-edit-modal";

export default function ShipmentsPage() {
  // State Management
  const [shipments, setShipments] = useState<ShipmentWithRelations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [counts, setCounts] = useState<ShipmentCounts>({ ALL: 0, IN_TRANSIT: 0, DELIVERED: 0, CANCELLED: 0, SYNC_FAILED: 0 });
  const [meta, setMeta] = useState<GetShipmentsResponse["meta"]>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ShipmentWithRelations | null>(null);

  // Query Parameters State (এটি চেঞ্জ হলেই ডেটা রি-ফেচ হবে)
  const [queryParams, setQueryParams] = useState<ShipmentQueryParams>({
    search: "",
    status: "ALL",
    page: 1,
    limit: 20,
  });

  // Data Fetching Function
  const fetchShipments = async () => {
    setLoading(true);
    const res = await getShipments(queryParams);
    if (res.success) {
      setShipments(res.data || []);
      setCounts(res.counts || { ALL: 0, IN_TRANSIT: 0, DELIVERED: 0, CANCELLED: 0, SYNC_FAILED: 0 });
      setMeta(res.meta);
    }
    setLoading(false);
  };

  // Debounce Effect for Search & Filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShipments();
    }, 400); 
    return () => clearTimeout(timer);
  }, [queryParams]);

  // Bulk Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(shipments.map((ship) => ship.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  return (
    /* WP-Admin Background Color: #f0f0f1 */
    <div className="min-h-screen bg-[#f0f0f1] font-sans text-[#1d2327]">
      <div className="max-w-[1920px] mx-auto">
        
        {/* ১. Page Header (Title) */}
        <WcShipmentHeader />

        {/* ২. Status Links (All | In Transit | Delivered) */}
        <WcShipmentStatusLinks 
          counts={counts} 
          currentStatus={queryParams.status || "ALL"}
          onStatusChange={(status) => setQueryParams({ ...queryParams, status, page: 1 })}
        />

        {/* ৩. Table Toolbar (Bulk Actions, Search & Pagination) */}
        <WcShipmentToolbar 
          queryParams={queryParams}
          setQueryParams={setQueryParams}
          meta={meta}
          selectedIds={selectedIds}
          onRefresh={fetchShipments}
          setSelectedIds={setSelectedIds}
        />

        {/* ৪. WooCommerce Style Data Table */}
        <WcShipmentTable 
          shipments={shipments}
          loading={loading}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onEditClick={(item) => setEditingItem(item)}
          onRefresh={fetchShipments}
        />

        {/* ৫. Bottom Pagination Info (Like WordPress) */}
        <div className="mt-2 flex justify-end">
           <span className="text-[13px] text-[#50575e]">
             {meta ? `${meta.total} items` : '0 items'}
           </span>
        </div>

      </div>

      {/* ৬. Edit Tracking Modal (Thickbox Style) */}
      {editingItem && (
        <WcShipmentEditModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onRefresh={fetchShipments}
        />
      )}
    </div>
  );
}