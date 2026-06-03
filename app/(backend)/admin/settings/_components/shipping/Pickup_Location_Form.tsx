// File: app/admin/settings/shipping/_components/Locations/Pickup_Location_Form.tsx

"use client";

import { useState } from "react";
import { savePickupLocation } from "@/app/actions/backend/settings/shipping/locations";
import { PickupLocation } from "@prisma/client";
import { X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { getCountryAndStatesList } from "@/app/actions/backend/settings/general/location-helpers"; // ✅ Import Helper

interface FormProps {
    location: PickupLocation | null;
    onClose: () => void;
    refreshData: () => void;
}

export default function Pickup_Location_Form({ location, onClose, refreshData }: FormProps) {
    const [loading, setLoading] = useState(false);

    // ✅ Get all countries dynamically
    const allCountries = getCountryAndStatesList([]);

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

    // WP Standard Input Class
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full box-border bg-white";

    return (
        <div className="fixed inset-0 bg-[#000000b3] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* WP Style Flat Modal */}
            <div className="bg-[#f0f0f1] shadow-md w-full max-w-lg max-h-[90vh] flex flex-col font-sans text-[13px] text-[#3c434a]">
                
                {/* Header */}
                <div className="flex justify-between items-center px-[20px] py-[15px] border-b border-[#c3c4c7] bg-white shrink-0">
                    <h3 className="text-[18px] font-normal text-[#1d2327] m-0 leading-tight">
                        {location ? "Edit Pickup Location" : "Add Pickup Location"}
                    </h3>
                    <button type="button" onClick={onClose} className="text-[#646970] hover:text-[#d63638] bg-transparent border-none cursor-pointer p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto bg-white p-[20px] flex-1">
                    <form id="pickup-form" onSubmit={handleSubmit} className="space-y-[15px]">
                        
                        <div>
                            <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
                                Location Name <span className="text-[#d63638]">*</span>
                            </label>
                            <input 
                                name="name" 
                                required 
                                defaultValue={location?.name || ""}
                                placeholder="e.g. Dhaka Dhanmondi Branch" 
                                className={wpInputClass}
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
                                Address <span className="text-[#d63638]">*</span>
                            </label>
                            <input 
                                name="address" 
                                required 
                                defaultValue={location?.address || ""}
                                placeholder="House #, Road #, Area" 
                                className={wpInputClass}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-[15px]">
                            <div>
                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
                                    City <span className="text-[#d63638]">*</span>
                                </label>
                                <input 
                                    name="city" 
                                    required 
                                    defaultValue={location?.city || ""}
                                    placeholder="e.g. Dhaka" 
                                    className={wpInputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">State / District</label>
                                <input 
                                    name="state" 
                                    defaultValue={location?.state || ""}
                                    placeholder="e.g. Dhaka" 
                                    className={wpInputClass}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-[15px]">
                            <div>
                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
                                    Postcode <span className="text-[#d63638]">*</span>
                                </label>
                                <input 
                                    name="postcode" 
                                    required 
                                    defaultValue={location?.postcode || ""}
                                    placeholder="1209" 
                                    className={wpInputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Country</label>
                                <select 
                                    name="country" 
                                    defaultValue={location?.country || "AU"} // Default Country Set to Australia as fallback
                                    className={wpInputClass}
                                >
                                    <option value="">Select a country...</option>
                                    {/* ✅ Dynamic Country Options */}
                                    {allCountries.map(country => (
                                        <option key={country.value} value={country.value}>
                                            {country.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Pickup Instructions</label>
                            <textarea 
                                name="instructions" 
                                rows={3}
                                defaultValue={location?.instructions || ""}
                                placeholder="e.g. Come to the 2nd floor and ask for Store Manager. Open 9 AM - 6 PM." 
                                className={`${wpInputClass} !h-auto py-2`}
                            />
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-[15px] border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px]"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="pickup-form"
                        disabled={loading}
                        className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[30px]"
                    >
                        {loading && <Loader2 size={14} className="animate-spin"/>}
                        {location ? "Update Location" : "Add Location"}
                    </button>
                </div>

            </div>
        </div>
    );
}