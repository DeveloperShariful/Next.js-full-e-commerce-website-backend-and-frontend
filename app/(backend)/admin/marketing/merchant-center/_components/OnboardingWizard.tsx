//File Path: app/(backend)/admin/marketing/merchant-center/_components/OnboardingWizard.tsx

"use client";

import Step1ConnectGoogle from "./Step1ConnectGoogle";
import Step2AccountSelect from "./Step2AccountSelect";
import Step3AttributeMapping from "./Step3AttributeMapping"; // 🔥 FIX: ইম্পোর্ট করা হলো

interface Props {
  currentStep: number;
  config: any;
}

export default function OnboardingWizard({ currentStep, config }: Props) {
  const steps = [
    { num: 0, label: "Connect Account" },
    { num: 1, label: "Select & Claim" },
    { num: 2, label: "Attribute Mapping" },
    { num: 3, label: "Finish Setup" }, // Step 4 এর নাম
  ];

  // ডাটাবেস থেকে আসা Step কে UI এর Step এ কনভার্ট করা
  const activeStepIndex = currentStep > 3 ? 3 : currentStep;

  return (
    <div className="max-w-[800px] mx-auto mt-6">
      
      {/* WordPress Style Wizard Header */}
      <div className="bg-white border border-[#ccd0d4] p-6 mb-5 text-center">
        <h2 className="text-[20px] font-normal text-[#1d2327] m-0 mb-2">Set up Google Merchant Center</h2>
        <p className="text-[13px] text-[#646970] m-0">
          Sync your products to Google and show them to millions of shoppers.
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold ${
                  activeStepIndex >= index
                    ? "bg-[#2271b1] text-white"
                    : "bg-[#f0f0f1] text-[#8c8f94] border border-[#ccd0d4]"
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`text-[13px] font-semibold ${
                  activeStepIndex >= index ? "text-[#1d2327]" : "text-[#8c8f94]"
                }`}
              >
                {step.label}
              </span>
              {index !== steps.length - 1 && (
                <div className="w-[30px] h-[1px] bg-[#ccd0d4] ml-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Components */}
      <div className="bg-white border border-[#ccd0d4]">
        {activeStepIndex === 0 && <Step1ConnectGoogle />}
        {activeStepIndex === 1 && <Step2AccountSelect config={config} />}
        
        {/* 🔥 FIX: Step 3 অথবা ভুলবশত 4 এ চলে গেলে ম্যাপিং পেজটাই দেখাবে */}
        {(activeStepIndex === 2 || activeStepIndex === 3) && <Step3AttributeMapping />}
      </div>
      
    </div>
  );
}