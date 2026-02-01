//app/(storefront)/affiliates/register/_components/register-form.tsx

"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react"; 
import { useRouter } from "next/navigation";
import { registerAffiliateAction } from "@/app/actions/storefront/affiliates/_services/register-affiliate";

const schema = z.object({
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms & Conditions to proceed.",
  }),
});

type FormData = z.infer<typeof schema>;

export default function RegisterForm() {
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
      const res = await registerAffiliateAction(); 
      
      if (res.success) {
        toast.success(res.message || "Welcome to the program!");
        router.push("/affiliates"); 
        router.refresh(); 
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Terms Checkbox */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="agreeTerms"
              type="checkbox"
              {...register("agreeTerms")}
              className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="agreeTerms" className="font-medium text-gray-900 cursor-pointer">
              I agree to the Affiliate Terms & Conditions
            </label>
            <p className="text-gray-500 mt-1 leading-snug">
              By joining, you agree to promote products ethically. You will get paid for every valid sale referred through your link.
            </p>
            {errors.agreeTerms && (
              <p className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                * {errors.agreeTerms.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin w-4 h-4" />
            Creating Account...
          </>
        ) : (
          <>
            Activate Affiliate Account
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}