//app/(admin)/admin/reviews/_components/review-row.tsx

"use client";

import React, { useState } from "react";
import { ReviewData } from "../types";
import { MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface RowProps {
  reviews: ReviewData[];
  // 🚀 FIXED: Matched exact Literal Types
  handleStatusChange: (id: string, status: "PENDING" | "APPROVED" | "SPAM") => void;
  handleDelete: (id: string) => void;
  handleRestore: (id: string) => void;
  handleForceDelete: (id: string) => void;
  handleReplySubmit: (id: string, text: string) => Promise<boolean>;
  selectedIds: string[];
  handleSelectOne: (id: string, checked: boolean) => void;
  currentFilter: string;
}

export default function ReviewRow({ 
  reviews, handleStatusChange, handleDelete, handleRestore, handleForceDelete, handleReplySubmit, selectedIds, handleSelectOne, currentFilter
}: RowProps) {
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const openReplyBox = (id: string, currentReply: string | null) => {
    setReplyingTo(id);
    setReplyText(currentReply || "");
  };

  const closeReplyBox = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const submitInlineReply = async (id: string) => {
    setIsSubmittingReply(true);
    const success = await handleReplySubmit(id, replyText);
    if (success) closeReplyBox();
    setIsSubmittingReply(false);
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={`text-[12px] tracking-widest ${i < rating ? "text-[#1d2327]" : "text-[#c3c4c7]"}`}>
        {i < rating ? "★" : "☆"}
      </span>
    ));
  };

  return (
    <>
      {reviews.map((review, index) => {
        // 🚀 FIXED: 100% WP Style Striped Background Logic
        const isAlternate = index % 2 !== 0; 
        const isSelected = selectedIds.includes(review.id);
        
        // 1. Default Alternate Colors (White / Light Gray)
        let rowBg = isAlternate ? 'bg-[#f9f9f9]' : 'bg-white';
        
        // 2. Override if PENDING (WP uses distinct pinkish alternates)
        if (review.status === "PENDING") {
           rowBg = isAlternate ? 'bg-[#fef7f8]' : 'bg-[#fcf0f1]'; 
        } 
        // 3. Override if SPAM (WP uses distinct orangeish alternates)
        else if (review.status === "SPAM") {
           rowBg = isAlternate ? 'bg-[#fff5eb]' : 'bg-[#ffecd9]'; 
        }
        
        // 4. Override completely if the row is CHECKED/SELECTED (Yellow)
        if (isSelected) {
           rowBg = 'bg-[#fff8e5]'; 
        }

        const isReplying = replyingTo === review.id;

        return (
          <React.Fragment key={review.id}>
            <tr className={`group border-b border-[#f0f0f1] transition-colors ${rowBg} hover:bg-[#f0f6fc]`}>
              
              <td className="p-2 text-center border-r border-[#f0f0f1] align-top pt-3">
                <input type="checkbox" checked={isSelected} onChange={(e) => handleSelectOne(review.id, e.target.checked)} className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] cursor-pointer focus:ring-[#2271b1]" />
              </td>
              
              <td className="p-2 border-r border-[#f0f0f1] align-top pt-3 text-center">
                 <div className="flex items-center justify-center gap-1 text-[#8c8f94] text-[12px]">
                   <MessageSquare size={12} className="opacity-70" />
                   <span>Review</span>
                 </div>
              </td>
              
              <td className="p-2 align-top pt-3">
                <div className="flex items-start gap-2">
                  <div className="w-[32px] h-[32px] rounded-[2px] bg-[#f0f0f1] border border-[#c3c4c7] shrink-0 overflow-hidden">
                    {review.user?.image ? (
                      <img src={review.user.image} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#e2e4e7] flex items-center justify-center text-[#8c8f94] font-bold text-[14px]">{(review.user?.name || "G")[0].toUpperCase()}</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#1d2327]">{review.user?.name || "Guest User"}</span>
                    <a href={`mailto:${review.user?.email}`} className="text-[#2271b1] hover:underline text-[12px]">{review.user?.email}</a>
                  </div>
                </div>
              </td>

              <td className="p-2 align-top pt-3 text-center">
                 <div className="flex justify-center" title={`${review.rating} out of 5 stars`}>{renderStars(review.rating)}</div>
              </td>
              
              <td className="p-2 align-top pt-3 pr-4">
                 <div className="text-[13px] text-[#3c434a] leading-relaxed mb-2">
                   {review.title && <strong className="block mb-1 text-[#1d2327]">{review.title}</strong>}
                   <p>{review.content}</p>
                 </div>

                 {review.reply && !isReplying && (
                   <div className="mb-2 p-2.5 bg-[#f6f7f7] border-l-2 border-[#2271b1] text-[12px] text-[#50575e]">
                     <strong className="block text-[#1d2327] mb-0.5">Store Manager Reply:</strong>
                     <p>{review.reply}</p>
                   </div>
                 )}

                 {!isReplying && (
                   <div className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 flex-wrap mt-2">
                      {currentFilter === "trash" ? (
                        <>
                          <button onClick={() => handleRestore(review.id)} className="text-[#2271b1] hover:underline">Restore</button>
                          <span className="text-[#c3c4c7]">|</span>
                          <button onClick={() => handleForceDelete(review.id)} className="text-[#d63638] hover:underline">Delete permanently</button>
                        </>
                      ) : (
                        <>
                          {review.status === "APPROVED" ? (
                            <button onClick={() => handleStatusChange(review.id, "PENDING")} className="text-[#d63638] hover:underline">Unapprove</button>
                          ) : (
                            <button onClick={() => handleStatusChange(review.id, "APPROVED")} className="text-[#008a20] hover:underline">Approve</button>
                          )}
                          <span className="text-[#c3c4c7]">|</span>
                          <button onClick={() => openReplyBox(review.id, review.reply)} className="text-[#2271b1] hover:underline">Reply</button>
                          <span className="text-[#c3c4c7]">|</span>
                          <Link href={`/admin/reviews/${review.id}`} className="text-[#2271b1] hover:underline">Edit</Link>
                          <span className="text-[#c3c4c7]">|</span>
                          {review.status !== "SPAM" && (
                            <>
                              <button onClick={() => handleStatusChange(review.id, "SPAM")} className="text-[#d63638] hover:underline">Spam</button>
                              <span className="text-[#c3c4c7]">|</span>
                            </>
                          )}
                          <button onClick={() => handleDelete(review.id)} className="text-[#d63638] hover:underline">Trash</button>
                        </>
                      )}
                   </div>
                 )}

                 {isReplying && (
                    <div className="mt-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-[3px] shadow-inner p-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex gap-1 mb-2">
                        {['b', 'i', 'link', 'b-quote', 'del', 'ins', 'img', 'ul', 'ol', 'li', 'code', 'close tags'].map(tag => (
                          <span key={tag} className="px-2 py-0.5 border border-[#8c8f94] rounded-[2px] bg-white text-[11px] text-[#3c434a] hover:bg-[#f0f0f1] cursor-pointer">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <textarea 
                        rows={4}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full p-2 border border-[#8c8f94] rounded-[3px] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-y"
                        placeholder="Write your reply here..."
                      />
                      <div className="flex items-center gap-2 mt-2">
                         <button 
                           onClick={() => submitInlineReply(review.id)} 
                           disabled={isSubmittingReply}
                           className="px-3 py-1 bg-[#2271b1] text-white text-[12px] font-medium rounded-[3px] hover:bg-[#135e96] flex items-center gap-1 shadow-sm disabled:opacity-70"
                         >
                           {isSubmittingReply && <Loader2 size={12} className="animate-spin" />}
                           Reply
                         </button>
                         <button onClick={closeReplyBox} className="px-3 py-1 bg-white border border-[#8c8f94] text-[#3c434a] text-[12px] rounded-[3px] hover:bg-[#f6f7f7]">
                           Cancel
                         </button>
                      </div>
                    </div>
                 )}
              </td>

              <td className="p-2 align-top pt-3 border-l border-[#f0f0f1]">
                <div className="flex flex-col items-start gap-1.5">
                  <Link href={`/admin/products/${review.product?.slug}`} className="text-[#2271b1] hover:text-[#0a4b78] hover:underline font-medium text-[13px] leading-tight">
                    {review.product?.name || "Unknown Product"}
                  </Link>
                  <div className="mt-1 bg-[#646970] text-white px-2 py-0.5 rounded-[10px] text-[10px] font-bold shadow-sm">
                    {review.product?._count?.reviews || 0}
                  </div>
                </div>
              </td>

              <td className="p-2 align-top pt-3 text-[12px] text-[#50575e]">
                 {format(new Date(review.createdAt), "yyyy/MM/dd 'at' h:mm a")}
              </td>

            </tr>
          </React.Fragment>
        );
      })}
    </>
  );
}