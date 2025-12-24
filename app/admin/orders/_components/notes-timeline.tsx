// File Location: app/admin/order/_components/notes-timeline.tsx

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, MessageSquare, Send, Mail } from "lucide-react"; 
import { addOrderNote } from "@/app/actions/order/add-note"; 
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

export const NotesTimeline = ({ order }: { order: any }) => {
  const [loading, setLoading] = useState(false);

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

  return (
    <Card className="border-slate-200 shadow-sm h-full">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
                <Clock size={14}/> Timeline & Notes
            </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col h-[500px]">
            
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
                <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" name="notify" id="notify" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"/>
                    <label htmlFor="notify" className="text-xs text-slate-500 cursor-pointer select-none">Notify customer via email</label>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                
                {order.orderNotes.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                        No activity recorded yet.
                    </div>
                )}

                {order.orderNotes.map((note: any) => (
                    <div key={note.id} className="relative pl-6 border-l-2 border-slate-100 group">
                        <div className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                            note.isSystem ? "bg-slate-300" : "bg-blue-500"
                        }`}></div>

                        <div className="space-y-1">
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {note.content}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{format(new Date(note.createdAt), "MMM d, h:mm a")}</span>
                                {note.isSystem && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">System</span>}
                                {!note.isSystem && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Staff</span>}
                                {note.notify && <span className="text-orange-400 flex items-center gap-0.5"><Mail size={8}/> Sent</span>}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="relative pl-6 border-l-2 border-transparent">
                     <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-white"></div>
                     <p className="text-sm text-slate-900 font-medium">Order Placed</p>
                     <p className="text-[10px] text-slate-400">{format(new Date(order.createdAt), "MMM d, h:mm a")}</p>
                </div>

            </div>

        </CardContent>
    </Card>
  )
}