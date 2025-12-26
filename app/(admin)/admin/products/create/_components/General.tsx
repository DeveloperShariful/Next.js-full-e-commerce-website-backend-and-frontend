// app/admin/products/create/_components/General.tsx

import { useEffect, useState } from "react";
import { ComponentProps } from "../types";
import { getTaxClasses } from "@/app/actions/admin/product/product-read";
import { X } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider"; // 🚀 Hook Import

export default function General({ data, updateData }: ComponentProps) {
    const [taxClasses, setTaxClasses] = useState<{id: string, name: string}[]>([]);
    const [showSchedule, setShowSchedule] = useState(!!data.saleStart);
    
    // 🚀 Dynamic Currency Symbol from Global Settings
    const { symbol } = useGlobalStore(); 

    useEffect(() => {
        getTaxClasses().then(res => { if(res.success) setTaxClasses(res.data as any) });
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split('T')[0];
    };

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
            
            {/* Regular Price */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Regular price ({symbol})</label>
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
                    <label className="text-right font-medium text-xs">Sale price ({symbol})</label>
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

                {showSchedule && (
                    <div className="mt-2 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1">
                        <div className="col-start-2 col-span-2 flex gap-2">
                            <input 
                                type="date" 
                                value={formatDate(data.saleStart)} 
                                onChange={e => updateData('saleStart', e.target.value)}
                                className="w-1/2 border border-gray-400 px-2 py-1 rounded-sm text-xs outline-none focus:border-[#2271b1]"
                            />
                            <input 
                                type="date" 
                                value={formatDate(data.saleEnd)} 
                                onChange={e => updateData('saleEnd', e.target.value)}
                                className="w-1/2 border border-gray-400 px-2 py-1 rounded-sm text-xs outline-none focus:border-[#2271b1]"
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

            {/* Tax Section */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Tax status</label>
                <select 
                    value={data.taxStatus} 
                    onChange={e => updateData('taxStatus', e.target.value)}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                >
                    <option value="taxable">Taxable</option>
                    <option value="shipping_only">Shipping only</option>
                    <option value="none">None</option>
                </select>
            </div>

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

            {/* Download Settings (Same as before) */}
            {data.isDownloadable && (
                <div className="mt-6 border-t border-gray-200 pt-4 animate-in fade-in">
                    <h3 className="text-xs font-bold text-gray-700 mb-3 ml-1">Download Settings</h3>
                    <div className="mb-4 bg-gray-50 border border-gray-300 p-3 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-600">Files</label>
                            <button type="button" onClick={addFile} className="text-[10px] bg-[#2271b1] text-white px-2 py-0.5 rounded hover:bg-[#1a5c91]">Add File</button>
                        </div>
                        {data.digitalFiles.map((file, i) => (
                            <div key={i} className="mb-2 bg-white border border-gray-200 p-2 rounded flex gap-2 items-start shadow-sm">
                                <div className="flex-1 space-y-2">
                                    <input placeholder="File Name" value={file.name} onChange={e => updateFile(i, 'name', e.target.value)} className="w-full border border-gray-300 px-2 py-1 text-xs rounded focus:border-[#2271b1] outline-none" />
                                    <input placeholder="File URL" value={file.url} onChange={e => updateFile(i, 'url', e.target.value)} className="w-full border border-gray-300 px-2 py-1 text-xs rounded focus:border-[#2271b1] outline-none" />
                                </div>
                                <button type="button" onClick={() => updateData('digitalFiles', data.digitalFiles.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4 items-center mb-3">
                        <label className="text-right font-medium text-xs">Download limit</label>
                        <div className="col-span-2">
                            <input type="number" value={data.downloadLimit === -1 ? "" : data.downloadLimit} onChange={e => updateData('downloadLimit', e.target.value === "" ? -1 : parseInt(e.target.value))} className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" placeholder="Unlimited" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-right font-medium text-xs">Download expiry</label>
                        <div className="col-span-2">
                            <input type="number" value={data.downloadExpiry === -1 ? "" : data.downloadExpiry} onChange={e => updateData('downloadExpiry', e.target.value === "" ? -1 : parseInt(e.target.value))} className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" placeholder="Never" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}