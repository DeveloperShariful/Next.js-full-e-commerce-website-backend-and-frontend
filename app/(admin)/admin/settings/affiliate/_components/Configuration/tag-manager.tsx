//app/(admin)/admin/settings/affiliate/_components/Configuration/tag-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { Tag, Plus, Trash2, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { createTagAction, deleteTagAction } from "@/app/actions/admin/settings/affiliate/_services/coupon-tag-service";

export default function TagManager({ initialTags }: { initialTags: any[] }) {
  const [tags, setTags] = useState(initialTags);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const res = await createTagAction(data.name);
      if (res.success) {
        toast.success("Tag created");
        reset();
        // বাস্তবে এখানে router.refresh() বা state update করতে হবে
        setTags([...tags, { id: Date.now().toString(), name: data.name }]); 
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    if(!confirm("Delete tag?")) return;
    startTransition(async () => {
       const res = await deleteTagAction(id);
       if(res.success) {
         toast.success("Tag deleted");
         setTags(tags.filter(t => t.id !== id));
       }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Create Form */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4"/> Create Tag
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Tag Name</label>
            <input {...register("name", { required: true })} className="w-full border p-2 rounded-lg text-sm mt-1" placeholder="e.g. VIP, Influencer" />
          </div>
          <button disabled={isPending} className="w-full bg-black text-white py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Tag
          </button>
        </form>
      </div>

      {/* List */}
      <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-bold text-gray-900">Available Tags</h3>
        </div>
        <div className="p-4 flex flex-wrap gap-2">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 group">
              <span className="text-sm font-medium text-gray-700">{tag.name}</span>
              <button onClick={() => handleDelete(tag.id)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {tags.length === 0 && <p className="text-gray-400 text-sm italic">No tags found.</p>}
        </div>
      </div>
    </div>
  );
}