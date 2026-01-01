// File: app/(storefront)/checkout/_components/payment/gateways/Offline_Payment_Info.tsx

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface OfflineProps {
  method: any; // Payment Method Object from DB
}

export const Offline_Payment_Info = ({ method }: OfflineProps) => {
  const { instructions, offlineConfig } = method;

  return (
    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Main Description */}
      <p className="text-sm text-gray-600">{method.description}</p>

      {/* Instructions Alert */}
      {instructions && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-4 w-4" />
          <AlertTitle>Instructions</AlertTitle>
          <AlertDescription className="mt-1 text-xs leading-relaxed">
            {instructions}
          </AlertDescription>
        </Alert>
      )}

      {/* Bank Details Specific UI */}
      {method.identifier === "bank_transfer" && offlineConfig?.bankDetails && (
        <div className="bg-gray-50 p-4 rounded-md border text-sm space-y-2">
          <p className="font-semibold text-gray-900">Bank Details:</p>
          {offlineConfig.bankDetails.map((bank: any, idx: number) => (
            <ul key={idx} className="list-disc list-inside text-gray-600 space-y-1">
              <li>Bank: {bank.bankName}</li>
              <li>Account Name: {bank.accountName}</li>
              <li>Account Number: {bank.accountNumber}</li>
              {bank.sortCode && <li>BSB/Sort Code: {bank.sortCode}</li>}
            </ul>
          ))}
        </div>
      )}
    </div>
  );
};