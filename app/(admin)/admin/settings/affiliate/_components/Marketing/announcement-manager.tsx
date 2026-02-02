// File: app/(admin)/admin/settings/affiliate/_components/Marketing/announcement-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AffiliateAnnouncement, AnnouncementType } from "@prisma/client";
import { 
  Plus, Trash2, Megaphone, Calendar, Users, Eye, EyeOff, Edit,
  CheckCircle, AlertTriangle, Info, Loader2, Clock, X, Save, Search, User, Layers, Hash
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isFuture, isPast } from "date-fns";

// Server Actions
import { 
  upsertAnnouncementAction, // Updated name
  deleteAnnouncementAction,
  toggleAnnouncementStatusAction,
  getTargetingOptions // New helper
} from "@/app/actions/admin/settings/affiliate/_services/marketing-assets-service";
import { searchAffiliatesForDropdown } from "@/app/actions/admin/settings/affiliate/_services/coupon-tag-service";

// --- TYPES ---
interface AnnouncementWithTargets extends AffiliateAnnouncement {
  targetGroups: { id: string; name: string }[];
  targetTiers: { id: string; name: string }[];
}

interface Props {
  initialData: AnnouncementWithTargets[];
}

interface AnnouncementFormData {
  id?: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  startsAt: string;
  expiresAt?: string;
  targetType: "ALL" | "SEGMENTED";
  groupIds: string[];
  tierIds: string[];
  affiliateIds: string[]; // For UI state
}

