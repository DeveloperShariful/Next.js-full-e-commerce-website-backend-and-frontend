// File: app/product/[slug]/_components/product-breadcrumb.tsx

import Link from "next/link";

interface Props {
  productName: string;
}

export default function ProductBreadcrumb({ productName }: Props) {
  return (
    <div className="border-b border-gray-100 bg-white py-3">
      <div className="container mx-auto px-6 text-xs md:text-sm text-gray-500 font-medium flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
        <span className="text-gray-300">/</span>
        <Link href="/shop" className="hover:text-slate-900 transition-colors">Shop</Link>
        <span className="text-gray-300">/</span>
        <span className="text-slate-900 truncate">{productName}</span>
      </div>
    </div>
  );
}
