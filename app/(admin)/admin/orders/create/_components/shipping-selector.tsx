// File: app/admin/orders/create/_components/shipping-selector.tsx

"use client"

import { useEffect, useState, useMemo } from "react";
import { getShippingResources } from "@/app/actions/admin/order/create_order/get-shipping-resources";
import { getTransdirectQuotes } from "@/app/actions/admin/order/create_order/get-transdirect-quotes"; 
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, MapPin, ClipboardList, Loader2, Store, CheckCircle } from "lucide-react";

interface ShippingSelectorProps {
  onPickupLocationChange: (id: string | null) => void;
  onShippingCostChange: (cost: number) => void;
  onAdminNoteChange: (note: string) => void;
  onCustomerNoteChange: (note: string) => void;
  address?: { city: string; postcode: string; state: string } | null;
  cartItems: any[];
}

export const ShippingSelector = ({
  onPickupLocationChange,
  onShippingCostChange,
  onAdminNoteChange,
  onCustomerNoteChange,
  address,
  cartItems
}: ShippingSelectorProps) => {
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [localRates, setLocalRates] = useState<any[]>([]);
  const [liveQuotes, setLiveQuotes] = useState<any[]>([]);
  
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  // ১. নাম সুন্দর করার ফাংশন (tnt_road_express -> TNT Road Express)
  const formatServiceName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace("Tnt", "TNT") // Special case
      .replace("Dhl", "DHL");
  };

  // ২. লোকাল রেট লোড
  useEffect(() => {
    const loadResources = async () => {
      setLoadingLocal(true);
      const res = await getShippingResources();
      setPickupPoints(res.pickupLocations);
      
      const mappedRates = res.shippingRates.map((r: any) => ({
          id: r.id,
          name: r.name,
          price: r.price,
          type: 'local',
          desc: r.zone?.name || "Flat Rate"
      }));
      setLocalRates(mappedRates);
      setLoadingLocal(false);
    };
    loadResources();
  }, []);

  // ৩. লাইভ কোট ফেচ (Transdirect)
  useEffect(() => {
    if (!address?.postcode || !address?.city || cartItems.length === 0) {
        setLiveQuotes([]); 
        return;
    }

    const fetchLiveQuotes = async () => {
        setLoadingQuotes(true);
        // রিসেট: নতুন কোট আসার আগে সিলেকশন মুছে ফেলা হচ্ছে
        setSelectedMethod(""); 
        onShippingCostChange(0);

        const res = await getTransdirectQuotes({
            items: cartItems,
            receiver: {
                suburb: address.city,
                postcode: address.postcode,
                state: address.state
            }
        });

        if (res.success) {
            setLiveQuotes(res.quotes);
        }
        setLoadingQuotes(false);
    };

    const timeout = setTimeout(() => {
        fetchLiveQuotes();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [address, cartItems]); 

  // ৪. মেথড ফিল্টারিং এবং সর্টিং
  const allMethods = useMemo(() => {
      // যদি লাইভ কোট থাকে, তাহলে লোকাল ডাটাবেসের "Transdirect Shipping" ($0) বা "Standard" অপশনগুলো বাদ দিব
      // যাতে ডুপ্লিকেট বা কনফিউশন না হয়।
      const filteredLocalRates = localRates.filter(r => {
          // যদি লাইভ কোট থাকে, তাহলে যেসব রেটের নাম Transdirect বা Courier দিয়ে শুরু, সেগুলো বাদ
          if (liveQuotes.length > 0) {
              const nameLower = r.name.toLowerCase();
              return !nameLower.includes("transdirect") && !nameLower.includes("carrier");
          }
          return true;
      });

      return [
          ...filteredLocalRates, 
          ...liveQuotes,
          ...(pickupPoints.length > 0 ? [{ id: 'pickup_only', name: 'Local Pickup (Store Collection)', price: 0, type: 'pickup' }] : [])
      ].sort((a, b) => a.price - b.price); 
  }, [localRates, liveQuotes, pickupPoints]);

  // ৫. সিলেকশন হ্যান্ডলার
  const handleMethodClick = (methodId: string) => {
      const method = allMethods.find(m => m.id === methodId);
      if (method) {
          setSelectedMethod(methodId);
          onShippingCostChange(method.price); // প্যারেন্টে প্রাইস পাঠানো
          
          if (method.type !== 'pickup') {
              onPickupLocationChange(null);
          }
      }
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Truck size={18} className="text-slate-500" />
        <h3 className="font-bold text-sm text-slate-700 uppercase tracking-tight">Shipping Method</h3>
      </div>
      
      <div className="space-y-3">
        <Label className="text-[11px] font-bold text-slate-500 uppercase">Available Options</Label>
        
        {(loadingLocal || loadingQuotes) && (
            <div className="py-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2 bg-slate-50 rounded border border-slate-100">
                <Loader2 size={14} className="animate-spin text-blue-500"/> 
                <span>Calculating best rates...</span>
            </div>
        )}

        {!loadingLocal && !loadingQuotes && allMethods.length === 0 && (
            <div className="p-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded text-center">
                Enter address & add items to view rates.
            </div>
        )}

        {/* LIST OF METHODS */}
        {!loadingQuotes && allMethods.length > 0 && (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {allMethods.map((method) => (
                    <div 
                        key={method.id} 
                        className={`relative flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all duration-200 select-none
                        ${selectedMethod === method.id 
                            ? 'border-blue-600 bg-blue-50 shadow-sm ring-1 ring-blue-600' 
                            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                        onClick={() => handleMethodClick(method.id)}
                    >
                        {/* Custom Radio Circle */}
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${selectedMethod === method.id ? "border-blue-600" : "border-slate-300"}`}>
                            {selectedMethod === method.id && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                        </div>
                        
                        <div className="flex-1 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className={`text-xs font-bold flex items-center gap-2 ${selectedMethod === method.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {method.type === 'transdirect' ? <Truck size={14} className="text-blue-500"/> : method.type === 'pickup' ? <Store size={14} className="text-green-600"/> : <MapPin size={14} className="text-slate-400"/>}
                                    {/* ফরম্যাট করা নাম */}
                                    {formatServiceName(method.name)}
                                </span>
                                {method.transit_time && (
                                    <span className="text-[10px] text-slate-500 mt-0.5 ml-6">
                                        Transit: {method.transit_time}
                                    </span>
                                )}
                            </div>
                            <div className="text-right">
                                <span className={`text-sm font-bold ${selectedMethod === method.id ? 'text-blue-700' : 'text-slate-900'}`}>
                                    ${method.price.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Checkmark Icon for Active Item */}
                        {selectedMethod === method.id && (
                            <div className="absolute right-0 top-0 -mt-2 -mr-2 bg-white rounded-full p-0.5">
                                <CheckCircle size={16} className="text-blue-600 fill-white"/>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>

      {selectedMethod === "pickup_only" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 bg-green-50 p-3 rounded border border-green-100">
          <Label className="text-[11px] font-bold text-green-700 uppercase flex items-center gap-1">
            <Store size={12} /> Select Store Location
          </Label>
          <select 
            className="w-full h-9 text-xs border border-green-200 rounded px-2 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
            onChange={(e) => onPickupLocationChange(e.target.value)}
          >
            <option value="">-- Choose Store --</option>
            {pickupPoints.map((loc) => (
                <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.city})
                </option>
            ))}
          </select>
        </div>
      )}

      <hr className="border-slate-100" />

      {/* Notes Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-slate-500 uppercase">Customer Note</Label>
          <Textarea 
            placeholder="E.g. Please leave at the front door..." 
            className="text-xs min-h-[60px] resize-none"
            onChange={(e) => onCustomerNoteChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-slate-500 uppercase">Internal Admin Note</Label>
          <Textarea 
            placeholder="Internal records only..." 
            className="text-xs min-h-[60px] resize-none bg-slate-50 border-dashed"
            onChange={(e) => onAdminNoteChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};