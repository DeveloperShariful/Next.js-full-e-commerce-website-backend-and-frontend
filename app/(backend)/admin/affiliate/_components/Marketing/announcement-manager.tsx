// File: app/(backend)/admin/affiliate/_components/Marketing/announcement-manager.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AnnouncementType } from "@prisma/client";
import { 
  Plus, Trash2, Megaphone, Calendar, Users, Eye, EyeOff, Edit,
  CheckCircle, AlertTriangle, Info, Loader2, Clock, X, Save, Search, User, Layers, Tag
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, isFuture } from "date-fns";

// Server Actions
import { 
  upsertAnnouncementAction, 
  deleteAnnouncementAction,
  toggleAnnouncementStatusAction,
  getTargetingOptions 
} from "@/app/actions/backend/affiliate/_services/marketing-assets-service";
import { searchAffiliatesForDropdown } from "@/app/actions/backend/affiliate/_services/coupon-tag-service";

// --- TYPES (Mapped to JSON Schema from backend) ---
interface AnnouncementWithTargets {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  startsAt: string | Date;
  expiresAt?: string | Date | null;
  targetGroups?: { id: string; name: string }[]; // Actually Tags now in backend
  targetTiers?: { id: string; name: string }[];
  affiliateIds?: string[];
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
  groupIds: string[]; // These are Tag IDs now
  tierIds: string[];
  affiliateIds: string[]; 
}

