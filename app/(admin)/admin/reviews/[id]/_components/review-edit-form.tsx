//app/(admin)/admin/reviews/[id]/_components/review-edit-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { updateFullReview } from "@/app/actions/admin/review/actions";
import { format } from "date-fns";

// Types matching your database structure
interface ReviewEditFormProps {
  initialData: {
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    status: "PENDING" | "APPROVED" | "SPAM" | "TRASH";
    createdAt: Date;
    user: {
      name: string | null;
      email: string;
      image: string | null;
    } | null;
    product: {
      name: string;
      slug: string;
      featuredImage: string | null;
    } | null;
  };
}

export default function ReviewEditForm({ initialData }: ReviewEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDateEditOpen, setIsDateEditOpen] = useState(false);

  // States for all editable fields
  const [formData, setFormData] = useState({
    title: initialData.title || "",
    content: initialData.content || "",
    rating: initialData.rating,
    status: initialData.status,
    // Converting Date object to string format required for datetime-local input
    createdAt: new Date(initialData.createdAt).toISOString().slice(0, 16)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast.error("Review content cannot be empty.");
      return;
    }

    const toastId = toast.loading("Updating review...");

    startTransition(async () => {
      const res = await updateFullReview(initialData.id, {
        title: formData.title,
        content: formData.content,
        rating: formData.rating,
        status: formData.status,
        createdAt: new Date(formData.createdAt) // Parse back to Date object
      });

      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        router.refresh(); // Refresh to get the latest data
      } else {
        toast.error(res.error as string, { id: toastId });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-5 items-start animate-in fade-in duration-300">
      
      {/* ========================================================
          LEFT COLUMN: AUTHOR, EDITOR & RATING (WP Style Layout)
      ======================================================== */}
      <div className="w-full lg:flex-1 space-y-5">
        
        {/* Author Details Box */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm">
          <h3 className="px-4 py-2.5 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-white">
            Author
          </h3>
          <div className="p-4 space-y-4 bg-white">
            <div className="grid grid-cols-[80px_1fr] items-center">
              <label className="text-[13px] text-[#3c434a] font-medium">Name</label>
              <input 
                type="text" 
                disabled
                value={initialData.user?.name || "Guest User"} 
                className="w-full px-2 py-1 bg-[#f0f0f1] border border-[#c3c4c7] rounded-[3px] text-[13px] text-[#8c8f94] cursor-not-allowed" 
              />
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center">
              <label className="text-[13px] text-[#3c434a] font-medium">Email</label>
              <input 
                type="text" 
                disabled
                value={initialData.user?.email || "N/A"} 
                className="w-full px-2 py-1 bg-[#f0f0f1] border border-[#c3c4c7] rounded-[3px] text-[13px] text-[#8c8f94] cursor-not-allowed" 
              />
            </div>
            {/* Notice matching WP logic where author data cannot be easily changed on reviews */}
            <p className="text-[11px] text-[#8c8f94] ml-[80px] italic">
              Note: Author details are tied to the registered user account and cannot be modified here.
            </p>
          </div>
        </div>

        {/* Review Editor Box */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm">
          {/* WP Style Text Editor Toolbar (Visual Dummy for exact UI matching) */}
          <div className="px-3 py-2 bg-[#f0f0f1] border-b border-[#c3c4c7] flex gap-1 flex-wrap">
            {['b', 'i', 'link', 'b-quote', 'del', 'ins', 'img', 'ul', 'ol', 'li', 'code', 'close tags'].map(tag => (
              <span key={tag} className="px-2 py-0.5 border border-[#8c8f94] rounded-[3px] bg-white text-[12px] text-[#3c434a] hover:bg-[#f6f7f7] cursor-pointer">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="bg-white">
            <textarea 
              rows={12} 
              value={formData.content} 
              onChange={(e) => setFormData({...formData, content: e.target.value})} 
              className="w-full p-4 border-none text-[14px] text-[#3c434a] focus:ring-0 outline-none resize-y" 
              placeholder="Enter review content here..."
            />
          </div>
        </div>

        {/* Rating Edit Box */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm">
          <h3 className="px-4 py-2.5 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7]">
            Rating
          </h3>
          <div className="p-4 bg-white">
            <select 
              value={formData.rating} 
              onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})} 
              className="w-full sm:w-[150px] px-2 py-1 bg-white border border-[#8c8f94] rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none"
            >
              <option value={5}>5 ★★★★★</option>
              <option value={4}>4 ★★★★☆</option>
              <option value={3}>3 ★★★☆☆</option>
              <option value={2}>2 ★★☆☆☆</option>
              <option value={1}>1 ★☆☆☆☆</option>
            </select>
            <p className="text-[12px] text-[#646970] mt-2">Update the star rating given by the customer.</p>
          </div>
        </div>

      </div>

      {/* ========================================================
          RIGHT COLUMN: STATUS, DATES & PUBLISH (WP Style Layout)
      ======================================================== */}
      <div className="w-full lg:w-[280px] xl:w-[300px] shrink-0 space-y-5">
        
        {/* Save/Publish Box */}
        <div className="bg-white border border-[#c3c4c7] shadow-sm">
          <h3 className="px-4 py-2.5 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7]">
            Save
          </h3>
          
          <div className="p-4 space-y-4">
            
            {/* Status Radio Buttons */}
            <div className="space-y-2">
              <p className="text-[13px] text-[#3c434a] font-semibold mb-1 flex items-center gap-1.5">
                <span className="text-[#8c8f94]">📌</span> Status: 
                <span className="font-bold ml-1">
                  {formData.status === "APPROVED" ? "Approved" : formData.status === "PENDING" ? "Pending" : "Spam"}
                </span>
              </p>
              <div className="flex flex-col gap-1.5 pl-5">
                <label className="flex items-center gap-2 text-[13px] text-[#3c434a] cursor-pointer">
                  <input type="radio" name="status" value="APPROVED" checked={formData.status === "APPROVED"} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]" />
                  Approved
                </label>
                <label className="flex items-center gap-2 text-[13px] text-[#3c434a] cursor-pointer">
                  <input type="radio" name="status" value="PENDING" checked={formData.status === "PENDING"} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]" />
                  Pending
                </label>
                <label className="flex items-center gap-2 text-[13px] text-[#3c434a] cursor-pointer">
                  <input type="radio" name="status" value="SPAM" checked={formData.status === "SPAM"} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]" />
                  Spam
                </label>
              </div>
            </div>

            {/* Date Editor */}
            <div className="pt-3 border-t border-[#f0f0f1]">
               <div className="text-[13px] text-[#3c434a] flex items-start gap-1.5">
                  <span className="text-[#8c8f94] mt-0.5">📅</span>
                  <div className="flex-1">
                    <p className="mb-1">
                      Submitted on: <span className="font-bold">{format(new Date(formData.createdAt), "MMM d, yyyy 'at' hh:mm a")}</span>
                    </p>
                    
                    {!isDateEditOpen ? (
                      <button type="button" onClick={() => setIsDateEditOpen(true)} className="text-[#2271b1] hover:underline text-[13px]">
                        Edit
                      </button>
                    ) : (
                      <div className="mt-2 bg-[#f6f7f7] p-3 border border-[#c3c4c7] rounded-[3px] shadow-inner">
                        <label className="block text-[11px] font-semibold text-[#646970] uppercase mb-1">Change Date & Time</label>
                        <input 
                          type="datetime-local" 
                          value={formData.createdAt}
                          onChange={(e) => setFormData({...formData, createdAt: e.target.value})}
                          className="w-full px-2 py-1 text-[13px] border border-[#8c8f94] rounded-[3px] focus:border-[#2271b1] outline-none"
                        />
                        <div className="flex gap-2 mt-2">
                           <button type="button" onClick={() => setIsDateEditOpen(false)} className="px-2 py-0.5 bg-[#f0f0f1] border border-[#c3c4c7] text-[#3c434a] text-[12px] rounded-[3px] hover:bg-white">OK</button>
                           <button type="button" onClick={() => { setIsDateEditOpen(false); setFormData({...formData, createdAt: new Date(initialData.createdAt).toISOString().slice(0, 16)}) }} className="text-[#2271b1] hover:underline text-[12px]">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* In Response To (Read Only info like WP) */}
            <div className="pt-3 border-t border-[#f0f0f1]">
               <div className="text-[13px] text-[#3c434a] flex items-start gap-1.5">
                  <span className="text-[#8c8f94] mt-0.5">💬</span>
                  <div>
                    <p>In response to:</p>
                    <Link href={`/admin/products/${initialData.product?.slug}`} className="text-[#2271b1] font-semibold hover:underline mt-1 block leading-tight">
                      {initialData.product?.name}
                    </Link>
                  </div>
               </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-3 bg-[#f6f7f7] border-t border-[#c3c4c7] flex justify-between items-center">
             <button 
               type="button"
               onClick={() => {
                 setFormData({...formData, status: "TRASH"});
                 toast("Status set to Trash. Click Update to confirm.");
               }}
               className="text-[#d63638] text-[13px] hover:underline"
             >
               Move to Trash
             </button>
             
             <button 
               type="submit" 
               disabled={isPending}
               className="px-4 py-1.5 bg-[#2271b1] text-white text-[13px] font-medium rounded-[3px] border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] transition-colors disabled:opacity-70 flex items-center gap-1.5 shadow-sm"
             >
               {isPending && <Loader2 className="animate-spin" size={14}/>}
               Update
             </button>
          </div>
        </div>

      </div>
    </form>
  );
}