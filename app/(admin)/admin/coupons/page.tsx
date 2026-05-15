// File Location: app/admin/coupons/page.tsx

import { getCoupons } from "@/app/actions/admin/coupon/coupon";
import { CouponsHeader } from "./_components/coupons-header";
import { CouponsTable } from "./_components/coupons-table";
import { PaginationControls } from "./_components/pagination-controls"; 
import { CouponType, CouponCountsType } from "./types";

interface CouponsPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    status?: string;
    limit?: string;
    type?: string;
  }>;
}

export default async function CouponsPage(props: CouponsPageProps) {
  const searchParams = await props.searchParams;
  
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20; 
  const query = searchParams.query || "";
  const status = searchParams.status || "all";
  const type = searchParams.type || "all"; 
  
  const { data: coupons, meta } = await getCoupons(page, limit, query, status, type);

  // Cast to Strict Types
  const typedCoupons: CouponType[] = coupons || [];
  const typedCounts: CouponCountsType = meta?.counts || { all: 0, published: 0, affiliate: 0, mine: 0, trash: 0 };

  return (
    <div className="max-w-[100%] mx-auto min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans pb-20">
      
      <CouponsHeader 
        counts={typedCounts} 
        totalItems={meta?.total || 0}
        currentPage={page}
        totalPages={meta?.pages || 1}
      />
      
      <CouponsTable 
        coupons={typedCoupons} 
        isTrashMode={status === 'trash'} 
      />

      {meta && meta.total > 0 && (
        <PaginationControls 
          total={meta.total}
          totalPages={meta.pages}
          currentPage={page}
          perPage={limit}
        />
      )}

    </div>
  );
}