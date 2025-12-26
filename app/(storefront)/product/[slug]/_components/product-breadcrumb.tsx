// File: app/product/[slug]/_components/product-breadcrumb.tsx

import Link from "next/link";

interface Props {
  productName: string;
}

export default function ProductBreadcrumb({ productName }: Props) {
  return (
    <div className="bg-gray-100 py-4 mb-8">
      <div className="container mx-auto px-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-blue-600">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{productName}</span>
      </div>
    </div>
  );
}