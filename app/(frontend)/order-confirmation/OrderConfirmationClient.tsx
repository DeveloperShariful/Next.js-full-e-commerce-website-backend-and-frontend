// app/order-confirmation/OrderConfirmationClient.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1, label: 'Verifying Payment' },
  { id: 2, label: 'Confirming Order' },
  { id: 3, label: 'Almost Done' },
] as const;

export default function OrderConfirmationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const orderKey = searchParams.get('key');
    const paymentIntentId = searchParams.get('payment_intent');
    const clientSecret = searchParams.get('payment_intent_client_secret');

    if (!orderId || !paymentIntentId || !clientSecret || !orderKey) {
      setError('Invalid order confirmation URL. Security check failed.');
      return;
    }

    const verifyStripePayment = async () => {
      try {
        const response = await fetch('/api/stripe/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, paymentIntentId }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Payment verification failed or was declined.');
        }

        setStep(2);
        await clearCart();

        setStep(3);
        setTimeout(() => {
          router.replace(`/order-success?order_id=${orderId}&key=${orderKey}`);
        }, 1500);

      } catch (err: unknown) {
        console.error('Payment Verification Error:', err);
        const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(msg);
      }
    };

    verifyStripePayment();
  }, [searchParams, router, clearCart]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4">
      {!error ? (
        <div className="w-full max-w-sm text-center">

          {/* Shield icon */}
          <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center mx-auto mb-8">
            <svg className="w-9 h-9 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    step > s.id
                      ? 'bg-green-500 text-white'
                      : step === s.id
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step > s.id ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.id}
                  </div>
                  <span className={`text-[10px] font-medium w-20 text-center leading-tight ${
                    step >= s.id ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-10 h-0.5 mb-5 transition-all duration-700 ${
                    step > s.id ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Spinner */}
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-5" />

          <h1 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
            {step === 1 && 'Verifying your payment...'}
            {step === 2 && 'Confirming your order...'}
            {step === 3 && 'Payment successful! Redirecting...'}
          </h1>

          <p className="text-gray-500 text-sm">
            Please do not close this window or press the back button.
          </p>

          <p className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secured by Stripe
          </p>
        </div>
      ) : (
        <div className="p-6 md:p-8 bg-red-50 border border-red-200 rounded-2xl max-w-lg w-full shadow-sm text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-red-700 mb-2">Verification Failed</h2>
          <p className="text-red-600 text-sm font-medium mb-4 leading-relaxed">{error}</p>
          <p className="text-gray-500 text-sm mb-6">
            If money was deducted from your account, please contact us immediately at{' '}
            <a href="mailto:support@gobikes.au" className="text-blue-600 underline font-medium">
              support@gobikes.au
            </a>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/checkout')}
              className="px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-[#333] transition-colors"
            >
              Return to Checkout
            </button>
            <a
              href="mailto:support@gobikes.au"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
