// app/admin/settings/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "@/app/actions/settings";
import { getShippingZones, createZone, deleteZone, addRate, deleteRate } from "@/app/actions/shipping";
import { toast } from "react-hot-toast";
import { 
  Save, Store, CreditCard, Share2, 
  Server, ShieldAlert, Loader2, Globe, Banknote, Settings, Truck, Plus, Trash2, MapPin 
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Shipping State
  const [zones, setZones] = useState<any[]>([]);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const [data, setData] = useState<any>({
    storeName: "",
    storeEmail: "",
    storePhone: "",
    currency: "BDT",
    currencySymbol: "৳",
    maintenance: false,
    
    social_facebook: "",
    social_instagram: "",
    social_twitter: "",
    social_youtube: "",
    
    payment_cod_enabled: true,
    
    payment_bkash_enabled: false,
    payment_bkash_number: "",
    payment_bkash_type: "Personal",

    payment_stripe_enabled: false,
    payment_stripe_public: "",
    payment_stripe_secret: "",

    payment_paypal_enabled: false,
    payment_paypal_client: "",
    payment_paypal_secret: "",

    smtp_host: "",
    smtp_port: "",
    smtp_user: "",
    smtp_pass: "",
  });

  const fetchData = async () => {
    // Fetch Settings
    const res = await getSettings();
    if (res.success && res.data) {
      const s = res.data;
      const social = s.socialLinks as any || {};
      const payment = s.paymentConfig as any || {};
      const smtp = s.smtpConfig as any || {};

      setData({
        storeName: s.storeName || "",
        storeEmail: s.storeEmail || "",
        storePhone: s.storePhone || "",
        currency: s.currency || "BDT",
        currencySymbol: s.currencySymbol || "৳",
        maintenance: s.maintenance || false,

        social_facebook: social.facebook || "",
        social_instagram: social.instagram || "",
        social_twitter: social.twitter || "",
        social_youtube: social.youtube || "",

        payment_cod_enabled: payment.cod?.enabled ?? true,
        
        payment_bkash_enabled: payment.bkash?.enabled ?? false,
        payment_bkash_number: payment.bkash?.number || "",
        payment_bkash_type: payment.bkash?.type || "Personal",

        payment_stripe_enabled: payment.stripe?.enabled ?? false,
        payment_stripe_public: payment.stripe?.publicKey || "",
        payment_stripe_secret: payment.stripe?.secretKey || "",

        payment_paypal_enabled: payment.paypal?.enabled ?? false,
        payment_paypal_client: payment.paypal?.clientId || "",
        payment_paypal_secret: payment.paypal?.secret || "",

        smtp_host: smtp.host || "",
        smtp_port: smtp.port || "",
        smtp_user: smtp.user || "",
        smtp_pass: smtp.pass || "",
      });
    }

    // Fetch Shipping Zones
    const zoneRes = await getShippingZones();
    if (zoneRes.success) setZones(zoneRes.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setData({ ...data, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, String(data[key]));
    });

    const res = await updateSettings(formData);
    setSubmitting(false);

    if (res.success) toast.success(res.message as string);
    else toast.error(res.error as string);
  };

  // --- SHIPPING HANDLERS ---
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const res = await createZone(formData);
    if(res.success) {
        toast.success(res.message as string);
        setIsZoneModalOpen(false);
        fetchData();
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if(selectedZoneId) formData.append("zoneId", selectedZoneId);
    
    const res = await addRate(formData);
    if(res.success) {
        toast.success(res.message as string);
        setIsRateModalOpen(false);
        fetchData();
    }
  };

  const handleDeleteZone = async (id: string) => {
    if(!confirm("Delete zone?")) return;
    await deleteZone(id);
    fetchData();
  };

  const handleDeleteRate = async (id: string) => {
    await deleteRate(id);
    fetchData();
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-blue-600" /> Store Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage global configuration for your e-commerce store.</p>
        </div>
        {activeTab !== 'shipping' && (
            <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium shadow-lg disabled:opacity-70"
            >
                {submitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                Save Changes
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR TABS */}
        <div className="lg:col-span-1 space-y-1">
            {[
                { id: "general", label: "General", icon: Store },
                { id: "shipping", label: "Shipping & Delivery", icon: Truck }, // ✅ New Tab
                { id: "payment", label: "Payments", icon: CreditCard },
                { id: "social", label: "Social Media", icon: Share2 },
                { id: "system", label: "System & Mail", icon: Server },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                        activeTab === tab.id 
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                        : "text-slate-600 hover:bg-white/50"
                    }`}
                >
                    <tab.icon size={18} /> {tab.label}
                </button>
            ))}
        </div>

        {/* MAIN CONTENT FORM */}
        <div className="lg:col-span-3">
            
            {/* --- GENERAL SETTINGS --- */}
            {activeTab === "general" && (
                <form className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                    <h3 className="font-bold text-lg mb-6 border-b pb-4 flex items-center gap-2">
                        <Store size={20} className="text-slate-400"/> Store Information
                    </h3>
                    <div className="grid gap-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Store Name</label>
                                <input type="text" name="storeName" value={data.storeName} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Support Email</label>
                                <input type="email" name="storeEmail" value={data.storeEmail} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Phone Number</label>
                                <input type="text" name="storePhone" value={data.storePhone} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Currency</label>
                                <select name="currency" value={data.currency} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white outline-none">
                                    <option value="BDT">BDT (Bangladeshi Taka)</option>
                                    <option value="USD">USD (US Dollar)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Symbol</label>
                                <input type="text" name="currencySymbol" value={data.currencySymbol} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* --- SHIPPING SETTINGS (NEW) --- */}
            {activeTab === "shipping" && (
                <div className="space-y-6 animate-in fade-in">
                    
                    {/* Header Action */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Shipping Zones</h3>
                            <p className="text-sm text-slate-500">Manage where you ship and how much it costs.</p>
                        </div>
                        <button onClick={() => setIsZoneModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                            <Plus size={16}/> Add Zone
                        </button>
                    </div>

                    {/* Zone List */}
                    {zones.map((zone) => (
                        <div key={zone.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-full border"><Globe size={16} className="text-blue-500"/></div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{zone.name}</h4>
                                        <p className="text-xs text-slate-500">Bangladesh (All Districts)</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => { setSelectedZoneId(zone.id); setIsRateModalOpen(true); }}
                                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded border border-blue-200"
                                    >
                                        + Add Rate
                                    </button>
                                    <button onClick={() => handleDeleteZone(zone.id)} className="text-slate-400 hover:text-red-500 p-1.5"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            
                            {/* Rates List */}
                            <div className="divide-y divide-slate-100">
                                {zone.rates.length === 0 && <p className="p-4 text-sm text-slate-400 italic">No shipping rates added yet.</p>}
                                {zone.rates.map((rate: any) => (
                                    <div key={rate.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <Truck size={16} className="text-slate-400"/>
                                            <div>
                                                <p className="font-medium text-slate-700">{rate.name}</p>
                                                {rate.minPrice ? (
                                                    <p className="text-xs text-green-600">Free shipping on orders over ৳{rate.minPrice}</p>
                                                ) : (
                                                    <p className="text-xs text-slate-500">Standard Delivery</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-slate-800">৳{rate.price}</span>
                                            <button onClick={() => handleDeleteRate(rate.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- PAYMENT SETTINGS --- */}
            {activeTab === "payment" && (
                <form className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in space-y-6">
                    {/* Mobile Banking (Bkash) */}
                    <div className="border border-slate-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-pink-600">
                                <Banknote size={20}/> bKash / Nagad
                            </h3>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Enable</label>
                                <input type="checkbox" name="payment_bkash_enabled" checked={data.payment_bkash_enabled} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                            </div>
                        </div>
                        {data.payment_bkash_enabled && (
                            <div className="grid grid-cols-2 gap-6 bg-pink-50 p-4 rounded-lg border border-pink-100">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Number</label>
                                    <input type="text" name="payment_bkash_number" value={data.payment_bkash_number} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" placeholder="017xxxxxxxx" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase">Type</label>
                                    <select name="payment_bkash_type" value={data.payment_bkash_type} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white">
                                        <option value="Personal">Personal</option>
                                        <option value="Merchant">Merchant</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COD */}
                    <div className="border border-slate-200 rounded-lg p-5 flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-700">
                            <Truck size={20}/> Cash on Delivery (COD)
                        </h3>
                        <input type="checkbox" name="payment_cod_enabled" checked={data.payment_cod_enabled} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                    </div>
                </form>
            )}

            {/* --- SOCIAL --- */}
            {activeTab === "social" && (
                <form className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                    <h3 className="font-bold text-lg mb-6 border-b pb-4 flex items-center gap-2">
                        <Share2 size={20} className="text-slate-400"/> Social Links
                    </h3>
                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Facebook URL</label>
                            <input type="text" name="social_facebook" value={data.social_facebook} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Instagram URL</label>
                            <input type="text" name="social_instagram" value={data.social_instagram} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                    </div>
                </form>
            )}

            {/* --- SYSTEM --- */}
            {activeTab === "system" && (
                <form className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in space-y-6">
                     <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2 text-red-700">
                                    <ShieldAlert size={20}/> Maintenance Mode
                                </h3>
                                <p className="text-sm text-red-600 mt-1">Enable this to hide the store from customers.</p>
                            </div>
                            <input 
                                type="checkbox" 
                                name="maintenance" 
                                checked={data.maintenance}
                                onChange={handleChange}
                                className="w-6 h-6 text-red-600 rounded"
                            />
                        </div>
                    </div>
                </form>
            )}

        </div>
      </div>

      {/* --- MODAL: CREATE ZONE --- */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Add Shipping Zone</h3>
                <form onSubmit={handleCreateZone} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-slate-700">Zone Name</label>
                        <input name="name" required placeholder="e.g. Inside Dhaka" className="w-full border p-2 rounded mt-1 outline-none focus:border-blue-500"/>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setIsZoneModalOpen(false)} className="px-4 py-2 border rounded text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-bold">Create Zone</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL: ADD RATE --- */}
      {isRateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold mb-4">Add Shipping Rate</h3>
                <form onSubmit={handleAddRate} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-slate-700">Rate Name</label>
                        <input name="name" required placeholder="e.g. Standard Delivery" className="w-full border p-2 rounded mt-1 outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-700">Price (৳)</label>
                        <input name="price" type="number" required placeholder="60" className="w-full border p-2 rounded mt-1 outline-none focus:border-blue-500"/>
                    </div>
                    <div className="pt-2 border-t mt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Condition (Optional)</label>
                        <p className="text-xs text-slate-400 mb-2">Free shipping if order price is above this amount.</p>
                        <input name="minPrice" type="number" placeholder="e.g. 5000" className="w-full border p-2 rounded mt-1 outline-none focus:border-blue-500"/>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setIsRateModalOpen(false)} className="px-4 py-2 border rounded text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold">Add Rate</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}