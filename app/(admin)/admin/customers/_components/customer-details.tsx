"use client";

import { useEffect, useState } from "react";
import { getCustomerDetails } from "@/app/actions/admin/customer";
import { X, MapPin, Mail, Phone, Calendar, ShoppingBag, Loader2, CreditCard } from "lucide-react";
import { OrderStatus } from "@prisma/client";

interface CustomerDetailsProps {
  customerId: string;
  onClose: () => void;
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount);
};

export function CustomerDetails({ customerId, onClose }: CustomerDetailsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getCustomerDetails(customerId);
      if (res.success) setData(res.data);
      setLoading(false);
    };
    fetchData();
  }, [customerId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Customer Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : !data ? (
          <div className="p-6 text-center text-slate-500">Failed to load data</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Profile Info */}
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-slate-600 mb-3 overflow-hidden">
                {data.image ? <img src={data.image} className="w-full h-full object-cover"/> : data.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-slate-800">{data.name}</h3>
              <p className="text-sm text-slate-500">{data.role}</p>
              
              <div className="flex justify-center gap-4 mt-4 text-sm text-slate-600">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                   <Mail size={14}/> {data.email}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                   <Phone size={14}/> {data.phone || "N/A"}
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Addresses</h4>
              <div className="space-y-3">
                {data.addresses.length === 0 ? <p className="text-sm text-slate-400 italic">No addresses saved.</p> : 
                  data.addresses.map((addr: any) => (
                    <div key={addr.id} className="p-3 border border-slate-200 rounded-lg text-sm bg-slate-50/50">
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0"/>
                        <div>
                          <p className="font-semibold text-slate-700">{addr.address1}</p>
                          <p className="text-slate-500">{addr.city}, {addr.country} - {addr.postcode}</p>
                          {addr.isDefault && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded mt-1 inline-block">Default</span>}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Orders</h4>
              <div className="space-y-3">
                {data.orders.length === 0 ? <p className="text-sm text-slate-400 italic">No orders yet.</p> :
                  data.orders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShoppingBag size={16}/></div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">#{order.orderNumber}</p>
                          <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{formatPrice(order.total)}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          order.status === OrderStatus.DELIVERED ? "bg-green-100 text-green-700" :
                          order.status === OrderStatus.CANCELLED ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}