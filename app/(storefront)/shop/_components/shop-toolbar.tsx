// File: app/(routes)/shop/_components/shop-toolbar.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  totalProducts: number;
  currentSort: string;
}

export default function ShopToolbar({ totalProducts, currentSort }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-100 gap-4">
      <p className="text-sm text-slate-500">
        Showing <strong className="text-slate-900">{totalProducts}</strong> results
      </p>

      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Sort by:</span>
        <div className="relative">
          <select
            value={currentSort}
            onChange={handleSortChange}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500 bg-white cursor-pointer"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}