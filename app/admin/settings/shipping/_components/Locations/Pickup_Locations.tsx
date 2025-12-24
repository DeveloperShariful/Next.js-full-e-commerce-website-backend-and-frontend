// File: app/admin/settings/shipping/_components/Locations/Pickup_Locations.tsx

"use client";

import { useState } from "react";
import { deletePickupLocation, togglePickupStatus } from "@/app/actions/admin/settings/shipping/locations";
import { PickupLocation } from "@prisma/client";
import { Plus, Store, Trash2, Edit, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import Pickup_Location_Form from "./Pickup_Location_Form";

interface PickupListProps {
    locations: PickupLocation[];
    refreshData: () => void;
}

export default function Pickup_Locations({ locations, refreshData }: PickupListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLoc, setEditingLoc] = useState<PickupLocation | null>(null);

    const handleAddNew = () => {
        setEditingLoc(null);
        setIsModalOpen(true);
    };

    const handleEdit = (loc: PickupLocation) => {
        setEditingLoc(loc);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this pickup location?")) {
            const res = await deletePickupLocation(id);
            if (res.success) {
                toast.success(res.message || "Location deleted");
                refreshData();
            } else {
                toast.error(res.error || "Failed to delete");
            }
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const res = await togglePickupStatus(id, !currentStatus);
        if (res.success) {
            toast.success("Status updated");
            refreshData();
        } else {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Store size={20} className="text-[#2271b1]" />
                        Local Pickup Locations
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Customers can choose to pick up their orders from these locations.
                    </p>
                </div>
                <button onClick={handleAddNew} className="w-full md:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] text-sm shadow-sm transition-colors">
                    <Plus size={16} /> Add Location
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden">
                {locations.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 italic bg-slate-50">
                        No pickup locations added. Add one to enable "Local Pickup" options properly.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 divide-y divide-slate-100">
                        {locations.map((loc) => (
                            <div key={loc.id} className="p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-slate-50 transition-colors group">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2 bg-slate-100 rounded text-slate-500 group-hover:text-[#2271b1] transition-colors">
                                        <MapPin size={20}/>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-slate-800">{loc.name}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border ${loc.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                {loc.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {loc.address}, {loc.city} {loc.postcode}, {loc.state}
                                        </p>
                                        {loc.instructions && (
                                            <p className="text-xs text-slate-400 mt-1 italic">
                                                Note: {loc.instructions}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
                                    <button 
                                        onClick={() => handleToggle(loc.id, loc.isActive)}
                                        className="text-xs font-bold px-3 py-1.5 border rounded hover:bg-slate-50 transition-colors"
                                    >
                                        {loc.isActive ? "Disable" : "Enable"}
                                    </button>
                                    <button onClick={() => handleEdit(loc)} className="p-2 text-slate-400 hover:text-[#2271b1] hover:bg-blue-50 rounded transition-all">
                                        <Edit size={18}/>
                                    </button>
                                    <button onClick={() => handleDelete(loc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <Pickup_Location_Form 
                    location={editingLoc} 
                    onClose={() => setIsModalOpen(false)} 
                    refreshData={refreshData}
                />
            )}
        </div>
    );
}