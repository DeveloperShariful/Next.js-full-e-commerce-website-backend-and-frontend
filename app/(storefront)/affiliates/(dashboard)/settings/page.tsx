//app/(storefront)/affiliates/settings/page.tsx

import { settingsService } from "@/app/actions/storefront/affiliates/_services/settings-service";
import SettingsForm from "./_components/settings-form"; 
import { Settings, CreditCard, Code2 } from "lucide-react";
// ✅ আপনার নির্দেশিত পাথ অনুযায়ী আপডেট করা হয়েছে
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "Settings | Affiliate",
};

export default async function SettingsPage() {
  // ✅ হার্ডকোড সরিয়ে ডাইনামিক অথ হেল্পার ব্যবহার করা হয়েছে
  const userId = await requireUser();
  
  const settings = await settingsService.getSettings(userId);

  if (!settings) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-700" />
          Account Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure payout methods and tracking pixels.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Payment Settings Section */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Payout Details</h3>
              <p className="text-xs text-gray-500">Where should we send your money?</p>
            </div>
          </div>
          
          <SettingsForm 
            userId={userId} 
            initialData={{
              paypalEmail: settings.paypalEmail || "",
              bankDetails: settings.bankDetails || { bankName: "", accountName: "", accountNumber: "" }
            }} 
          />
        </div>

        {/* Tracking Pixels Section */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Tracking Pixels</h3>
              <p className="text-xs text-gray-500">Fire events on your own ad platforms when you make a sale.</p>
            </div>
          </div>

          <div className="space-y-4">
            {settings.pixels.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No pixels connected yet.</p>
            ) : (
              <ul className="space-y-2">
                {settings.pixels.map(p => (
                  <li key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                    <span className="font-medium text-sm">{p.provider}</span>
                    <code className="text-xs bg-white px-2 py-1 rounded border">{p.pixelId}</code>
                  </li>
                ))}
              </ul>
            )}
            
            <button className="text-sm text-blue-600 font-medium hover:underline">
              + Add New Pixel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}