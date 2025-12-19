// app/admin/settings/general/_components/Taxes_and_coupons.tsx

import { ComponentProps } from "../types";

export default function Taxes_and_coupons({ data, updateNestedData }: ComponentProps) {
    return (
        <div className="bg-white p-6 rounded-sm border border-gray-300 shadow-sm mb-6">
            
            <h3 className="text-sm font-bold text-gray-800 mb-4">Enable taxes</h3>
            <div className="mb-6">
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
            </div>

            <h3 className="text-sm font-bold text-gray-800 mb-4">Enable coupons</h3>
            <div className="space-y-3">
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