// --- MAIN COMPONENT ---
export default function AnnouncementManager({ initialData }: Props) {
  const [items, setItems] = useState<AnnouncementWithTargets[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementWithTargets | null>(null);

  // Helper Data for Dropdowns
  const [availableGroups, setAvailableGroups] = useState<{id:string, name:string}[]>([]);
  const [availableTiers, setAvailableTiers] = useState<{id:string, name:string}[]>([]);

  // Load Groups/Tiers on mount
  useEffect(() => {
    getTargetingOptions().then(data => {
        setAvailableGroups(data.groups);
        setAvailableTiers(data.tiers);
    });
  }, []);
  
  const handleEdit = (item: AnnouncementWithTargets) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this announcement?")) return;
    setItems(prev => prev.filter(i => i.id !== id));
    const res = await deleteAnnouncementAction(id);
    if(res.success) toast.success("Deleted");
    else toast.error(res.message);
  };

  const handleToggle = async (id: string, current: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: !current } : i));
    const res = await toggleAnnouncementStatusAction(id, !current);
    if(res.success) toast.success(res.message);
    else {
        setItems(prev => prev.map(i => i.id === id ? { ...i, isActive: current } : i));
        toast.error("Failed");
    }
  };

  const getTypeIcon = (type: AnnouncementType) => {
      switch(type) {
          case 'WARNING': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
          case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-600" />;
          default: return <Info className="w-5 h-5 text-blue-600" />;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Announcements</h3>
          <p className="text-xs text-gray-500">Manage updates for groups, tiers, or specific partners.</p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95">
          <Plus className="w-4 h-4" /> Create New
        </button>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <Megaphone className="w-8 h-8 text-gray-300 mx-auto mb-3"/>
            <h4 className="text-gray-900 font-medium">No announcements</h4>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className={cn("group relative flex flex-col sm:flex-row gap-5 p-6 rounded-xl border transition-all bg-white hover:shadow-md", !item.isActive && "opacity-75 bg-gray-50/50")}>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm", item.type === "INFO" ? "bg-blue-50 border-blue-100" : item.type === "WARNING" ? "bg-orange-50 border-orange-100" : "bg-green-50 border-green-100")}>
                {getTypeIcon(item.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                  {!item.isActive && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase border">Draft</span>}
                  {isFuture(new Date(item.startsAt)) && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-100 flex gap-1"><Clock className="w-3 h-3"/> Scheduled</span>}
                </div>
                <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">{item.content}</p>
                
                <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border">
                    <Calendar className="w-3 h-3 text-gray-400" /> {format(new Date(item.startsAt), "MMM d, yyyy")}
                  </span>
                  
                  {/* Target Badges */}
                  {(item.targetGroups.length > 0 || item.targetTiers.length > 0) ? (
                      <>
                        {item.targetGroups.map(g => (
                            <span key={g.id} className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                                <Users className="w-3 h-3" /> {g.name}
                            </span>
                        ))}
                        {item.targetTiers.map(t => (
                            <span key={t.id} className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
                                <Layers className="w-3 h-3" /> {t.name}
                            </span>
                        ))}
                      </>
                  ) : (
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border">
                        <Users className="w-3 h-3 text-gray-400" /> All Affiliates
                      </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 absolute right-4 top-4">
                <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleToggle(item.id, item.isActive)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors" title={item.isActive ? "Hide" : "Publish"}>
                  {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <AnnouncementFormModal 
            initialData={editingItem} 
            groups={availableGroups} 
            tiers={availableTiers}
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => window.location.reload()} 
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENT: MODAL FORM ---
function AnnouncementFormModal({ initialData, groups, tiers, onClose, onSuccess }: any) {
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]); 

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AnnouncementFormData>({
        defaultValues: {
            id: initialData?.id,
            title: initialData?.title || "",
            content: initialData?.content || "",
            type: initialData?.type || "INFO",
            isActive: initialData?.isActive ?? true,
            startsAt: initialData?.startsAt ? new Date(initialData.startsAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().split('T')[0] : "",
            targetType: (initialData?.targetGroups?.length > 0 || initialData?.targetTiers?.length > 0) ? "SEGMENTED" : "ALL",
            groupIds: initialData?.targetGroups?.map((g:any) => g.id) || [],
            tierIds: initialData?.targetTiers?.map((t:any) => t.id) || [],
            affiliateIds: [] 
        }
    });

    const targetType = watch("targetType");
    const watchedGroupIds = watch("groupIds");
    const watchedTierIds = watch("tierIds");

    // Search Users Logic
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (searchTerm.length > 1) {
                const res = await searchAffiliatesForDropdown(searchTerm);
                setSearchResults(res);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    const handleUserSelect = (user: any) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
            // setValue("affiliateIds", [...selectedUsers, user].map(u => u.id));
        }
        setSearchTerm("");
        setSearchResults([]);
    };

    const toggleSelection = (field: "groupIds" | "tierIds", id: string) => {
        const current = field === "groupIds" ? watchedGroupIds : watchedTierIds;
        const newSet = current.includes(id) 
            ? current.filter(i => i !== id)
            : [...current, id];
        setValue(field, newSet);
    };

    const onSubmit = (data: AnnouncementFormData) => {
        startTransition(async () => {
            const res = await upsertAnnouncementAction({
                ...data,
                startsAt: new Date(data.startsAt),
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
                // Pass affiliateIds if backend supports it
                // affiliateIds: selectedUsers.map(u => u.id) 
            });

            if(res.success) {
                toast.success(initialData ? "Updated successfully" : "Published successfully");
                onSuccess();
            } else {
                toast.error(res.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50/80">
                    <h3 className="font-bold text-gray-900">{initialData ? "Edit Announcement" : "New Announcement"}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-black" /></button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Title</label>
                            <input {...register("title", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-black" placeholder="Headline..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase">Type</label>
                                <select {...register("type")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                    <option value="INFO">ℹ️ Info</option>
                                    <option value="WARNING">⚠️ Warning</option>
                                    <option value="SUCCESS">✅ Success</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase">Status</label>
                                <select {...register("isActive", { setValueAs: v => v === "true" })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                    <option value="true">Active</option>
                                    <option value="false">Draft</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* TARGETING SECTION */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        <label className="text-xs font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Target Audience
                        </label>
                        
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="radio" value="ALL" {...register("targetType")} className="text-black focus:ring-black" />
                                All Affiliates
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="radio" value="SEGMENTED" {...register("targetType")} className="text-black focus:ring-black" />
                                Specific Groups/Tiers
                            </label>
                        </div>

                        {targetType === "SEGMENTED" && (
                            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                                {/* Group Selector */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Filter by Group</p>
                                    <div className="flex flex-wrap gap-2">
                                        {groups.map((g: any) => (
                                            <button 
                                                key={g.id} type="button"
                                                onClick={() => toggleSelection("groupIds", g.id)}
                                                className={cn("text-xs px-2 py-1 rounded border transition-colors", 
                                                    watchedGroupIds.includes(g.id) ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                                                )}
                                            >
                                                {g.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tier Selector */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Filter by Tier</p>
                                    <div className="flex flex-wrap gap-2">
                                        {tiers.map((t: any) => (
                                            <button 
                                                key={t.id} type="button"
                                                onClick={() => toggleSelection("tierIds", t.id)}
                                                className={cn("text-xs px-2 py-1 rounded border transition-colors", 
                                                    watchedTierIds.includes(t.id) ? "bg-yellow-500 text-white border-yellow-600" : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                                                )}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Specific User Search (UI Only - needs schema support for persistence) */}
                                <div className="relative">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Specific Affiliates (Optional)</p>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                        <input 
                                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-xs" 
                                            placeholder="Search affiliate name..."
                                        />
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-32 overflow-y-auto">
                                            {searchResults.map(user => (
                                                <button key={user.id} type="button" onClick={() => handleUserSelect(user)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex justify-between">
                                                    <span>{user.user.name}</span>
                                                    <span className="text-gray-400">{user.slug}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {selectedUsers.map((u, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] border border-blue-100 flex items-center gap-1">
                                                <User className="w-3 h-3"/> {u.user.name}
                                                <button type="button" onClick={() => setSelectedUsers(selectedUsers.filter(su => su.id !== u.id))}><X className="w-3 h-3 hover:text-red-500"/></button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Message</label>
                        <textarea {...register("content", { required: true })} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-black" />
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex justify-end gap-3 border-t">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isPending} className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800 shadow-lg">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                            {initialData ? "Update Announcement" : "Publish Announcement"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}