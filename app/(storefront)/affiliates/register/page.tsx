//app/(storefront)/affiliates/register/page.tsx

import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RegisterForm from "./_components/register-form";
import { requireUser } from "@/app/actions/storefront/affiliates/auth-helper";

export const metadata = {
  title: "Join Partner Program",
};

export default async function RegisterPage() {
  const userId = await requireUser();
  const existing = await db.affiliateAccount.findUnique({
    where: { userId }
  });
  if (existing) {
    redirect("/affiliates");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join the Partner Program
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Earn commissions by promoting products you love.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}