// File: app/(admin)/admin/settings/affiliate/_components/group-manager.tsx

"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { 
  Search, Plus, Users, Edit, Trash2, MoreVertical, 
  Layers, Percent, ShieldCheck, Package, Megaphone,
  Copy, X, Loader2, Save, ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AffiliateGroup } from "@prisma/client";

// ✅ CORRECTED IMPORT: Using named imports from consolidated group service
import { 
  deleteGroupAction, 
  upsertGroupAction 
} from "@/app/actions/admin/settings/affiliates/_services/group-service";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GroupWithDetails extends AffiliateGroup {
  _count: { 
    affiliates: number;
    productRates: number;
    announcements: number;
  };
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

  useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  // --- Filter & Sort Logic ---
  const filteredGroups = useMemo(() => {
    let result = [...groups];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.slug.toLowerCase().includes(q) ||
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
        // ✅ Call Service Method Directly
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
            // ✅ Call Service Method Directly
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
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 1. HEADER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Layers className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total Groups</p>
                <h3 className="text-2xl font-bold text-gray-900">{groups.length}</h3>
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Users className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Assigned Affiliates</p>
                <h3 className="text-2xl font-bold text-gray-900">
                    {groups.reduce((acc, curr) => acc + curr._count.affiliates, 0)}
                </h3>
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Active Override Rules</p>
                <h3 className="text-2xl font-bold text-gray-900">
                    {groups.reduce((acc, curr) => acc + curr._count.productRates, 0)}
                </h3>
            </div>
        </div>
      </div>

      {/* 2. TOOLBAR */}
      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-200 flex flex-col xl:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 w-full xl:w-auto">
            <div className={cn("flex items-center gap-2 transition-all duration-300", selectedIds.size > 0 ? "opacity-100" : "opacity-50 pointer-events-none grayscale")}>
                <button 
                    onClick={handleBulkDelete}
                    disabled={isPending || selectedIds.size === 0}
                    className="h-9 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.size})
                </button>
            </div>
            {selectedIds.size === 0 && (
                <span className="text-xs text-gray-400 italic pl-2 border-l ml-2">Select groups to manage</span>
            )}
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              className="block w-full p-2 pl-10 text-xs text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-black focus:border-black outline-none shadow-sm transition-all h-9" 
              placeholder="Search groups..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 h-9 px-4 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> New Group
          </button>
        </div>
      </div>

      {/* 3. TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ring-1 ring-black/5">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200 font-bold tracking-wider">
              <tr>
                <th scope="col" className="p-4 w-10">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer transition-all"
                      checked={filteredGroups.length > 0 && selectedIds.size === filteredGroups.length}
                      onChange={handleSelectAll}
                    />
                  </div>
                </th>
                <SortableHeader label="Group Info" field="name" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Commission" field="commissionRate" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <SortableHeader label="Members" field="_count.affiliates" currentSort={sortField} currentDir={sortDirection} onSort={handleSort} />
                <th scope="col" className="px-6 py-3">Config</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <Layers className="w-10 h-10 opacity-30 text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No groups found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => (
                  <tr key={group.id} className="bg-white hover:bg-gray-50/60 transition-colors group">
                    <td className="p-4 w-4">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-black bg-white border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer transition-all"
                          checked={selectedIds.has(group.id)}
                          onChange={() => handleSelectOne(group.id)}
                        />
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleOpenDetails(group)} className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline transition-colors">
                                    {group.name}
                                </button>
                                {group.isDefault && (
                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wide">
                                        Default
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">/{group.slug}</span>
                            </div>
                            {group.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{group.description}</p>}
                        </div>
                    </td>

                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                            <div className={cn("p-1.5 rounded-lg", group.commissionRate ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400")}>
                                <Percent className="w-3.5 h-3.5" />
                            </div>
                            <span className={cn("font-mono font-bold text-sm", group.commissionRate ? "text-gray-900" : "text-gray-400 italic")}>
                                {group.commissionRate ? `${Number(group.commissionRate)}%` : "Global"}
                            </span>
                        </div>
                    </td>

                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[...Array(Math.min(group._count.affiliates, 3))].map((_, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                                        <Users className="w-3 h-3" />
                                    </div>
                                ))}
                                {group._count.affiliates > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                                        +{group._count.affiliates - 3}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                                {group._count.affiliates} Users
                            </span>
                        </div>
                    </td>

                    <td className="px-6 py-4">
                        <div className="flex gap-2">
                            {group._count.productRates > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium border border-purple-100" title="Product Overrides">
                                    <Package className="w-3 h-3" /> {group._count.productRates}
                                </span>
                            )}
                            {group._count.announcements > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-[10px] font-medium border border-orange-100" title="Active Announcements">
                                    <Megaphone className="w-3 h-3" /> {group._count.announcements}
                                </span>
                            )}
                            {group._count.productRates === 0 && group._count.announcements === 0 && (
                                <span className="text-[10px] text-gray-300 italic">No overrides</span>
                            )}
                        </div>
                    </td>

                    <td className="px-6 py-4">
                        {group.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
                                Active
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wide">
                                Inactive
                            </span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button disabled={isPending} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors outline-none focus:ring-2 focus:ring-black/5">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <MoreVertical className="w-4 h-4" />}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 shadow-xl border-gray-200 p-1">
                          <DropdownMenuLabel className="text-xs font-bold text-gray-500 uppercase px-2 py-1.5">Group Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenDetails(group)} className="cursor-pointer text-xs font-medium px-2 py-2 rounded hover:bg-gray-50">
                            <Users className="w-3.5 h-3.5 mr-2 text-gray-500" /> View Members
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(group)} className="cursor-pointer text-xs font-medium px-2 py-2 rounded hover:bg-gray-50">
                            <Edit className="w-3.5 h-3.5 mr-2 text-gray-500" /> Edit Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(group.id)} className="cursor-pointer text-xs font-medium px-2 py-2 rounded text-red-700 hover:bg-red-50 focus:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GroupConfigModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={editingGroup} 
      />

      <GroupDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        group={selectedGroup} 
      />

    </div>
  );
}

// --- SUB COMPONENTS ---

function SortableHeader({ label, field, currentSort, currentDir, onSort }: any) {
    return (
        <th scope="col" className="px-6 py-3 cursor-pointer group select-none">
            <div className="flex items-center gap-1.5" onClick={() => onSort(field)}>
                {label}
                <ArrowUpDown className={cn(
                    "w-3 h-3 transition-colors",
                    currentSort === field ? "text-black" : "text-gray-300 group-hover:text-gray-500"
                )} />
            </div>
        </th>
    );
}

function GroupConfigModal({ isOpen, onClose, initialData }: any) {
    const [isPending, startTransition] = useTransition();
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            commissionRate: initialData?.commissionRate ? Number(initialData.commissionRate) : "",
            isDefault: initialData?.isDefault || false
        }
    });

    const onSubmit = (data: any) => {
        startTransition(async () => {
            // ✅ Call Service Method Directly
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">{initialData ? "Edit Group" : "Create Group"}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-black" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <form id="group-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Group Name</label>
                            <input 
                                {...register("name", { required: "Name is required" })} 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" 
                                placeholder="e.g. VIP Influencers" 
                            />
                            {errors.name && <span className="text-red-500 text-xs font-medium">{errors.name.message as string}</span>}
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Description</label>
                            <textarea {...register("description")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" rows={3} placeholder="Internal notes..." />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Commission Override (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input type="number" step="0.01" {...register("commissionRate")} className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" placeholder="Global default" />
                            </div>
                            <p className="text-[10px] text-gray-400">Leave empty to use the system-wide commission rate.</p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3 hover:border-blue-200 transition-colors">
                            <input type="checkbox" id="isDefault" {...register("isDefault")} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                            <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                                Set as Default Group <br/>
                                <span className="text-xs text-blue-600/70 font-normal">New affiliates will join this group automatically.</span>
                            </label>
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" form="group-form" disabled={isPending} className="px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save Group
                    </button>
                </div>
            </div>
        </div>
    );
}

function GroupDetailDrawer({ isOpen, onClose, group }: { isOpen: boolean, onClose: () => void, group: GroupWithDetails | null }) {
    if (!isOpen || !group) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity animate-in fade-in" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-gray-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-2">
                             <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
                             {group.isDefault && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Default</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 font-mono">/{group.slug}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Members</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500"/> {group._count.affiliates}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Commission</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                                <Percent className="w-5 h-5 text-green-500"/> {group.commissionRate ? `${Number(group.commissionRate)}%` : "Global"}
                            </p>
                        </div>
                    </div>

                    {group.description && (
                        <div>
                            <h4 className="text-xs font-bold text-gray-900 border-b pb-2 mb-2 uppercase">Description</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg italic">"{group.description}"</p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-xs font-bold text-gray-900 border-b pb-2 mb-3 uppercase flex justify-between">
                            Active Configurations 
                            <span className="text-gray-400 font-normal normal-case">Linked to this group</span>
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Product Overrides</span>
                                </div>
                                <span className="font-bold text-gray-900">{group._count.productRates} rules</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded">
                                        <Megaphone className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Announcements</span>
                                </div>
                                <span className="font-bold text-gray-900">{group._count.announcements} posts</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col gap-2">
                        <p className="text-xs font-bold text-blue-700 uppercase">Registration Link for this Group</p>
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-200">
                            <code className="text-xs text-gray-600 flex-1 truncate">
                                https://gobike.au/affiliate/register?group={group.slug}
                            </code>
                            <button onClick={() => {
                                navigator.clipboard.writeText(`https://gobike.au/affiliate/register?group=${group.slug}`);
                                toast.success("Link copied");
                            }} className="p-1 hover:bg-gray-100 rounded">
                                <Copy className="w-3.5 h-3.5 text-gray-500"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}