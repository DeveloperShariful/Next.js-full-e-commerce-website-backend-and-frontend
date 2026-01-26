//File: app/(admin)/admin/settings/affiliate/groups/_components/group-manager.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { AffiliateGroup } from "@prisma/client";
import { Plus, Search, Edit, Trash2, Users, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Define the type locally if not in central types
interface GroupWithCount extends AffiliateGroup {
  _count: { affiliates: number };
}

// Mock actions (Replace with actual imports when you create mutation files)
const upsertGroupAction = async (data: any) => ({ success: true, message: "Group saved (Simulated)" });
const deleteGroupAction = async (id: string) => ({ success: true, message: "Group deleted (Simulated)" });

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
    
    // In real app, call server action here
    const res = await deleteGroupAction(id);
    if(res.success) {
        setGroups(prev => prev.filter(g => g.id !== id));
        toast.success(res.message);
    }
  };

  // ✅ FIX: Explicit type for onSuccess callback
  const handleSuccess = () => {
    setIsModalOpen(false);
    toast.success("Group saved");
    // In real app, you might re-fetch data or update state here
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
         <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              placeholder="Search by group name..." 
              className="pl-9 pr-4 py-2 w-full border rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <button 
           onClick={handleCreate}
           className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all"
         >
            <Plus className="w-4 h-4" /> Add New Group
         </button>
      </div>

      {/* GROUPS LIST */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs font-semibold">
             <tr>
                <th className="px-6 py-3 w-10"><input type="checkbox" className="rounded" /></th>
                <th className="px-6 py-3">Group Name</th>
                <th className="px-6 py-3">Commission Rate</th>
                <th className="px-6 py-3">Affiliates</th>
                <th className="px-6 py-3">Net Revenue</th>
                <th className="px-6 py-3 text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
             {filteredGroups.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No groups found.</td></tr>
             ) : (
                filteredGroups.map(group => (
                   <tr key={group.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{group.name}</span>
                            {group.isDefault && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full">Default</span>}
                         </div>
                         <div className="text-xs text-gray-400 mt-0.5">Slug: {group.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-sm font-medium">
                            {group.commissionRate ? `${Number(group.commissionRate)}%` : <span className="text-gray-400 italic">Site Default</span>}
                         </div>
                         <div className="text-[10px] text-gray-400">from site default</div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-1 text-blue-600 font-medium cursor-pointer hover:underline">
                            <Users className="w-3 h-3" /> {group._count.affiliates}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-xs space-y-1">
                            <div className="flex gap-2"><span>Sales:</span> <span className="font-medium">$0.00</span></div>
                            <div className="flex gap-2 text-gray-400"><span>Comm:</span> <span>($0.00)</span></div>
                            <div className="border-t w-24 pt-1 font-bold">Net: $0.00</div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(group)} className="p-2 text-gray-500 hover:bg-gray-100 rounded"><Edit className="w-4 h-4" /></button>
                            {!group.isDefault && (
                                <button onClick={() => handleDelete(group.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            )}
                         </div>
                      </td>
                   </tr>
                ))
             )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
         <GroupModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            initialData={editingGroup}
            onSuccess={handleSuccess}
         />
      )}
    </div>
  );
}

// --- SUB COMPONENT: MODAL ---

interface GroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: GroupWithCount | null;
    onSuccess: () => void;
}

function GroupModal({ isOpen, onClose, initialData, onSuccess }: GroupModalProps) {
    const [isPending, startTransition] = useTransition();
    
    // Explicit form types
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
            await upsertGroupAction({ ...data, id: initialData?.id });
            onSuccess();
        });
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-lg">{initialData ? "Edit Group" : "Create Group"}</h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Group Name</label>
                        <input 
                            {...register("name", { required: true })} 
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none" 
                            placeholder="e.g. VIP Influencers" 
                        />
                        {errors.name && <span className="text-red-500 text-xs">Name is required</span>}
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea {...register("description")} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none" rows={3} placeholder="Internal notes..." />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Override Commission Rate (%)</label>
                        <input type="number" step="0.01" {...register("commissionRate")} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-black outline-none" placeholder="Leave empty to use global default" />
                        <p className="text-[10px] text-gray-500">If set, this overrides the global store commission rate for members of this group.</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="isDefault" {...register("isDefault")} className="rounded border-gray-300 text-black focus:ring-black" />
                        <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">Set as Default Group for new signups</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isPending} className="px-6 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 flex items-center gap-2">
                            {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                            Save Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}