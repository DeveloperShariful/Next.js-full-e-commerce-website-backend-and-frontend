// File: app/(admin)/admin/brands/page.tsx

import { getBrands, deleteBrand } from "@/app/actions/admin/brands/brand-actions";
import { Plus, Trash2, Edit, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function BrandsPage() {
  const { data: brands } = await getBrands();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Brands</h1>
           <p className="text-sm text-slate-500">Manage your product brands</p>
        </div>
        <Link href="/admin/brands/create">
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-md">
            <Plus size={18} /> Add Brand
          </button>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
           <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                 <th className="p-4 font-semibold">Name / Slug</th>
                 <th className="p-4 font-semibold">Country</th>
                 <th className="p-4 font-semibold text-center">Products</th>
                 <th className="p-4 font-semibold text-right">Created</th>
                 <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {brands?.length === 0 ? (
                 <tr><td colSpan={5} className="p-8 text-center text-slate-500">No brands found.</td></tr>
              ) : (
                 brands?.map((brand) => (
                    <tr key={brand.id} className="hover:bg-slate-50 transition group">
                       <td className="p-4">
                          <div className="font-bold text-slate-800">{brand.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                             {brand.slug}
                             {brand.website && (
                               <a href={brand.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline ml-2 flex items-center gap-0.5">
                                 <ExternalLink size={10}/> Site
                               </a>
                             )}
                          </div>
                       </td>
                       <td className="p-4 text-slate-600">
                          {brand.countryOfOrigin || "N/A"}
                       </td>
                       <td className="p-4 text-center">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                             {brand._count.products}
                          </span>
                       </td>
                       <td className="p-4 text-right text-slate-500">
                          {format(new Date(brand.createdAt), "MMM d, yyyy")}
                       </td>
                       <td className="p-4 text-right flex justify-end gap-3 items-center">
                          <Link href={`/admin/brands/${brand.id}`} className="text-slate-400 hover:text-blue-600 transition">
                             <Edit size={18}/>
                          </Link>
                          <form action={async () => {
                              "use server";
                              await deleteBrand(brand.id);
                          }}>
                              <button className="text-slate-400 hover:text-red-500 transition"><Trash2 size={18}/></button>
                          </form>
                       </td>
                    </tr>
                 ))
              )}
           </tbody>
        </table>
      </div>
    </div>
  );
}