// --- MAIN COMPONENT (WP STYLE) ---
export default function AnnouncementManager({ initialData }: Props) {
  const [items, setItems] = useState<AnnouncementWithTargets[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementWithTargets | null>(null);

  // Helper Data for Dropdowns
  const [availableTags, setAvailableTags] = useState<{id:string, name:string}[]>([]);
  const [availableTiers, setAvailableTiers] = useState<{id:string, name:string}[]>([]);

  useEffect(() => {
    getTargetingOptions().then(data => {
        setAvailableTags(data.groups); // 'groups' key now returns Tags from backend
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
    if(res.success) toast.success(res.message);
    else {
        toast.error(res.message);
        window.location.reload(); // Revert on fail
    }
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
          case 'WARNING': return <AlertTriangle className="w-5 h-5 text-[#d63638]" />;
          case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-[#00a32a]" />;
          default: return <Info className="w-5 h-5 text-[#2271b1]" />;
      }
  };

  return (
    <div className="space-y-4 font-sans text-[#1d2327]">
      
      {/* WP Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
        <div>
          <h1 className="text-[22px] font-normal text-[#1d2327] m-0 flex items-center gap-2">
             <Megaphone className="w-5 h-5 text-[#50575e]" /> Announcements
          </h1>
          <p className="text-[13px] text-[#50575e] m-0">Manage updates for tags, tiers, or specific partners.</p>
        </div>
        <button 
            onClick={handleCreate} 
            className="flex items-center gap-1.5 border border-[#2271b1] bg-[#2271b1] text-white px-3 py-1 text-[13px] rounded-sm hover:bg-[#135e96] hover:border-[#135e96] transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add New
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#c3c4c7] shadow-sm flex flex-col items-center">
            <Megaphone className="w-8 h-8 text-[#c3c4c7] mb-2"/>
            <h4 className="text-[14px] font-semibold text-[#1d2327] m-0">No announcements</h4>
            <p className="text-[13px] text-[#50575e] m-0 mt-1">Create your first announcement to keep affiliates engaged.</p>
          </div>
        ) : (
          items.map(item => {
            const isDraft = !item.isActive;
            const scheduled = isFuture(new Date(item.startsAt));
            const hasTags = item.targetGroups && item.targetGroups.length > 0;
            const hasTiers = item.targetTiers && item.targetTiers.length > 0;

            return (
            <div key={item.id} className={cn("group relative flex flex-col sm:flex-row gap-4 p-4 bg-white border border-[#c3c4c7] shadow-sm transition-colors hover:border-[#8c8f94]", isDraft && "bg-[#f6f7f7] border-dashed")}>
              
              {/* Icon Box */}
              <div className={cn("w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 border", 
                item.type === "INFO" ? "bg-[#f0f6fc] border-[#2271b1]/30" : 
                item.type === "WARNING" ? "bg-[#fcf0f1] border-[#d63638]/30" : "bg-[#f0f6fc] border-[#00a32a]/30"
              )}>
                {getTypeIcon(item.type)}
              </div>
              
              <div className="flex-1 min-w-0 pr-12">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className={cn("font-semibold text-[14px] m-0", isDraft ? "text-[#50575e]" : "text-[#2271b1] hover:underline cursor-pointer")} onClick={() => handleEdit(item)}>
                    {item.title}
                  </h4>
                  {isDraft && <span className="bg-[#f0f0f1] text-[#50575e] px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase border border-[#c3c4c7]">Draft</span>}
                  {scheduled && <span className="bg-[#fcf9e8] text-[#8a6d3b] px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase border border-[#f0b849] flex items-center gap-1"><Clock className="w-3 h-3"/> Scheduled</span>}
                </div>
                
                <p className="text-[13px] text-[#2c3338] mb-3 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                
                <div className="flex flex-wrap gap-2 text-[11px] text-[#50575e] font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Published: {format(new Date(item.startsAt), "Y/m/d")}
                  </span>
                  <span className="text-[#c3c4c7]">|</span>
                  
                  {/* WP Style Target Badges */}
                  {(hasTags || hasTiers) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {item.targetGroups?.map(g => (
                            <span key={g.id} className="flex items-center gap-1 bg-[#f0f6fc] text-[#2271b1] px-1.5 py-0.5 border border-[#2271b1]/20">
                                <Tag className="w-3 h-3" /> {g.name}
                            </span>
                        ))}
                        {item.targetTiers?.map(t => (
                            <span key={t.id} className="flex items-center gap-1 bg-[#fcf9e8] text-[#8a6d3b] px-1.5 py-0.5 border border-[#f0b849]/30">
                                <Layers className="w-3 h-3" /> {t.name}
                            </span>
                        ))}
                      </div>
                  ) : (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> All Affiliates
                      </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 absolute right-3 top-3">
                <button onClick={() => handleToggle(item.id, item.isActive)} className="text-[#50575e] hover:text-[#2271b1] p-1 focus:outline-none" title={item.isActive ? "Unpublish" : "Publish"}>
                  {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleEdit(item)} className="text-[#50575e] hover:text-[#2271b1] p-1 focus:outline-none" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-[#50575e] hover:text-[#d63638] p-1 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <AnnouncementFormModal 
            initialData={editingItem} 
            tags={availableTags} 
            tiers={availableTiers}
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => window.location.reload()} 
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENT: WP STYLE MODAL FORM ---
function AnnouncementFormModal({ initialData, tags, tiers, onClose, onSuccess }: any) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans text-[#1d2327]">
            <div className="bg-[#f0f0f1] border border-[#c3c4c7] shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-white">
                    <h3 className="text-[14px] font-semibold m-0">{initialData ? "Edit Announcement" : "New Announcement"}</h3>
                    <button onClick={onClose} className="text-[#50575e] hover:text-[#d63638]"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                  <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    
                    {/* Basic Info WP Metabox */}
                    <div>
                        <label className="text-[13px] font-semibold block mb-1">Title</label>
                        <input {...register("title", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none" placeholder="Headline..." />
                    </div>

                    <div className="border border-[#c3c4c7] p-3 bg-[#f6f7f7] grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Notice Type</label>
                            <select {...register("type")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px] bg-white">
                                <option value="INFO">ℹ️ Information</option>
                                <option value="WARNING">⚠️ Warning / Important</option>
                                <option value="SUCCESS">✅ Success / Good News</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[12px] font-semibold text-[#50575e] block mb-1">Status</label>
                            <select {...register("isActive", { setValueAs: v => v === "true" })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px] bg-white">
                                <option value="true">Active (Published)</option>
                                <option value="false">Draft (Hidden)</option>
                            </select>
                        </div>
                    </div>

                    {/* TARGETING SECTION */}
                    <div className="border border-[#c3c4c7] p-4 bg-white space-y-3">
                        <label className="text-[13px] font-semibold flex items-center gap-1.5 m-0">
                            <Users className="w-4 h-4 text-[#50575e]" /> Target Audience
                        </label>
                        
                        <div className="flex gap-4 mb-3 border-b border-[#f0f0f1] pb-3">
                            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                                <input type="radio" value="ALL" {...register("targetType")} className="text-[#2271b1] focus:ring-[#2271b1]" />
                                All Affiliates
                            </label>
                            <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                                <input type="radio" value="SEGMENTED" {...register("targetType")} className="text-[#2271b1] focus:ring-[#2271b1]" />
                                Specific Tags/Tiers
                            </label>
                        </div>

                        {targetType === "SEGMENTED" && (
                            <div className="space-y-4">
                                {/* Tag Selector */}
                                <div>
                                    <p className="text-[11px] font-semibold text-[#50575e] uppercase mb-1.5 m-0">Filter by Tags</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {tags.map((g: any) => (
                                            <button 
                                                key={g.id} type="button"
                                                onClick={() => toggleSelection("groupIds", g.id)}
                                                className={cn("text-[11px] px-2 py-1 border transition-colors", 
                                                    watchedGroupIds.includes(g.id) ? "bg-[#f0f6fc] text-[#2271b1] border-[#2271b1]" : "bg-white text-[#50575e] border-[#c3c4c7] hover:border-[#8c8f94]"
                                                )}
                                            >
                                                {g.name}
                                            </button>
                                        ))}
                                        {tags.length === 0 && <span className="text-[11px] text-[#8c8f94] italic">No tags available</span>}
                                    </div>
                                </div>

                                {/* Tier Selector */}
                                <div>
                                    <p className="text-[11px] font-semibold text-[#50575e] uppercase mb-1.5 m-0">Filter by Tier</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {tiers.map((t: any) => (
                                            <button 
                                                key={t.id} type="button"
                                                onClick={() => toggleSelection("tierIds", t.id)}
                                                className={cn("text-[11px] px-2 py-1 border transition-colors", 
                                                    watchedTierIds.includes(t.id) ? "bg-[#fcf9e8] text-[#8a6d3b] border-[#f0b849]" : "bg-white text-[#50575e] border-[#c3c4c7] hover:border-[#8c8f94]"
                                                )}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div>
                        <label className="text-[13px] font-semibold block mb-1">Message Content</label>
                        <textarea {...register("content", { required: true })} rows={5} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px] focus:border-[#2271b1] outline-none" />
                    </div>

                  </form>
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[#c3c4c7] bg-[#f0f0f1] flex justify-end gap-2 shrink-0">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[13px] rounded-sm hover:bg-[#e6e6e6]">Cancel</button>
                    <button type="submit" form="announcement-form" disabled={isPending} className="px-4 py-1.5 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] disabled:opacity-50 flex items-center gap-1.5">
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {initialData ? "Update" : "Publish"}
                    </button>
                </div>
            </div>
        </div>
    );
}