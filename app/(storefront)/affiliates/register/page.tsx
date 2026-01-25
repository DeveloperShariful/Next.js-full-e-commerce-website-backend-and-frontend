//app/(storefront)/affiliates/register/page.tsx

import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RegisterForm from "./_components/register-form";
// ✅ আপডেট করা ইম্পোর্ট পাথ
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "Join Partner Program",
};

export default async function RegisterPage() {
  // ✅ হার্ডকোড সরিয়ে ডাইনামিক অথ হেল্পার ব্যবহার করা হয়েছে
  const userId = await requireUser();
  
  // Check if already registered
  const existing = await db.affiliateAccount.findUnique({
    where: { userId }
  });

  // যদি অ্যাকাউন্ট থাকে, তাহলে ড্যাশবোর্ডে পাঠিয়ে দাও
  if (existing) {
    redirect("/affiliates");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo Here */}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join the Partner Program
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Earn commissions by promoting products you love.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <RegisterForm userId={userId} />
        </div>
      </div>
    </div>
  );
}