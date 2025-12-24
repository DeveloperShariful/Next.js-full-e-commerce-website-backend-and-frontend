// app/admin/products/create/_components/General.tsx

import { useEffect, useState } from "react";
import { ComponentProps } from "../types";
import { getTaxRates } from "@/app/actions/admin/product/product-read";
import { X, Upload } from "lucide-react";

export default function General({ data, updateData }: ComponentProps) {
    const [taxRates, setTaxRates] = useState<{id: string, name: string, rate: number}[]>([]);

    useEffect(() => {
        getTaxRates().then(res => { if(res.success) setTaxRates(res.data as any) });
    }, []);

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
            {/* Pricing Section */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Regular price ($)</label>
                <input 
                    type="number" 
                    value={data.price} 
                    onChange={e => updateData('price', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                    placeholder="0.00"
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Sale price ($)</label>
                <input 
                    type="number" 
                    value={data.salePrice} 
                    onChange={e => updateData('salePrice', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                    placeholder="0.00"
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs text-gray-500">Cost per item</label>
                <input 
                    type="number" 
                    value={data.cost} 
                    onChange={e => updateData('cost', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                    placeholder="0.00"
                />
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
                    <option value="shipping">Shipping only</option>
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
                        {taxRates.map(r => (
                            <option key={r.id} value={r.id}>{r.name} ({r.rate}%)</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Digital Files Section */}
            {data.isDownloadable && (
                <div className="mt-6 border border-gray-300 rounded-sm bg-gray-50 p-4">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-gray-700">Downloadable Files</label>
                        <button type="button" onClick={addFile} className="text-xs bg-[#2271b1] text-white px-2 py-1 rounded">Add File</button>
                    </div>
                    
                    {data.digitalFiles.map((file, i) => (
                        <div key={i} className="mb-2 bg-white border border-gray-300 p-2 rounded flex gap-2 items-start">
                            <div className="flex-1 space-y-2">
                                <input 
                                    placeholder="File Name" 
                                    value={file.name} 
                                    onChange={e => updateFile(i, 'name', e.target.value)}
                                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                                />
                                <input 
                                    placeholder="File URL" 
                                    value={file.url} 
                                    onChange={e => updateFile(i, 'url', e.target.value)}
                                    className="w-full border border-gray-300 px-2 py-1 text-xs rounded"
                                />
                            </div>
                            <button type="button" onClick={() => {
                                updateData('digitalFiles', data.digitalFiles.filter((_, idx) => idx !== i));
                            }} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                        </div>
                    ))}
                    {data.digitalFiles.length === 0 && <p className="text-xs text-gray-400 italic">No files added.</p>}
                </div>
            )}
        </div>
    );
}