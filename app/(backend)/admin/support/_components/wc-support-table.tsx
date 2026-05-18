// File: app/admin/support/_components/wc-support-table.tsx

"use client";

import Link from "next/link";
import { TicketWithRelations } from "../types";
import { Loader2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { updateTicketStatus, deleteTicket } from "@/app/actions/backend/support/support";
import { toast } from "sonner";
import { TicketStatus, TicketPriority } from "@prisma/client";

interface WcSupportTableProps {
  tickets: TicketWithRelations[];
  loading: boolean;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onRefresh: () => void;
}

export const WcSupportTable = ({
  tickets,
  loading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onRefresh
}: WcSupportTableProps) => {

  // Status Badge Generator
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return <span className="bg-[#eaa4a4] text-[#761919] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Open</span>;
      case "IN_PROGRESS":
        return <span className="bg-[#e0c6e1] text-[#752a7a] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">In Progress</span>;
      case "RESOLVED":
        return <span className="bg-[#c6e1c6] text-[#5b841b] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Resolved</span>;
      case "CLOSED":
        return <span className="bg-[#e5e5e5] text-[#777] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Closed</span>;
      default:
        return <span className="bg-[#e5e5e5] text-[#777] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  // Priority Color Code
  const getPriorityStyle = (priority: TicketPriority) => {
    switch (priority) {
      case "CRITICAL": return "text-[#d63638] font-bold";
      case "HIGH": return "text-[#d63cd2] font-semibold";
      case "MEDIUM": return "text-[#2271b1]";
      case "LOW": return "text-[#50575e]";
      default: return "text-[#50575e]";
    }
  };

  // Status Action Handler
  const handleAction = async (id: string, action: TicketStatus | "delete") => {
    const confirmMsg = action === "delete" 
      ? "Delete this ticket permanently?"
      : `Mark this ticket as ${action.replace("_", " ")}?`;

    if (!confirm(confirmMsg)) return;

    if (action === "delete") {
      const res = await deleteTicket(id);
      res.success ? toast.success(res.message) : toast.error(res.error);
    } else {
      const res = await updateTicketStatus(id, action);
      res.success ? toast.success(res.message) : toast.error(res.error);
    }
    
    onRefresh();
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2271b1] w-8 h-8" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] p-8 text-center text-[#50575e] text-[13px]">
        No support tickets found.
      </div>
    );
  }

  const allSelected = tickets.length > 0 && selectedIds.length === tickets.length;

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-x-auto">
      <table className="w-full text-left border-collapse text-[13px] text-[#2c3338]">
        <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] font-semibold">
          <tr>
            <th className="w-[40px] pl-3 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
            </th>
            <th className="py-2 px-3">Subject / Ticket Info</th>
            <th className="py-2 px-3">Customer</th>
            <th className="py-2 px-3">Priority</th>
            <th className="py-2 px-3 text-center">Replies</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3 text-right pr-4">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f1]">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="group hover:bg-[#f6f7f7] transition-colors relative">
              
              {/* Checkbox */}
              <td className="pl-3 py-3 align-top">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(ticket.id)}
                  onChange={(e) => onSelectOne(ticket.id, e.target.checked)}
                  className="rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
              </td>

              {/* Ticket Info & Hover Actions */}
              <td className="py-3 px-3 align-top">
                <Link href={`/admin/support/${ticket.id}`} className="text-[#2271b1] font-bold hover:text-[#135e96] hover:underline block max-w-[250px] truncate">
                  {ticket.subject}
                </Link>
                <div className="text-[11px] text-[#8c8f94] mt-0.5 font-mono">
                  ID: #{ticket.id.slice(0, 8)}
                </div>
                
                {/* Hidden Hover Actions (Like WordPress) */}
                <div className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-2">
                  <Link href={`/admin/support/${ticket.id}`} className="text-[#2271b1] hover:text-[#135e96]">Reply</Link>
                  
                  {ticket.status !== "CLOSED" && (
                    <>
                      <span className="text-[#a7aaad]">|</span>
                      <button onClick={() => handleAction(ticket.id, "CLOSED")} className="text-[#5b841b] hover:underline">Close</button>
                    </>
                  )}
                  
                  <span className="text-[#a7aaad]">|</span>
                  <button onClick={() => handleAction(ticket.id, "delete")} className="text-[#d63638] hover:underline">Delete</button>
                </div>
              </td>

              {/* Customer Info */}
              <td className="py-3 px-3 align-top">
                <div className="font-medium text-[#2c3338]">{ticket.user?.name || "Guest"}</div>
                <div className="text-[12px] text-[#50575e]">
                  <a href={`mailto:${ticket.user?.email}`} className="text-[#2271b1] hover:underline">
                    {ticket.user?.email}
                  </a>
                </div>
              </td>

              {/* Priority */}
              <td className="py-3 px-3 align-top">
                <span className={`text-[12px] capitalize ${getPriorityStyle(ticket.priority)}`}>
                  {ticket.priority.toLowerCase()}
                </span>
              </td>

              {/* Replies Count */}
              <td className="py-3 px-3 align-top text-center">
                 <div className="inline-flex items-center justify-center gap-1 bg-[#f0f0f1] border border-[#c3c4c7] px-2 py-0.5 rounded-full text-[#50575e] text-[11px] font-bold" title={`${ticket._count.messages} Replies`}>
                    <MessageCircle size={12}/> {ticket._count.messages}
                 </div>
              </td>

              {/* Status Badge */}
              <td className="py-3 px-3 align-top">
                {getStatusBadge(ticket.status)}
              </td>

              {/* Date */}
              <td className="py-3 px-3 text-right pr-4 align-top text-[#50575e]">
                <abbr title={new Date(ticket.updatedAt).toLocaleString()} className="no-underline cursor-help">
                  {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                </abbr>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};