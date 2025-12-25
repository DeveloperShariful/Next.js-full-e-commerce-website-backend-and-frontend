// app/admin/products/create/_components/General.tsx

import { useEffect, useState } from "react";
import { ComponentProps } from "../types";
import { getTaxClasses } from "@/app/actions/admin/product/product-read";
import { X } from "lucide-react";

export default function General({ data, updateData }: ComponentProps) {
    // State for fetching tax classes from DB
    const [taxClasses, setTaxClasses] = useState<{id: string, name: string}[]>([]);
    
    // Local state to toggle the visibility of Sale Schedule inputs
    const [showSchedule, setShowSchedule] = useState(!!data.saleStart);

    // Fetch Tax Classes on mount
    useEffect(() => {
        getTaxClasses().then(res => { if(res.success) setTaxClasses(res.data as any) });
    }, []);

    // Helper to format date for input fields (YYYY-MM-DD)
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split('T')[0];
    };

    // --- Digital Files Helpers ---
    const addFile = () => {
        updateData('digitalFiles', [...data.digitalFiles, { name: "", url: "" }]);
    };

    const updateFile = (index: number, field: string, val: string) => {
        const newFiles = [...data.digitalFiles];
        (newFiles[index] as any)[field] = val;
        updateData('digitalFiles', newFiles);
    };

    return (
        <div className="space-y-4 max-w-lg">
            
            {/* --- PRICING SECTION --- */}
            
            {/* Regular Price */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Regular price ($)</label>
                <input 
                    type="number" 
                    value={data.price} 
                    onChange={e => updateData('price', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                    placeholder="0.00"
                />
            </div>

            {/* Sale Price & Schedule */}
            <div>
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-right font-medium text-xs">Sale price ($)</label>
                    <div className="col-span-2 flex items-center gap-2">
                        <input 
                            type="number" 
                            value={data.salePrice} 
                            onChange={e => updateData('salePrice', e.target.value)} 
                            className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                            placeholder="0.00"
                        />
                        <button 
                            type="button" 
                            onClick={() => {
                                setShowSchedule(!showSchedule);
                                // Clear dates if hiding schedule
                                if (showSchedule) {
                                    updateData('saleStart', "");
                                    updateData('saleEnd', "");
                                }
                            }}
                            className="text-xs text-[#2271b1] hover:underline whitespace-nowrap"
                        >
                            {showSchedule ? "Cancel" : "Schedule"}
                        </button>
                    </div>
                </div>

                {/* Schedule Date Pickers */}
                {showSchedule && (
                    <div className="mt-2 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1">
                        <div className="col-start-2 col-span-2 flex gap-2">
                            <input 
                                type="date" 
                                value={formatDate(data.saleStart)} 
                                onChange={e => updateData('saleStart', e.target.value)}
                                className="w-1/2 border border-gray-400 px-2 py-1 rounded-sm text-xs outline-none focus:border-[#2271b1]"
                                placeholder="From YYYY-MM-DD"
                            />
                            <input 
                                type="date" 
                                value={formatDate(data.saleEnd)} 
                                onChange={e => updateData('saleEnd', e.target.value)}
                                className="w-1/2 border border-gray-400 px-2 py-1 rounded-sm text-xs outline-none focus:border-[#2271b1]"
                                placeholder="To YYYY-MM-DD"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Cost Per Item */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs text-gray-500">Cost per item</label>
                <div className="col-span-2">
                    <input 
                        type="number" 
                        value={data.costPerItem} 
                        onChange={e => updateData('costPerItem', e.target.value)} 
                        className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                        placeholder="0.00"
                    />
                     <p className="text-[10px] text-gray-500 mt-1">Customers won&apos;t see this</p>
                </div>
            </div>

            <hr className="border-gray-200 my-4"/>

            {/* --- TAX SECTION --- */}
            
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Tax status</label>
                <select 
                    value={data.taxStatus} 
                    onChange={e => updateData('taxStatus', e.target.value)}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                >
                    <option value="taxable">Taxable</option>
                    <option value="shipping">Shipping only</option>
                    <option value="none">None</option>
                </select>
            </div>

            {/* Show Tax Class only if Taxable */}
            {data.taxStatus === 'taxable' && (
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-right font-medium text-xs">Tax class</label>
                    <select 
                        value={data.taxRateId} 
                        onChange={e => updateData('taxRateId', e.target.value)}
                        className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                    >
                        <option value="">Standard</option>
                        {taxClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* --- DOWNLOAD SETTINGS (Only if Is Downloadable is checked) --- */}
            
            {data.isDownloadable && (
                <div className="mt-6 border-t border-gray-200 pt-4 animate-in fade-in">
                    <h3 className="text-xs font-bold text-gray-700 mb-3 ml-1">Download Settings</h3>
                    
                    {/* Digital Files Management */}
                    <div className="mb-4 bg-gray-50 border border-gray-300 p-3 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-600">Files</label>
                            <button type="button" onClick={addFile} className="text-[10px] bg-[#2271b1] text-white px-2 py-0.5 rounded hover:bg-[#1a5c91]">Add File</button>
                        </div>
                        
                        {data.digitalFiles.map((file, i) => (
                            <div key={i} className="mb-2 bg-white border border-gray-200 p-2 rounded flex gap-2 items-start shadow-sm">
                                <div className="flex-1 space-y-2">
                                    <input 
                                        placeholder="File Name" 
                                        value={file.name} 
                                        onChange={e => updateFile(i, 'name', e.target.value)}
                                        className="w-full border border-gray-300 px-2 py-1 text-xs rounded focus:border-[#2271b1] outline-none"
                                    />
                                    <input 
                                        placeholder="File URL" 
                                        value={file.url} 
                                        onChange={e => updateFile(i, 'url', e.target.value)}
                                        className="w-full border border-gray-300 px-2 py-1 text-xs rounded focus:border-[#2271b1] outline-none"
                                    />
                                </div>
                                <button type="button" onClick={() => {
                                    updateData('digitalFiles', data.digitalFiles.filter((_, idx) => idx !== i));
                                }} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                            </div>
                        ))}
                        {data.digitalFiles.length === 0 && <p className="text-[11px] text-gray-400 italic text-center py-2">No files added yet.</p>}
                    </div>

                    {/* Download Limits */}
                    <div className="grid grid-cols-3 gap-4 items-center mb-3">
                        <label className="text-right font-medium text-xs">Download limit</label>
                        <div className="col-span-2">
                            <input 
                                type="number" 
                                value={data.downloadLimit === -1 ? "" : data.downloadLimit} 
                                onChange={e => updateData('downloadLimit', e.target.value === "" ? -1 : parseInt(e.target.value))} 
                                className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                                placeholder="Unlimited"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Leave blank for unlimited re-downloads.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-right font-medium text-xs">Download expiry</label>
                        <div className="col-span-2">
                            <input 
                                type="number" 
                                value={data.downloadExpiry === -1 ? "" : data.downloadExpiry} 
                                onChange={e => updateData('downloadExpiry', e.target.value === "" ? -1 : parseInt(e.target.value))} 
                                className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                                placeholder="Never"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">Enter number of days before a download link expires, or leave blank.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}