// File: app/admin/shipments/_components/wc-shipment-header.tsx

"use client";

export const WcShipmentHeader = () => {
  return (
    // মোবাইলে flex-col, বড় স্ক্রিনে flex-row
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-[23px] font-normal text-[#1d2327]">
          Shipments
        </h1>
        <p className="text-[13px] text-[#50575e] mt-1">
          Manage couriers, tracking, and Transdirect API syncing.
        </p>
      </div>
    </div>
  );
};