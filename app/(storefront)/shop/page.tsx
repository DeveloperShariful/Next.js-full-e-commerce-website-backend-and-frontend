// File: app/(routes)/shop/page.tsx

// Actions
import { getShopProducts } from "@/app/actions/storefront/shop/get-shop-products";
import { getShopCategories } from "@/app/actions/storefront/shop/get-categories";

// Components
import ShopHeader from "./_components/shop-header";
import FilterSidebar from "./_components/filter-sidebar";
import ShopToolbar from "./_components/shop-toolbar";
import ProductGrid from "./_components/product-grid";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ShopPage(props: ShopPageProps) {
  // 1. Parse Search Params
  const searchParams = await props.searchParams;
  const { category, sort = "newest", minPrice, maxPrice } = searchParams;

  // 2. Fetch Data in Parallel
  const [products, categories] = await Promise.all([
    getShopProducts({ category, sort, minPrice, maxPrice }),
    getShopCategories(),
  ]);

  return (
    <div className="bg-white min-h-screen font-sans text-slate-800">
      
      {/* 1. Header Banner */}
      <ShopHeader />

      <div className="container mx-auto px-6 pb-20">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* 2. Sidebar Filters */}
          <FilterSidebar 
            categories={categories} 
            activeCategory={category} 
          />

          {/* 3. Main Content Area */}
          <div className="flex-1">
            
            {/* Toolbar (Sorting & Count) */}
            <ShopToolbar 
                totalProducts={products.length} 
                currentSort={sort} 
            />

            {/* Product Grid Display */}
            <ProductGrid products={products} />

          </div>
        </div>
      </div>
    </div>
  );
}