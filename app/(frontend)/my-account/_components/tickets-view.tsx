// File: app/(frontend)/my-account/_components/tickets-view.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { formatTz } from "@/lib/store-time";
import { HelpCircle, Plus, Send, X, Loader2, MessageSquare, ArrowLeft } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { createSupportTicketAction, sendTicketReplyAction } from "@/app/actions/frontend/my-account/ticket-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TicketMessage {
  id: string;
  senderId: string;
  message: string;
  createdAt: string | Date;
}

interface TicketData {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string | Date;
  messages: TicketMessage[];
}

interface Props {
  initialTickets: TicketData[];
}

export default function TicketsView({ initialTickets }: Props) {
  const { timezone } = useGlobalStore();
  const [tickets, setTickets] = useState<TicketData[]>(initialTickets);
  const [activeTicket, setActiveTicket] = useState<TicketData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create Ticket Form
  const { register: registerTicket, handleSubmit: handleSubmitTicket, reset: resetTicket } = useForm({
    defaultValues: { subject: "", message: "", priority: "MEDIUM" }
  });

  // Reply Form
  const [replyMessage, setReplyMessage] = useState("");

  const handleCreateTicket = (data: any) => {
    startTransition(async () => {
      const res = await createSupportTicketAction(data);
      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        resetTicket();
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;

    startTransition(async () => {
      const res = await sendTicketReplyAction({ ticketId: activeTicket.id, message: replyMessage });
      if (res.success) {
        toast.success(res.message);
        
        // Optimistic UI Update
        const newMsg = {
          id: `temp-${Date.now()}`,
          senderId: activeTicket.messages[0].senderId, // Assuming customer is original sender
          message: replyMessage,
          createdAt: new Date().toISOString()
        };
        
        setActiveTicket({
          ...activeTicket,
          status: "OPEN",
          messages: [...activeTicket.messages, newMsg]
        });

        setReplyMessage("");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      
      {!activeTicket ? (
        // --- 1. TICKET LIST VIEW (WP Style) ---
        <div className="bg-white border border-[#c3c4c7] shadow-sm">
            <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1] flex justify-between items-center">
                <div>
                    <h3 className="text-[14px] font-semibold m-0">Support Tickets</h3>
                    <p className="text-[12px] text-[#50575e] m-0">Need help? Open a ticket to chat with our staff.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-3 py-1 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] flex items-center gap-1 shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> Open New Ticket
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse">
                    <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7]">
                        <tr>
                            <th className="px-4 py-2 font-semibold">Subject</th>
                            <th className="px-4 py-2 font-semibold">Status</th>
                            <th className="px-4 py-2 font-semibold">Last Updated</th>
                            <th className="px-4 py-2 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f1] bg-white">
                        {tickets.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-[#50575e] bg-[#f6f7f7] italic">You have no active support tickets.</td></tr>
                        ) : (
                            tickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-[#f6f7f7]">
                                    <td className="px-4 py-3 font-semibold text-[#2271b1] hover:underline cursor-pointer" onClick={() => setActiveTicket(ticket)}>
                                        {ticket.subject}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn("px-1.5 py-0.5 rounded-sm text-[10px] font-bold border uppercase", 
                                            ticket.status === "OPEN" ? "bg-[#f0f6fc] text-[#2271b1] border-[#2271b1]/20" :
                                            ticket.status === "IN_PROGRESS" ? "bg-[#fcf9e8] text-[#8a6d3b] border-[#f0b849]/30" : "bg-[#fcf0f1] text-[#50575e] border-[#c3c4c7]/30"
                                        )}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[#50575e]">
                                        {formatTz(new Date(ticket.createdAt), timezone, "yyyy/M/d h:mm a")}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => setActiveTicket(ticket)} className="text-[#2271b1] hover:underline text-[12px] flex items-center gap-1 ml-auto">
                                            <MessageSquare className="w-3.5 h-3.5" /> Chat ({ticket.messages.length})
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        // --- 2. LIVE CHAT THREAD VIEW (WP Metabox Style) ---
        <div className="bg-white border border-[#c3c4c7] shadow-sm flex flex-col h-[550px] animate-in slide-in-from-left-2">
            <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1] flex justify-between items-center shrink-0">
                <button onClick={() => setActiveTicket(null)} className="text-[#2271b1] hover:underline text-[12px] flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back to List
                </button>
                <h4 className="font-semibold text-[14px] m-0 truncate max-w-[200px]">{activeTicket.subject}</h4>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f6f7f7] space-y-4 custom-scrollbar">
                {activeTicket.messages.map((msg) => {
                    const isMe = msg.senderId === activeTicket.messages[0].senderId; // Customer ID check
                    
                    return (
                        <div key={msg.id} className={cn("flex flex-col max-w-[75%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                            <div className={cn("p-3 border text-[13px] rounded-sm shadow-sm", 
                                isMe ? "bg-[#f0f6fc] border-[#2271b1]/30 text-[#1d2327]" : "bg-white border-[#c3c4c7] text-[#1d2327]"
                            )}>
                                {msg.message}
                            </div>
                            <span className="text-[10px] text-[#8c8f94] mt-1">
                                {isMe ? "You" : "Staff"} • {formatTz(new Date(msg.createdAt), timezone, "h:mm a")}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendReply} className="p-3 border-t border-[#c3c4c7] bg-[#f0f0f1] flex gap-2 shrink-0">
                <input 
                    type="text" 
                    placeholder="Type your message..." 
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    className="flex-1 border border-[#8c8f94] rounded-sm px-3 py-1.5 text-[13px] outline-none focus:border-[#2271b1] bg-white"
                />
                <button type="submit" disabled={isPending} className="px-4 py-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white rounded-sm text-[13px] font-semibold flex items-center gap-1">
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send
                </button>
            </form>
        </div>
      )}

      {/* --- WP CREATE TICKET MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-[#f0f0f1] border border-[#c3c4c7] shadow-xl w-full max-w-md flex flex-col max-h-[85vh]">
                <div className="px-4 py-3 border-b border-[#c3c4c7] bg-white flex justify-between items-center">
                    <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Open Support Ticket</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-[#50575e] hover:text-[#d63638]"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleSubmitTicket(handleCreateTicket)} className="p-4 bg-white space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-[13px] font-semibold block mb-1">Subject</label>
                        <input {...registerTicket("subject", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px]" placeholder="Brief summary..." />
                    </div>

                    <div>
                        <label className="text-[13px] font-semibold block mb-1">Priority</label>
                        <select {...registerTicket("priority")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] bg-white">
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[13px] font-semibold block mb-1">Your Message</label>
                        <textarea {...registerTicket("message", { required: true })} rows={4} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px]" placeholder="Details of your issue..." />
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-[#f0f0f1]">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[13px] rounded-sm">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-4 py-1.5 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] disabled:opacity-50">
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Open Ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}