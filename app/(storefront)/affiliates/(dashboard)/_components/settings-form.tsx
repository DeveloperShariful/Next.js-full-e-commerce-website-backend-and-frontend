//app/(storefront)/affiliates/_components/settings-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { 
    Save, Loader2, CreditCard, Code, MousePointerClick, 
    ShieldCheck, UploadCloud, FileText, CheckCircle, XCircle 
} from "lucide-react";
import { updateSettingsAction, addPixelAction, uploadKYCAction } from "@/app/actions/storefront/affiliates/_services/settings-service";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
// ✅ Import MediaPicker (Single Selection)
import { MediaPicker } from "@/components/media/media-picker";

interface Props {
  userId: string; 
  initialData: {
    paypalEmail?: string | null;
    bankDetails?: any;
    pixels: any[];
    kyc?: {
        isVerified: boolean;
        documents: any[];
    };
  };
}

export default function SettingsForm({ userId, initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"PAYMENT" | "TRACKING" | "KYC">("PAYMENT");

  // --- 1. Payment Form ---
  const paymentForm = useForm({
    defaultValues: {
      paypalEmail: initialData.paypalEmail || "",
      bankName: initialData.bankDetails?.bankName || "",
      accountName: initialData.bankDetails?.accountName || "",
      accountNumber: initialData.bankDetails?.accountNumber || "",
    }
  });

  // --- 2. Pixel Form ---
  const pixelForm = useForm({
    defaultValues: { provider: "FACEBOOK", pixelId: "" }
  });

  // --- 3. KYC Form ---
  const kycForm = useForm({
    defaultValues: { type: "NATIONAL_ID", number: "", url: "" }
  });
  
  // Watch URL to validate form submission
  const kycUrl = kycForm.watch("url");

  // --- Handlers ---

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

  const onUploadKYC = (data: any) => {
      if (!data.url) {
          toast.error("Please upload a document image.");
          return;
      }

      startTransition(async () => {
          const res = await uploadKYCAction(data);
          if(res.success) {
              toast.success(res.message);
              kycForm.reset();
              // In real app, consider using router.refresh() instead of reload
              window.location.reload(); 
          } else {
              toast.error(res.message);
          }
      });
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case "APPROVED": return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold border border-green-100"><CheckCircle className="w-3 h-3"/> Verified</span>;
          case "REJECTED": return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-100"><XCircle className="w-3 h-3"/> Rejected</span>;
          default: return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-bold border border-yellow-100"><Loader2 className="w-3 h-3 animate-spin"/> Pending</span>;
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Tabs Navigation */}
      <div className="flex gap-6 border-b border-gray-200 overflow-x-auto">
        {[
            { id: "PAYMENT", label: "Payment Method", icon: CreditCard },
            { id: "TRACKING", label: "Tracking Pixels", icon: MousePointerClick },
            { id: "KYC", label: "Verification", icon: ShieldCheck }
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={cn(
                    "pb-3 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap",
                    activeTab === tab.id ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-800"
                )}
            >
                <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
        ))}
      </div>

      {/* ==========================
          1. PAYMENT TAB
      ========================== */}
      {activeTab === "PAYMENT" && (
        <form onSubmit={paymentForm.handleSubmit(onSavePayment)} className="space-y-8">
          {/* PayPal Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">PayPal Payouts</h3>
            <div className="max-w-md">
              <label className="text-xs font-bold text-gray-700 uppercase">PayPal Email</label>
              <input 
                {...paymentForm.register("paypalEmail")} 
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" 
                placeholder="you@example.com" 
              />
            </div>
          </div>

          {/* Bank Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Bank Transfer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Bank Name</label>
                  <input {...paymentForm.register("bankName")} className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                  <label className="text-xs font-bold text-gray-700 uppercase">Account Name</label>
                  <input {...paymentForm.register("accountName")} className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">Account Number / IBAN</label>
                  <input {...paymentForm.register("accountNumber")} className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isPending} className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg active:scale-95">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Changes
          </button>
        </form>
      )}

      {/* ==========================
          2. TRACKING TAB
      ========================== */}
      {activeTab === "TRACKING" && (
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
                         <div className="p-2 bg-gray-100 rounded-md font-bold text-gray-600">{p.provider[0]}</div>
                         <div><p className="font-bold text-sm text-gray-900">{p.provider}</p><p className="text-xs text-gray-500 font-mono">{p.pixelId}</p></div>
                      </div>
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded border border-green-100">Active</span>
                   </div>
                ))
             )}
          </div>
        </div>
      )}

      {/* ==========================
          3. KYC VERIFICATION TAB
      ========================== */}
      {activeTab === "KYC" && (
          <div className="space-y-8">
              {/* Verification Status Banner */}
              <div className={cn(
                  "p-5 rounded-xl border flex items-start gap-4",
                  initialData.kyc?.isVerified 
                    ? "bg-green-50 border-green-200" 
                    : "bg-blue-50 border-blue-200"
              )}>
                  {initialData.kyc?.isVerified ? (
                      <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                  ) : (
                      <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                  )}
                  <div>
                      <h3 className={cn("font-bold text-lg", initialData.kyc?.isVerified ? "text-green-900" : "text-blue-900")}>
                          {initialData.kyc?.isVerified ? "Identity Verified" : "Identity Verification Required"}
                      </h3>
                      <p className={cn("text-sm mt-1", initialData.kyc?.isVerified ? "text-green-700" : "text-blue-700")}>
                          {initialData.kyc?.isVerified 
                            ? "You are eligible for payouts. No further action needed." 
                            : "Please upload a valid government ID or Tax document to unlock withdrawals."}
                      </p>
                  </div>
              </div>

              {/* Upload Form (Show only if not verified) */}
              {!initialData.kyc?.isVerified && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4">Submit Document</h3>
                      <form onSubmit={kycForm.handleSubmit(onUploadKYC)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-700 uppercase">Document Type</label>
                                  <select {...kycForm.register("type")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none">
                                      <option value="NATIONAL_ID">National ID / NID</option>
                                      <option value="PASSPORT">Passport</option>
                                      <option value="DRIVING_LICENSE">Driving License</option>
                                      <option value="TAX_FORM">Tax Return / TIN</option>
                                  </select>
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-gray-700 uppercase">Document Number</label>
                                  <input {...kycForm.register("number", { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder="e.g. 123-456-789" />
                              </div>
                          </div>
                          
                          {/* ✅ MEDIA PICKER (Replaces Manual URL Input) */}
                          <div className="space-y-2">
                              <MediaPicker 
                                label="Document Image (Front)"
                                value={kycUrl}
                                onChange={(url) => {
                                    kycForm.setValue("url", url, { shouldValidate: true });
                                }}
                                onRemove={() => {
                                    kycForm.setValue("url", "", { shouldValidate: true });
                                }}
                              />
                              {/* Hidden Input to register with React Hook Form validation */}
                              <input type="hidden" {...kycForm.register("url", { required: "Document image is required" })} />
                          </div>

                          <div className="pt-2">
                            <button type="submit" disabled={isPending || !kycUrl} className="w-full md:w-auto px-6 py-2.5 bg-black text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>} Submit for Review
                            </button>
                          </div>
                      </form>
                  </div>
              )}

              {/* Submission History */}
              <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-500 uppercase">Submission History</h4>
                  {initialData.kyc?.documents.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No documents submitted yet.</p>
                  ) : (
                      initialData.kyc?.documents.map((doc: any) => (
                          <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-start gap-3">
                                  <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                                      <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                      <h5 className="font-bold text-sm text-gray-900">{doc.type.replace("_", " ")}</h5>
                                      <p className="text-xs text-gray-500 font-mono">{doc.number}</p>
                                      {doc.feedback && (
                                          <p className="text-xs text-red-600 mt-1 bg-red-50 p-1.5 rounded">
                                              Note: {doc.feedback}
                                          </p>
                                      )}
                                  </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                  <span className="text-gray-400">{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                                  {getStatusBadge(doc.status)}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

    </div>
  );
}