//app/admin/settings/general/_components/Measurement_Maintenance.tsx

import { Ruler, Scale, AlertTriangle } from "lucide-react";
import { GeneralSettingsData } from "../page";

interface Props {
    data: GeneralSettingsData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Measurement_Maintenance({ data, handleChange, updateNestedData }: Props) {
    return (
        <div className="space-y-6 mb-6">
            <div className="bg-white p-6 rounded-sm border border-gray-300 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Measurements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                    <div>
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1">
                            Weight unit <Scale size={12} className="text-gray-400"/>
                        </label>
                        <select name="weightUnit" value={data.weightUnit} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm">
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="lbs">lbs</option>
                            <option value="oz">oz</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1 mb-1">
                            Dimensions unit <Ruler size={12} className="text-gray-400"/>
                        </label>
                        <select name="dimensionUnit" value={data.dimensionUnit} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm">
                            <option value="m">m</option>
                            <option value="cm">cm</option>
                            <option value="mm">mm</option>
                            <option value="in">in</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-sm border border-orange-200 shadow-sm bg-orange-50/20">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-orange-500"/> Site Visibility
                </h3>
                <div className="mt-4 flex items-start gap-3">
                    <input 
                        type="checkbox" id="maintenance" name="maintenance"
                        checked={data.maintenance} 
                        onChange={(e) => updateNestedData('maintenance', '', e.target.checked)} 
                        className="mt-0.5 w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <div>
                        <label htmlFor="maintenance" className="block text-sm font-bold text-gray-800 cursor-pointer">Enable Maintenance Mode</label>
                        <p className="text-xs text-gray-600 mt-1">If enabled, the frontend store will be hidden.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}