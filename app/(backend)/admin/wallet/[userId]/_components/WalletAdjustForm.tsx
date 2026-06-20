"use client";

import { useState, useTransition } from "react";
import { adjustWalletBalance } from "@/app/actions/backend/wallet/wallet-actions";
import { PlusCircle, MinusCircle, Loader2 } from "lucide-react";

interface WalletAdjustFormProps {
  userId: string;
  currentBalance: number;
}

export default function WalletAdjustForm({ userId, currentBalance }: WalletAdjustFormProps) {
  const [type, setType] = useState<"ADD" | "DEDUCT">("ADD");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setMessage({ text: "সঠিক পরিমাণ দিন।", success: false });
      return;
    }
    if (!description.trim()) {
      setMessage({ text: "Description দেওয়া আবশ্যক।", success: false });
      return;
    }

    startTransition(async () => {
      const result = await adjustWalletBalance(userId, parsed, type, description);
      setMessage({ text: result.message, success: result.success });
      if (result.success) {
        setAmount("");
        setDescription("");
      }
    });
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-sm">
      <div className="px-4 py-3 border-b border-[#c3c4c7] bg-[#f0f0f1]">
        <h3 className="text-[14px] font-semibold text-[#1d2327] m-0">Adjust Balance</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Type selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("ADD")}
            className={`flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold border rounded-sm transition-colors ${
              type === "ADD"
                ? "bg-[#00a32a] text-white border-[#00a32a]"
                : "bg-white text-[#50575e] border-[#c3c4c7] hover:border-[#00a32a] hover:text-[#00a32a]"
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Add
          </button>
          <button
            type="button"
            onClick={() => setType("DEDUCT")}
            className={`flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold border rounded-sm transition-colors ${
              type === "DEDUCT"
                ? "bg-[#d63638] text-white border-[#d63638]"
                : "bg-white text-[#50575e] border-[#c3c4c7] hover:border-[#d63638] hover:text-[#d63638]"
            }`}
          >
            <MinusCircle className="w-4 h-4" /> Deduct
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-[12px] font-semibold text-[#2c3338] mb-1">
            Amount (A$)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-1.5 border border-[#8c8f94] rounded-sm text-[13px] outline-none focus:border-[#2271b1] font-mono"
            required
          />
          {amount && parseFloat(amount) > 0 && (
            <p className="text-[11px] text-[#50575e] mt-1">
              New balance:{" "}
              <span className="font-mono font-semibold text-[#1d2327]">
                A$
                {(
                  currentBalance +
                  (type === "ADD" ? parseFloat(amount) : -parseFloat(amount))
                ).toFixed(2)}
              </span>
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-[12px] font-semibold text-[#2c3338] mb-1">
            Description <span className="text-[#d63638]">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Refund for order #1234"
            rows={3}
            className="w-full px-3 py-1.5 border border-[#8c8f94] rounded-sm text-[13px] outline-none focus:border-[#2271b1] resize-none"
            required
          />
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className={`px-3 py-2 text-[12px] rounded-sm border ${
              message.success
                ? "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30"
                : "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2 bg-[#2271b1] text-white text-[13px] font-semibold rounded-sm hover:bg-[#135e96] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Processing..." : `Confirm ${type === "ADD" ? "Add" : "Deduct"}`}
        </button>
      </form>
    </div>
  );
}
