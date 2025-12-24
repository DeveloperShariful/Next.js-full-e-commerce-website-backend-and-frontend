// File: app/admin/settings/shipping/_components/Locations/Pickup_Location_Form.tsx

"use client";

import { useState } from "react";
import { savePickupLocation } from "@/app/actions/admin/settings/shipping/locations";
import { PickupLocation } from "@prisma/client";
import { X, Loader2, Save, Store } from "lucide-react";
import { toast } from "react-hot-toast";

interface FormProps {
    location: PickupLocation | null;
    onClose: () => void;
    refreshData: () => void;
}

export default function Pickup_Location_Form({ location, onClose, refreshData }: FormProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        
        if (location) {
            formData.append("id", location.id);
        }

        const res = await savePickupLocation(formData);
        
        if (res.success) {
            toast.success(res.message || "Location saved");
            refreshData();
            onClose();
        } else {
            toast.error(res.error || "Error saving location");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Store size={18} className="text-[#2271b1]"/> 
                        {location ? "Edit Location" : "Add Location"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            Location Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                            name="name" 
                            required 
                            defaultValue={location?.name || ""}
                            placeholder="e.g. Dhaka Dhanmondi Branch" 
                            className="w-full border border-slate-300 p-2.5 rounded-md outline-none focus:border-[#2271b1] transition-all"
                        />
                    </div>

                    {/* Address Line */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Address <span className="text-red-500">*</span></label>
                        <input 
                            name="address" 
                            required 
                            defaultValue={location?.address || ""}
                            placeholder="House #, Road #, Area" 
                            className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                        />
                    </div>

                    {/* City & State Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">City <span className="text-red-500">*</span></label>
                            <input 
                                name="city" 
                                required 
                                defaultValue={location?.city || ""}
                                placeholder="e.g. Dhaka" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">State / District</label>
                            <input 
                                name="state" 
                                defaultValue={location?.state || ""}
                                placeholder="e.g. Dhaka" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                        </div>
                    </div>

                    {/* Postcode & Country Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Postcode <span className="text-red-500">*</span></label>
                            <input 
                                name="postcode" 
                                required 
                                defaultValue={location?.postcode || ""}
                                placeholder="1209" 
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Country</label>
                            <select 
                                name="country" 
                                defaultValue={location?.country || "BD"}
                                className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1] bg-white"
                            >
                                <option value="BD">Bangladesh</option>
                                <option value="AU">Australia</option>
                                <option value="US">United States</option>
                                {/* Add more if needed */}
                            </select>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Pickup Instructions</label>
                        <textarea 
                            name="instructions" 
                            rows={3}
                            defaultValue={location?.instructions || ""}
                            placeholder="e.g. Come to the 2nd floor and ask for Store Manager. Open 9 AM - 6 PM." 
                            className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                        />
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t mt-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 border border-slate-300 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#2271b1] text-white rounded-md text-sm font-bold hover:bg-[#135e96] disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                            {location ? "Update Location" : "Add Location"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}