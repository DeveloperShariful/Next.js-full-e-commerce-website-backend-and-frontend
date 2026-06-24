'use client';

import { useState } from 'react';

interface PayPalMessageProps {
  total: number;
}

export default function PayPalMessage({ total }: PayPalMessageProps) {
  const [showModal, setShowModal] = useState(false);

  if (total <= 0) return null;

  const installment = (total / 4).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
  const totalFormatted = total.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

  const payments = [
    { label: 'Today',   active: true  },
    { label: '2 weeks', active: false },
    { label: '4 weeks', active: false },
    { label: '6 weeks', active: false },
  ];

  return (
    <>
      {/* Inline message row */}
      <div className="mb-2 flex items-center justify-center gap-1.5 text-[13px] text-gray-600">
        <img
          src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
          alt="PayPal"
          className="h-[14px] w-auto"
          loading="eager"
        />
        <span>Pay in 4 interest-free payments of {installment}.</span>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="text-[#0070ba] underline bg-transparent border-none cursor-pointer text-[13px] p-0 leading-none"
        >
          Learn more
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative bg-white rounded-xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border border-gray-300 rounded text-gray-500 hover:bg-gray-100 text-xl leading-none z-10"
            >
              ×
            </button>

            <div className="p-8">
              {/* PayPal P logo */}
              <img
                src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
                alt="PayPal"
                className="h-10 w-auto mb-5"
                loading="eager"
              />

              {/* Heading */}
              <h2 className="text-[26px] font-bold text-gray-900 leading-tight mb-3">
                Pay in 4 interest-free<br />payments
              </h2>

              {/* Subtitle */}
              <p className="text-gray-700 text-[15px] mb-8">
                Split your purchase of {totalFormatted} into 4 with no sign-up fees or no late fees.
              </p>

              {/* Payment timeline */}
              <div className="flex items-start justify-between mb-10 px-2">
                {payments.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center relative">
                    {idx < 3 && (
                      <div className="absolute top-[7px] left-1/2 w-full border-t-2 border-dashed border-gray-300" />
                    )}
                    <div className={`w-4 h-4 rounded-full z-10 mb-2 ${item.active ? 'bg-[#0070ba]' : 'bg-gray-400'}`} />
                    <span className="text-[13px] font-semibold text-gray-800">{installment}</span>
                    <span className="text-[12px] text-gray-500 mt-0.5">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <ol className="space-y-4 mb-8">
                <li className="flex gap-3 text-[15px] text-gray-700">
                  <span className="font-semibold shrink-0">1.</span>
                  <span>Choose PayPal at checkout to pay later with <strong>Pay in 4</strong>.</span>
                </li>
                <li className="flex gap-3 text-[15px] text-gray-700">
                  <span className="font-semibold shrink-0">2.</span>
                  <span>Complete your purchase with an initial 25% payment.</span>
                </li>
                <li className="flex gap-3 text-[15px] text-gray-700">
                  <span className="font-semibold shrink-0">3.</span>
                  <span>Remaining payments are taken automatically. It&apos;s easy!</span>
                </li>
              </ol>

              {/* Legal text */}
              <p className="text-[11px] text-gray-500 leading-relaxed">
                PayPal Pay in 4 is a continuing credit contract provided by PayPal Credit Pty
                Limited (ABN 66 600 629 258; Australian Credit Licence number 568848) to
                Australian residents and is subject to eligibility criteria, credit application
                and suitability assessment. PayPal Pay in 4 is available on eligible transactions
                under $2,000 AUD and application and use may impact a consumer&apos;s credit score.
                Please read and consider the{' '}
                <a
                  href="https://www.paypal.com/au/digital-wallet/ways-to-pay/checkout-with-paypal?locale.x=en_AU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0070ba] underline font-semibold"
                >
                  PayPal Credit Guide
                </a>
                {' '}before entering into the PayPal Pay in 4 Facility Agreement. Please see the{' '}
                <a
                  href="https://www.paypal.com/au/digital-wallet/ways-to-pay/buy-now-pay-later"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0070ba] underline"
                >
                  PayPal Pay in 4 Terms
                </a>
                {' '}for full details.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
