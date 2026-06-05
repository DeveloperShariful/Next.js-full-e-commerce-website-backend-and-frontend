// File: app/(frontend)/my-account/_components/addresses-view.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Home, Edit, Check, Loader2, Copy } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { saveAddressAction } from "@/app/actions/frontend/my-account/address-service";
import { State } from "country-state-city";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddressData {
  id: string;
  type: "BILLING" | "SHIPPING";
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

interface Props {
  initialAddresses: AddressData[];
}

export default function AddressesView({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<AddressData[]>(initialAddresses);
  const [editingType, setEditingType] = useState<"BILLING" | "SHIPPING" | null>(null);

  const billing = addresses.find(a => a.type === "BILLING");
  const shipping = addresses.find(a => a.type === "SHIPPING");

  return (
    <div className="space-y-6 font-sans text-[#1d2327]">
      {editingType ? (
        <AddressForm 
          type={editingType} 
          initialData={editingType === "BILLING" ? billing : shipping} 
          billingData={billing} // Passed for copy function in shipping
          onClose={() => setEditingType(null)}
          onSuccess={(newAddr: any) => {
             setAddresses(prev => {
                const filtered = prev.filter(a => a.type !== editingType);
                return [...filtered, newAddr];
             });
             setEditingType(null);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* Billing Address Card */}
          <div className="bg-white border border-[#c3c4c7] shadow-sm">
            <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1] flex justify-between items-center">
              <h3 className="text-[14px] font-semibold m-0 flex items-center gap-1.5"><Home className="w-4 h-4 text-[#50575e]"/> Billing Address</h3>
              <button onClick={() => setEditingType("BILLING")} className="text-[#2271b1] hover:underline text-[12px] flex items-center gap-1">
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <div className="p-4 text-[13px] text-[#50575e] space-y-1 leading-relaxed">
              {billing ? (
                <>
                  <p className="font-bold text-[#1d2327] text-[14px] m-0 mb-1">{billing.firstName} {billing.lastName}</p>
                  {billing.company && <p className="m-0">{billing.company}</p>}
                  <p className="m-0">{billing.address1}</p>
                  {billing.address2 && <p className="m-0">{billing.address2}</p>}
                  <p className="m-0">{billing.city}, {billing.state} {billing.postcode}</p>
                  <p className="m-0 font-semibold text-[#1d2327]">{billing.country}</p>
                  <p className="m-0 pt-2 text-[#8c8f94]">Phone: {billing.phone}</p>
                </>
              ) : (
                <p className="italic text-center py-4">No billing address saved yet.</p>
              )}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white border border-[#c3c4c7] shadow-sm">
            <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1] flex justify-between items-center">
              <h3 className="text-[14px] font-semibold m-0 flex items-center gap-1.5"><Home className="w-4 h-4 text-[#50575e]"/> Shipping Address</h3>
              <button onClick={() => setEditingType("SHIPPING")} className="text-[#2271b1] hover:underline text-[12px] flex items-center gap-1">
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <div className="p-4 text-[13px] text-[#50575e] space-y-1 leading-relaxed">
              {shipping ? (
                <>
                  <p className="font-bold text-[#1d2327] text-[14px] m-0 mb-1">{shipping.firstName} {shipping.lastName}</p>
                  {shipping.company && <p className="m-0">{shipping.company}</p>}
                  <p className="m-0">{shipping.address1}</p>
                  {shipping.address2 && <p className="m-0">{shipping.address2}</p>}
                  <p className="m-0">{shipping.city}, {shipping.state} {shipping.postcode}</p>
                  <p className="m-0 font-semibold text-[#1d2327]">{shipping.country}</p>
                  <p className="m-0 pt-2 text-[#8c8f94]">Phone: {shipping.phone}</p>
                </>
              ) : (
                <p className="italic text-center py-4">No shipping address saved yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: ADDRESS FORM (WP STYLE) ---
function AddressForm({ type, initialData, billingData, onClose, onSuccess }: any) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      type: type,
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      company: initialData?.company || "",
      address1: initialData?.address1 || "",
      address2: initialData?.address2 || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      postcode: initialData?.postcode || "",
      country: initialData?.country || "AU",
      phone: initialData?.phone || "",
    }
  });

  const selectedCountry = watch("country");
  const states = State.getStatesOfCountry(selectedCountry);

  const copyBillingAddress = () => {
    if (!billingData) return toast.error("No billing address to copy.");
    setValue("firstName", billingData.firstName);
    setValue("lastName", billingData.lastName);
    setValue("company", billingData.company || "");
    setValue("address1", billingData.address1);
    setValue("address2", billingData.address2 || "");
    setValue("city", billingData.city);
    setValue("country", billingData.country);
    setValue("state", billingData.state);
    setValue("postcode", billingData.postcode);
    setValue("phone", billingData.phone);
    toast.success("Billing address copied.");
  };

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const res = await saveAddressAction(data);
      if (res.success) {
        toast.success(res.message);
        onSuccess(data); // Local state sync
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm animate-in slide-in-from-top-2">
      <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1] flex justify-between items-center">
         <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Edit {type === "BILLING" ? "Billing" : "Shipping"} Address</h3>
         {type === "SHIPPING" && billingData && (
             <button type="button" onClick={copyBillingAddress} className="text-[#2271b1] hover:underline text-[12px] flex items-center gap-1">
                 <Copy className="w-3 h-3" /> Copy from Billing
             </button>
         )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
         <div className="grid grid-cols-2 gap-4">
             <div>
                 <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">First Name *</label>
                 <input {...register("firstName", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
             </div>
             <div>
                 <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Last Name *</label>
                 <input {...register("lastName", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
             </div>
         </div>

         <div>
             <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Company Name (Optional)</label>
             <input {...register("company")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                 <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Street Address *</label>
                 <input {...register("address1", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" placeholder="House number and street name" />
             </div>
             <div>
                 <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Apartment, Suite (Optional)</label>
                 <input {...register("address2")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" placeholder="Apartment, unit, etc." />
             </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div>
                 <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">City / Suburb *</label>
                 <input {...register("city", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
             </div>
             <div>
                 <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Postcode *</label>
                 <input {...register("postcode", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
             </div>
             <div>
                 <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Country *</label>
                 <select {...register("country")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px] bg-white">
                     <option value="AU">Australia</option>
                     <option value="NZ">New Zealand</option>
                 </select>
             </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                 <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">State *</label>
                 {states.length > 0 ? (
                     <select {...register("state", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px] bg-white">
                         <option value="">Select an option…</option>
                         {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                     </select>
                 ) : (
                     <input {...register("state", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
                 )}
             </div>
             <div>
                 <label className="text-[12px] font-semibold text-[#1d2327] block mb-1">Phone *</label>
                 <input {...register("phone", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
             </div>
         </div>

         <div className="flex gap-2 pt-4 border-t border-[#f0f0f1] justify-end">
             <button type="button" onClick={onClose} className="px-3 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[13px] rounded-sm">Cancel</button>
             <button type="submit" disabled={isPending} className="px-4 py-1.5 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] flex items-center gap-1 font-semibold">
                 {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Address
             </button>
         </div>
      </form>
    </div>
  );
}