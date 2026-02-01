//app/(storefront)/affiliates/_components/payout-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { CreditCard, Clock, CheckCircle, AlertCircle, History, Building2, Wallet, Loader2, DollarSign, X, Check, ShoppingBag, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { PayoutMethod } from "@prisma/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { requestPayoutAction } from "@/app/actions/storefront/affiliates/_services/finance-service";
// ✅ IMPORT ADDED
import { useGlobalStore } from "@/app/providers/global-store-provider";

// =========================================================
// PART 1: PAYOUT REQUEST MODAL 
// =========================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  balance: number;
  config: {
    minimumPayout: number;
    payoutMethods: string[];
  };
}

function PayoutRequestModal({ isOpen, onClose, userId, balance, config }: ModalProps) {
  const [isPending, startTransition] = useTransition();
  // ✅ GLOBAL STORE USAGE
  const { symbol } = useGlobalStore(); 
  const currency = symbol || "$";

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      amount: config.minimumPayout,
      method: (config.payoutMethods[0] as PayoutMethod) || "STORE_CREDIT"
    }
  });

  const selectedMethod = watch("method");

  interface FormValues {
    amount: number;
    method: PayoutMethod;
  }

  const onSubmit = (data: FormValues) => {
    const toastId = toast.loading("Processing request...");

    startTransition(async () => {
      const result = await requestPayoutAction({ 
        amount: Number(data.amount), 
        method: data.method 
      });

      if (result.success) {
        toast.success(result.message, { id: toastId });
        onClose();
      } else {
        toast.error(result.message, { id: toastId });
        console.log("Client Error Log:", result.message);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
             <h3 className="text-lg font-bold text-gray-900">Request Withdrawal</h3>
             <p className="text-xs text-gray-500">Transfer earnings to your account</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          
          {/* Balance Display */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 rounded-xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
                <div>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Available Balance</span>
                    <span className="block text-2xl font-bold mt-1">{currency}{balance.toFixed(2)}</span>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-400" />
                </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none blur-2xl"></div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase">Withdraw Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-bold text-gray-400">{currency}</span>
              <input
                type="number"
                step="0.01"
                {...register("amount", { 
                  min: { value: config.minimumPayout, message: `Min: ${currency}${config.minimumPayout}` },
                  max: { value: balance, message: "Exceeds balance" },
                  required: "Amount is required"
                })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all"
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><X className="w-3 h-3"/> {errors.amount.message}</p>}
          </div>

          {/* Method Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase">Payout Method</label>
            <div className="space-y-2">
              {config.payoutMethods.map((m) => (
                <label 
                  key={m} 
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all",
                    selectedMethod === m ? "border-black bg-gray-50 ring-1 ring-black" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", 
                        m === 'PAYPAL' ? "bg-blue-50 text-blue-600" : m === 'BANK_TRANSFER' ? "bg-gray-100 text-gray-600" : "bg-purple-50 text-purple-600"
                    )}>
                        {m === 'PAYPAL' ? <CreditCard className="w-4 h-4"/> : m === 'BANK_TRANSFER' ? <Building2 className="w-4 h-4"/> : <ShoppingBag className="w-4 h-4"/>}
                    </div>
                    <span className="text-sm font-bold text-gray-900 capitalize">{m.replace("_", " ").toLowerCase()}</span>
                  </div>
                  <input type="radio" value={m} {...register("method")} className="w-4 h-4 text-black focus:ring-black accent-black" />
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 flex gap-2">
            <span className="font-bold">Note:</span> Processing takes 1-3 business days.
          </div>

          <button
            type="submit"
            disabled={isPending || balance < config.minimumPayout}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm Request <ArrowRight className="w-4 h-4"/></>}
          </button>

        </form>
      </div>
    </div>
  );
}

// =========================================================
// PART 2: MAIN PAYOUT MANAGER COMPONENT
// =========================================================

interface ManagerProps {
  data: {
    wallet: {
      balance: number;
      totalEarnings: number;
      pendingPayouts: number;
      config: { minimumPayout: number; payoutMethods: string[] };
      paymentDetails: any;
    };
    history: any[];
  };
  userId: string;
  // currency: string; // Removed from props, using Global Store
}

export default function PayoutManager({ data, userId }: ManagerProps) {
  const { wallet, history } = data;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ GLOBAL STORE USAGE
  const { formatPrice, symbol } = useGlobalStore();
  const currency = symbol || "$";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* 1. Wallet Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Balance Card (Dark Theme) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Available Balance</p>
                  <h2 className="text-5xl font-bold mt-3 tracking-tight">{formatPrice(wallet.balance)}</h2>
               </div>
               <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                  <Wallet className="w-6 h-6 text-white" />
               </div>
            </div>
            
            <div className="mt-8 flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Clock className="w-4 h-4 text-orange-400" /> Pending: {formatPrice(wallet.pendingPayouts)}
              </span>
              <span className="flex items-center gap-2 text-gray-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <CheckCircle className="w-4 h-4 text-green-400" /> Lifetime: {formatPrice(wallet.totalEarnings)}
              </span>
            </div>
          </div>

          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
        </div>

        {/* Action & Info Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center gap-6">
          <div>
             <h3 className="font-bold text-gray-900 flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-blue-600" /> Withdrawal Rules
             </h3>
             <ul className="mt-3 space-y-2 text-sm text-gray-600">
               <li className="flex items-start gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                 Minimum withdrawal is <span className="font-bold text-gray-900">{formatPrice(wallet.config.minimumPayout)}</span>
               </li>
               <li className="flex items-start gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                 Processing takes 1-3 business days.
               </li>
               <li className="flex items-start gap-2">
                 <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                 Payments sent via {wallet.config.payoutMethods.join(", ").toLowerCase().replace(/_/g, " ")}.
               </li>
             </ul>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={wallet.balance < wallet.config.minimumPayout}
            className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex justify-center items-center gap-2"
          >
            Request Payout
          </button>
        </div>
      </div>

      {/* 2. History Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-900">Withdrawal History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Date Requested</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Reference ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400 flex flex-col items-center">
                    <History className="w-8 h-8 mb-2 opacity-20" />
                    No withdrawal history found.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                      <div className="text-[10px] text-gray-400 font-normal">{format(new Date(item.createdAt), "h:mm a")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 capitalize">
                        {item.method === 'BANK_TRANSFER' ? <Building2 className="w-4 h-4 text-gray-400"/> : <CreditCard className="w-4 h-4 text-gray-400"/>}
                        {item.method.replace("_", " ").toLowerCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                      {formatPrice(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-gray-500">
                      {item.transactionId || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Integration */}
      <PayoutRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        balance={wallet.balance}
        config={wallet.config}
      />
    </div>
  );
}

// Helper: Status Badge
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-100",
    PROCESSING: "bg-blue-50 text-blue-700 border-blue-100",
    COMPLETED: "bg-green-50 text-green-700 border-green-100",
    FAILED: "bg-red-50 text-red-700 border-red-100",
    CANCELLED: "bg-gray-50 text-gray-600 border-gray-200",
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}