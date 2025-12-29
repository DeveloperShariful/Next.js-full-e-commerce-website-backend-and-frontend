// File: app/(admin)/admin/tags/page.tsx

import { getTags, deleteTag } from "@/app/actions/admin/tags/tag-actions";
import { Plus, Trash2, Edit, Tag as TagIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function TagsPage() {
  const { data: tags } = await getTags();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Tags</h1>
           <p className="text-sm text-slate-500">Manage tags for product filtering ({tags?.length || 0})</p>
        </div>
        <Link href="/admin/tags/create">
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-md">
            <Plus size={18} /> Add Tag
          </button>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
           <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
              <tr>
                 <th className="p-4 font-semibold">Name / Slug</th>
                 <th className="p-4 font-semibold text-center">Color Badge</th>
                 <th className="p-4 font-semibold text-center">Products</th>
                 <th className="p-4 font-semibold text-right">Created</th>
                 <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {tags?.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                        <TagIcon size={32} className="mx-auto mb-2 opacity-20"/>
                        No tags created yet.
                    </td>
                 </tr>
              ) : (
                 tags?.map((tag) => (
                    <tr key={tag.id} className="hover:bg-slate-50 transition group">
                       <td className="p-4">
                          <div className="font-bold text-slate-800">{tag.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{tag.slug}</div>
                       </td>
                       <td className="p-4 text-center">
                          {tag.color ? (
                             <span 
                               className="px-2 py-1 rounded-full text-white text-xs font-bold"
                               style={{ backgroundColor: tag.color }}
                             >
                               {tag.color}
                             </span>
                          ) : <span className="text-slate-400 text-xs">-</span>}
                       </td>
                       <td className="p-4 text-center">
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                             {tag._count.products}
                          </span>
                       </td>
                       <td className="p-4 text-right text-slate-500">
                          {format(new Date(tag.createdAt), "MMM d, yyyy")}
                       </td>
                       <td className="p-4 text-right flex justify-end gap-3 items-center">
                          <Link href={`/admin/tags/${tag.id}`} className="text-slate-400 hover:text-blue-600 transition">
                             <Edit size={18}/>
                          </Link>
                          <form action={async () => {
                              "use server";
                              await deleteTag(tag.id);
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