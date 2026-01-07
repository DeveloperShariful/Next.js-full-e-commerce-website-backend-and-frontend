// File: app/admin/products/page.tsx

import Link from 'next/link';
import { db } from '@/lib/prisma';
import { ProductType, ProductStatus, Prisma } from '@prisma/client';
import ProductTable from './_components/product-table';
import ProductLogViewer from './_components/ProductLogViewer';
import ImportExportButtons from './_components/ImportExportButtons';

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
  <div className="p-4 md:p-6 min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
    
    {/* --- HEADER SECTION --- */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Products</h1>
        <p className="text-sm text-slate-500 mt-1 hidden sm:block">Manage your product catalog</p>
      </div>
      
      {/* Action Buttons (Mobile: Wrap, Desktop: Row) */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <Link 
          href="/admin/products/create" 
          className="flex-1 md:flex-none text-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
        >
          + Add New
        </Link>
        
        {/* Import/Export & Log Viewer Components */}
        <div className="flex gap-2 flex-1 md:flex-none justify-end md:justify-start">
           <ImportExportButtons />
           <ProductLogViewer />
        </div>
      </div>
    </div>

    {/* --- TABLE SECTION --- */}
    <div className="w-full">
      <ProductTable 
        products={products}
        categories={categories}
        counts={counts}
        statusFilter={statusFilter}
      />
    </div>

    {/* --- PAGINATION SECTION --- */}
    {totalProducts > 0 && (
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-slate-600 gap-4 pb-8">
        <div>
           Showing {products.length} of {totalProducts} items
        </div>
        
        <div className="flex gap-2">
          <Link 
             href={`/admin/products?page=${page > 1 ? page - 1 : 1}&query=${query}&status=${statusFilter}`} 
             className={`px-3 py-1.5 border border-slate-300 bg-white rounded hover:bg-slate-50 transition ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
          >
             Previous
          </Link>
          
          <div className="px-3 py-1.5 border border-blue-500 bg-blue-50 text-blue-600 rounded font-bold">
             {page}
          </div>
          
          <Link 
             href={`/admin/products?page=${page < totalPages ? page + 1 : totalPages}&query=${query}&status=${statusFilter}`} 
             className={`px-3 py-1.5 border border-slate-300 bg-white rounded hover:bg-slate-50 transition ${page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
          >
             Next
          </Link>
        </div>
      </div>
    )}
  </div>
);
}