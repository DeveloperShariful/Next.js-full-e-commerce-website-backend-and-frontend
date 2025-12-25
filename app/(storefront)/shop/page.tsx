// app/(routes)/shop/page.tsx

import { db } from "@/lib/db";
import ProductCard from "@/components/ui/product-card";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown, Check } from "lucide-react";

// Next.js 15 Search Params
interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ShopPage(props: ShopPageProps) {
  const searchParams = await props.searchParams;
  
  const categoryFilter = searchParams.category;
  const sortOption = searchParams.sort || "newest";
  
  // --- FILTER LOGIC ---
  const whereCondition: any = {
    status: 'active', // শুধু একটিভ প্রোডাক্ট
    ...(categoryFilter ? { category: { name: categoryFilter } } : {}),
  };

  // --- SORT LOGIC ---
  let orderBy: any = { createdAt: 'desc' };
  if (sortOption === 'price_asc') orderBy = { price: 'asc' };
  if (sortOption === 'price_desc') orderBy = { price: 'desc' };
  if (sortOption === 'name_asc') orderBy = { name: 'asc' };

  // --- DATA FETCHING ---
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: whereCondition,
      include: { images: true, category: true },
      orderBy: orderBy,
    }),
    db.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } }
    })
  ]);

  return (
    <div className="bg-white min-h-screen font-sans text-slate-800">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-100 py-12 mb-8">
         <div className="container mx-auto px-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Shop All Products</h1>
            <p className="text-slate-500">Explore the best collection tailored for you.</p>
         </div>
      </div>

      <div className="container mx-auto px-6 pb-20">
         <div className="flex flex-col lg:flex-row gap-10">
            
            {/* === SIDEBAR FILTERS (Left) === */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
               
               {/* Category Filter */}
               <div>
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2 flex items-center justify-between">
                     Categories <ChevronDown size={16}/>
                  </h3>
                  <div className="space-y-2">
                     <Link 
                        href="/shop" 
                        className={`block text-sm ${!categoryFilter ? 'font-bold text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
                     >
                        All Categories
                     </Link>
                     {categories.map((cat) => (
                        <Link 
                           key={cat.id} 
                           href={`/shop?category=${cat.name}`}
                           className={`flex justify-between items-center text-sm group ${categoryFilter === cat.name ? 'font-bold text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
                        >
                           <span>{cat.name}</span>
                           <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500">{cat._count.products}</span>
                        </Link>
                     ))}
                  </div>
               </div>

               {/* Price Filter (Static for now) */}
               <div>
                  <h3 className="font-bold text-slate-900 mb-4 border-b pb-2 flex items-center justify-between">
                     Price Range <ChevronDown size={16}/>
                  </h3>
                  <div className="flex items-center gap-2">
                     <input type="number" placeholder="Min" className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"/>
                     <span className="text-slate-400">-</span>
                     <input type="number" placeholder="Max" className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"/>
                  </div>
               </div>

            </div>

            {/* === MAIN CONTENT (Right) === */}
            <div className="flex-1">
               
               {/* Toolbar */}
               <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-100 gap-4">
                  <p className="text-sm text-slate-500">
                     Showing <strong className="text-slate-900">{products.length}</strong> results
                  </p>
                  
                  <div className="flex items-center gap-3">
                     <span className="text-sm text-slate-500">Sort by:</span>
                     <div className="relative">
                        <form>
                           <select 
                              name="sort" 
                              defaultValue={sortOption}
                              // We can use a client component for auto-submit or simple form submission
                              className="border border-slate-300 rounded-lg text-sm px-3 py-2 outline-none focus:border-blue-500 bg-white"
                           >
                              <option value="newest">Newest Arrivals</option>
                              <option value="price_asc">Price: Low to High</option>
                              <option value="price_desc">Price: High to Low</option>
                              <option value="name_asc">Name: A-Z</option>
                           </select>
                        </form>
                     </div>
                  </div>
               </div>

               {/* Product Grid */}
               {products.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                     <p className="text-lg font-medium text-slate-600">No products found.</p>
                     <p className="text-slate-400 text-sm">Try changing your filters.</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {products.map((product) => (
                        // @ts-ignore
                        <ProductCard key={product.id} data={product} />
                     ))}
                  </div>
               )}

            </div>
         </div>
      </div>
    </div>
  );
}