// File: app/(backend)/admin/affiliate/_components/Management/group-manager.tsx

"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { 
  Search, Plus, Users, Edit, Trash2, MoreVertical, 
  Layers, Percent, ShieldCheck, Package, Megaphone,
  Copy, X, Loader2, Save, ArrowUpDown, DollarSign 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AffiliateTier } from "@prisma/client"; // ✅ FIXED: Replaced deleted AffiliateGroup with AffiliateTier
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { 
  deleteGroupAction, 
  upsertGroupAction 
} from "@/app/actions/backend/affiliate/_services/group-service";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ✅ FIXED: Mapped Group Details to Tier architecture without losing any UI element
interface GroupWithDetails extends AffiliateTier {
  _count: { 
    affiliates: number;
    productRates?: number;
    announcements?: number;
  };
  slug?: string;
}

interface Props {
  initialGroups: GroupWithDetails[];
}

type SortField = 'name' | 'commissionRate' | 'createdAt' | '_count.affiliates';
type SortDirection = 'asc' | 'desc';

export default function GroupManager({ initialGroups }: Props) {
  const [isPending, startTransition] = useTransition();

  const [groups, setGroups] = useState<GroupWithDetails[]>(initialGroups);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithDetails | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);
  const { symbol } = useGlobalStore(); 
  const currency = symbol || "";

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const filteredGroups = useMemo(() => {
    let result = [...groups];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g => 
        g.name.toLowerCase().includes(q) || 
        (g.description && g.description.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let valA: any = sortField.includes('.') ? getNestedValue(a, sortField) : a[sortField as keyof GroupWithDetails];
      let valB: any = sortField.includes('.') ? getNestedValue(b, sortField) : b[sortField as keyof GroupWithDetails];

      if (typeof valA === 'object' && valA?.toNumber) valA = valA.toNumber();
      if (typeof valB === 'object' && valB?.toNumber) valB = valB.toNumber();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [groups, search, sortField, sortDirection]);

  function getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  // --- Handlers ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(filteredGroups.map(g => g.id)));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleEdit = (group: GroupWithDetails) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (group: GroupWithDetails) => {
    setSelectedGroup(group);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure? Affiliates in this group will lose their group benefits.")) return;
    
    startTransition(async () => {
        const res = await deleteGroupAction(id);
        if(res.success) {
            setGroups(prev => prev.filter(g => g.id !== id));
            toast.success(res.message);
            if(selectedGroup?.id === id) setIsDrawerOpen(false);
        } else {
            toast.error(res.message);
        }
    });
  };

  const handleBulkDelete = () => {
    if(!confirm(`Delete ${selectedIds.size} groups? This cannot be undone.`)) return;
    const ids = Array.from(selectedIds);
    startTransition(async () => {
        let errors = 0;
        for (const id of ids) {
            const res = await deleteGroupAction(id);
            if (!res.success) errors++;
        }
        if (errors > 0) toast.warning(`Completed with ${errors} errors.`);
        else toast.success("Groups deleted successfully");
        
        setGroups(prev => prev.filter(g => !selectedIds.has(g.id)));
        setSelectedIds(new Set());
    });
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 pb-20 font-sans text-[#1d2327]">
      
      {/* 1. HEADER STATS (WP Metabox Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-[#c3c4c7] shadow-sm flex items-center gap-4">
            <div className="p-2 bg-[#f0f6fc] text-[#2271b1] border border-[#2271b1]/20">
                <Layers className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[12px] text-[#50575e] font-semibold uppercase">Total Groups</p>
                <h3 className="text-[22px] font-normal text-[#1d2327] m-0 leading-none">{groups.length}</h3>
            </div>
        </div>
        <div className="bg-white p-4 border border-[#c3c4c7] shadow-sm flex items-center gap-4">
            <div className="p-2 bg-[#fcf0f1] text-[#d63638] border border-[#d63638]/20">
                <Users className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[12px] text-[#50575e] font-semibold uppercase">Assigned Affiliates</p>
                <h3 className="text-[22px] font-normal text-[#1d2327] m-0 leading-none">
                    {groups.reduce((acc, curr) => acc + (curr._count.affiliates || 0), 0)}
                </h3>
            </div>
        </div>
        <div className="bg-white p-4 border border-[#c3c4c7] shadow-sm flex items-center gap-4">
            <div className="p-2 bg-[#f0f6fc] text-[#00a32a] border border-[#00a32a]/20">
                <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[12px] text-[#50575e] font-semibold uppercase">Active Rules</p>
                <h3 className="text-[22px] font-normal text-[#1d2327] m-0 leading-none">
                    {groups.reduce((acc, curr) => acc + (curr._count.productRates || 0), 0)}
                </h3>
            </div>
        </div>
      </div>

      {/* 2. WP TOOLBAR */}
      <div className="bg-white p-3 border border-[#c3c4c7] flex flex-col xl:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 w-full xl:w-auto">
            <div className={cn("flex items-center gap-2 transition-all duration-300", selectedIds.size > 0 ? "opacity-100" : "opacity-50 pointer-events-none grayscale")}>
                <button 
                    onClick={handleBulkDelete}
                    disabled={isPending || selectedIds.size === 0}
                    className="px-3 py-1.5 bg-[#fcf0f1] border border-[#d63638] text-[#d63638] hover:bg-[#d63638] hover:text-white rounded-sm text-[13px] transition-colors shadow-sm flex items-center gap-1.5"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.size})
                </button>
            </div>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-[#8c8f94]" />
            <input 
              type="text" 
              className="block w-full pl-8 pr-2 py-1.5 text-[13px] text-[#1d2327] border border-[#8c8f94] rounded-sm bg-white focus:ring-1 focus:ring-[#2271b1] focus:border-[#2271b1] outline-none shadow-sm" 
              placeholder="Search groups..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2271b1] bg-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] text-white rounded-sm text-[13px] transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> New Group
          </button>
        </div>
      </div>

      {/* 3. WP LIST TABLE */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-[13px] text-left border-collapse">
            <thead className="bg-[#f0f0f1] border-b border-[#c3c4c7] text-[#2c3338]">
              <tr>
                <th scope="col" className="p-3 w-10 text-center font-normal border-r border-[#c3c4c7]/30">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                    checked={filteredGroups.length > 0 && selectedIds.size === filteredGroups.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <SortableHeader label="Group Info" field="name" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Commission" field="commissionRate" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Members" field="_count.affiliates" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Config</th>
                <th scope="col" className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30">Status</th>
                <th scope="col" className="px-4 py-2 font-semibold text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center bg-[#f6f7f7]">
                    <div className="flex flex-col items-center justify-center gap-2 text-[#50575e]">
                      <Layers className="w-8 h-8 text-[#c3c4c7]" />
                      <p className="text-[13px] font-medium">No groups found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const safeSlug = group.slug || group.name.toLowerCase().replace(/\s+/g, '-');
                  const prodRatesCount = group._count.productRates || 0;
                  const annCount = group._count.announcements || 0;

                  return (
                    <tr key={group.id} className="bg-white hover:bg-[#f6f7f7] transition-colors group">
                      <td className="p-3 text-center border-r border-[#c3c4c7]/10">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] cursor-pointer"
                            checked={selectedIds.has(group.id)}
                            onChange={() => handleSelectOne(group.id)}
                          />
                      </td>
                      
                      <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                          <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                  <button onClick={() => handleOpenDetails(group)} className="text-[13px] font-semibold text-[#2271b1] hover:text-[#135e96] hover:underline transition-colors m-0 p-0 text-left">
                                      {group.name}
                                  </button>
                                  {group.isDefault && (
                                      <span className="text-[10px] font-bold text-[#00a32a] bg-[#f0f6fc] border border-[#00a32a]/30 px-1.5 py-0.5 rounded-sm uppercase">
                                          Default
                                      </span>
                                  )}
                              </div>
                              <div className="text-[11px] text-[#50575e] font-mono mt-1">/{safeSlug}</div>
                              {group.description && <p className="text-[11px] text-[#8c8f94] mt-1 m-0 line-clamp-1 italic">{group.description}</p>}
                          </div>
                      </td>

                      <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                          <div className="flex items-center gap-1.5">
                              <span className={cn("font-mono font-semibold text-[14px]", group.commissionRate ? "text-[#1d2327]" : "text-[#8c8f94] italic")}>
                                  {group.commissionRate ? (group.commissionType === "FIXED" ? `${currency}${Number(group.commissionRate)}` : `${Number(group.commissionRate)}%`): "Global" }
                              </span>
                          </div>
                      </td>

                      <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                          <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[#1d2327] flex items-center gap-1">
                                  <Users className="w-4 h-4 text-[#50575e]" /> {group._count.affiliates}
                              </span>
                          </div>
                      </td>

                      <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                          <div className="flex gap-2">
                              {prodRatesCount > 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[#f0f0f1] text-[#1d2327] text-[11px] border border-[#c3c4c7]" title="Product Overrides">
                                      <Package className="w-3 h-3 text-[#2271b1]" /> {prodRatesCount}
                                  </span>
                              )}
                              {annCount > 0 && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[#f0f0f1] text-[#1d2327] text-[11px] border border-[#c3c4c7]" title="Active Announcements">
                                      <Megaphone className="w-3 h-3 text-[#d63638]" /> {annCount}
                                  </span>
                              )}
                              {prodRatesCount === 0 && annCount === 0 && (
                                  <span className="text-[11px] text-[#8c8f94] italic">None</span>
                              )}
                          </div>
                      </td>

                      <td className="px-4 py-3 border-r border-[#c3c4c7]/10">
                          {/* We don't have isActive in AffiliateTier, fallback to static 'Active' or derive from logic */}
                          <span className="text-[11px] font-semibold text-[#00a32a]">Active</span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button disabled={isPending} className="p-1 text-[#50575e] hover:text-[#1d2327] hover:bg-[#f0f0f1] rounded-sm transition-colors outline-none focus:ring-1 focus:ring-[#2271b1]">
                              {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <MoreVertical className="w-4 h-4" />}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 shadow-lg border border-[#c3c4c7] p-0 rounded-sm bg-white font-sans">
                            <DropdownMenuItem onClick={() => handleOpenDetails(group)} className="cursor-pointer text-[12px] text-[#2c3338] px-3 py-2 hover:bg-[#f0f6fc] hover:text-[#2271b1] focus:bg-[#f0f6fc]">
                              View Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(group)} className="cursor-pointer text-[12px] text-[#2c3338] px-3 py-2 hover:bg-[#f0f6fc] hover:text-[#2271b1] focus:bg-[#f0f6fc]">
                              Edit Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#c3c4c7] m-0" />
                            <DropdownMenuItem onClick={() => handleDelete(group.id)} className="cursor-pointer text-[12px] text-[#d63638] px-3 py-2 hover:bg-[#fcf0f1] focus:bg-[#fcf0f1]">
                              Delete Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GroupConfigModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={editingGroup} />
      <GroupDetailDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} group={selectedGroup} />

    </div>
  );
}

// --- SUB COMPONENTS ---

function SortableHeader({ label, field, currentSort, currentDir, onSort }: any) {
    return (
        <th scope="col" className="px-4 py-2 font-semibold border-r border-[#c3c4c7]/30 cursor-pointer group select-none hover:bg-[#e6e6e6] transition-colors" onClick={() => onSort(field)}>
            <div className="flex items-center justify-between">
                {label}
                <ArrowUpDown className={cn(
                    "w-3 h-3 transition-colors",
                    currentSort === field ? "text-[#1d2327]" : "text-[#c3c4c7] group-hover:text-[#8c8f94]"
                )} />
            </div>
        </th>
    );
}

function GroupConfigModal({ isOpen, onClose, initialData }: any) {
    const [isPending, startTransition] = useTransition();
    const { symbol } = useGlobalStore(); 
    const currency = symbol || "$";
    
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: "",
            description: "",
            commissionRate: "",
            isDefault: false,
            commissionType: "PERCENTAGE" 
        }
    });

    const commissionType = watch("commissionType");

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    description: initialData.description || "",
                    commissionRate: initialData.commissionRate ? String(initialData.commissionRate) : "",
                    isDefault: initialData.isDefault || false,
                    commissionType: initialData.commissionType || "PERCENTAGE"
                });
            } else {
                reset({ name: "", description: "", commissionRate: "", isDefault: false, commissionType: "PERCENTAGE" });
            }
        }
    }, [initialData, isOpen, reset]);

    const onSubmit = (data: any) => {
        startTransition(async () => {
            const res = await upsertGroupAction({ ...data, id: initialData?.id });
            if(res.success) {
                toast.success(res.message);
                onClose();
                window.location.reload();
            } else {
                toast.error(res.message);
            }
        });
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans text-[#1d2327]">
            <div className="bg-[#f0f0f1] border border-[#c3c4c7] shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                
                <div className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center bg-white">
                    <h3 className="font-semibold text-[14px] text-[#1d2327] m-0">{initialData ? "Edit Group" : "Create Group"}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-[#50575e] hover:text-[#d63638]" /></button>
                </div>
                
                <div className="p-4 overflow-y-auto bg-white">
                    <form id="group-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        
                        <div>
                            <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Group Name</label>
                            <input 
                                {...register("name", { required: "Name is required" })} 
                                className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-sm" 
                                placeholder="e.g. VIP Influencers" 
                            />
                            {errors.name && <span className="text-[#d63638] text-[11px] mt-1">{errors.name.message as string}</span>}
                        </div>
                        
                        <div>
                            <label className="text-[13px] font-semibold text-[#1d2327] block mb-1">Description</label>
                            <textarea 
                                {...register("description")} 
                                className="w-full border border-[#8c8f94] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-sm" 
                                rows={3} 
                            />
                        </div>

                        <div className="border border-[#c3c4c7] p-3 bg-[#f6f7f7]">
                            <label className="text-[13px] font-semibold text-[#1d2327] block mb-2">Commission Structure</label>
                            
                            <div className="flex gap-2">
                                <div className="flex bg-[#f0f0f1] border border-[#c3c4c7] p-0.5 rounded-sm shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setValue("commissionType", "PERCENTAGE")}
                                        className={cn(
                                            "px-2 py-1 text-[12px] font-semibold rounded-sm",
                                            commissionType === "PERCENTAGE" ? "bg-white text-[#1d2327] shadow-sm border border-[#c3c4c7]" : "text-[#50575e] hover:text-[#2c3338]"
                                        )}
                                    >
                                        <Percent className="w-3 h-3 inline mr-1" /> %
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue("commissionType", "FIXED")}
                                        className={cn(
                                            "px-2 py-1 text-[12px] font-semibold rounded-sm",
                                            commissionType === "FIXED" ? "bg-white text-[#1d2327] shadow-sm border border-[#c3c4c7]" : "text-[#50575e] hover:text-[#2c3338]"
                                        )}
                                    >
                                        <DollarSign className="w-3 h-3 inline mr-1" /> Fixed
                                    </button>
                                </div>

                                <div className="relative flex-1">
                                    <div className="absolute left-2 top-1.5 text-[#50575e] font-bold text-[13px] pointer-events-none">
                                        {commissionType === "FIXED" ? currency : <Percent className="w-3.5 h-3.5" />}
                                    </div>
                                    <input 
                                        type="number" step="0.01" 
                                        {...register("commissionRate")} 
                                        className="w-full border border-[#8c8f94] pl-7 pr-2 py-1.5 text-[13px] font-bold focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-sm" 
                                        placeholder="10" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="isDefault" {...register("isDefault")} className="w-4 h-4 rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]" />
                            <label htmlFor="isDefault" className="text-[13px] text-[#1d2327]">
                                Set as Default Group <br/>
                                <span className="text-[11px] text-[#50575e] italic">New affiliates will join this group automatically.</span>
                            </label>
                        </div>
                    </form>
                </div>

                <div className="p-3 border-t border-[#c3c4c7] bg-[#f0f0f1] flex justify-end gap-2 shrink-0">
                    <button onClick={onClose} className="px-3 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[13px] rounded-sm hover:bg-[#e6e6e6]">Cancel</button>
                    <button type="submit" form="group-form" disabled={isPending} className="px-4 py-1.5 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] disabled:opacity-50 flex items-center gap-1.5">
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Group
                    </button>
                </div>
            </div>
        </div>
    );
}

