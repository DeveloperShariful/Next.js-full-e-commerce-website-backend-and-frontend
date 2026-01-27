// File: app/(admin)/admin/settings/affiliate/_components/group-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { AffiliateGroup } from "@prisma/client";
import { Plus, Search, Edit, Trash2, Users, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { upsertGroupAction, deleteGroupAction } from "@/app/actions/admin/settings/affiliates/mutations/manage-groups";

interface GroupWithCount extends AffiliateGroup {
  _count: { affiliates: number };
}

interface Props {
  initialGroups: GroupWithCount[];
}

export default function GroupManager({ initialGroups }: Props) {
  const [groups, setGroups] = useState<GroupWithCount[]>(initialGroups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithCount | null>(null);
  const [search, setSearch] = useState("");

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleEdit = (group: GroupWithCount) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this group? Affiliates will be moved to default.")) return;
    
    const res = await deleteGroupAction(id);
    if(res.success) {
        setGroups(prev => prev.filter(g => g.id !== id));
        toast.success(res.message);
    } else {
        toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              placeholder="Search groups..." 
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <button 
           onClick={handleCreate}
           className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
         >
            <Plus className="w-4 h-4" /> Create Group
         </button>
      </div>

      {/* Groups List */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
             <tr>
                <th className="px-6 py-3">Group Name</th>
                <th className="px-6 py-3">Commission Rate</th>
                <th className="px-6 py-3">Affiliates</th>
                <th className="px-6 py-3 text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {filteredGroups.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                    <Users className="w-10 h-10 text-gray-300 mb-3" />
                    <p>No groups found.</p>
                </td></tr>
             ) : (
                filteredGroups.map(group => (
                   <tr key={group.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{group.name}</span>
                            {group.isDefault && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded border border-blue-100">Default</span>}
                         </div>
                         <div className="text-xs text-gray-400 mt-0.5 font-mono">Slug: {group.slug}</div>
                         {group.description && <div className="text-xs text-gray-500 mt-1 max-w-sm truncate">{group.description}</div>}
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-sm font-bold text-gray-800">
                            {group.commissionRate ? `${Number(group.commissionRate)}%` : <span className="text-gray-400 font-normal italic">Global Default</span>}
                         </div>
                         <div className="text-[10px] text-gray-400">Override rate</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-1 text-gray-700 bg-gray-50 px-2 py-1 rounded w-fit text-xs font-medium border border-gray-100">
                            <Users className="w-3 h-3 text-gray-400" /> {group._count.affiliates} Members
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(group)} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                            {!group.isDefault && (
                                <button onClick={() => handleDelete(group.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            )}
                         </div>
                      </td>
                   </tr>
                ))
             )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
         <GroupModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            initialData={editingGroup}
            onSuccess={() => {
                setIsModalOpen(false);
                toast.success("Group saved successfully");
                // In a real app, router.refresh() or state update would happen here
                window.location.reload(); 
            }}
         />
      )}
    </div>
  );
}

// --- SUB COMPONENT: Group Modal ---

interface GroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: GroupWithCount | null;
    onSuccess: () => void;
}

function GroupModal({ isOpen, onClose, initialData, onSuccess }: GroupModalProps) {
    const [isPending, startTransition] = useTransition();
    
    type GroupFormValues = {
        name: string;
        description: string;
        commissionRate: number | string;
        isDefault: boolean;
    };

    const { register, handleSubmit, formState: { errors } } = useForm<GroupFormValues>({
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            commissionRate: initialData?.commissionRate ? Number(initialData.commissionRate) : "",
            isDefault: initialData?.isDefault || false
        }
    });

    const onSubmit = (data: GroupFormValues) => {
        startTransition(async () => {
            const res = await upsertGroupAction({ ...data, id: initialData?.id });
            if(res.success) onSuccess();
            else toast.error(res.message);
        });
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">{initialData ? "Edit Group" : "Create New Group"}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-black" /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Group Name</label>
                        <input 
                            {...register("name", { required: true })} 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" 
                            placeholder="e.g. VIP Influencers" 
                        />
                        {errors.name && <span className="text-red-500 text-xs font-medium">Name is required</span>}
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Description</label>
                        <textarea {...register("description")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" rows={3} placeholder="Internal notes about this group..." />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase">Commission Override (%)</label>
                        <input type="number" step="0.01" {...register("commissionRate")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" placeholder="Leave empty to use global default" />
                        <p className="text-[10px] text-gray-400">Overrides the store-wide rate for members.</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3 hover:border-gray-200 transition-colors">
                        <div className="relative flex items-center">
                            <input type="checkbox" id="isDefault" {...register("isDefault")} className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer peer" />
                        </div>
                        <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                            Set as Default Group <br/>
                            <span className="text-xs text-gray-400 font-normal">New affiliates will join this group automatically.</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}