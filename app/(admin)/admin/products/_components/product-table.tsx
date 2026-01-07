// app/admin/products/_components/product-table.tsx

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Image as ImageIcon, Star, Loader2 } from "lucide-react";
import { bulkProductAction, moveToTrash, deleteProduct } from "@/app/actions/admin/product/product-list"; 
import { duplicateProduct } from "@/app/actions/admin/product/duplicate-product"; 
import { toast } from "react-hot-toast";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface ProductTableProps {
  products: any[];
  categories: any[];
  counts: any;
  statusFilter: string;
}

export default function ProductTable({ products, categories, counts, statusFilter }: ProductTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const { formatPrice } = useGlobalStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [query, setQuery] = useState(searchParams.get("query") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (query) params.set("query", query);
    else params.delete("query");
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleFilter = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(type, value);
    else params.delete(type);
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

  // ✅ FIX 1: Bulk Action Fix
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
                setSelectedIds([]); // সিলেকশন ক্লিয়ার
                setBulkAction("");  // ড্রপডাউন রিসেট
                router.refresh();   // 🔥 ফোর্স রিফ্রেশ (UI সাথে সাথে আপডেট হবে)
            } else {
                toast.error(res.message || "Action failed");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    });
  };

  // ✅ FIX 2: Single Action Fix (Try-Finally)
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
                  router.refresh(); // 🔥 ফোর্স রিফ্রেশ
              } else {
                  toast.error(res?.message || "Action failed");
              }
          } catch (error) {
              toast.error("An error occurred");
          } finally {
              // 🔥 কাজ শেষ হোক বা এরর হোক, লোডিং বন্ধ হবেই
              setLoadingId(null);
          }
      });
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 text-sm mb-4 text-slate-500">
         <Link href="/admin/products" className={`${!statusFilter ? 'font-bold text-black' : 'text-blue-600 hover:underline'}`}>
            All <span className="text-slate-400">({counts.all})</span>
         </Link>
         <span className="text-slate-300 hidden sm:inline">|</span>
         <Link href="/admin/products?status=active" className={`${statusFilter === 'active' ? 'font-bold text-black' : 'text-blue-600 hover:underline'}`}>
            Published <span className="text-slate-400">({counts.active})</span>
         </Link>
         <span className="text-slate-300 hidden sm:inline">|</span>
         <Link href="/admin/products?status=draft" className={`${statusFilter === 'draft' ? 'font-bold text-black' : 'text-blue-600 hover:underline'}`}>
            Drafts <span className="text-slate-400">({counts.draft})</span>
         </Link>
         <span className="text-slate-300 hidden sm:inline">|</span>
         <Link href="/admin/products?status=archived" className={`${statusFilter === 'archived' ? 'font-bold text-black' : 'text-blue-600 hover:underline'}`}>
            Trash <span className="text-slate-400">({counts.archived})</span>
         </Link>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
           <div className="flex gap-2 w-full sm:w-auto">
               <select 
                  value={bulkAction} 
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="h-9 px-3 border border-slate-400 rounded text-sm bg-white outline-none focus:border-blue-500 w-full sm:w-auto cursor-pointer"
               >
                  <option value="">Bulk Actions</option>
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
                  disabled={isPending || !bulkAction}
                  className="h-9 px-4 border border-slate-400 rounded text-sm bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[80px]"
               >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
               </button>
           </div>
           
           <div className="flex gap-2 w-full sm:w-auto">
              <select onChange={(e) => handleFilter("category", e.target.value)} className="h-9 px-3 border border-slate-400 rounded text-sm bg-white outline-none w-full sm:w-40 cursor-pointer">
                 <option value="">Select a category</option>
                 {categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                 ))}
              </select>
              <select onChange={(e) => handleFilter("type", e.target.value)} className="h-9 px-3 border border-slate-400 rounded text-sm bg-white outline-none w-full sm:w-32 cursor-pointer">
                 <option value="">Filter by type</option>
                 <option value="SIMPLE">Simple</option>
                 <option value="VARIABLE">Variable</option>
              </select>
           </div>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full lg:w-auto">
           <input 
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder="Search products..." 
             className="h-9 pl-3 pr-8 border border-slate-400 rounded text-sm w-full lg:w-64 outline-none focus:border-blue-500" 
           />
           <button type="submit" className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-slate-500 hover:text-slate-700 cursor-pointer">
              <Search size={16} />
           </button>
        </form>
      </div>

      <div className={`bg-white border border-slate-300 shadow-sm overflow-x-auto rounded-sm transition-opacity duration-200 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <table className="w-full text-left border-collapse text-sm min-w-[600px] md:min-w-full">
          <thead className="bg-white border-b border-slate-300 text-slate-700">
            <tr>
              <th className="p-3 w-10 text-center">
                  <input type="checkbox" onChange={toggleSelectAll} checked={products.length > 0 && selectedIds.length === products.length} className="rounded border-slate-400 cursor-pointer w-4 h-4 accent-blue-600" />
              </th>
              <th className="p-3 w-16 text-center"><ImageIcon size={16} className="mx-auto text-slate-400" /></th>
              <th className="p-3 font-semibold text-blue-600 min-w-[200px]">Name</th>
              <th className="p-3 font-semibold hidden md:table-cell">SKU</th>
              <th className="p-3 font-semibold">Stock</th>
              <th className="p-3 font-semibold">Price</th>
              <th className="p-3 font-semibold hidden lg:table-cell">Categories</th>
              <th className="p-3 font-semibold hidden xl:table-cell">Brand</th> 
              <th className="p-3 font-semibold hidden 2xl:table-cell">Tags</th>
              <th className="p-3 font-semibold text-center hidden sm:table-cell"><Star size={16} className="mx-auto text-slate-400" /></th>
              <th className="p-3 font-semibold hidden lg:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.length === 0 ? (
              <tr><td colSpan={11} className="p-16 text-center text-slate-500">No products found.</td></tr>
            ) : (
              products.map((product) => {
                const displayImage = product.featuredImage || product.images[0]?.url || null;
                const stock = product.inventoryLevels?.reduce((acc: number, curr: any) => acc + curr.quantity, 0) || 0;
                const isProcessing = loadingId === product.id;

                return (
                  <tr key={product.id} className="hover:bg-[#F9F9F9] group align-top transition-colors">
                    <td className="p-3 text-center">
                        <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelect(product.id)} className="rounded border-slate-400 cursor-pointer w-4 h-4 accent-blue-600" />
                    </td>
                    <td className="p-3">
                       <div className="h-10 w-10 bg-slate-100 border border-slate-300 flex items-center justify-center overflow-hidden rounded-sm">
                          {displayImage ? (
                             <img src={displayImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                             <ImageIcon className="text-slate-300" size={20} />
                          )}
                       </div>
                    </td>
                    <td className="p-3">
                       <Link href={`/admin/products/create?id=${product.id}`} className="font-semibold text-blue-600 hover:underline block mb-1">
                          {product.name} 
                          {product.status === 'DRAFT' && <span className="text-slate-400 font-normal italic text-xs ml-1">— Draft</span>}
                       </Link>
                       <div className="flex flex-wrap gap-1 text-[11px] text-slate-400 mt-1 items-center h-5">
                          <span className="text-slate-500 font-bold bg-slate-100 px-1 rounded">ID: {product.productCode} | </span>
                          
                          {statusFilter === 'archived' ? (
                             <div className="flex gap-2 items-center">
                                <button onClick={() => handleSingleAction(product.id, 'restore')} disabled={isProcessing} className="text-blue-600 hover:underline disabled:opacity-50 flex items-center gap-1">
                                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : "Restore"}
                                </button>
                                <span className="text-slate-300"> | </span>
                                <button onClick={() => handleSingleAction(product.id, 'delete')} disabled={isProcessing} className="text-red-600 hover:underline disabled:opacity-50 flex items-center gap-1">
                                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : "Delete Permanently"}
                                </button>
                             </div>
                          ) : (
                             <div className="flex gap-2 items-center">
                                <Link href={`/admin/products/create?id=${product.id}`} className="text-blue-600 hover:underline">Edit</Link>
                                <span className="text-slate-300"> | </span>
                                <button onClick={() => handleSingleAction(product.id, 'trash')} disabled={isProcessing} className="text-red-600 hover:underline disabled:opacity-50 flex items-center gap-1">
                                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : "Trash"}
                                </button>
                                <span className="text-slate-300"> | </span>
                                <Link href={`/product/${product.slug}`} target="_blank" className="text-blue-600 hover:underline">View</Link>
                                <span className="text-slate-300"> | </span>
                                <button onClick={() => handleSingleAction(product.id, 'duplicate')} disabled={isProcessing} className="text-blue-600 hover:underline disabled:opacity-50 flex items-center gap-1">
                                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin"/> : "Duplicate"}
                                </button>
                             </div>
                          )}
                       </div>
                    </td>
                    <td className="p-3 text-slate-600 hidden md:table-cell">{product.sku || <span className="text-slate-400">–</span>}</td>
                    <td className="p-3">
                       {product.trackQuantity ? (
                          <span className={`text-xs font-bold ${stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {stock > 0 ? 'In stock' : 'Out of stock'} <span className="font-normal text-slate-500">({stock})</span>
                          </span>
                       ) : (
                          <span className="text-green-600 text-xs font-bold">In stock</span>
                       )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                       {product.salePrice ? (
                          <div className="flex flex-col">
                             <span className="line-through text-slate-400 text-xs">{formatPrice(product.price)}</span>
                             <span className="font-medium text-slate-800">{formatPrice(product.salePrice)}</span>
                          </div>
                       ) : (
                          <span className="font-medium text-slate-800">{formatPrice(product.price)}</span>
                       )}
                    </td>
                    <td className="p-3 text-blue-600 hover:underline cursor-pointer hidden lg:table-cell">
                       {product.category?.name || <span className="text-slate-400">–</span>}
                    </td>
                    <td className="p-3 text-slate-600 hidden xl:table-cell">
                        {product.brand?.name || <span className="text-slate-400">–</span>}
                    </td>
                    <td className="p-3 text-slate-600 hidden 2xl:table-cell">
                       {product.tags && product.tags.length > 0 
                          ? product.tags.map((t:any) => t.name).join(', ') 
                          : <span className="text-slate-400">–</span>}
                    </td>
                    <td className="p-3 text-center hidden sm:table-cell">
                       <Star size={16} className={`mx-auto cursor-pointer transition-colors ${product.isFeatured ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`} />
                    </td>
                    <td className="p-3 text-slate-500 text-xs hidden lg:table-cell">
                       {product.status === 'ACTIVE' ? 'Published' : 'Last Modified'} <br/>
                       <span className="text-slate-700">{formatDate(product.updatedAt)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}