function GroupDetailDrawer({ isOpen, onClose, group }: { isOpen: boolean, onClose: () => void, group: GroupWithDetails | null }) {
    if (!isOpen || !group) return null;
    const safeSlug = group.slug || group.name.toLowerCase().replace(/\s+/g, '-');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-site.com";
    const regLink = `${siteUrl}/affiliate/register?group=${safeSlug}`;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans text-[#1d2327]">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#c3c4c7]">
                
                <div className="p-4 border-b border-[#c3c4c7] bg-[#f0f0f1] flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2">
                             <h2 className="text-[18px] font-semibold text-[#1d2327] m-0">{group.name}</h2>
                             {group.isDefault && <span className="px-1.5 py-0.5 bg-[#f0f6fc] border border-[#2271b1]/30 text-[#2271b1] text-[10px] font-bold rounded-sm uppercase">Default</span>}
                        </div>
                        <p className="text-[12px] text-[#50575e] mt-1 font-mono m-0">/{safeSlug}</p>
                    </div>
                    <button onClick={onClose} className="text-[#50575e] hover:text-[#d63638]"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-sm text-center">
                            <p className="text-[11px] text-[#50575e] font-semibold uppercase m-0">Members</p>
                            <p className="text-[20px] font-normal text-[#1d2327] m-0 mt-1 flex items-center justify-center gap-1.5">
                                <Users className="w-4 h-4 text-[#2271b1]"/> {group._count.affiliates || 0}
                            </p>
                        </div>
                        <div className="p-3 bg-[#f6f7f7] border border-[#c3c4c7] rounded-sm text-center">
                            <p className="text-[11px] text-[#50575e] font-semibold uppercase m-0">Commission</p>
                            <p className="text-[20px] font-normal text-[#1d2327] m-0 mt-1 flex items-center justify-center gap-1.5">
                                <Percent className="w-4 h-4 text-[#00a32a]"/> {group.commissionRate ? `${Number(group.commissionRate)}%` : "Global"}
                            </p>
                        </div>
                    </div>

                    {group.description && (
                        <div className="border border-[#c3c4c7] p-3 bg-white">
                            <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 mb-1">Description</h4>
                            <p className="text-[12px] text-[#50575e] m-0 italic">{group.description}</p>
                        </div>
                    )}

                    <div className="border border-[#c3c4c7] p-3 bg-white">
                        <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 mb-2">Active Configurations</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-[#f0f0f1] border border-[#c3c4c7] rounded-sm">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-[#50575e]" />
                                    <span className="text-[12px] text-[#1d2327]">Product Overrides</span>
                                </div>
                                <span className="font-semibold text-[13px] text-[#1d2327]">{group._count.productRates || 0} rules</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-[#f0f0f1] border border-[#c3c4c7] rounded-sm">
                                <div className="flex items-center gap-2">
                                    <Megaphone className="w-4 h-4 text-[#50575e]" />
                                    <span className="text-[12px] text-[#1d2327]">Announcements</span>
                                </div>
                                <span className="font-semibold text-[13px] text-[#1d2327]">{group._count.announcements || 0} posts</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#2271b1] bg-[#f0f6fc] p-3">
                        <p className="text-[12px] font-semibold text-[#2271b1] m-0 mb-1">Registration Link</p>
                        <div className="flex items-center gap-2 bg-white border border-[#c3c4c7] p-1.5 rounded-sm">
                            <code className="text-[11px] text-[#50575e] flex-1 truncate select-all px-1">
                                {regLink}
                            </code>
                            <button onClick={() => {
                                navigator.clipboard.writeText(regLink);
                                toast.success("Link copied");
                            }} className="p-1 hover:bg-[#f0f0f1] border border-transparent hover:border-[#c3c4c7] rounded-sm transition-colors text-[#2c3338]">
                                <Copy className="w-3.5 h-3.5"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}