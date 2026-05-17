// File Location: app/admin/orders/create/_components/create-sidebar-notes.tsx

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { OrderDataType } from "../types";

interface CreateSidebarNotesProps {
  orderData: OrderDataType;
  setOrderData: React.Dispatch<React.SetStateAction<OrderDataType>>;
}

export const CreateSidebarNotes = ({ orderData, setOrderData }: CreateSidebarNotesProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [noteType, setNoteType] = useState<"private" | "customer">("private");
  const [tempNote, setTempNote] = useState("");

  const handleAddNote = (e: React.FormEvent) => {
      e.preventDefault();
      if (!tempNote.trim()) return;

      if (noteType === "private") {
          const current = orderData.adminNote ? orderData.adminNote + "\n" : "";
          setOrderData({ ...orderData, adminNote: current + tempNote });
      } else {
          const current = orderData.customerNote ? orderData.customerNote + "\n" : "";
          setOrderData({ ...orderData, customerNote: current + tempNote });
      }
      setTempNote("");
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
        
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
                
                {/* Notes Display Area */}
                {(orderData.adminNote || orderData.customerNote) ? (
                    <div className="max-h-[150px] overflow-y-auto mb-4 border-b border-[#f0f0f1] pb-2 space-y-2">
                        {orderData.adminNote && (
                            <div className="p-2 bg-[#e5f5fa] border border-[#c0d9e1] rounded-[3px] text-[13px] text-[#1d2327] shadow-sm">
                                <span className="block text-[11px] font-semibold text-[#646970] mb-0.5">Private Note</span>
                                {orderData.adminNote}
                            </div>
                        )}
                        {orderData.customerNote && (
                            <div className="p-2 bg-[#f6f7f7] border border-[#e2e4e7] rounded-[3px] text-[13px] text-[#1d2327] shadow-sm">
                                <span className="block text-[11px] font-semibold text-[#646970] mb-0.5">Note to Customer</span>
                                {orderData.customerNote}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-[13px] text-[#646970] mb-4 italic">There are no notes yet.</p>
                )}

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2">
                    <label className="text-[12px] text-[#646970] font-semibold">Add note</label>
                    <textarea 
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        className="w-full h-[60px] p-2 border border-[#8c8f94] text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] shadow-sm rounded-[3px] resize-none"
                    ></textarea>
                    
                    <div className="flex gap-2">
                        <select 
                            value={noteType}
                            onChange={(e) => setNoteType(e.target.value as "private" | "customer")}
                            className="w-full h-[30px] px-2 border border-[#8c8f94] bg-white text-[#32373c] text-[13px] outline-none shadow-sm rounded-[3px]"
                        >
                            <option value="private">Private note</option>
                            <option value="customer">Note to customer</option>
                        </select>
                        <button 
                            type="submit" 
                            disabled={!tempNote.trim()}
                            className="border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-4 text-[13px] rounded-[3px] font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                            Add
                        </button>
                    </div>
                </form>
            </div>
        )}
    </div>
  );
};