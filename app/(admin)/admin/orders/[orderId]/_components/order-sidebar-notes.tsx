// File Location: app/admin/orders/[orderId]/_components/order-sidebar-notes.tsx

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronUp, ChevronDown, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { addOrderNote } from "@/app/actions/admin/order/add-note"; 

// ✅ STRICT TYPES IMPORT
import { OrderDetailsType, OrderNote } from "../types";

interface OrderSidebarNotesProps {
  order: OrderDetailsType;
}

export const OrderSidebarNotes = ({ order }: OrderSidebarNotesProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [noteType, setNoteType] = useState<string>("private");

  const handleAddNote = async (formData: FormData) => {
    setLoading(true);
    // If it's a customer note, we pass notify=on based on schema structure
    if(noteType === "customer") formData.append("notify", "on");
    
    const res = await addOrderNote(formData);
    if(res.success) {
        toast.success("Note added.");
        (document.getElementById("note-form") as HTMLFormElement).reset();
    } else {
        toast.error(res.error);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        
        {/* Meta Box Header */}
        <div 
            className="px-3 py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
        >
            <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Order notes</h2>
            <button type="button" className="text-[#646970]">
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
        </div>

        {isOpen && (
            <div className="p-3">
                {/* Scrollable Notes List */}
                <div className="max-h-[250px] overflow-y-auto mb-4 border-b border-[#f0f0f1] pb-2">
                    <ul className="space-y-3 m-0 p-0 list-none">
                        {order.orderNotes.length === 0 && (
                            <li className="text-[13px] text-[#646970] italic">There are no notes yet.</li>
                        )}
                        {order.orderNotes.map((note: OrderNote) => (
                            <li key={note.id} className="text-[13px]">
                                <div className="text-[11px] text-[#646970] mb-0.5 flex items-center gap-1">
                                    {format(new Date(note.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                                    {note.isSystem && <span className="font-semibold text-[#2271b1]">(System)</span>}
                                    {note.notify && <span className="flex items-center gap-0.5 text-[#dba617] font-semibold" title="Emailed to customer"><Mail size={10}/></span>}
                                </div>
                                <p className={`p-2 m-0 rounded-[3px] shadow-sm border ${
                                    note.isSystem 
                                        ? 'bg-[#f6f7f7] border-[#e2e4e7] text-[#646970]' 
                                        : 'bg-[#e5f5fa] border-[#c0d9e1] text-[#1d2327]'
                                }`}>
                                    {note.content}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Add Note Form */}
                <form id="note-form" action={handleAddNote} className="space-y-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    
                    <label className="text-[12px] text-[#646970] font-semibold">Add note</label>
                    <textarea 
                        name="content" 
                        required
                        className="w-full h-[60px] p-2 border border-[#8c8f94] text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-sm rounded-[3px] resize-none"
                    ></textarea>
                    
                    <div className="flex gap-2">
                        <select 
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value)}
                            className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none shadow-sm rounded-[3px]"
                        >
                            <option value="private">Private note</option>
                            <option value="customer">Note to customer</option>
                        </select>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                        </button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};