//File: app/(admin)/admin/settings/affiliate/announcements/_components/announcement-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { AffiliateAnnouncement } from "@prisma/client";
import { Plus, Trash2, Edit, Megaphone, Calendar, Users, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock types/actions
const createAnnouncementAction = async (data: any) => ({ success: true, message: "Posted" });
const deleteAnnouncementAction = async (id: string) => ({ success: true, message: "Deleted" });
const toggleStatusAction = async (id: string, status: boolean) => ({ success: true, message: "Updated" });

interface AnnouncementWithTargets extends AffiliateAnnouncement {
  targetGroups: { id: string; name: string }[];
  targetTiers: { id: string; name: string }[];
}

interface Props {
  initialData: AnnouncementWithTargets[];
}

export default function AnnouncementManager({ initialData }: Props) {
  const [items, setItems] = useState(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Quick Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("INFO");

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this announcement?")) return;
    const res = await deleteAnnouncementAction(id);
    if(res.success) {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success(res.message);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const res = await toggleStatusAction(id, !current);
    if(res.success) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: !current } : i));
      toast.success(res.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createAnnouncementAction({ title, content, type, isActive: true });
    if(res.success) {
      toast.success(res.message);
      setIsFormOpen(false);
      // Logic to refresh data usually goes here
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
        <div>
          <h3 className="font-semibold text-gray-900">Announcements</h3>
          <p className="text-sm text-gray-500">Broadcast messages to affiliate dashboards.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Create Form (Inline) */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg border shadow-sm animate-in slide-in-from-top-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. New Commission Rates!" />
              </div>
              <div className="w-40 space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="INFO">Info</option>
                  <option value="WARNING">Alert</option>
                  <option value="SUCCESS">Success</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <textarea required value={content} onChange={e => setContent(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Message details..." />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-6 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800">Publish</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed text-gray-400">
            No announcements found.
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className={cn("flex flex-col sm:flex-row gap-4 p-4 rounded-lg border transition-all hover:shadow-md bg-white", !item.isActive && "opacity-60 bg-gray-50")}>
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0", 
                item.type === "INFO" ? "bg-blue-100 text-blue-600" : 
                item.type === "WARNING" ? "bg-orange-100 text-orange-600" : 
                "bg-green-100 text-green-600"
              )}>
                <Megaphone className="w-6 h-6" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  {!item.isActive && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Draft</span>}
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.content}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 
                    {item.targetGroups.length > 0 ? `${item.targetGroups.length} Groups` : "All Affiliates"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button onClick={() => handleToggle(item.id, item.isActive)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg" title={item.isActive ? "Hide" : "Show"}>
                  {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}