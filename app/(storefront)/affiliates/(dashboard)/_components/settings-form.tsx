//app/(storefront)/affiliates/_components/settings-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Save, Loader2, CreditCard, Code, MousePointerClick } from "lucide-react";
import { updateSettingsAction, addPixelAction } from "@/app/actions/storefront/affiliates/_services/settings-service";

interface Props {
  userId: string; 
  initialData: {
    paypalEmail?: string | null;
    bankDetails?: any;
    pixels: any[];
  };
}

export default function SettingsForm({ userId, initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"PAYMENT" | "TRACKING">("PAYMENT");

  const paymentForm = useForm({
    defaultValues: {
      paypalEmail: initialData.paypalEmail || "",
      bankName: initialData.bankDetails?.bankName || "",
      accountName: initialData.bankDetails?.accountName || "",
      accountNumber: initialData.bankDetails?.accountNumber || "",
    }
  });

  const pixelForm = useForm({
    defaultValues: { provider: "FACEBOOK", pixelId: "" }
  });

  const onSavePayment = (data: any) => {
    startTransition(async () => {
      const payload = {
        paypalEmail: data.paypalEmail,
        bankDetails: {
          bankName: data.bankName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
        }
      };
      
      const res = await updateSettingsAction(payload);
      if (res.success) toast.success("Payment settings saved.");
      else toast.error("Failed to save settings.");
    });
  };

  const onAddPixel = (data: any) => {
    startTransition(async () => {
      const res = await addPixelAction(data.provider, data.pixelId);
      if (res.success) {
        toast.success("Tracking pixel added.");
        pixelForm.reset();
      } else {
        toast.error("Failed to add pixel.");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button onClick={() => setActiveTab("PAYMENT")} className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "PAYMENT" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          <CreditCard className="w-4 h-4" /> Payment Settings
        </button>
        <button onClick={() => setActiveTab("TRACKING")} className={`pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "TRACKING" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
          <MousePointerClick className="w-4 h-4" /> Tracking Pixels
        </button>
      </div>

      {activeTab === "PAYMENT" ? (
        <form onSubmit={paymentForm.handleSubmit(onSavePayment)} className="space-y-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">PayPal Payouts</h3>
            <div className="max-w-md">
              <label className="text-xs font-bold text-gray-700 uppercase">PayPal Email</label>
              <input {...paymentForm.register("paypalEmail")} className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none" placeholder="you@example.com" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Bank Transfer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-gray-700 uppercase">Bank Name</label><input {...paymentForm.register("bankName")} className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" /></div>
              <div><label className="text-xs font-bold text-gray-700 uppercase">Account Name</label><input {...paymentForm.register("accountName")} className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" /></div>
              <div className="md:col-span-2"><label className="text-xs font-bold text-gray-700 uppercase">Account Number / IBAN</label><input {...paymentForm.register("accountNumber")} className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" /></div>
            </div>
          </div>

          <button type="submit" disabled={isPending} className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-95">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Changes
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Code className="w-5 h-5" /> Add New Pixel</h3>
            <form onSubmit={pixelForm.handleSubmit(onAddPixel)} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/3">
                <label className="text-xs font-bold text-gray-700 uppercase">Provider</label>
                <select {...pixelForm.register("provider")} className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none">
                  <option value="FACEBOOK">Facebook / Meta</option>
                  <option value="GOOGLE">Google Ads</option>
                  <option value="TIKTOK">TikTok</option>
                </select>
              </div>
              <div className="w-full md:w-1/2">
                <label className="text-xs font-bold text-gray-700 uppercase">Pixel ID</label>
                <input {...pixelForm.register("pixelId", { required: true })} placeholder="e.g. 1234567890" className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <button type="submit" disabled={isPending} className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">Add</button>
            </form>
          </div>

          <div className="space-y-3">
             <h4 className="text-sm font-bold text-gray-500 uppercase">Active Pixels</h4>
             {initialData.pixels.length === 0 ? <p className="text-sm text-gray-400 italic">No pixels added yet.</p> : (
                initialData.pixels.map((p: any) => (
                   <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-gray-100 rounded-md">
                            {p.provider === 'FACEBOOK' ? <span className="font-bold text-blue-600">f</span> : p.provider === 'GOOGLE' ? <span className="font-bold text-red-500">G</span> : <span className="font-bold text-black">T</span>}
                         </div>
                         <div><p className="font-bold text-sm text-gray-900">{p.provider}</p><p className="text-xs text-gray-500 font-mono">{p.pixelId}</p></div>
                      </div>
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded border border-green-100">Active</span>
                   </div>
                ))
             )}
          </div>
        </div>
      )}
    </div>
  );
}