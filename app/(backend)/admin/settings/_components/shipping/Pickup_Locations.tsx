// File: app/admin/settings/shipping/_components/Locations/Pickup_Locations.tsx

"use client";

import { useState } from "react";
import { deletePickupLocation, togglePickupStatus } from "@/app/actions/backend/settings/shipping/locations";
import { PickupLocation } from "@prisma/client";
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
        <div className="w-full text-[13px] text-[#3c434a] animate-in fade-in">
            
            {/* WP Page Title & Action */}
            <div className="flex items-center gap-3 mb-[15px]">
                <h2 className="text-[23px] font-normal text-[#1d2327] m-0">Local Pickup Locations</h2>
                <button 
                    onClick={handleAddNew} 
                    className="bg-[#f6f7f7] border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[10px] py-[2px] text-[13px] font-semibold cursor-pointer"
                >
                    Add Location
                </button>
            </div>
            <p className="text-[13px] text-[#646970] mt-0 mb-[15px]">Customers can choose to pick up their orders from these locations. Activate "Local Pickup" in your Shipping Zones to show them at checkout.</p>

            {/* WP List Table */}
            <div className="w-full overflow-x-auto bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border mb-[30px]">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] w-[30%]">Location Name</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Address Details</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {locations.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-[10px] py-[20px] text-center text-[#646970] italic">
                                    No pickup locations added. Add one to enable "Local Pickup" options properly.
                                </td>
                            </tr>
                        ) : locations.map((loc, index) => (
                            <tr key={loc.id} className={`border-b border-[#f0f0f1] last:border-none hover:bg-[#f6f7f7] group ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                                <td className="px-[10px] py-[10px] align-top">
                                    <strong className="text-[#2271b1] block text-[14px]">{loc.name}</strong>
                                    
                                    {/* WP Row Actions (Hover to reveal) */}
                                    <div className="text-[12px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEdit(loc)}
                                            className="bg-transparent border-none text-[#2271b1] hover:underline cursor-pointer p-0"
                                        >
                                            Edit
                                        </button>
                                        <span className="text-[#c3c4c7] mx-1">|</span>
                                        <button 
                                            onClick={() => handleToggle(loc.id, loc.isActive)}
                                            className="bg-transparent border-none text-[#2271b1] hover:underline cursor-pointer p-0"
                                        >
                                            {loc.isActive ? "Disable" : "Enable"}
                                        </button>
                                        <span className="text-[#c3c4c7] mx-1">|</span>
                                        <button 
                                            onClick={() => handleDelete(loc.id)}
                                            className="bg-transparent border-none text-[#d63638] hover:underline cursor-pointer p-0"
                                        >
                                            Trash
                                        </button>
                                    </div>
                                </td>
                                <td className="px-[10px] py-[10px] text-[#3c434a] align-top">
                                    <div className="leading-relaxed">
                                        {loc.address}, {loc.city} {loc.postcode}, {loc.state} <br/>
                                        {loc.country}
                                    </div>
                                    {loc.instructions && (
                                        <p className="text-[12px] text-[#646970] mt-[5px] mb-0 italic">
                                            <strong>Instructions:</strong> {loc.instructions}
                                        </p>
                                    )}
                                </td>
                                <td className="px-[10px] py-[10px] align-top">
                                    {loc.isActive ? (
                                        <span className="text-[#007017] font-semibold">Active</span>
                                    ) : (
                                        <span className="text-[#646970]">Inactive</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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