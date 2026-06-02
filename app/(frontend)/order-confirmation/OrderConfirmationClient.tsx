// app/order-confirmation/OrderConfirmationClient.tsx

'use client'; 

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function OrderConfirmationClient() { 
    const router = useRouter();
    const searchParams = useSearchParams();
    const { clearCart } = useCart();

    const [message, setMessage] = useState('Verifying your secure payment, please wait...');
    const [error, setError] = useState('');

    useEffect(() => {
        // Stripe থেকে রিডাইরেক্ট হয়ে আসার পর URL-এ এই প্যারামিটারগুলো থাকে
        const orderId = searchParams.get('order_id');
        const orderKey = searchParams.get('key');
        const paymentIntentId = searchParams.get('payment_intent');
        const clientSecret = searchParams.get('payment_intent_client_secret');

        // যদি URL-এ প্রয়োজনীয় ডাটা না থাকে, তবে ব্লক করে দেওয়া
        if (!orderId || !paymentIntentId || !clientSecret || !orderKey) {
            setError('Invalid order confirmation URL. Security check failed.');
            setMessage('');
            return;
        }

        const verifyStripePayment = async () => {
            try {
                // আমাদের নতুন capture-order API তে কল করা হচ্ছে
                const response = await fetch('/api/stripe/capture-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, paymentIntentId }),
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Payment verification failed or was declined.');
                }

                // পেমেন্ট সাকসেস হলে কার্ট ক্লিয়ার করে সাকসেস পেজে পাঠানো
                setMessage('Payment successful! Preparing your order details...');
                
                if (typeof clearCart === 'function') {
                    await clearCart();
                }
                
                // কাস্টমারকে ২ সেকেন্ড এই পেজে রেখে তারপর রিডাইরেক্ট করা হচ্ছে সুন্দর এক্সপেরিয়েন্সের জন্য
                setTimeout(() => {
                    router.replace(`/order-success?order_id=${orderId}&key=${orderKey}`);
                }, 2000);

            } catch (err: unknown) {
                console.error("Payment Verification Error:", err);
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(`There was a problem confirming your payment: ${errorMessage}. Please contact support if the amount was deducted.`);
                setMessage('');
            }
        };

        verifyStripePayment();

    }, [searchParams, router, clearCart]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            {!error && (
                <div className="flex flex-col items-center">
                    {/* Tailwind CSS Spinner */}
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-[#333] rounded-full animate-spin mb-6"></div>
                    
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        {message}
                    </h1>
                    
                    <p className="mt-4 text-gray-500 text-sm font-medium">
                        Please do not close this window or click the back button.
                    </p>
                </div>
            )}

            {error && (
                <div className="p-6 md:p-8 bg-red-50 border border-red-200 rounded-xl max-w-[600px] w-full mx-auto shadow-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    
                    <h2 className="text-xl font-bold text-red-700 mb-2">Verification Failed</h2>
                    <p className="text-red-600 font-medium mb-6 leading-relaxed">
                        {error}
                    </p>
                    
                    <button 
                        onClick={() => router.push('/checkout')} 
                        className="px-8 py-3 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-[#333] transition-colors duration-200 w-full md:w-auto shadow-md"
                    >
                        Return to Checkout
                    </button>
                </div>
            )}
        </div>
    );
}