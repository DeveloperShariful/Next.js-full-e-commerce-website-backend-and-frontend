// File: app/(frontend)/my-account/_components/profile-view.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { User, Save, Loader2, Key } from "lucide-react";
import { updateProfileTransaction } from "@/app/actions/frontend/my-account/profile-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  initialUser: any;
}

export default function ProfileView({ initialUser }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      firstName: initialUser?.metafields?.firstName || "",
      lastName: initialUser?.metafields?.lastName || "",
      nickname: initialUser?.name || "",
      phone: initialUser?.phone || "",
      email: initialUser?.email || "",
      password: "",
      bio: initialUser?.notes || ""
    }
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      const res = await updateProfileTransaction(data);
      if (res.success) {
        toast.success(res.message);
        setShowPassword(false);
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm font-sans text-[#1d2327] animate-in fade-in duration-300">
      <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1]">
        <h3 className="text-[14px] font-semibold m-0">Account Details</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        
        {/* Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] font-semibold block mb-1">First Name *</label>
            <input {...register("firstName", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
          </div>
          <div>
            <label className="text-[13px] font-semibold block mb-1">Last Name *</label>
            <input {...register("lastName", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="text-[13px] font-semibold block mb-1">Display Name (Nickname) *</label>
          <input {...register("nickname", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
          <p className="text-[11px] text-[#8c8f94] m-0 mt-1">This is how your name will be displayed in the account section and in reviews.</p>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] font-semibold block mb-1">Email Address *</label>
            <input type="email" {...register("email", { required: true })} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
          </div>
          <div>
            <label className="text-[13px] font-semibold block mb-1">Phone Number</label>
            <input {...register("phone")} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px]" />
          </div>
        </div>

        {/* Password Reset Section WP style */}
        <div className="border border-[#c3c4c7] p-3 bg-[#f6f7f7]">
          <h4 className="text-[13px] font-semibold m-0 mb-2 flex items-center gap-1.5"><Key className="w-4 h-4 text-[#50575e]" /> Password Change</h4>
          
          {!showPassword ? (
             <button type="button" onClick={() => setShowPassword(true)} className="px-3 py-1.5 border border-[#8c8f94] bg-[#f0f0f1] text-[#2c3338] text-[12px] font-semibold rounded-sm hover:bg-[#e6e6e6]">
                 Change Password
             </button>
          ) : (
             <div className="space-y-2 animate-in slide-in-from-top-1">
                 <label className="text-[12px] text-[#50575e] block">New Password (leave blank to leave unchanged)</label>
                 <div className="flex gap-2">
                     <input type="password" {...register("password")} className="flex-1 border border-[#8c8f94] rounded-sm px-2 py-1 text-[13px] bg-white" placeholder="Min. 6 characters" />
                     <button type="button" onClick={() => setShowPassword(false)} className="px-3 py-1 bg-[#f0f0f1] border border-[#8c8f94] text-[#2c3338] text-[12px] rounded-sm">Cancel</button>
                 </div>
             </div>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="text-[13px] font-semibold block mb-1">Biographical Info</label>
          <textarea {...register("bio")} rows={4} className="w-full border border-[#8c8f94] rounded-sm px-2 py-1.5 text-[13px]" placeholder="A little about yourself..." />
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-[#f0f0f1] flex justify-end">
          <button type="submit" disabled={isPending} className="px-4 py-1.5 border border-[#2271b1] bg-[#2271b1] text-white text-[13px] rounded-sm hover:bg-[#135e96] flex items-center gap-1.5 font-semibold">
             {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}