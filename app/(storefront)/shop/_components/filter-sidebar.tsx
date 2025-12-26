// File: app/(routes)/shop/_components/filter-sidebar.tsx

import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface CategoryWithCount {
  id: string;
  name: string;
  _count: { products: number };
}

interface Props {
  categories: CategoryWithCount[];
  activeCategory?: string;
}

export default function FilterSidebar({ categories, activeCategory }: Props) {
  return (
    <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
      
      {/* Category Filter */}
      <div>
        <h3 className="font-bold text-slate-900 mb-4 border-b pb-2 flex items-center justify-between">
          Categories <ChevronDown size={16} />
        </h3>
        <div className="space-y-2">
          <Link
            href="/shop"
            className={`block text-sm ${
              !activeCategory
                ? "font-bold text-blue-600"
                : "text-slate-600 hover:text-blue-600"
            }`}
          >
            All Categories
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.name}`}
              className={`flex justify-between items-center text-sm group ${
                activeCategory === cat.name
                  ? "font-bold text-blue-600"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500">
                {cat._count.products}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Price Filter (Static Placeholder) */}
      <div>
        <h3 className="font-bold text-slate-900 mb-4 border-b pb-2 flex items-center justify-between">
          Price Range <ChevronDown size={16} />
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            placeholder="Max"
            className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}