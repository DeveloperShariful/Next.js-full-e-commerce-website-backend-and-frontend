// File: app/admin/products/_components/product-table.tsx

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Image as ImageIcon, Star, Loader2 } from "lucide-react";
import { bulkProductAction, moveToTrash, deleteProduct } from "@/app/actions/backend/product/product-list"; 
import { duplicateProduct } from "@/app/actions/backend/product/product-duplicate"; 
import { toast } from "react-hot-toast";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { PaginationControls } from "./pagination-controls"; 

interface ProductTableProps {
  products: any[];
  categories: any[];
  brands: any[]; 
  counts: any;
  statusFilter: string;
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export default function ProductTable({ 
  products, categories, brands, counts, statusFilter, totalProducts, totalPages, currentPage, limit 
}: ProductTableProps) {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const { formatPrice } = useGlobalStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [brandFilter, setBrandFilter] = useState(searchParams.get("brand") || "");
  const [stockFilter, setStockFilter] = useState(searchParams.get("stock_status") || ""); 

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("query", query);
    else params.delete("query");
    params.set("page", "1");
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (categoryFilter) params.set("category", categoryFilter);
    else params.delete("category");
    
    if (typeFilter) params.set("type", typeFilter);
    else params.delete("type");

    if (brandFilter) params.set("brand", brandFilter);
    else params.delete("brand");

    params.set("page", "1");
    router.push(`/admin/products?${params.toString()}`);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(products.map(p => p.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleBulkApply = async () => {
    if (!bulkAction) return toast.error("Select an action");
    if (selectedIds.length === 0) return toast.error("Select items first");

    const formData = new FormData();
    formData.append("ids", JSON.stringify(selectedIds));
    formData.append("action", bulkAction);

    startTransition(async () => {
        try {
            const res = await bulkProductAction(formData);
            if (res.success) {
                toast.success(res.message || "Bulk action successful");
                setSelectedIds([]); 
                setBulkAction("");  
                router.refresh();   
            } else {
                toast.error(res.message || "Action failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    });
  };

  const handleSingleAction = (id: string, actionType: 'duplicate' | 'trash' | 'restore' | 'delete') => {
      setLoadingId(id);
      
      startTransition(async () => {
          try {
              let res: { success: boolean; message?: string; error?: string } | undefined;
              
              if (actionType === 'duplicate') res = await duplicateProduct(id);
              else if (actionType === 'trash') { 
                  await moveToTrash(id); 
                  res = { success: true, message: "Moved to trash" }; 
              }
              else if (actionType === 'restore') {
                 const fd = new FormData(); fd.append("ids", JSON.stringify([id])); fd.append("action", "restore");
                 res = await bulkProductAction(fd);
              }
              else if (actionType === 'delete') {
                 res = await deleteProduct(id);
              }
    
              if(res?.success) {
                  toast.success(res.message || "Success");
                  router.refresh(); 
              } else {
                  toast.error(res?.message || "Action failed");
              }
          } catch (error) {
              toast.error("An error occurred");
          } finally {
              setLoadingId(null);
          }
      });
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

  const renderStars = (isFeatured: boolean) => {
    return (
      <span className={`text-[16px] leading-none select-none transition-colors ${isFeatured ? "text-[#f56e28]" : "text-[#c3c4c7]"}`}>
        {isFeatured ? "★" : "☆"}
      </span>
    );
  };

  return (
    <div className="w-full animate-in fade-in duration-300">
      
      {/* 🚀 WP Style Top Row: Status Links & Search (100% Responsive) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
        
        {/* Left: Status Links */}
        <ul className="flex flex-wrap items-center gap-1 text-[13px] text-[#646970]">
           <li className="flex items-center gap-1">
              <Link href="/admin/products" className={`${!statusFilter ? 'font-semibold text-[#1d2327]' : 'text-[#2271b1] hover:text-[#0a4b78]'}`}>
                  All <span className="text-[#646970] font-normal">({counts.all})</span>
              </Link>
              <span className="text-[#c3c4c7] ml-1">|</span>
           </li>
           <li className="flex items-center gap-1">
              <Link href="/admin/products?status=active" className={`${statusFilter === 'active' ? 'font-semibold text-[#1d2327]' : 'text-[#2271b1] hover:text-[#0a4b78]'}`}>
                  Published <span className="text-[#646970] font-normal">({counts.active})</span>
              </Link>
              <span className="text-[#c3c4c7] ml-1">|</span>
           </li>
           <li className="flex items-center gap-1">
              <Link href="/admin/products?status=draft" className={`${statusFilter === 'draft' ? 'font-semibold text-[#1d2327]' : 'text-[#2271b1] hover:text-[#0a4b78]'}`}>
                  Drafts <span className="text-[#646970] font-normal">({counts.draft})</span>
              </Link>
              {counts.archived > 0 && <span className="text-[#c3c4c7] ml-1">|</span>}
           </li>
           {counts.archived > 0 && (
             <li className="flex items-center gap-1">
                <Link href="/admin/products?status=archived" className={`${statusFilter === 'archived' ? 'font-semibold text-[#1d2327]' : 'text-[#2271b1] hover:text-[#0a4b78]'}`}>
                    Trash <span className="text-[#646970] font-normal">({counts.archived})</span>
                </Link>
             </li>
           )}
        </ul>

        {/* Right: Search Box */}
        <form onSubmit={handleSearch} className="flex items-stretch shadow-sm w-full md:w-auto">
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-[200px] px-2 py-[3px] border border-[#8c8f94] text-[13px] text-[#3c434a] focus:border-[#2271b1] outline-none rounded-l-[3px]"
            placeholder="Search products..."
          />
          <button type="submit" className="px-3 py-[3px] border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] text-[13px] hover:bg-[#f0f0f1] transition-colors rounded-r-[3px] whitespace-nowrap">
            Search products
          </button>
        </form>

      </div>

      {/* 🚀 WP Style Toolbar Row: Bulk Actions, Filters & Pagination */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-2 gap-3">
        
        {/* Left Side: Bulk Actions & Advanced Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto">
           
           {/* Bulk Actions */}
           <div className="flex items-center gap-1 mr-1 w-full sm:w-auto">
               <select 
                  value={bulkAction} 
                  onChange={(e) => setBulkAction(e.target.value)}
                  disabled={isPending || products.length === 0}
                  className="flex-1 sm:flex-none px-2 py-[3px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
               >
                  <option value="">Bulk actions</option>
                  {statusFilter === 'archived' ? (
                      <>
                        <option value="restore">Restore</option>
                        <option value="delete">Delete Permanently</option>
                      </>
                  ) : (
                      <>
                        <option value="trash">Move to Trash</option>
                        <option value="publish">Publish</option>
                        <option value="unpublish">Unpublish</option>
                      </>
                  )}
               </select>
               <button 
                  onClick={handleBulkApply} 
                  disabled={isPending || !bulkAction || selectedIds.length === 0}
                  className="px-2.5 py-[3px] border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] rounded-[3px] text-[13px] hover:bg-[#f0f6fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
               >
                  {isPending && <Loader2 className="w-3 h-3 animate-spin" />} Apply
               </button>
           </div>
           
           {/* Filters (🚀 FIXED ALL KEYS) */}
           <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="flex-1 sm:flex-none px-2 py-[3px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none">
              <option value="">Select a category</option>
              {categories?.map((c, index) => (<option key={c.id || `cat-${index}`} value={c.name}>{c.name}</option>))}
           </select>
           
           <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="flex-1 sm:flex-none px-2 py-[3px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none">
              <option value="">Filter by product type</option>
              <option value="SIMPLE">Simple product</option>
              <option value="VARIABLE">Variable product</option>
           </select>

           <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="flex-1 sm:flex-none px-2 py-[3px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none">
              <option value="">Filter by brand</option>
              {brands?.map((b, index) => (<option key={b.id || `brand-${index}`} value={b.name}>{b.name}</option>))}
           </select>

           <button 
             onClick={handleApplyFilters} 
             className="px-2.5 py-[3px] border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] rounded-[3px] text-[13px] hover:bg-[#f0f6fc] transition-colors whitespace-nowrap"
           >
             Filter
           </button>
        </div>

        {/* Right Side: Pagination (Top) */}
        <div className="flex items-center w-full xl:w-auto justify-end mt-2 xl:mt-0">
          {totalProducts > 0 && (
            <PaginationControls total={totalProducts} totalPages={totalPages} currentPage={currentPage} perPage={limit} />
          )}
        </div>
        
      </div>

      {/* 🚀 WP List Table */}
      <div className={`bg-white border border-[#c3c4c7] shadow-sm transition-opacity duration-200 mt-2 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <div className="overflow-x-auto ">
          <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse min-w-[1200px]">
            <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
              <tr>
                <th className="p-2 w-8 text-center border-r border-[#e2e4e7]">
                    <input type="checkbox" onChange={toggleSelectAll} checked={products.length > 0 && selectedIds.length === products.length} className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] focus:ring-[#2271b1] cursor-pointer" />
                </th>
                <th className="p-2 w-14 border-r border-[#e2e4e7]"><ImageIcon size={14} className="mx-auto text-[#8c8f94]" /></th>
                <th className="p-2 font-medium min-w-[200px]">Name</th>
                <th className="p-2 font-medium w-32">SKU</th>
                <th className="p-2 font-medium w-24">Stock</th>
                <th className="p-2 font-medium w-32">Price</th>
                <th className="p-2 font-medium w-24">Cost</th>
                <th className="p-2 font-medium w-40">Categories</th>
                <th className="p-2 font-medium w-32">Tags</th>
                <th className="p-2 font-medium w-12 text-center"><Star size={14} className="mx-auto text-[#8c8f94]" /></th>
                <th className="p-2 font-medium w-40">Date</th>
                <th className="p-2 font-medium w-32">Brands</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#f0f0f1]">
              {products.length === 0 ? (
                <tr><td colSpan={12} className="p-10 text-center text-[#50575e] italic">No products found.</td></tr>
              ) : (
                products.map((product, index) => {
                  const displayImage = product.featuredImage || product.images[0]?.url || null;
                  const stock = product.inventoryLevels?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0;
                  const isProcessing = loadingId === product.id;
                  
                  const isAlternate = index % 2 !== 0; 
                  const isSelected = selectedIds.includes(product.id);
                  let rowBg = isSelected ? 'bg-[#fff8e5]' : isAlternate ? 'bg-[#f9f9f9]' : 'bg-white';

                  return (
                    <tr key={product.id} className={`group align-top transition-colors ${rowBg} hover:bg-[#f0f6fc]`}>
                      
                      <td className="p-2 text-center border-r border-[#f0f0f1] pt-[14px]">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.id)} className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] focus:ring-[#2271b1] cursor-pointer" />
                      </td>
                      
                      <td className="p-2 border-r border-[#f0f0f1] pt-[14px]">
                         <div className="w-[32px] h-[32px] bg-[#f0f0f1] border border-[#c3c4c7] rounded-[2px] flex items-center justify-center overflow-hidden mx-auto">
                            {displayImage ? (
                               <img src={displayImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                               <ImageIcon className="text-[#8c8f94]" size={14} />
                            )}
                         </div>
                      </td>
                      
                      <td className="p-2 pt-[14px]">
                         <div className="flex flex-col">
                           <div className="flex items-center gap-1.5">
                             <Link href={`/admin/products/create?id=${product.id}`} className="font-semibold text-[#2271b1] hover:text-[#0a4b78] hover:underline">
                                {product.name} 
                             </Link>
                             {product.status === 'DRAFT' && <span className="text-[#3c434a] font-bold text-[11px]">— Draft</span>}
                           </div>
                           
                           <div className="text-[12px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 flex-wrap">
                               <span className="text-[#8c8f94] text-[10px]">ID: {product.productCode}</span>
                               <span className="text-[#c3c4c7]">|</span>
                               
                               {statusFilter === 'archived' ? (
                                  <>
                                     <button onClick={() => handleSingleAction(product.id, 'restore')} disabled={isProcessing} className="text-[#2271b1] hover:underline">Restore</button>
                                     <span className="text-[#c3c4c7]">|</span>
                                     <button onClick={() => handleSingleAction(product.id, 'delete')} disabled={isProcessing} className="text-[#d63638] hover:underline">Delete Permanently</button>
                                  </>
                               ) : (
                                  <>
                                     <Link href={`/admin/products/create?id=${product.id}`} className="text-[#2271b1] hover:underline">Edit</Link>
                                     <span className="text-[#c3c4c7]">|</span>
                                     <button className="text-[#2271b1] hover:underline">Quick Edit</button>
                                     <span className="text-[#c3c4c7]">|</span>
                                     <button onClick={() => handleSingleAction(product.id, 'trash')} disabled={isProcessing} className="text-[#d63638] hover:underline">Trash</button>
                                     <span className="text-[#c3c4c7]">|</span>
                                     <Link href={`/product/${product.slug}`} target="_blank" className="text-[#2271b1] hover:underline">View</Link>
                                     <span className="text-[#c3c4c7]">|</span>
                                     <button onClick={() => handleSingleAction(product.id, 'duplicate')} disabled={isProcessing} className="text-[#2271b1] hover:underline">Duplicate</button>
                                  </>
                               )}
                           </div>
                         </div>
                      </td>
                      
                      <td className="p-2 pt-[14px]">
                         <span className="text-[#2271b1] hover:underline cursor-pointer">{product.sku || "—"}</span>
                      </td>
                      
                      <td className="p-2 pt-[14px]">
                         {product.trackQuantity ? (
                            <span className={`text-[12px] font-semibold ${stock > 0 ? 'text-[#008a20]' : 'text-[#d63638]'}`}>
                               {stock > 0 ? 'In stock' : 'Out of stock'}
                            </span>
                         ) : (
                            <span className="text-[#008a20] text-[12px] font-semibold">In stock</span>
                         )}
                      </td>
                      
                      <td className="p-2 pt-[14px] text-[#2271b1]">
                         {product.salePrice ? (
                            <div className="flex flex-col">
                               <span className="line-through text-[#8c8f94] text-[11px]">{formatPrice(product.price)}</span>
                               <span>{formatPrice(product.salePrice)}</span>
                            </div>
                         ) : (
                            <span>{formatPrice(product.price)}</span>
                         )}
                      </td>

                      <td className="p-2 pt-[14px] text-[#50575e]">
                         {product.costPerItem ? formatPrice(product.costPerItem) : "—"}
                      </td>
                      
                      <td className="p-2 pt-[14px] text-[#2271b1] hover:underline cursor-pointer">
                         {product.category?.name || "—"}
                      </td>
                      
                      <td className="p-2 pt-[14px] text-[#2271b1] hover:underline cursor-pointer">
                         {product.tags && product.tags.length > 0 
                            ? product.tags.map((t:any) => t.name).join(', ') 
                            : "—"}
                      </td>
                      
                      <td className="p-2 pt-[14px] text-center">
                         {renderStars(product.isFeatured)}
                      </td>
                      
                      <td className="p-2 pt-[14px] text-[#50575e] text-[12px]">
                         {product.status === 'ACTIVE' ? 'Published' : 'Last Modified'} <br/>
                         <span className="text-[#3c434a] font-medium">{formatDate(product.updatedAt)}</span>
                      </td>

                      <td className="p-2 pt-[14px] text-[#2271b1] hover:underline cursor-pointer">
                         {product.brand?.name || "—"}
                      </td>
                      
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot className="bg-[#f6f7f7] border-t border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
              <tr>
                <th className="p-2 w-8 text-center border-r border-[#e2e4e7]">
                  <input type="checkbox" onChange={toggleSelectAll} checked={products.length > 0 && selectedIds.length === products.length} className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] focus:ring-[#2271b1] cursor-pointer" />
                </th>
                <th className="p-2 text-center border-r border-[#e2e4e7]"><ImageIcon size={14} className="mx-auto text-[#8c8f94]" /></th>
                <th className="p-2 font-medium">Name</th>
                <th className="p-2 font-medium">SKU</th>
                <th className="p-2 font-medium">Stock</th>
                <th className="p-2 font-medium">Price</th>
                <th className="p-2 font-medium">Cost</th>
                <th className="p-2 font-medium">Categories</th>
                <th className="p-2 font-medium">Tags</th>
                <th className="p-2 font-medium text-center"><Star size={14} className="mx-auto text-[#8c8f94]" /></th>
                <th className="p-2 font-medium">Date</th>
                <th className="p-2 font-medium">Brands</th>
              </tr>
            </tfoot>

          </table>
        </div>
      </div>

      {/* 🚀 WP Style Pagination (Bottom) */}
      {totalProducts > 0 && (
        <div className="mt-2 flex justify-end">
          <PaginationControls total={totalProducts} totalPages={totalPages} currentPage={currentPage} perPage={limit} />
        </div>
      )}

    </div>
  );
}
