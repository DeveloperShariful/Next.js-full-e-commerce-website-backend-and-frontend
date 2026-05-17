// ফাইল পাথ: app/product/info-panels/PaymentMethods.tsx

import Image from 'next/image';
export default function PaymentMethods() {
  return (
    <div className="w-full">
      <h4 className="text-[1.2rem] font-bold mb-2">100% Secure & Trusted</h4>
      <p className="text-[0.95rem] text-[#555] leading-[1.6] mb-6">We accept all major credit cards and payment providers for a safe and secure checkout process.</p>
      <div className="w-full">
        <Image 
          src="https://gobikes.au/wp-content/uploads/2018/07/trust-symbols_b-1.jpg" 
          alt="Guaranteed Safe Checkout Methods" 
          width={400} 
          height={40} 
          style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
}