// app/admin/products/page.tsx

import Link from 'next/link';
import { db } from '@/lib/prisma';
import { ProductType, ProductStatus, Prisma } from '@prisma/client';
import ProductTable from './_components/product-table';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    category?: string;
    status?: string;
    type?: string;
  }>;
}

export default async function ProductListPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;

  const query = searchParams.query || "";
  const categoryFilter = searchParams.category || "";
  const statusFilter = searchParams.status || "";
  const typeFilter = searchParams.type || "";
  
  const page = Number(searchParams.page) || 1;
  const limit = 20; 
  const skip = (page - 1) * limit;

  // --- OPTIMIZED FILTER LOGIC ---
  const whereCondition: Prisma.ProductWhereInput = {
    AND: [
      // 1. Search Optimization (Full Text Search priority, fallback to contains)
      query ? {
        OR: [
          // 'search' uses Postgres Full Text Search (Faster for words)
          { name: { search: query.split(" ").join(" & ") } }, 
          // 'contains' handles partial matches (substrings)
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ]
      } : {},

      // 2. Optimized Status Filtering
      statusFilter === 'archived' ? { status: ProductStatus.ARCHIVED } :
      statusFilter === 'draft' ? { status: ProductStatus.DRAFT } :
      statusFilter === 'active' ? { status: ProductStatus.ACTIVE } :
      { status: { not: ProductStatus.ARCHIVED } }, // Default: Show all except trash

      // 3. Other Filters
      typeFilter ? { productType: typeFilter.toUpperCase() as ProductType } : {},
      categoryFilter ? { category: { name: categoryFilter } } : {},
    ]
  };

  // --- PARALLEL DATA FETCHING (FASTEST) ---
  const [products, totalProducts, categories, statusCounts] = await Promise.all([
    db.product.findMany({
      where: whereCondition,
      // Selective Query: Only fetching what is needed for the table
      select: {
        id: true,
        productCode: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        salePrice: true,
        status: true,
        productType: true,
        trackQuantity: true,
        featuredImage: true,
        isFeatured: true,
        updatedAt: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        tags: { select: { name: true } },
        images: { take: 1, select: { url: true }, orderBy: { position: 'asc' } },
        // Optimized Inventory Count
        inventoryLevels: { select: { quantity: true } }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.product.count({ where: whereCondition }),
    db.category.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    db.product.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  // Status Counts Logic
  const counts = {
    all: statusCounts.filter(s => s.status !== ProductStatus.ARCHIVED).reduce((acc, curr) => acc + curr._count.status, 0),
    active: statusCounts.find(s => s.status === ProductStatus.ACTIVE)?._count.status || 0,
    draft: statusCounts.find(s => s.status === ProductStatus.DRAFT)?._count.status || 0,
    archived: statusCounts.find(s => s.status === ProductStatus.ARCHIVED)?._count.status || 0,
  };

  return (
    <div className="p-4 md:p-3 min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-normal text-slate-800">Products</h1>
          <Link href="/admin/products/create" className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition">
            Add New
          </Link>
        </div>
      </div>

      <ProductTable 
        products={products}
        categories={categories}
        counts={counts}
        statusFilter={statusFilter}
      />

      {totalProducts > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-slate-600 gap-4 sm:gap-0 pb-4">
          <div>{totalProducts} items</div>
          <div className="flex gap-1">
            <Link 
               href={`/admin/products?page=${page > 1 ? page - 1 : 1}&query=${query}&status=${statusFilter}`} 
               className={`px-3 py-1 border border-slate-300 bg-white rounded hover:bg-slate-50 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
               &laquo;
            </Link>
            <div className="px-3 py-1 border border-slate-300 bg-white rounded font-bold">{page}</div>
            <Link 
               href={`/admin/products?page=${page < totalPages ? page + 1 : totalPages}&query=${query}&status=${statusFilter}`} 
               className={`px-3 py-1 border border-slate-300 bg-white rounded hover:bg-slate-50 ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            >
               &raquo;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}