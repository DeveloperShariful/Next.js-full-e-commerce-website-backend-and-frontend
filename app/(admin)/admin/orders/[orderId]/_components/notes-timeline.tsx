"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Send, Mail, User, ShieldAlert } from "lucide-react"; 
import { addOrderNote } from "@/app/actions/admin/order/add-note"; 
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export const NotesTimeline = ({ order }: { order: any }) => {
  const [loading, setLoading] = useState(false);
  // ✅ Filter State
  const [filter, setFilter] = useState<'ALL' | 'NOTE' | 'SYSTEM'>('ALL');

  const handleAddNote = async (formData: FormData) => {
    setLoading(true);
    const res = await addOrderNote(formData);
    if(res.success) {
        toast.success(res.message);
        const form = document.getElementById("note-form") as HTMLFormElement;
        form?.reset();
    } else {
        toast.error(res.error);
    }
    setLoading(false);
  }

  // ✅ Filter Logic
  const filteredNotes = order.orderNotes.filter((note: any) => {
      if (filter === 'ALL') return true;
      if (filter === 'SYSTEM') return note.isSystem === true;
      if (filter === 'NOTE') return note.isSystem === false;
      return true;
  });

  return (
    <Card className="border-slate-200 shadow-sm h-full flex flex-col">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row justify-between items-center">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
                <Clock size={14}/> Timeline & Notes
            </CardTitle>
            
            {/* ✅ Filter Buttons */}
            <div className="flex bg-white rounded-md border border-slate-200 p-0.5">
                {['ALL', 'NOTE', 'SYSTEM'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                            filter === f ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col flex-1 min-h-[500px]">
            
            <div className="mb-6">
                <form id="note-form" action={handleAddNote} className="flex gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <Input 
                        name="content" 
                        placeholder="Leave a private note..." 
                        className="bg-slate-50 text-sm border-slate-200 focus:bg-white transition-colors"
                        required
                    />
                    <Button disabled={loading} size="icon" className="bg-slate-900 text-white shrink-0">
                        <Send size={16} />
                    </Button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                
                {filteredNotes.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                        No {filter.toLowerCase()}s found.
                    </div>
                )}

                {filteredNotes.map((note: any) => (
                    <div key={note.id} className="relative pl-6 border-l-2 border-slate-100 group">
                        {/* Icon/Dot Logic */}
                        <div className={`absolute -left-[9px] top-0 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center ${
                            note.isSystem ? "bg-slate-200 text-slate-500" : "bg-blue-100 text-blue-600"
                        }`}>
                            {note.isSystem ? <ShieldAlert size={10}/> : <User size={10}/>}
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {note.content}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{format(new Date(note.createdAt), "MMM d, h:mm a")}</span>
                                {note.isSystem && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">System</span>}
                                {!note.isSystem && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Staff</span>}
                                {note.notify && <span className="text-orange-400 flex items-center gap-0.5"><Mail size={8}/> Emailed</span>}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Initial Event */}
                {filter === 'ALL' && (
                    <div className="relative pl-6 border-l-2 border-transparent opacity-50">
                        <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-white"></div>
                        <p className="text-sm text-slate-900 font-medium">Order Placed</p>
                        <p className="text-[10px] text-slate-400">{format(new Date(order.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                )}

            </div>

        </CardContent>
    </Card>
  )
}