import { db } from '@/lib/prisma';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import ResetPasswordForm from './_components/ResetPasswordForm';
import RequestResetForm from './_components/RequestResetForm';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  // No token/email → show "Forgot Password" email request form
  if (!token || !email) {
    return <RequestResetForm />;
  }

  const verificationToken = await db.verificationToken.findFirst({
    where: {
      identifier: email,
      token: token,
      expires: { gt: new Date() },
    },
  });

  if (!verificationToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 text-center">
          <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Link Expired</h2>
          <p className="text-slate-500 text-sm mb-6">
            This password reset link has expired (valid for 24 hours). Please request a new one.
          </p>
          <Link href="/sign-in" className="text-blue-600 hover:underline text-sm font-medium">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm token={token} email={email} />;
}
