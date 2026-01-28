//app/(storefront)/affiliates/register/_components/register-form.tsx

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; 
import { registerAffiliateAction } from "@/app/actions/storefront/affiliates/mutations/register-affiliate";
import { useRouter } from "next/navigation";

// ✅ FIX: Zod schema fix
const schema = z.object({
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to terms",
  }),
});

// Type inference
type FormData = z.infer<typeof schema>;

export default function RegisterForm({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      agreeTerms: false,
    }
  });

  const onSubmit = () => {
    startTransition(async () => {
      const res = await registerAffiliateAction(userId);
      
      if (res.success) {
        toast.success("Welcome to the program!");
        router.push("/affiliates"); // Redirect to dashboard
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="agreeTerms"
            type="checkbox"
            {...register("agreeTerms")}
            className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="agreeTerms" className="font-medium text-gray-700">I agree to the Affiliate Terms & Conditions</label>
          <p className="text-gray-500">Get paid for every sale you refer.</p>
          {errors.agreeTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeTerms.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
      >
        {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Activate Affiliate Account"}
      </button>
    </form>
  );
}