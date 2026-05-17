// File: app/admin/settings/general/_components/tax_and_coupons.tsx

import { GeneralSettingsData } from "../page";

interface Props {
    data: GeneralSettingsData;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Taxes_and_coupons({ data, updateNestedData }: Props) {
    return (
        <div className="bg-white p-6 rounded-sm border border-gray-300 shadow-sm mb-6">
            
            {/* Taxes Section */}
            <h3 className="text-sm font-bold text-gray-800 mb-4">Tax Options</h3>
            <div className="space-y-4 mb-6">
                {/* Enable Taxes */}
                <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        id="enable_tax"
                        checked={data.taxSettings.enableTax} 
                        onChange={(e) => updateNestedData('taxSettings', 'enableTax', e.target.checked)} 
                        className="mt-0.5 w-4 h-4 text-[#2271b1] rounded border-gray-300 focus:ring-[#2271b1]"
                    />
                    <div>
                        <label htmlFor="enable_tax" className="block text-sm text-gray-700 select-none cursor-pointer">Enable tax rates and calculations</label>
                    </div>
                </div>

                {/* ✅ MISSING PART ADDED: Prices Include Tax */}
                <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        id="prices_include_tax"
                        checked={data.taxSettings.pricesIncludeTax} 
                        onChange={(e) => updateNestedData('taxSettings', 'pricesIncludeTax', e.target.checked)} 
                        className="mt-0.5 w-4 h-4 text-[#2271b1] rounded border-gray-300 focus:ring-[#2271b1]"
                    />
                    <div>
                        <label htmlFor="prices_include_tax" className="block text-sm text-gray-700 select-none cursor-pointer">Prices entered with tax</label>
                        <p className="text-xs text-gray-500 mt-0.5">I will enter prices inclusive of tax.</p>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 my-4"/>

            {/* Coupons Section */}
            <h3 className="text-sm font-bold text-gray-800 mb-4">Coupons</h3>
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        id="enable_coupons"
                        checked={data.generalConfig.enableCoupons} 
                        onChange={(e) => updateNestedData('generalConfig', 'enableCoupons', e.target.checked)} 
                        className="mt-0.5 w-4 h-4 text-[#2271b1] rounded border-gray-300 focus:ring-[#2271b1]"
                    />
                    <div>
                        <label htmlFor="enable_coupons" className="block text-sm text-gray-700 select-none cursor-pointer">Enable the use of coupon codes</label>
                        <p className="text-xs text-gray-500 mt-0.5">Coupons can be applied from the cart and checkout pages.</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        id="calc_coupons_seq"
                        checked={data.generalConfig.calcCouponsSequentially} 
                        onChange={(e) => updateNestedData('generalConfig', 'calcCouponsSequentially', e.target.checked)} 
                        className="mt-0.5 w-4 h-4 text-[#2271b1] rounded border-gray-300 focus:ring-[#2271b1]"
                    />
                    <div>
                        <label htmlFor="calc_coupons_seq" className="block text-sm text-gray-700 select-none cursor-pointer">Calculate coupon discounts sequentially</label>
                        <p className="text-xs text-gray-500 mt-0.5">When applying multiple coupons, apply the first coupon to the full price and the second coupon to the discounted price and so on.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}