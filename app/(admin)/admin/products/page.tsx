// File: app/admin/products/page.tsx

import Link from 'next/link';
import { db } from '@/lib/prisma';
import { ProductType, ProductStatus, Prisma } from '@prisma/client';
import ProductTable from './_components/product-table';
import ProductLogViewer from './_components/ProductLogViewer';
import ImportExportButtons from './_components/ImportExportButtons';
import { PaginationControls } from "./_components/pagination-controls";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    category?: string;
    status?: string;
    type?: string;
    limit?: string;
  }>;
}

export default async function ProductListPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;

  const query = searchParams.query || "";
  const categoryFilter = searchParams.category || "";
  const statusFilter = searchParams.status || "";
  const typeFilter = searchParams.type || "";
  
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 20;
  const skip = (page - 1) * limit;

  const whereCondition: Prisma.ProductWhereInput = {
    AND: [
      query ? {
        OR: [
          { name: { search: query.split(" ").join(" & ") } }, 
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ]
      } : {},

      statusFilter === 'archived' ? { status: ProductStatus.ARCHIVED } :
      statusFilter === 'draft' ? { status: ProductStatus.DRAFT } :
      statusFilter === 'active' ? { status: ProductStatus.ACTIVE } :
      { status: { not: ProductStatus.ARCHIVED } },

      typeFilter ? { productType: typeFilter.toUpperCase() as ProductType } : {},
      categoryFilter ? { category: { name: categoryFilter } } : {},
    ]
  };

  const [products, totalProducts, categories, statusCounts] = await Promise.all([
    db.product.findMany({
      where: whereCondition,
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

  const counts = {
    all: statusCounts.filter(s => s.status !== ProductStatus.ARCHIVED).reduce((acc, curr) => acc + curr._count.status, 0),
    active: statusCounts.find(s => s.status === ProductStatus.ACTIVE)?._count.status || 0,
    draft: statusCounts.find(s => s.status === ProductStatus.DRAFT)?._count.status || 0,
    archived: statusCounts.find(s => s.status === ProductStatus.ARCHIVED)?._count.status || 0,
  };

  return (
    <div className="p-3 md:p-6 min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500 mt-1 hidden sm:block">Manage your product catalog</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Link 
            href="/admin/products/create" 
            className="flex-1 md:flex-none text-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm whitespace-nowrap"
          >
            + Add New
          </Link>
          
          <div className="flex gap-1 flex-1 md:flex-none justify-end md:justify-start">
             <ImportExportButtons />
             <ProductLogViewer />
          </div>
        </div>
      </div>

      <div className="w-full">
        <ProductTable 
          products={products}
          categories={categories}
          counts={counts}
          statusFilter={statusFilter}
        />
      </div>

      {totalProducts > 0 && (
        <PaginationControls 
          total={totalProducts}
          totalPages={totalPages}
          currentPage={page}
          perPage={limit}
        />
      )}
    </div>
  );
}