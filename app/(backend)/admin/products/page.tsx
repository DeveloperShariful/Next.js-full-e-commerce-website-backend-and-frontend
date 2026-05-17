// File: app/admin/products/page.tsx

import Link from 'next/link';
import { db } from '@/lib/prisma';
import { ProductType, ProductStatus, Prisma } from '@prisma/client';
import ProductTable from './_components/product-table';
import ProductLogViewer from './_components/ProductLogViewer';
import ImportExportButtons from './_components/ImportExportButtons';
import { serializeData } from "@/app/actions/backend/product/product-utils";

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

  // 🚀 Fetching Brands as well for the new Filter
  const [products, totalProducts, categories, brands, statusCounts] = await Promise.all([
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
        costPerItem: true, // 🚀 Added Cost
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
    db.brand.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }), // 🚀 Brand Filter Support
    db.product.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);

  const serializedProducts = serializeData(products);
  const totalPages = Math.ceil(totalProducts / limit);

  const counts = {
    all: statusCounts.filter(s => s.status !== ProductStatus.ARCHIVED).reduce((acc, curr) => acc + curr._count.status, 0),
    active: statusCounts.find(s => s.status === ProductStatus.ACTIVE)?._count.status || 0,
    draft: statusCounts.find(s => s.status === ProductStatus.DRAFT)?._count.status || 0,
    archived: statusCounts.find(s => s.status === ProductStatus.ARCHIVED)?._count.status || 0,
  };

  return (
    <div className="font-sans text-[#3c434a] max-w-full">
      
      {/* 🚀 WP Style Header Row (Matched with your screenshot) */}
      {/* 🚀 WP Style Header Row */}
      <div className="mb-4 flex justify-between items-start md:items-center">
        
        {/* Left Side: Title and Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          
          <div className="flex items-center gap-2">
            <h1 className="text-[23px] font-normal text-[#1d2327]">Products</h1>
            
            <Link 
              href="/admin/products/create" 
              className="px-2 py-1 text-[13px] border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#2271b1] hover:text-white rounded-[3px] transition-colors shadow-sm whitespace-nowrap"
            >
              Add new 
            </Link>
          </div>
          <div className="mt-1 sm:mt-0">
            <ImportExportButtons />
          </div>
        </div>
        <div className="mt-1 sm:mt-0">
           <ProductLogViewer />
          </div>
      </div>

      {/* Main Table Component */}
      <div className="w-full mt-4">
        <ProductTable 
          products={serializedProducts}
          categories={categories}
          brands={brands} // 🚀 Passing brands for the new filter
          counts={counts}
          statusFilter={statusFilter}
          totalProducts={totalProducts}
          totalPages={totalPages}
          currentPage={page}
          limit={limit}
        />
      </div>

    </div>
  );
}