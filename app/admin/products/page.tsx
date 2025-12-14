// app/admin/products/page.tsx

import Link from 'next/link';
import { db } from '@/lib/db';
import { 
  Plus, Search, Image as ImageIcon, Star, 
  Trash2, RefreshCcw
} from 'lucide-react';
import { deleteProduct } from '@/app/actions/product';
import { ProductType } from '@prisma/client';

// Next.js 15 searchParams type
interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
    category?: string;
    status?: string;
    type?: string;
    stock_status?: string;
  }>;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(date));
};

export default async function ProductListPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;

  const query = searchParams.query || "";
  const categoryFilter = searchParams.category || "";
  const statusFilter = searchParams.status || "";
  const typeFilter = searchParams.type || "";
  
  const page = Number(searchParams.page) || 1;
  const limit = 20; 
  const skip = (page - 1) * limit;

  const whereCondition: any = {
    AND: [
      {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ]
      },
      statusFilter ? { status: statusFilter } : {},
      typeFilter ? { productType: typeFilter as ProductType } : {},
      categoryFilter ? { category: { name: categoryFilter } } : {},
    ]
  };

  // ✅ OPTIMIZED QUERY: Only fetching fields needed for the table
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
        updatedAt: true,
        category: {
          select: { name: true }
        },
        tags: {
          select: { name: true }
        },
        images: {
          take: 1,
          select: { url: true }
        },
        inventoryLevels: {
          select: { quantity: true }
        }
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
    all: statusCounts.reduce((acc, curr) => acc + curr._count.status, 0),
    active: statusCounts.find(s => s.status === 'active')?._count.status || 0,
    draft: statusCounts.find(s => s.status === 'draft')?._count.status || 0,
    archived: statusCounts.find(s => s.status === 'archived')?._count.status || 0,
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-normal text-slate-800">Products</h1>
          <Link href="/admin/products/create" className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition">
            Add New
          </Link>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex gap-1 text-sm mb-4 text-slate-500">
         <Link href="/admin/products" className={`${!statusFilter ? 'font-bold text-black' : 'text-blue-600 hover:underline'}`}>
            All <span className="text-slate-400">({counts.all})</span>
         </Link>
         <span className="text-slate-300">|</span>
         <Link href="/admin/products?status=active" className={`${statusFilter === 'active' ? 'font-bold text-black' : 'text-blue-600 hover:underline'}`}>
            Published <span className="text-slate-400">({counts.active})</span>
         </Link>
         <span className="text-slate-300">|</span>
         <Link href="/admin/products?status=draft" className={`${statusFilter === 'draft' ? 'font-bold text-black' : 'text-blue-600 hover:underline'}`}>
            Drafts <span className="text-slate-400">({counts.draft})</span>
         </Link>
         <span className="text-slate-300">|</span>
         <Link href="/admin/products?status=archived" className={`${statusFilter === 'archived' ? 'font-bold text-black' : 'text-blue-600 hover:underline'}`}>
            Trash <span className="text-slate-400">({counts.archived})</span>
         </Link>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
           <select className="h-9 px-3 border border-slate-400 rounded text-sm bg-white outline-none focus:border-blue-500">
              <option>Bulk Actions</option>
              <option>Edit</option>
              <option>Move to Trash</option>
           </select>
           <button className="h-9 px-3 border border-slate-400 rounded text-sm bg-white hover:bg-slate-50">Apply</button>
           
           <form className="flex gap-2 ml-2">
              <select name="category" defaultValue={categoryFilter} className="h-9 px-3 border border-slate-400 rounded text-sm bg-white outline-none w-40">
                 <option value="">Select a category</option>
                 {categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                 ))}
              </select>
              <select name="type" defaultValue={typeFilter} className="h-9 px-3 border border-slate-400 rounded text-sm bg-white outline-none w-32">
                 <option value="">Filter by type</option>
                 <option value="SIMPLE">Simple product</option>
                 <option value="VARIABLE">Variable product</option>
              </select>
              <button type="submit" className="h-9 px-3 border border-slate-400 rounded text-sm bg-white hover:bg-slate-50">Filter</button>
           </form>
        </div>
        
        <form className="relative">
           <input 
             name="query" 
             defaultValue={query} 
             placeholder="Search products..." 
             className="h-9 pl-3 pr-8 border border-slate-400 rounded text-sm w-64 outline-none focus:border-blue-500" 
           />
           <button type="submit" className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-slate-500 hover:text-slate-700">
              <Search size={16} />
           </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-300 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-white border-b border-slate-300">
            <tr>
              <th className="p-3 w-10 text-center"><input type="checkbox" className="rounded border-slate-400" /></th>
              <th className="p-3 w-16 text-center"><ImageIcon size={16} className="mx-auto text-slate-400" /></th>
              <th className="p-3 font-medium text-blue-600 hover:underline cursor-pointer">Name</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Categories</th>
              <th className="p-3 font-medium">Tags</th>
              <th className="p-3 font-medium text-center"><Star size={16} className="mx-auto text-slate-400" /></th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.length === 0 ? (
              <tr><td colSpan={10} className="p-16 text-center text-slate-500">No products found.</td></tr>
            ) : (
              products.map((product) => {
                const displayImage = product.featuredImage || product.images[0]?.url || null;
                const stock = product.inventoryLevels?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

                return (
                  <tr key={product.id} className="hover:bg-[#F9F9F9] group align-top">
                    <td className="p-3 text-center"><input type="checkbox" className="rounded border-slate-400" /></td>
                    
                    <td className="p-3">
                       <div className="h-10 w-10 bg-slate-100 border border-slate-300 flex items-center justify-center overflow-hidden">
                          {displayImage ? (
                             <img src={displayImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                             <ImageIcon className="text-slate-300" size={20} />
                          )}
                       </div>
                    </td>

                    <td className="p-3 w-1/4">
                       <Link href={`/admin/products/create?id=${product.id}`} className="font-semibold text-blue-600 hover:underline block mb-1">
                          {product.name} {product.status === 'draft' && <span className="text-slate-400 font-normal">— Draft</span>}
                       </Link>
                       <div className="flex flex-wrap gap-1 text-xs text-slate-400">
                          <span className="text-slate-300">ID: {product.id.slice(0, 4)} | </span>
                          <Link href={`/admin/products/create?id=${product.id}`} className="text-blue-600 hover:underline">Edit</Link>
                          <span className="text-slate-300">|</span>
                          <form action={async () => { 'use server'; await deleteProduct(product.id) }} className="inline">
                             <button className="text-red-600 hover:underline">Trash</button>
                          </form>
                       </div>
                    </td>

                    <td className="p-3 text-slate-600">{product.sku || <span className="text-slate-400">–</span>}</td>

                    <td className="p-3">
                       {product.trackQuantity ? (
                          <span className={`text-xs font-bold ${stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {stock > 0 ? 'In stock' : 'Out of stock'} <span className="font-normal text-slate-500">({stock})</span>
                          </span>
                       ) : (
                          <span className="text-green-600 text-xs font-bold">In stock</span>
                       )}
                    </td>

                    <td className="p-3">
                       {product.salePrice ? (
                          <div>
                             <span className="line-through text-slate-400 text-xs mr-1">{formatPrice(product.price)}</span>
                             <span className="font-medium">{formatPrice(product.salePrice)}</span>
                          </div>
                       ) : (
                          <span className="font-medium">{formatPrice(product.price)}</span>
                       )}
                    </td>

                    <td className="p-3 text-blue-600 hover:underline cursor-pointer">
                       {product.category?.name || <span className="text-slate-400">–</span>}
                    </td>

                    <td className="p-3 text-slate-600">
                       {product.tags && product.tags.length > 0 
                         ? product.tags.map(t => t.name).join(', ') 
                         : <span className="text-slate-400">–</span>}
                    </td>

                    <td className="p-3 text-center">
                       <Star size={16} className="mx-auto text-slate-300 cursor-pointer hover:text-yellow-400" />
                    </td>

                    <td className="p-3 text-slate-500 text-xs">
                       {product.status === 'active' ? 'Published' : 'Last Modified'} <br/>
                       <span className="text-slate-700">{formatDate(product.updatedAt)}</span>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalProducts > 0 && (
        <div className="flex justify-between items-center mt-4 text-sm text-slate-600">
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