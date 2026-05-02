"use client";

import { useEffect, useState } from "react";
import { getPaymentProviders, updatePaymentProvider } from "@/app/actions/admin/settings/payments/payment-actions";
import { CreditCard, Wallet, Truck, Save, Loader2 } from "lucide-react";
import { toast } from "sonner"; // অথবা react-hot-toast ব্যবহার করতে পারেন

// Prisma Type
type PaymentProvider = {
  id: string;
  providerId: string;
  name: string;
  isEnabled: boolean;
  mode: "TEST" | "LIVE";
  publicKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
  instructions: string | null;
};

export default function PaymentSettingsPage() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  },[]);

  const fetchProviders = async () => {
    const res = await getPaymentProviders();
    if (res.success && res.providers) {
      setProviders(res.providers);
    } else {
      toast.error("Failed to load payment settings.");
    }
    setLoading(false);
  };

  const handleInputChange = (id: string, field: keyof PaymentProvider, value: any) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async (provider: PaymentProvider) => {
    setSavingId(provider.id);
    const res = await updatePaymentProvider(provider.id, provider);
    
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.error || "Something went wrong!");
    }
    setSavingId(null);
  };

  const getIcon = (providerId: string) => {
    switch (providerId) {
      case "stripe": return <CreditCard className="w-6 h-6 text-indigo-500" />;
      case "paypal": return <Wallet className="w-6 h-6 text-blue-500" />;
      case "cod": return <Truck className="w-6 h-6 text-green-500" />;
      default: return <CreditCard className="w-6 h-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Settings</h1>
        <p className="text-gray-500 mt-1">Configure your payment gateways and API keys.</p>
      </div>

      <div className="space-y-6">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            
            {/* Header (Title & On/Off Toggle) */}
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex items-center gap-3">
                {getIcon(provider.providerId)}
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {provider.name}
                </h2>
              </div>
              
              <label className="flex items-center cursor-pointer">
                <span className="mr-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {provider.isEnabled ? "Enabled" : "Disabled"}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={provider.isEnabled}
                    onChange={(e) => handleInputChange(provider.id, "isEnabled", e.target.checked)}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${provider.isEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${provider.isEnabled ? "translate-x-6" : ""}`}></div>
                </div>
              </label>
            </div>

            {/* Content Body */}
            <div className="space-y-4">
              
              {/* API Keys for Online Gateways (Stripe/PayPal) */}
              {provider.providerId !== "cod" && (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Environment Mode</label>
                    <select
                      value={provider.mode}
                      onChange={(e) => handleInputChange(provider.id, "mode", e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TEST">Test (Sandbox)</option>
                      <option value="LIVE">Live (Production)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Public Key / Client ID
                    </label>
                    <input
                      type="text"
                      value={provider.publicKey || ""}
                      onChange={(e) => handleInputChange(provider.id, "publicKey", e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${provider.name} Public Key`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Secret Key
                    </label>
                    <input
                      type="password"
                      value={provider.secretKey || ""}
                      onChange={(e) => handleInputChange(provider.id, "secretKey", e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${provider.name} Secret Key`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Webhook Secret / ID
                    </label>
                    <input
                      type="text"
                      value={provider.webhookSecret || ""}
                      onChange={(e) => handleInputChange(provider.id, "webhookSecret", e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter Webhook Secret (if applicable)"
                    />
                  </div>
                </>
              )}

              {/* Instructions for Manual Gateways like COD */}
              {provider.providerId === "cod" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={provider.instructions || ""}
                    onChange={(e) => handleInputChange(provider.id, "instructions", e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., Please pay the exact amount to the delivery rider."
                  />
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => handleSave(provider)}
                  disabled={savingId === provider.id}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingId === provider.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {savingId === provider.id ? "Saving..." : "Save Settings"}
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}