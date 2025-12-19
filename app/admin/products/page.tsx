import Link from 'next/link';
import { db } from '@/lib/db';
import { ProductType } from '@prisma/client';
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

  // Query Construction
  const whereCondition: any = {
    AND: [
      {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ]
      },
      statusFilter === 'archived' 
        ? { status: 'archived' } 
        : statusFilter 
            ? { status: statusFilter } 
            : { status: { not: 'archived' } },
      
      typeFilter ? { productType: typeFilter as ProductType } : {},
      categoryFilter ? { category: { name: categoryFilter } } : {},
    ]
  };

  const [products, totalProducts, categories, statusCounts] = await Promise.all([
    db.product.findMany({
      where: whereCondition,
      select: {
        id: true,
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
        images: { take: 1, select: { url: true } },
        inventoryLevels: { select: { quantity: true } }
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.product.count({ where: whereCondition }),
    db.category.findMany({ select: { name: true } }),
    db.product.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  const counts = {
    all: statusCounts.filter(s => s.status !== 'archived').reduce((acc, curr) => acc + curr._count.status, 0),
    active: statusCounts.find(s => s.status === 'active')?._count.status || 0,
    draft: statusCounts.find(s => s.status === 'draft')?._count.status || 0,
    archived: statusCounts.find(s => s.status === 'archived')?._count.status || 0,
  };

  return (
    // FIX: Responsive Negative Margin applied (-m-4 for mobile, -m-6 for desktop)
    // This matches the parent layout padding exactly to prevent overflow scrollbar
    <div className="p-4 md:p-3 min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER - RESPONSIVE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-normal text-slate-800">Products</h1>
          <Link href="/admin/products/create" className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition">
            Add New
          </Link>
        </div>
      </div>

      {/* CLIENT TABLE COMPONENT */}
      <ProductTable 
        products={products}
        categories={categories}
        counts={counts}
        statusFilter={statusFilter}
      />

      {/* PAGINATION - RESPONSIVE */}
      {totalProducts > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-slate-600 gap-4 sm:gap-0 pb-4">
          <div>{totalProducts} items</div>
          <div className="flex gap-1">
            <Link 
               href={`/admin/products?page=${page > 1 ? page - 1 : 1}`} 
               className={`px-3 py-1 border border-slate-300 bg-white rounded hover:bg-slate-50 ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
               &laquo;
            </Link>
            <div className="px-3 py-1 border border-slate-300 bg-white rounded font-bold">{page}</div>
            <Link 
               href={`/admin/products?page=${page < totalPages ? page + 1 : totalPages}`} 
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