// File: app/(admin)/admin/settings/affiliate/_components/Marketing/announcement-manager.tsx

"use client";

import { useState } from "react";
import { AffiliateAnnouncement } from "@prisma/client";
import { Plus, Trash2, Megaphone, Calendar, Users, Eye, EyeOff, CheckCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

import { 
  createAnnouncementAction, 
  deleteAnnouncementAction,
  toggleAnnouncementStatusAction 
} from "@/app/actions/admin/settings/affiliate/_services/marketing-assets-service";

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
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("INFO");

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this announcement?")) return;
    
    // Optimistic Delete
    const previousItems = items;
    setItems(prev => prev.filter(i => i.id !== id));

    // ✅ Call Service Method Directly
    const res = await deleteAnnouncementAction(id);
    
    if(res.success) {
      toast.success(res.message);
    } else {
      setItems(previousItems); // Revert
      toast.error(res.message);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: !current } : i));
    
    // ✅ Call Service Method Directly
    const res = await toggleAnnouncementStatusAction(id, !current);
    
    if(res.success) {
        toast.success(res.message);
    } else {
        setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: current } : i));
        toast.error("Update failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // ✅ Call Service Method Directly
    const res = await createAnnouncementAction({ 
        title, 
        content, 
        type: type as any, 
        isActive: true 
    });

    if(res.success) {
      toast.success(res.message);
      setIsFormOpen(false);
      setTitle("");
      setContent("");
      window.location.reload(); 
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
      switch(type) {
          case 'WARNING': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
          case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-600" />;
          default: return <Info className="w-5 h-5 text-blue-600" />;
      }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h3 className="font-semibold text-gray-900">Dashboard Announcements</h3>
          <p className="text-xs text-gray-500">Post news, updates, and urgent alerts directly to partner dashboards.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> {isFormOpen ? "Close Editor" : "New Post"}
        </button>
      </div>

      {/* Editor Panel */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase">Headline</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" placeholder="e.g. New Commission Rates!" />
              </div>
              <div className="w-full sm:w-48 space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all">
                  <option value="INFO">ℹ️ Info</option>
                  <option value="WARNING">⚠️ Alert</option>
                  <option value="SUCCESS">✅ Success</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase">Message Body</label>
              <textarea required value={content} onChange={e => setContent(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" rows={3} placeholder="Write your announcement here..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="px-6 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2">
                {loading && <Loader2 className="w-3 h-3 animate-spin"/>}
                {loading ? "Posting..." : "Publish Now"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 flex flex-col items-center">
            <Megaphone className="w-10 h-10 mb-2 opacity-50"/>
            <p>No announcements yet.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className={cn("group flex flex-col sm:flex-row gap-4 p-5 rounded-xl border transition-all bg-white hover:shadow-md", !item.isActive && "opacity-60 bg-gray-50 border-dashed")}>
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border shadow-sm", 
                item.type === "INFO" ? "bg-blue-50 border-blue-100" : 
                item.type === "WARNING" ? "bg-orange-50 border-orange-100" : 
                "bg-green-50 border-green-100"
              )}>
                {getTypeIcon(item.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                  {!item.isActive && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">DRAFT</span>}
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{item.content}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 font-medium">
                  <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"><Calendar className="w-3 h-3" /> {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                  <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                    <Users className="w-3 h-3" /> 
                    {item.targetGroups.length > 0 ? `${item.targetGroups.length} Groups` : "All Affiliates"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggle(item.id, item.isActive)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
                  {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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